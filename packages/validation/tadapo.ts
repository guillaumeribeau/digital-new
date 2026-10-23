import { z } from "zod";
const text = (label: string, max = 200) => z.string().trim().min(2, `${label} : précisez votre réponse.`).max(max, "Ce texte est trop long.");
const optional = (max = 1500) => z.string().trim().max(max, "Ce texte est trop long.");
export const tadapoBriefSchema = z.object({
  plan: z.enum(["essentiel", "business"]), term: z.enum(["12", "monthly"]),
  company: text("Entreprise"), activity: text("Activité"), area: text("Zone d’activité"),
  fullName: text("Nom"), email: z.email("Indiquez une adresse e-mail valide.").max(254),
  phone: optional(40), objectives: text("Objectifs", 1500), services: text("Prestations", 2500),
  audience: text("Clientèle", 500), pages: optional(1000),
  existingWebsite: optional(500).refine(value => !value || (URL.canParse(value) && ["http:", "https:"].includes(new URL(value).protocol)), "Utilisez une adresse complète commençant par https://."),
  style: text("Style", 100), colors: optional(300), inspirations: optional(1000),
  logo: z.enum(["oui", "non", "a-prevoir"]), content: optional(1500),
  domainMode: z.enum(["existing", "new", "help"]), domain: optional(253),
}).strict().superRefine((value, context) => {
  if (value.domainMode !== "help" && !/^(?!-)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(value.domain)) {
    context.addIssue({ code: "custom", path: ["domain"], message: "Indiquez un domaine sans https://, par exemple mon-entreprise.fr." });
  }
  if (value.plan === "business" && value.pages.trim().length < 2) {
    context.addIssue({ code: "custom", path: ["pages"], message: "Indiquez les pages souhaitées, dans la limite de cinq." });
  }
});
export type TadapoBrief = z.infer<typeof tadapoBriefSchema>;
