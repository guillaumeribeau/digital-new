import { getDb, type Prisma } from '@nova/database';
import { tadapoBriefSchema } from '@nova/validation/tadapo';
import { digestTadapo } from '@nova/shared/tadapo-server';
import { tadapoReplyDomain, queueTadapoOwner } from '@nova/shared/tadapo-mail';
import { submitTadapoReview, tadapoReviewState, tadapoBillingWindow } from '@nova/shared/tadapo-workflow';
import type { TadapoOffer } from '@nova/shared/tadapo';
import { seal } from '@nova/shared/secure-payload';
import { fetchInboundAttachment, inboundAttachment } from './site-inbound';
import { z } from 'zod';
type Incoming={id:string;to:string[];from:string;subject:string;text?:string|null;html?:string|null;attachments:{id:string;filename?:string|null;content_type?:string}[]};
const address=(s:string)=>(s.match(/<([^<>]+)>/)?.[1]||s).trim();
export async function applyTadapoInbound(email: Incoming) {
  let target:{token:string;purpose:string;version:number|null}|undefined;
  for(const recipient of email.to){const m=address(recipient).match(/^(tr([0-9]{1,6})|td|tm|tp)-([A-Za-z0-9_-]{43})@(.+)$/);if(m&&m[4].toLowerCase()===tadapoReplyDomain()?.toLowerCase()){target={purpose:m[1].startsWith('tr')?'REVIEWS':m[1]==='td'?'DOMAIN':m[1]==='tm'?'MONTHLY':'CONTENTS',version:m[2]?Number(m[2]):null,token:m[3]};break;}}
  if(!target)return false;
  const db=getDb(),order=await db.tadapoOrder.findUnique({where:{tokenHash:digestTadapo(target.token)}});if(!order)return false;
  if(await db.tadapoInboundEmail.findUnique({where:{providerId:email.id}}))return true;
  const attachments:z.infer<typeof inboundAttachment>[]=[];let size=0;
  for(const f of email.attachments){const item:z.infer<typeof inboundAttachment>={id:f.id,filename:f.filename||'Pièce jointe',contentType:f.content_type,archived:false};if(size<16*1024*1024){try{const bytes=await fetchInboundAttachment(email.id,f.id);if(size+bytes.length<=16*1024*1024){item.encrypted=seal(bytes.toString('base64'));item.archived=true;size+=bytes.length;}}catch{/* Keep the provider reference and flag missing archives. */}}attachments.push(item);}
  const content=email.text||(email.html||'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]*>/g,' ')||'Message sans texte. Consultez les pièces jointes.';
  await db.$transaction(async tx=>{
    await tx.$queryRaw`SELECT "id" FROM "TadapoOrder" WHERE "id"=${order.id}::uuid FOR UPDATE`;
    if(await tx.tadapoInboundEmail.findUnique({where:{providerId:email.id}}))return;
    const o=await tx.tadapoOrder.findUniqueOrThrow({where:{id:order.id},include:{project:{include:{lead:{select:{deletedAt:true}}}}}});
    const brief=tadapoBriefSchema.parse(o.brief),stateBefore=await tadapoReviewState(tx,o);
    let state=target!.purpose==='DOMAIN'?'DOMAIN_MESSAGE':'CONTENTS_RECEIVED';
    if(address(email.from).toLowerCase()!==brief.email.toLowerCase())state='UNVERIFIED_SENDER';
    else if(!o.paidAt||!o.project||o.project.stage==='CANCELLED'||o.project.lead.deletedAt)state='PROJECT_CLOSED';
    else if(target!.purpose==='REVIEWS'){
      if(target!.version!==o.reviewVersion)state='STALE_VERSION';
      else if(stateBefore.waiting)state='DEFERRED';
      else if(o.stage==='PUBLISHED'||stateBefore.rounds.length>=3||o.approvedAt||!stateBefore.deadline||stateBefore.deadline.getTime()<Date.now())state='QUOTE_REQUEST';
      else if(o.stage!=='PREVIEW_SENT')state='DEFERRED';
      else {await submitTadapoReview(tx,o,email.id,content.slice(0,10000),o.reviewVersion,attachments.length,attachments.some(f=>!f.archived));state='SUBMITTED';}
    }else if(target!.purpose==='MONTHLY'){
      if(o.stage!=='PUBLISHED'||o.subscriptionStatus!=='active'||o.billingAlert)state='QUOTE_REQUEST';
      else {const period=tadapoBillingWindow(o.paidAt!).start,offer=o.offerSnapshot as unknown as TadapoOffer;const used=await tx.tadapoFeedback.count({where:{orderId:o.id,kind:'MONTHLY',periodStart:period}});
        if(used>=offer.modifications)state='QUOTE_REQUEST';else{await tx.tadapoFeedback.create({data:{orderId:o.id,requestId:email.id,version:o.reviewVersion,content:content.slice(0,10000),kind:'MONTHLY',status:'OPEN',periodStart:period}});state='MONTHLY_SUBMITTED';}}
    }
    if(state==='QUOTE_REQUEST')await tx.tadapoFeedback.create({data:{orderId:o.id,requestId:email.id,version:o.reviewVersion,content:content.slice(0,10000),kind:'EXTRA'}});
    await tx.tadapoInboundEmail.create({data:{orderId:o.id,providerId:email.id,purpose:target!.purpose,state,sender:email.from,subject:email.subject||'Réponse client',content,attachments:attachments as Prisma.InputJsonValue}});
    // submitTadapoReview already queued the one owner summary for that series.
    if(state!=='SUBMITTED')await queueTadapoOwner(tx,o,'inbound/'+email.id,state==='QUOTE_REQUEST'?'Demande supplémentaire Tadapo reçue par e-mail':state==='MONTHLY_SUBMITTED'?'Modification mensuelle Tadapo reçue par e-mail':target!.purpose==='DOMAIN'?'Réponse client concernant le domaine Tadapo':'E-mail client Tadapo conservé dans le dossier',`${state==='UNVERIFIED_SENDER'?'Expéditeur différent du client : vérifiez son identité avant traitement.\n':state==='DEFERRED'?'Le client attend la version corrigée : aucune nouvelle série ouverte.\n':state==='STALE_VERSION'?'Réponse à une ancienne version : aucune nouvelle série ouverte.\n':''}${content.slice(0,240)}\n${attachments.length} pièce(s) jointe(s).${attachments.some(f=>!f.archived)?' Certains fichiers sont à récupérer dans Resend.':''}`);
  },{timeout:20000});return true;
}
