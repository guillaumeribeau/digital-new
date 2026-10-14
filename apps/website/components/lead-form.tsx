"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { examples } from "@/lib/examples";
import "@/styles/lead-form.css";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  LockKeyhole,
  CircleCheck,
  AlertCircle,
  LoaderCircle,
  Sparkles,
} from "lucide-react";
import {
  leadSchema,
  stepFields,
  leadStyleLabels,
  type Lead,
} from "@/lib/lead-schema";
import { track } from "@/lib/analytics";
import { AntiBot, type AntiBotSettings } from "./anti-bot";
const titles = [
  "Votre activité",
  "Votre direction visuelle",
  "Vos coordonnées",
];
const subtitles = [
  "L’essentiel pour comprendre ce que vous faites.",
  "Un exemple vous plaît ? Choisissez-le, ou laissez-nous proposer.",
  "Relisez votre projet et indiquez comment vous recontacter.",
];
export function LeadForm({ enabled, antiBot }: { enabled: boolean; antiBot: AntiBotSettings | null }) {
  const [turnstileToken, setTurnstileToken] = useState("");
  const [challengeVersion, setChallengeVersion] = useState(0);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const started = useRef(false);
  const mounted = useRef(false);
  const lock = useRef(false);
  const title = useRef<HTMLHeadingElement>(null);
  const lastAttempt = useRef({ payload: "", id: "" });
  const {
    register,
    handleSubmit,
    trigger,
    control,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<Lead>({
    resolver: zodResolver(leadSchema),
    mode: "onTouched",
    defaultValues: {
      company: "",
      city: "",
      services: "",
      fullName: "",
      email: "",
      phone: "",
      style: "propose",
      contactMethod: "email",
      consent: false,
      pricingAcknowledged: false,
      honeypot: "",
      requestId: "",
    },
  });
  const contactMethod = useWatch({ control, name: "contactMethod" });
  useEffect(() => {
    setValue("requestId", crypto.randomUUID());
    const params = new URLSearchParams(window.location.search);
    for (const [field, parameter] of [
      ["utmSource", "utm_source"], ["utmMedium", "utm_medium"], ["utmCampaign", "utm_campaign"],
    ] as const) {
      const value = params.get(parameter);
      if (value) setValue(field, value.slice(0, 200));
    }
  }, [setValue]);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    title.current?.focus({ preventScroll: true });
    title.current?.scrollIntoView({
      block: "start",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }, [step]);
  const field = (
    name: keyof Lead,
    label: string,
    options: {
      textarea?: boolean;
      optional?: boolean;
      type?: string;
      placeholder?: string;
      autoComplete?: string;
    } = {},
  ) => (
    <div className="field">
      <label htmlFor={name}>
        {label}
        {options.optional && <span> · facultatif</span>}
      </label>
      {options.textarea ? (
        <textarea
          id={name}
          rows={3}
          {...register(name)}
          aria-invalid={!!errors[name]}
          aria-describedby={errors[name] ? name + "-error" : undefined}
          placeholder={options.placeholder}
        />
      ) : (
        <input
          id={name}
          type={options.type || "text"}
          autoComplete={options.autoComplete}
          {...register(name)}
          aria-invalid={!!errors[name]}
          aria-describedby={errors[name] ? name + "-error" : undefined}
          placeholder={options.placeholder}
        />
      )}
      <FieldError name={name} message={errors[name]?.message} />
    </div>
  );
  const choices = (
    name: keyof Lead,
    legend: string,
    values: { value: string; label: string }[],
  ) => (
    <fieldset
      className="choice-field"
      aria-describedby={errors[name] ? name + "-error" : undefined}
    >
      <legend>{legend}</legend>
      <div className="radio-options">
        {values.map((v) => (
          <label className="radio-option" key={v.value}>
            <input
              type="radio"
              value={v.value}
              {...register(name)}
              onChange={(e) => {
                register(name).onChange(e);
                if (name === "contactMethod" && errors.phone)
                  void trigger("phone");
              }}
            />
            <span>{v.label}</span>
          </label>
        ))}
      </div>
      <FieldError name={name} message={errors[name]?.message} />
    </fieldset>
  );
  async function next() {
    const okay = await trigger(stepFields[step], { shouldFocus: true });
    if (okay) {
      setError("");
      setStep(step + 1);
      track("lead_form_step", { step: step + 2 });
    }
  }
  async function submit(data: Lead) {
    if (lock.current) return;
    if (!turnstileToken) { setError("Terminez la vérification anti-robot avant d’envoyer votre demande."); return; }
    lock.current = true;
    setBusy(true);
    setError("");
    track("lead_form_submit");
    const payload = JSON.stringify({ ...data, requestId: "" });
    if (lastAttempt.current.payload !== payload) {
      lastAttempt.current = { payload, id: crypto.randomUUID() };
    }
    data = { ...data, requestId: lastAttempt.current.id };
    setValue("requestId", data.requestId);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, turnstileToken }),
        signal: AbortSignal.timeout(25000),
      });
      const result = await response.json();
      if (!response.ok || !result.success || !result.reference) {
        setError(
          result.error ||
            "Votre demande n’a pas été transmise. Réessayez plus tard.",
        );
        return;
      }
      setReference(result.reference);
      track("lead_form_success");
    } catch {
      setError(
        "La transmission n’a pas pu être confirmée. Vérifiez votre connexion et réessayez. Vos informations sont conservées dans ce formulaire.",
      );
    } finally {
      setBusy(false);
      lock.current = false;
      setTurnstileToken("");
      setChallengeVersion((value) => value + 1);
    }
  }
  if (reference)
    return (
      <div className="form-success" role="status">
        <CircleCheck size={54} />
        <p className="eyebrow">DEMANDE ENREGISTRÉE</p>
        <h1>
          Votre projet
          <br />
          commence ici.
        </h1>
        <p>
          Votre demande est enregistrée. L’envoi de votre lien de confirmation
          est en attente de traitement. À réception, confirmez votre adresse
          e-mail pour que notre équipe puisse examiner votre projet. Pensez
          aussi à vérifier vos courriers indésirables.
        </p>
        <ol>
          <li>Vous confirmez votre adresse avec le lien reçu par e-mail.</li>
          <li>
            Nous vous recontactons pour confirmer le périmètre et le délai.
          </li>
          <li>Nous préparons votre première proposition gratuite.</li>
        </ol>
        <small>Référence : {reference}</small>
        <AntiBot key={"resend-" + challengeVersion} settings={antiBot} action="lead_resend" onToken={setTurnstileToken} />
        <button type="button" className="button" disabled={busy} onClick={async () => {
          if (!turnstileToken) { setResendMessage("Terminez la vérification anti-robot avant de demander un nouveau lien."); return; }
          setBusy(true);
          try {
            const response = await fetch("/api/leads/resend", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reference, email: getValues("email"), turnstileToken }),
              signal: AbortSignal.timeout(25000),
            });
            const result = await response.json();
            setResendMessage(result.message || result.error || "Le renvoi est temporairement indisponible.");
          } catch { setResendMessage("Le renvoi est temporairement indisponible."); }
          finally { setBusy(false); setTurnstileToken(""); setChallengeVersion((value) => value + 1); }
        }}>Demander un nouveau lien</button>
        {resendMessage && <p>{resendMessage}</p>}
        <Link className="button" href="/">
          Revenir à l’accueil
        </Link>
      </div>
    );

  return (
    <div className="form-layout lead-form-short">
      <aside className="form-sidebar">
        <p className="eyebrow">VOTRE SITE COMMENCE PAR VOUS</p>
        <h1>
          Votre activité.
          <br />
          Vos envies.
          <br />
          <span>On prend le relais.</span>
        </h1>
        <p>
          Quelques informations pour imaginer votre première proposition
          gratuite. Les détails viendront ensuite.
        </p>
        <ol>
          {titles.map((t, i) => (
            <li
              key={t}
              className={i === step ? "current" : i < step ? "done" : ""}
              aria-current={i === step ? "step" : undefined}
            >
              <span>
                {i < step ? (
                  <Check size={15} />
                ) : (
                  String(i + 1).padStart(2, "0")
                )}
              </span>
              {t}
            </li>
          ))}
        </ol>
        <div className="sidebar-reassurance">
          <LockKeyhole size={19} />
          <p>
            Demande gratuite.
            <br />
            Vous décidez après avoir vu le résultat.
          </p>
        </div>
      </aside>
      <div className="form-main">
        <div className="progress-caption">
          <span>
            ÉTAPE {step + 1} SUR {titles.length}
          </span>
          <span>{Math.round(((step + 1) / titles.length) * 100)} %</span>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-label="Progression du formulaire"
          aria-valuemin={0}
          aria-valuemax={titles.length}
          aria-valuenow={step + 1}
        >
          <span style={{ width: ((step + 1) / titles.length) * 100 + "%" }} />
        </div>
        <h2 ref={title} tabIndex={-1}>
          {titles[step]}
          <span className="blue-text">.</span>
        </h2>
        <p className="form-subtitle">{subtitles[step]}</p>
        {!enabled && (
          <div className="form-notice">
            <AlertCircle size={17} />
            <p>
              Le formulaire est en préparation. Vous pouvez explorer les étapes
              ; l’envoi sera disponible une fois notre service de réception
              activé.
            </p>
          </div>
        )}
        <p className="required-note">
          {step === 1
            ? "Le choix « Proposez-moi un style » est sélectionné par défaut."
            : "Tous les champs sont nécessaires sauf indication « facultatif »."}
        </p>
        <form
          noValidate
          onFocusCapture={() => {
            if (!started.current) {
              started.current = true;
              track("lead_form_start");
            }
          }}
          onSubmit={(e) => {
            e.preventDefault();
            if (step < titles.length - 1) void next();
            else
              void handleSubmit(submit, (fieldErrors) => {
                const invalidStep = stepFields.findIndex((fields) =>
                  fields.some((name) => fieldErrors[name]),
                );
                if (invalidStep >= 0) setStep(invalidStep);
                setError(
                  "Vérifiez les champs signalés avant d’envoyer votre demande.",
                );
              })(e);
          }}
        >
          <div className="honeypot" aria-hidden="true">
            <label htmlFor="honeypot">Ne pas remplir ce champ</label>
            <input
              id="honeypot"
              tabIndex={-1}
              autoComplete="off"
              {...register("honeypot")}
            />
          </div>
          {step === 0 && (
            <div className="fields">
              {field("company", "Nom de votre entreprise", {
                autoComplete: "organization",
                placeholder: "Ex. Atelier Martin",
              })}
              <div className="field-row">
                <div className="field">
                  <label htmlFor="sector">Votre secteur d’activité</label>
                  <select
                    id="sector"
                    {...register("sector")}
                    aria-invalid={!!errors.sector}
                    aria-describedby={
                      errors.sector ? "sector-error" : undefined
                    }
                  >
                    <option value="">Choisir un secteur</option>
                    {[
                      "Artisanat",
                      "Commerce",
                      "Indépendant",
                      "Profession libérale",
                      "Association",
                      "Autre",
                    ].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                  <FieldError name="sector" message={errors.sector?.message} />
                </div>
                {field("city", "Votre ville", {
                  autoComplete: "address-level2",
                  placeholder: "Ex. Lyon",
                })}
              </div>
              {field(
                "services",
                "Votre métier et vos principales prestations",
                {
                  textarea: true,
                  placeholder:
                    "Ex. Plombier : dépannage, installation de sanitaires et rénovation de salles de bains.",
                },
              )}
              <p className="lead-later-note">
                Quelques mots suffisent. Nous préciserons ensemble les contenus,
                les couleurs, le logo et les photos après votre demande.
              </p>
            </div>
          )}
          {step === 1 && (
            <fieldset
              className="lead-inspiration"
              aria-describedby={errors.style ? "style-error" : undefined}
            >
              <legend className="sr-only">
                Quelle direction visuelle vous plaît ?
              </legend>
              <label className="lead-propose">
                <input type="radio" value="propose" {...register("style")} />
                <Sparkles size={24} />
                <span>
                  <strong>Proposez-moi un style</strong>
                  <small>
                    Nous imaginons une direction adaptée à votre métier.
                  </small>
                </span>
              </label>
              <div className="lead-inspiration-grid">
                {examples.map((example) => (
                  <label className="lead-inspiration-card" key={example.slug}>
                    <input
                      type="radio"
                      value={example.slug}
                      {...register("style")}
                    />
                    <div className="lead-inspiration-photo">
                      <Image
                        src={
                          "/examples/previews/" + example.slug + "-desktop.webp"
                        }
                        width={1440}
                        height={1000}
                        alt={"Aperçu du site fictif " + example.name}
                        sizes="(max-width:767px) 43vw, (max-width:1100px) 24vw, 17vw"
                      />
                      <span className="lead-choice-check" aria-hidden="true">
                        <Check size={13} />
                      </span>
                    </div>
                    <span className="lead-inspiration-caption">
                      <strong>{example.name}</strong>
                      <small>{example.sector}</small>
                    </span>
                  </label>
                ))}
              </div>
              <p className="lead-inspiration-note">
                Ces exemples fictifs donnent une direction. Votre proposition
                sera adaptée à votre activité.
              </p>
              <FieldError name="style" message={errors.style?.message} />
            </fieldset>
          )}
          {step === 2 && (
            <div className="fields">
              {field("fullName", "Nom et prénom", { autoComplete: "name" })}
              {field("email", "Votre adresse e-mail", {
                type: "email",
                autoComplete: "email",
                placeholder: "vous@entreprise.fr",
              })}
              {choices(
                "contactMethod",
                "Comment préférez-vous être contacté ?",
                [
                  { value: "email", label: "Par e-mail" },
                  { value: "telephone", label: "Par téléphone" },
                ],
              )}
              {field("phone", "Votre téléphone", {
                type: "tel",
                autoComplete: "tel",
                optional: contactMethod !== "telephone",
                placeholder: "06 12 34 56 78",
              })}
              <section
                className="lead-review"
                aria-label="Récapitulatif de votre demande"
              >
                <h3>Votre demande en un coup d’œil</h3>
                <Summary
                  title="Votre activité"
                  onEdit={() => setStep(0)}
                  rows={[
                    ["Entreprise", getValues("company")],
                    ["Secteur", getValues("sector")],
                    ["Ville", getValues("city")],
                    ["Métier et prestations", getValues("services")],
                  ]}
                />
                <Summary
                  title="Votre direction visuelle"
                  onEdit={() => setStep(1)}
                  rows={[
                    ["Votre choix", leadStyleLabels[getValues("style")]],
                    [
                      "Contenus, logo et photos",
                      "À préciser lors de nos échanges",
                    ],
                  ]}
                />
              </section>
              <div className="consent-field">
                <label>
                  <input type="checkbox" {...register("pricingAcknowledged")}
                    aria-invalid={!!errors.pricingAcknowledged}
                    aria-describedby={errors.pricingAcknowledged ? "pricingAcknowledged-error" : undefined} />
                  <span>J’ai pris connaissance des tarifs : première proposition gratuite,
                    création à 299 € HT payable après validation, puis gestion technique
                    à 29 € HT/mois, sans engagement de durée. Domaine, hébergement
                    et mise en ligne pris en charge.</span>
                </label>
                <FieldError name="pricingAcknowledged" message={errors.pricingAcknowledged?.message} />
                <label>
                  <input
                    type="checkbox"
                    {...register("consent")}
                    aria-invalid={!!errors.consent}
                    aria-describedby={
                      errors.consent ? "consent-error" : undefined
                    }
                  />
                  <span>
                    J’accepte que les informations saisies soient utilisées pour
                    traiter ma demande et me recontacter au sujet de mon projet.
                  </span>
                </label>
                <Link href="/politique-confidentialite" target="_blank">
                  Lire la politique de confidentialité (nouvel onglet)
                </Link>
                <FieldError name="consent" message={errors.consent?.message} />
              </div>
            </div>
          )}
          {step === 2 && <AntiBot key={"submit-" + challengeVersion} settings={antiBot} action="lead_submit" onToken={setTurnstileToken} />}
          {error && (
            <div className="form-error" role="alert">
              <AlertCircle size={19} />
              <p>{error}</p>
            </div>
          )}
          <div className="form-controls">
            {step > 0 ? (
              <button
                type="button"
                className="back-button"
                disabled={busy}
                onClick={() => {
                  setError("");
                  setStep(step - 1);
                }}
              >
                Retour
              </button>
            ) : (
              <span />
            )}
            <button className="button" type="submit" disabled={busy}>
              {busy ? (
                <>
                  <LoaderCircle className="spinner" size={18} />
                  Transmission…
                </>
              ) : step === titles.length - 1 ? (
                "Envoyer ma demande gratuitement"
              ) : (
                "Continuer"
              )}
              {!busy && (
                <span className="button-spark" aria-hidden="true">
                  ✳︎
                </span>
              )}
            </button>
          </div>
          <p className="form-privacy">
            <LockKeyhole size={13} />
            Vos coordonnées ne sont pas utilisées pour la mesure d’audience.
          </p>
        </form>
      </div>
    </div>
  );
}
function FieldError({ name, message }: { name: string; message?: string }) {
  return message ? (
    <p className="field-error" id={name + "-error"} role="alert">
      {message}
    </p>
  ) : null;
}
function Summary({
  title,
  rows,
  onEdit,
}: {
  title: string;
  rows: [string, string | undefined][];
  onEdit: () => void;
}) {
  return (
    <section className="summary-section">
      <div>
        <h3>{title}</h3>
        <button type="button" onClick={onEdit}>
          Modifier
        </button>
      </div>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value || "Non renseigné"}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
