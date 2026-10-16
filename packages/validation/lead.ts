import { z } from "zod";
const required = (label: string, max = 200) =>
  z
    .string()
    .trim()
    .min(2, label + " : indiquez au moins 2 caractères.")
    .max(max, "Ce texte est trop long.");
const optional = (max = 1000) =>
  z.string().trim().max(max, "Ce texte est trop long.");
export const leadStyleLabels = {
  propose: "Proposez-moi un style",
  plombier: "Atelier Martin Plomberie",
  paysagiste: "Les Jardins d’Arthur",
  coiffure: "Maison Camille",
  conseil: "Horizon Conseil",
  "bien-etre": "Équilibre & Sens",
  association: "Ensemble & Demain",
  restaurant: "L’Atelier des Braises",
  photographe: "Noé Laurent Studio",
  automobile: "Atelier Minuit",
  graphique: "Audacieux & graphique",
  naturel: "Chaleureux & naturel",
  minimal: "Épuré & essentiel",
};
const websiteSchema = z
  .object({
    hasWebsite: z
      .enum(["oui", "non"], { error: "Choisissez une réponse." })
      .optional(),
    website: optional(500)
      .optional()
      .refine(
        (v) =>
          !v ||
          (URL.canParse(v) &&
            ["http:", "https:"].includes(new URL(v).protocol)),
        "Indiquez une adresse complète, par exemple https://exemple.fr.",
      ),
  })
  .superRefine((v, ctx) => {
    if (v.hasWebsite === "oui" && !v.website)
      ctx.addIssue({
        code: "custom",
        path: ["website"],
        message: "Indiquez l’adresse de votre site actuel.",
      });
  });
export const leadSchema = z
  .object({
    company: required("Nom de l’entreprise"),
    sector: z.enum(
      [
        "Artisanat",
        "Commerce",
        "Indépendant",
        "Profession libérale",
        "Association",
        "Autre",
      ],
      { error: "Choisissez votre secteur." },
    ),
    city: required("Ville"),
    services: required("Votre métier et vos prestations", 1500),
    style: z.enum(
      [
        "propose",
        "plombier",
        "paysagiste",
        "coiffure",
        "conseil",
        "bien-etre",
        "association",
        "restaurant",
        "photographe",
        "automobile",
        "graphique",
        "naturel",
        "minimal",
      ],
      { error: "Choisissez un exemple ou laissez-nous proposer un style." },
    ),
    // Optional legacy brief fields remain accepted, but are no longer required to request a proposal.
    description: optional(1500).optional(),
    colors: optional(200).optional(),
    hasLogo: z.enum(["oui", "non", "en cours"]).optional(),
    hasPhotos: z.enum(["oui", "non", "en cours"]).optional(),
    extra: optional(2000).optional(),
    fullName: required("Nom et prénom"),
    email: z.email("Indiquez une adresse e-mail valide.").max(254),
    phone: z
      .string()
      .trim()
      .max(25, "Ce numéro est trop long.")
      .optional()
      .refine(
        (v) =>
          !v ||
          (/^[+0-9(). -]+$/.test(v) && v.replace(/[^0-9]/g, "").length >= 7),
        "Indiquez un numéro de téléphone valide.",
      ),
    contactMethod: z.enum(["email", "telephone"], {
      error: "Choisissez un moyen de contact.",
    }),
    consent: z
      .boolean()
      .refine((v) => v, "Votre accord est nécessaire pour traiter la demande."),
    honeypot: z.string().max(0, "Demande non valide."),
    pricingAcknowledged: z.boolean().refine((v) => v,
      "Confirmez avoir pris connaissance des tarifs."),
    utmSource: optional(200).optional(),
    utmMedium: optional(200).optional(),
    utmCampaign: optional(200).optional(),
    requestId: z.uuid("Identifiant de demande non valide."),
  })
  .superRefine((v, ctx) => {
    if (v.contactMethod === "telephone" && !v.phone)
      ctx.addIssue({
        code: "custom",
        path: ["phone"],
        message: "Indiquez un numéro pour être contacté par téléphone.",
      });
  })
  .and(websiteSchema);
export type Lead = z.infer<typeof leadSchema>;
export const stepFields: (keyof Lead)[][] = [
  ["company", "sector", "city", "services"],
  ["style"],
  ["fullName", "email", "phone", "contactMethod", "consent", "pricingAcknowledged"],
];
