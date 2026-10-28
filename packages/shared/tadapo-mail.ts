import type { Prisma, TadapoOrder } from '@nova/database';
import { tadapoBriefSchema } from '@nova/validation/tadapo';
import { seal, unseal } from './secure-payload';
import { tadapoClientLink, tadapoSender, tadapoOrigin, TadapoError } from './tadapo-server';
import { assertBrandContent } from './brands';

const escape = (s: string) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export const tadapoReplyDomain = () => {
  const value = process.env.TADAPO_REPLY_DOMAIN;
  if (value) assertBrandContent('tadapo', value);
  return value;
};
export function tadapoReplyTo(o: TadapoOrder, purpose: 'reviews' | 'domain' | 'monthly' | 'billing') {
  const domain = tadapoReplyDomain();
  if (!domain) return tadapoSender().reply_to;
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) throw new TadapoError('EMAIL_NOT_CONFIGURED');
  const token = unseal(o.tokenEncrypted);
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw new TadapoError('INVALID_TOKEN');
  return `${purpose === 'reviews' ? `tr${o.reviewVersion}` : purpose === 'domain' ? 'td' : purpose === 'monthly' ? 'tm' : 'tp'}-${token}@${domain}`;
}
export function tadapoEmailHtml(name: string, subject: string, message: string, url: string, label: string) {
  return `<!doctype html><html lang="fr"><body style="margin:0;padding:24px 12px;background:#fff8f0;color:#24201c;font-family:Arial,sans-serif"><div style="max-width:560px;margin:auto;background:white;padding:32px;border-radius:18px"><p style="font-size:26px;font-weight:bold;color:#e15b2a">tadapo.</p><h1 style="font-size:26px">${escape(subject)}</h1><p>Bonjour ${escape(name)},</p><p style="white-space:pre-line;line-height:1.7">${escape(message)}</p><p><a href="${escape(url)}" style="display:inline-block;padding:16px 22px;background:#e15b2a;color:white;text-decoration:none;border-radius:8px">${escape(label)}</a></p><p style="line-height:1.7">Une question ? Répondez à cet e-mail.<br>Guillaume · Tadapo</p><p style="font-size:12px;color:#666">Guillaume Ribeau EI · SIRET 91123105800015<br>17 rue des Maréchaux, 72190 Sargé-lès-le-Mans</p></div></body></html>`;
}
export async function queueTadapoEmail(tx: Prisma.TransactionClient, o: TadapoOrder, kind: string, subject: string, message: string, requestId?: string, purpose: 'reviews'|'domain'|'monthly'|'billing' = 'billing', stableKey?: string) {
  const brief = tadapoBriefSchema.parse(o.brief), url = new URL(tadapoClientLink(o));
  url.searchParams.set('parcours',purpose==='domain'?'domaine':purpose==='monthly'?'modifications':purpose==='reviews'?'retours':'factures');
  const link=url.href;
  const fullSubject = `${o.mode === 'TEST' ? '[TEST] ' : ''}${subject}`;
  const body = `${o.mode === 'TEST' ? 'MODE TEST — aucun débit réel.\n\n' : ''}${message}`;
  const consent = o.consentSnapshot as { termsHtml?: string };
  await tx.tadapoMail.createMany({ skipDuplicates: true, data: {orderId:o.id, key:`tadapo/${o.id}/${stableKey || requestId || kind}`,kind,
    payloadEncrypted:seal({...tadapoSender(),reply_to:tadapoReplyTo(o,purpose),to:[brief.email],subject:fullSubject,
      text:`Bonjour ${brief.fullName},\n\n${body}\n\nVotre lien personnel : ${link}\n\nRépondez à cet e-mail pour transmettre vos contenus ou poser une question.\nTadapo · Guillaume Ribeau EI`,
      html:tadapoEmailHtml(brief.fullName,fullSubject,body,link,purpose==='domain'?'Mon nom de domaine':purpose==='reviews'?'Voir le site et transmettre mes retours':purpose==='monthly'?'Mes modifications mensuelles':'Mon suivi et mes factures'),
      ...(kind==='TADAPO_REVIEW_INVITE'?{headers:{'X-Tadapo-Review-Version':String(o.reviewVersion)}}:{}),
      ...(kind==='TADAPO_PAYMENT' && consent.termsHtml ? {attachments:[{filename:'conditions-tadapo-acceptees.html',content:Buffer.from(consent.termsHtml).toString('base64')}]} : {})})}});
}
export async function queueTadapoOwner(tx: Prisma.TransactionClient, o: TadapoOrder, key: string, subject: string, summary: string) {
  const brief = tadapoBriefSchema.parse(o.brief), to=process.env.TADAPO_NOTIFICATION_EMAIL || tadapoSender().reply_to;
  const url = new URL(`/projets/${o.projectId}`,process.env.COMMERCIAL_PUBLIC_URL || process.env.BETTER_AUTH_URL || 'https://admin-production-1a67.up.railway.app').href;
  const fullSubject=`${o.mode==='TEST'?'[TEST] ':''}${subject}`;
  const message=`${brief.company} · ${brief.fullName}\n\n${summary}\n\nLe détail complet est conservé dans le dossier.`;
  await tx.tadapoMail.createMany({skipDuplicates:true,data:{orderId:o.id,key:`tadapo-owner/${o.id}/${key}`,kind:'TADAPO_OWNER_NOTICE',payloadEncrypted:seal({...tadapoSender(),to:[to],reply_to:brief.email,subject:fullSubject,text:`${message}\n\nOuvrir le dossier : ${url}`,html:tadapoEmailHtml('Guillaume',fullSubject,message,url,'Ouvrir le dossier dans l’admin')})}});
}
export async function queueTadapoDomainInvite(tx: Prisma.TransactionClient, o: TadapoOrder, requestId?: string) {
  return queueTadapoEmail(tx,o,'TADAPO_DOMAIN_INVITE','Choisissez votre nom de domaine Tadapo',
    'Choisissez l’adresse de votre futur site, indépendamment des retours sur sa réalisation.\n\nRecherchez un nom disponible chez OVH : https://www.ovhcloud.com/fr/domains/\n\nUn domaine est inclus jusqu’à 20 € HT/an dans les deux formules, à l’achat comme au renouvellement. Vérifiez les deux tarifs : une promotion la première année ne garantit pas le prix des années suivantes.\n\nNe commandez pas le domaine vous-même : transmettez votre choix depuis votre espace domaine. Nous vérifierons les tarifs et la disponibilité. Au-delà de 20 € HT/an, la différence fera l’objet d’un devis complémentaire à accepter et régler séparément avant achat. Tout changement de prix au renouvellement nécessitera votre nouvel accord avant facturation du supplément.\n\nVotre choix ne réserve pas le domaine. Nous l’achèterons manuellement à votre nom après accord. Si vous possédez déjà un domaine, indiquez-le simplement dans le formulaire.',requestId,'domain');
}
export function tadapoPaymentMessage(o:TadapoOrder){
  const consent=o.consentSnapshot as {agreement?:string;earlyStart?:boolean;earlyStartText?:string};
  return `Votre premier mois a été réglé.\n\n${consent.agreement||''}\n\nDémarrage anticipé demandé : ${consent.earlyStart?'oui':'non'}. ${consent.earlyStartText||''}\n\nConditions : ${tadapoOrigin()}/conditions-generales\n\nEnvoyez votre logo, vos photos et vos textes en réponse. La première version est prévue sous 72 h ouvrées après dossier complet et paiement. Les trois séries de retours incluses débuteront à l’envoi de cette première version, pour une durée de 30 jours. Un autre e-mail vous permet de choisir votre nom de domaine. Vos factures sont accessibles par votre lien personnel.`;
}
export async function queueTadapoReviewInvite(tx: Prisma.TransactionClient, o: TadapoOrder, completed: number, requestId?: string, message?: string) {
  const next=completed+1;
  const subject=completed===0?'Votre site Tadapo : première série de modifications':completed<3?`Votre site Tadapo corrigé : série ${next}/3${next===3?' — dernière série':''}`:'Votre site Tadapo corrigé : validation finale';
  return queueTadapoEmail(tx,o,'TADAPO_REVIEW_INVITE',subject,
    `${completed?'Les corrections de la série précédente sont réalisées.':'Votre première version est disponible.'}\n\n${message || 'Vérifiez les textes, les photos, le logo, les couleurs et vos informations pratiques. Précisez la page, l’élément concerné et le résultat souhaité.'}\n\n${next<=3?`Série ${next}/3${next===3?' : dernière série incluse':''}. Regroupez vos demandes dans le formulaire et envoyez-les en une seule fois. Attendez notre version corrigée avant la série suivante. Vous pouvez valider le site dès qu’il vous convient. Les trois séries sont à transmettre dans les 30 jours suivant l’envoi de la première version.`:'Les trois séries incluses sont terminées. Validez la version finale ou demandez un devis pour des changements supplémentaires.'}\n\nVersion du site : ${o.projectId?'ouvrez votre lien personnel ci-dessous.':''}\nLe choix du domaine suit un parcours séparé. Votre abonnement est déjà actif : aucune nouvelle activation n’est demandée.`,requestId,'reviews',requestId || `review-version/${o.reviewVersion}`);
}
