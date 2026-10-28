"use client";
import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Download, LockKeyhole } from "lucide-react";
import { tadapoBriefSchema, type TadapoBrief } from "@nova/validation/tadapo";
import { tadapoAgreement, tadapoOfferVersion, tadapoMoney, tadapoOffer, type TadapoPlan, type TadapoTerm } from "@nova/shared/tadapo";
import { Spark } from "./logo";
import { DomainSearch } from "./domain-search";
const steps = ["Votre entreprise", "Votre futur site", "Votre univers", "Votre domaine", "Récapitulatif", "Confirmer et payer"];
const stepFields: (keyof TadapoBrief)[][] = [
  ["company", "activity", "area", "fullName", "email", "phone"],
  ["objectives", "services", "audience", "pages", "existingWebsite"],
  ["style", "colors", "inspirations", "logo", "content"], ["domainMode", "domain"],
];
export function OrderWizard({ plan, term }: { plan: TadapoPlan; term: TadapoTerm }) {
  const [step, setStep] = useState(0);
  const [brief, setBrief] = useState<TadapoBrief>({ plan, term, company: "", activity: "", area: "", fullName: "", email: "", phone: "", objectives: "", services: "", audience: "", pages: "", existingWebsite: "", style: "À imaginer ensemble", colors: "", inspirations: "", logo: "non", content: "", domainMode: "help", domain: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof TadapoBrief, string>>>({});
  const [downloaded, setDownloaded] = useState(false);
  const [agreement, setAgreement] = useState(false), [privacy, setPrivacy] = useState(false), [earlyStart, setEarlyStart] = useState(false);
  const [pending, setPending] = useState(false), [submitError, setSubmitError] = useState("");
  const attempt = useRef<{ fingerprint: string; requestId: string } | null>(null);
  async function pay() {
    const data = validate(); if (!data || !agreement || !privacy || pending) return;
    const fingerprint = JSON.stringify({ brief: data, earlyStart });
    if (attempt.current?.fingerprint !== fingerprint) attempt.current = { fingerprint, requestId: crypto.randomUUID() };
    setPending(true); setSubmitError("");
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ brief: data, requestId: attempt.current.requestId, offerVersion: tadapoOfferVersion, agreement, privacy, earlyStart, honeypot: "" }) });
      const result = await response.json();
      if (!response.ok) { if (result.code === "CHECKOUT_EXPIRED") attempt.current = null; throw new Error(result.error); }
      if (typeof result.url !== "string" || !result.url.startsWith("https://checkout.stripe.com/")) throw new Error("Le lien de paiement est indisponible.");
      window.location.assign(result.url);
    } catch (error) { setSubmitError(error instanceof Error ? error.message : "Le paiement est indisponible. Réessayez."); setPending(false); }
  }
  const heading = useRef<HTMLHeadingElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const offer = tadapoOffer(brief.plan, brief.term);
  function update<K extends keyof TadapoBrief>(field: K, value: TadapoBrief[K]) {
    setBrief(previous => ({ ...previous, [field]: value }));
    setErrors(previous => ({ ...previous, [field]: undefined }));
    setDownloaded(false);
  }
  function go(next: number) {
    setStep(next);
    requestAnimationFrame(() => { heading.current?.focus(); heading.current?.scrollIntoView({ block: "start", behavior: "instant" }); });
  }
  function validate(fields?: (keyof TadapoBrief)[]) {
    const parsed = tadapoBriefSchema.safeParse(brief);
    if (parsed.success) return parsed.data;
    const nextErrors: Partial<Record<keyof TadapoBrief, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof TadapoBrief;
      if (!fields || fields.includes(field)) nextErrors[field] ??= issue.message;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      requestAnimationFrame(() => form.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus());
      return null;
    }
    return brief;
  }
  function next(event: FormEvent) {
    event.preventDefault();
    if (validate(stepFields[step])) go(Math.min(step + 1, 5));
  }
  function download() {
    const data = validate();
    if (!data) { const first = stepFields.findIndex(fields => fields.some(field => errors[field])); go(first < 0 ? 0 : first); return; }
    const record = { state: "local-draft-not-submitted", brand: "tadapo", offer, brief: data };
    const url = URL.createObjectURL(new Blob([JSON.stringify(record, null, 2)], { type: "application/json;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "mon-projet-tadapo.json"; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); setDownloaded(true);
  }
  function field(name: keyof TadapoBrief, label: string, options: { type?: string; placeholder?: string; multiline?: boolean; optional?: boolean; autoComplete?: string } = {}) {
    const attributes = { id: name, name, value: brief[name], "aria-invalid": !!errors[name], "aria-describedby": errors[name] ? `${name}-error` : undefined, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update(name, event.target.value), placeholder: options.placeholder, required: !options.optional, autoComplete: options.autoComplete, maxLength: name === "services" ? 2500 : options.multiline ? 1500 : 500 };
    return <div className={`order-field${options.multiline ? " field-wide" : ""}`} key={name}><label htmlFor={name}>{label}{options.optional && <span> — facultatif</span>}</label>{options.multiline ? <textarea {...attributes} rows={4} /> : <input {...attributes} type={options.type || "text"} />}{errors[name] && <p id={`${name}-error`} className="field-error">{errors[name]}</p>}</div>;
  }
  return <div className="order-layout t-container"><aside className="order-aside"><p className="t-eyebrow">VOTRE GRAND DÉPART</p><h1>Un beau site <br />commence <br /><span>par vous.</span></h1><p>Quelques questions pour imaginer<br />un site qui vous ressemble.</p><ol className="order-progress" aria-label="Étapes du questionnaire">{steps.map((title, index) => <li key={title} aria-current={index === step ? "step" : undefined} className={index < step ? "is-complete" : ""}><span>{index < step ? <Check size={14} /> : `0${index + 1}`}</span>{title}</li>)}</ol><div className="order-plan"><span>VOTRE FORMULE</span><strong>{offer.name} <small>{tadapoMoney(offer.htCents)} € HT/mois</small></strong><p>{offer.minimumMonths ? "Engagement 12 mois · paiement mensuel" : "Sans engagement de durée"}<br />0 € de frais de création</p><Link href="/#tarifs">Changer de formule</Link></div></aside>
    <div className="order-panel"><div className="order-panel-top"><span>ÉTAPE {step + 1} / {steps.length}</span><span><LockKeyhole size={13} /> Vos réponses restent dans cet onglet</span></div><div className="order-progress-bar"><i style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div><h2 ref={heading} tabIndex={-1}>{steps[step]}<span>.</span></h2><form ref={form} noValidate onSubmit={next}><div className="order-step" key={step}>
      {step === 0 && <><p className="step-intro">D’abord, faisons connaissance.</p><div className="order-fields">{field("company", "Nom de votre entreprise", { autoComplete: "organization" })}{field("activity", "Votre activité", { placeholder: "Électricien, fleuriste, coach…" })}{field("area", "Votre zone d’activité", { placeholder: "Ville, région ou France entière" })}{field("fullName", "Votre nom et prénom", { autoComplete: "name" })}{field("email", "Votre adresse e-mail", { type: "email", autoComplete: "email" })}{field("phone", "Votre téléphone", { type: "tel", autoComplete: "tel", optional: true })}</div></>}
      {step === 1 && <><p className="step-intro">Que doit raconter votre {offer.pages === 1 ? "page" : "site de cinq pages maximum"} ?</p><div className="order-fields">{field("objectives", "À quoi doit servir votre site ?", { multiline: true, placeholder: "Présenter mon activité, recevoir des demandes de devis…" })}{field("services", "Vos principales prestations", { multiline: true })}{field("audience", "À qui vous adressez-vous ?")}{offer.pages > 1 && field("pages", "Quelles pages souhaitez-vous ?", { placeholder: "Accueil, services, réalisations, à propos, contact" })}{field("existingWebsite", "Votre site actuel", { type: "url", optional: true, placeholder: "https://…" })}</div></>}
      {step === 2 && <><p className="step-intro">Place à votre personnalité.</p><div className="order-fields"><div className="order-field"><label htmlFor="style">L’ambiance qui vous ressemble</label><select id="style" value={brief.style} onChange={event => update("style", event.target.value)}>{["À imaginer ensemble", "Épurée et lumineuse", "Chaleureuse et naturelle", "Colorée et expressive", "Élégante et sobre"].map(value => <option key={value}>{value}</option>)}</select></div><div className="order-field"><label htmlFor="logo">Avez-vous un logo ?</label><select id="logo" value={brief.logo} onChange={event => update("logo", event.target.value as TadapoBrief["logo"])}><option value="non">Non</option><option value="oui">Oui</option><option value="a-prevoir">En préparation</option></select></div>{field("colors", "Vos couleurs préférées", { optional: true })}{field("inspirations", "Des sites ou styles qui vous plaisent ?", { optional: true, multiline: true })}{field("content", "Vos textes, photos et contenus disponibles", { optional: true, multiline: true, placeholder: "Décrivez ce que vous avez déjà. N’indiquez aucun mot de passe ou lien privé." })}</div><p className="order-help">Les fichiers pourront être échangés après l’ouverture de votre projet. Aucun document n’est envoyé ici.</p></>}
      {step === 3 && <><p className="step-intro">Une adresse à vous, pour votre activité.</p><fieldset className="domain-choices"><legend>Votre nom de domaine</legend>{([["existing", "J’ai déjà un domaine", "Nous préparons son raccordement sans demander vos mots de passe."], ["new", "Je souhaite un nouveau domaine", "Son prix et sa disponibilité seront vérifiés avant réservation."], ["help", "J’ai besoin d’un conseil", "Nous choisirons une adresse adaptée à votre activité."]] as const).map(([value, title, text]) => <label className={brief.domainMode === value ? "selected" : ""} key={value}><input type="radio" name="domainMode" value={value} checked={brief.domainMode === value} onChange={() => update("domainMode", value)} /><span><strong>{title}</strong><small>{text}</small></span></label>)}</fieldset>{brief.domainMode !== "help" && field("domain", brief.domainMode === "existing" ? "Votre domaine actuel" : "Le domaine souhaité", { placeholder: "mon-entreprise.fr" })}{brief.domainMode === "new" && <DomainSearch key={brief.domain} domain={brief.domain || ""} />}{brief.domainMode === "existing" && <p><Link href="/domaine-existant">Voir les étapes de raccordement de mon domaine</Link></p>}<div className="order-info"><strong>{offer.plan === "business" ? "Votre domaine Business" : "Votre domaine Essentiel"}</strong><p>{"Un domaine est inclus jusqu’à 20 € HT par an dans chaque formule. Tout dépassement fait l’objet d’un devis complémentaire à accepter et régler séparément."} Le domaine sera enregistré à votre nom.</p><p>Une recherche ne réserve pas le domaine. Aucun achat ni renouvellement n’est effectué ici.</p></div></>}
      {step === 4 && <><p className="step-intro">Tout est là ? Relisez, ajustez, puis gardez votre récapitulatif.</p><div className="summary-price"><span>Site {offer.name}</span><strong>{tadapoMoney(offer.htCents)} € <small>HT / mois</small></strong><p>{tadapoMoney(offer.ttcCents, 2)} € TTC / mois · TVA 20 %</p><p>{offer.minimumMonths ? "Engagement initial de 12 mois, facturation mensuelle" : "Sans engagement de durée"}</p><p>Création : 0 € · {offer.pages === 1 ? "Une page" : "Jusqu’à cinq pages"} · {offer.modifications} modification{offer.modifications > 1 ? "s" : ""}/mois</p><ul className="summary-features">{offer.features.map(feature => <li key={feature}>{feature}</li>)}</ul>{offer.googleBusinessProfile && <p>* Selon votre éligibilité et les validations de Google.</p>}<p>{offer.domainAnnualCapCents ? "Domaine inclus jusqu’à 20 € HT/an." : "Domaine en supplément, prix à confirmer."}</p></div>{stepFields.map((fields, index) => <section className="summary-section" key={index}><div><h3>{steps[index]}</h3><button type="button" onClick={() => go(index)}>Modifier</button></div><dl>{fields.filter(key => brief[key] && !(key === "pages" && offer.pages === 1)).map(key => <div key={key}><dt>{({ company: "Entreprise", activity: "Activité", area: "Zone", fullName: "Contact", email: "E-mail", phone: "Téléphone", objectives: "Objectifs", services: "Prestations", audience: "Clientèle", pages: "Pages", existingWebsite: "Site actuel", style: "Style", colors: "Couleurs", inspirations: "Inspirations", logo: "Logo", content: "Contenus", domainMode: "Choix du domaine", domain: "Domaine" } as Record<string, string>)[key]}</dt><dd>{key === "domainMode" ? ({ existing: "Domaine existant", new: "Nouveau domaine à vérifier", help: "Conseil souhaité" })[brief.domainMode] : brief[key]}</dd></div>)}</dl></section>)}<p className="order-info">Première version à valider sous 72 h ouvrées après réception du dossier complet et du paiement. Le premier mois est réglé à la prochaine étape. Le domaine est inclus jusqu’à 20 € HT/an ; seul le dépassement sera approuvé et payé séparément. Trois séries de retours sont incluses dans les 30 jours suivant l’envoi de la première version.</p><button className="t-button t-button-outline" type="button" onClick={download}><Download size={17} /> Télécharger mon récapitulatif</button>{downloaded && <p role="status" className="download-status">Le téléchargement est lancé. Aucune demande n’a été transmise.</p>}</>}
      {step === 5 && <div className="order-finish"><Spark /><h3>Votre projet.<br />On commence.</h3><p>{tadapoAgreement(offer)}</p><p><Link href="/conditions-generales" target="_blank">Lire les conditions générales</Link> · <Link href="/retractation" target="_blank">Rétractation</Link> · <Link href="/resiliation" target="_blank">Résiliation</Link></p><label className="order-consent"><input type="checkbox" checked={agreement} onChange={e => setAgreement(e.target.checked)} /> J’accepte l’offre et les conditions générales présentées ci-dessus.</label><label className="order-consent"><input type="checkbox" checked={privacy} onChange={e => setPrivacy(e.target.checked)} /> J’ai pris connaissance de la <Link href="/confidentialite" target="_blank">politique de confidentialité</Link>.</label><label className="order-consent"><input type="checkbox" checked={earlyStart} onChange={e => setEarlyStart(e.target.checked)} /> Je demande expressément le démarrage de la prestation avant la fin du délai de rétractation applicable et j’ai pris connaissance des conséquences décrites sur la page Rétractation.</label><p>Sans demande de démarrage anticipé, la création commencera après le délai applicable de 14 jours. La première version est prévue sous 72 h ouvrées après paiement et réception du dossier complet, à compter du démarrage autorisé.</p><button className="t-button" type="button" disabled={pending || !agreement || !privacy} onClick={() => void pay()}><LockKeyhole size={18} /> {pending ? "Ouverture du paiement…" : `Commander et payer ${tadapoMoney(offer.ttcCents, 2)} € TTC`}</button>{submitError && <p role="alert" className="field-error">{submitError}</p>}<p>Paiement sécurisé par Stripe. Votre abonnement sera ensuite prélevé chaque mois à la date de commande.</p></div>}
    </div><div className="order-navigation">{step > 0 && <button className="t-text-link" type="button" onClick={() => go(step - 1)}><ArrowLeft size={16} /> Précédent</button>}{step < 5 && <button type="submit" className="t-button">{step === 4 ? "Confirmer et payer" : "Continuer"}<ArrowRight size={17} /></button>}</div></form><p className="order-privacy">Avant paiement, vos réponses restent en mémoire dans cet onglet. À la commande, elles sont enregistrées pour traiter votre projet. <Link href="/confidentialite">Confidentialité</Link></p></div></div>;
}
