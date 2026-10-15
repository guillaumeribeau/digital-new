import { brand } from "../config/brand.config";

export function escapeEmailHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

type EmailDesign = {
  preview: string;
  label: string;
  title: string;
  introduction: string;
  content: string;
  afterAction?: string;
  reference: string;
  action?: { label: string; url: string };
};

export function leadEmailTemplate(email: EmailDesign) {
  const escape = escapeEmailHtml;
  const origin = process.env.NEXT_PUBLIC_SITE_URL || brand.domain;
  const logo = new URL("/pics/Logo moderne zelyweb fond transparent.png", origin).href;
  const action = email.action;
  const button = action ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0;width:100%;"><tr><td align="center" bgcolor="#2454ff" style="border-radius:8px;mso-padding-alt:18px 24px;">
    <a href="${escape(action.url)}" style="display:block;padding:18px 24px;color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;text-align:center;">${escape(action.label)} &rarr;</a>
  </td></tr></table>` : "";
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escape(email.title)} — ${escape(brand.name)}</title></head>
<body style="margin:0;padding:0;background-color:#f3f3ee;color:#111111;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${escape(email.preview)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#f3f3ee"><tr><td align="center" style="padding:32px 16px;">
<!--[if mso]><table role="presentation" width="600"><tr><td><![endif]-->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;">
<tr><td style="padding:4px 8px 24px;"><a href="${escape(origin)}" style="text-decoration:none;"><img src="${escape(logo)}" width="168" height="56" alt="${escape(brand.name)}" style="display:block;border:0;width:168px;height:56px;color:#111111;font-size:24px;font-weight:bold;"></a></td></tr>
<tr><td bgcolor="#2454ff" style="padding:32px 28px;border-radius:16px 16px 0 0;">
<p style="margin:0 0 20px;font-size:11px;line-height:1.5;font-weight:bold;letter-spacing:1.5px;color:#efff62;text-transform:uppercase;">${escape(email.label)}</p>
<h1 style="margin:0;font-size:32px;line-height:1.18;letter-spacing:-1px;color:#ffffff;font-weight:bold;">${escape(email.title)}</h1>
</td></tr>
<tr><td bgcolor="#ffffff" style="padding:28px;border-radius:0 0 16px 16px;">
<p style="margin:0 0 18px;font-size:17px;line-height:1.7;">${escape(email.introduction)}</p>
${email.content}
${button}
${email.afterAction || ""}
${action ? `<p style="margin:0 0 18px;color:#585952;font-size:12px;line-height:1.7;">Le bouton ne s’ouvre pas ? Copiez ce lien dans votre navigateur :<br><a href="${escape(action.url)}" style="color:#2454ff;word-break:break-all;overflow-wrap:anywhere;">${escape(action.url)}</a></p>` : ""}
<p style="margin:28px 0 0;padding-top:20px;border-top:1px solid #e9e9e5;font-size:14px;line-height:1.7;">À bientôt,<br><strong>L’équipe ${escape(brand.name)}</strong></p>
</td></tr>
<tr><td style="padding:24px 8px 0;color:#585952;font-size:11px;line-height:1.8;">
<p style="margin:0 0 8px;overflow-wrap:anywhere;">Référence de votre demande : ${escape(email.reference)}</p>
<p style="margin:0;"><strong>${escape(brand.name)}</strong> · Votre site internet, on s’occupe de tout.<br>Première proposition gratuite. Aucun paiement à cette étape.</p>
</td></tr></table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table></body></html>`;
}
