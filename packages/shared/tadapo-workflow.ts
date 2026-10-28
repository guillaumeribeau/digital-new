import { getDb, Prisma, type TadapoOrder } from '@nova/database';
import { z } from 'zod';
import { tadapoAnniversary, type TadapoOffer } from './tadapo';
import { authorizeTadapo, TadapoError } from './tadapo-server';
import { queueTadapoOwner, queueTadapoEmail } from './tadapo-mail';
import type { TadapoDomainQuote } from './tadapo-domain';

export function tadapoBillingWindow(start: Date, now = new Date()) {
  let months = (now.getUTCFullYear()-start.getUTCFullYear())*12 + now.getUTCMonth()-start.getUTCMonth();
  if (tadapoAnniversary(start,months)>now) months--;
  return {start:tadapoAnniversary(start,Math.max(0,months)),end:tadapoAnniversary(start,Math.max(0,months)+1)};
}
export async function tadapoReviewState(tx: Pick<Prisma.TransactionClient,'tadapoFeedback'>, o: TadapoOrder) {
  const rounds = await tx.tadapoFeedback.findMany({where:{orderId:o.id,kind:'REVIEW'},orderBy:{number:'asc'}});
  return {rounds,waiting:rounds.some(r=>r.status==='OPEN'),completed:rounds.filter(r=>r.status==='CLOSED').length,
    deadline:o.firstVersionAt?new Date(o.firstVersionAt.getTime()+30*86400000):null};
}
export async function submitTadapoReview(tx: Prisma.TransactionClient, o: TadapoOrder, requestId: string, message: string, version: number, attachmentCount=0, archiveWarning=false) {
  const previous=await tx.tadapoFeedback.findUnique({where:{requestId}});
  if(previous){if(previous.orderId!==o.id||previous.kind!=='REVIEW'||previous.content!==message||previous.version!==version)throw new TadapoError('REQUEST_CONFLICT');return false;}
  const state=await tadapoReviewState(tx,o);
  if(state.waiting)throw new TadapoError('REVIEW_WAITING');
  if(!o.paidAt||o.stage!=='PREVIEW_SENT'||o.approvedAt||!state.deadline||state.deadline.getTime()<Date.now())throw new TadapoError('REVIEW_CLOSED');
  if(o.reviewVersion!==version)throw new TadapoError('STALE_VERSION');
  if(state.rounds.length>=3)throw new TadapoError('REVIEW_LIMIT');
  const number=state.rounds.length+1;
  await tx.tadapoFeedback.create({data:{orderId:o.id,requestId,version,content:message,kind:'REVIEW',number,status:'OPEN'}});
  await tx.tadapoOrder.update({where:{id:o.id},data:{stage:'REVIEW',approvedAt:null,approvedVersion:null,approvedName:null}});
  await tx.project.update({where:{id:o.projectId!},data:{stage:'REVIEW'},select:{id:true}});
  await queueTadapoOwner(tx,o,`feedback/${requestId}`,`Nouveaux retours Tadapo — série ${number}/3`,`Série ${number}/3 · ${attachmentCount} pièce(s) jointe(s)\n${message.slice(0,240)}${archiveWarning?'\nCertains fichiers sont à récupérer dans Resend : consultez le dossier.':''}`);
  return true;
}
export async function tadapoClientAction(id: string, token: string|null, input: unknown) {
  await authorizeTadapo(id,token);
  const d=z.object({action:z.enum(['approve','feedback','extra-request','monthly','domain-request','domain-renewal']),version:z.number().int().min(1).optional(),requestId:z.uuid(),name:z.string().trim().min(2).max(200),message:z.string().trim().max(10000).default(''),domain:z.string().trim().toLowerCase().max(253).optional(),kind:z.enum(['new','existing']).optional(),agreement:z.literal(true).optional()}).strict().parse(input);
  return getDb().$transaction(async tx=>{
    await tx.$queryRaw`SELECT "id" FROM "TadapoOrder" WHERE "id"=${id}::uuid FOR UPDATE`;
    const o=await tx.tadapoOrder.findUniqueOrThrow({where:{id}});
    if(!o.paidAt||!o.projectId)throw new TadapoError('INVALID_ACTION');
    const kind=d.action==='approve'?'APPROVAL':d.action==='feedback'?'REVIEW':d.action==='extra-request'?'EXTRA':d.action==='monthly'?'MONTHLY':d.action==='domain-request'?'DOMAIN':'RENEWAL';
    const content=d.action==='approve'?`Validation par ${d.name}`:d.action==='domain-request'?`${d.kind}: ${d.domain}`:d.action==='domain-renewal'?`Accord de renouvellement par ${d.name}`:d.message;
    const previous=await tx.tadapoFeedback.findUnique({where:{requestId:d.requestId}});
    if(previous){if(previous.orderId!==id||previous.content!==content||previous.kind!==kind||previous.version!==(d.version||o.reviewVersion))throw new TadapoError('REQUEST_CONFLICT');return;}
    if(d.action==='feedback'){if(d.message.length<2||!d.version)throw new TadapoError('MESSAGE_REQUIRED');await submitTadapoReview(tx,o,d.requestId,d.message,d.version);return;}
    let subject='',summary=content,periodStart:Date|undefined;
    if(d.action==='approve'){
      const state=await tadapoReviewState(tx,o);
      if(!['PREVIEW_SENT','APPROVED'].includes(o.stage)||d.version!==o.reviewVersion||state.waiting)throw new TadapoError('REVIEW_WAITING');
      await tx.tadapoOrder.update({where:{id},data:{stage:'APPROVED',approvedAt:new Date(),approvedVersion:d.version,approvedName:d.name}});
      await tx.project.update({where:{id:o.projectId},data:{stage:'APPROVED'},select:{id:true}});
      subject='Version Tadapo validée par le client';
    }else if(d.action==='monthly'){
      if(o.stage!=='PUBLISHED'||o.subscriptionStatus!=='active'||o.billingAlert)throw new TadapoError('MONTHLY_UNAVAILABLE');
      if(d.message.length<2)throw new TadapoError('MESSAGE_REQUIRED');
      periodStart=tadapoBillingWindow(o.paidAt).start;
      const used=await tx.tadapoFeedback.count({where:{orderId:id,kind:'MONTHLY',periodStart}}),offer=o.offerSnapshot as unknown as TadapoOffer;
      if(used>=offer.modifications)throw new TadapoError('MONTHLY_LIMIT');
      subject='Nouvelle modification mensuelle Tadapo';summary=`Demande ${used+1}/${offer.modifications} de la période en cours\n${d.message.slice(0,240)}`;
    }else if(d.action==='extra-request'){
      if(d.message.length<2)throw new TadapoError('MESSAGE_REQUIRED');
      subject='Demande de devis supplémentaire Tadapo';summary=d.message.slice(0,240);
    }else if(d.action==='domain-request'){
      if(o.domainAcceptedAt||o.domainPurchasedAt||!d.kind||!d.domain||! /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(d.domain))throw new TadapoError('INVALID_ACTION');
      await tx.tadapoOrder.update({where:{id},data:{domainRequest:{domain:d.domain,kind:d.kind,requestedAt:new Date().toISOString(),name:d.name},domainQuote:Prisma.DbNull,domainVersion:{increment:1}}});
      subject='Choix de domaine Tadapo reçu';
    }else{
      const proposal=z.object({id:z.uuid(),renewalHtCents:z.number().int().nonnegative(),renewalAt:z.string(),approvedAt:z.string().nullable()}).parse(o.domainRenewal);
      if(d.agreement!==true||d.requestId!==proposal.id||proposal.approvedAt)throw new TadapoError('STALE_VERSION');
      const approved={...proposal,approvedAt:new Date().toISOString(),approvedName:d.name};
      const history=Array.isArray(o.domainRenewalHistory)?o.domainRenewalHistory:[];
      const q=o.domainQuote as TadapoDomainQuote;
      await tx.tadapoOrder.update({where:{id},data:{domainRenewal:approved,domainRenewalHistory:[...history,{...approved,event:'APPROVED'}],domainQuote:{...q,renewalHtCents:proposal.renewalHtCents,renewalExtraHtCents:Math.max(0,proposal.renewalHtCents-q.includedHtCents)}}});
      subject='Nouveau tarif de renouvellement Tadapo accepté';summary=`${d.name} a accepté le nouveau tarif de ${(proposal.renewalHtCents/100).toFixed(2)} € HT/an pour le ${proposal.renewalAt}. Le supplément éventuel reste à facturer séparément.`;
    }
    await tx.tadapoFeedback.create({data:{orderId:id,requestId:d.requestId,version:d.version||o.reviewVersion,content,kind,status:d.action==='monthly'?'OPEN':'RECORDED',periodStart}});
    await queueTadapoOwner(tx,o,`${kind}/${d.requestId}`,subject,summary);
    if(d.action==='monthly')await queueTadapoEmail(tx,o,'TADAPO_MONTHLY_RECEIVED','Votre modification mensuelle Tadapo est enregistrée',`Votre demande a été enregistrée :\n\n${d.message}\n\nSon état est visible dans votre suivi. Les demandes hors forfait font l’objet d’un devis complémentaire.`,d.requestId,'monthly');
  });
}
