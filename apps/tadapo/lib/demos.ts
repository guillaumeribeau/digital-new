import { demoPhotos } from "./demo-photos";

export const demos = [
  { slug: "courant", name: "Courant", sector: "Artisan électricien", category: "Artisan", title: "Du courant. Des idées.",
    description: "Des installations bien pensées pour une maison qui vous ressemble.", image: "/images/courant.jpg", alt: "Tableau électrique et câbles d’une installation", tone: "electric", credit: "https://www.pexels.com/photo/257736/", photographer: "Pixabay", label: "Simple. Précis. Bien connecté.",
    services: [["Rénovation électrique", "Repenser vos circuits et vos équipements selon les usages de votre logement."], ["Éclairage intérieur", "Donner à chaque pièce la lumière dont elle a besoin."], ["Maison connectée", "Des commandes et des équipements pour simplifier votre quotidien."]],
  },
  { slug: "studio-alba", name: "studio alba", sector: "Architecture d’intérieur", category: "Indépendant", title: "De l’espace pour vos idées.",
    description: "Des lieux sensibles, des matières naturelles et une autre façon d’habiter.", image: demoPhotos.livingRoom.src, alt: demoPhotos.livingRoom.alt, tone: "alba", credit: demoPhotos.livingRoom.credit, photographer: demoPhotos.livingRoom.photographer, label: "Penser les lieux. Révéler leur caractère.",
    services: [["Conception des espaces", "Imaginer des volumes et des circulations en accord avec votre façon de vivre."], ["Matières & couleurs", "Composer une palette singulière, des premières intentions aux derniers détails."], ["Accompagnement du projet", "Une approche attentive pour vous guider dans les choix de votre intérieur."]],
  },
  { slug: "pollen", name: "pollen.", sector: "Restaurant de saison", category: "Commerce", title: "Les bonnes choses se partagent.",
    description: "Une cuisine de saison, de grandes tablées et le plaisir de prendre son temps.", image: demoPhotos.dish.src, alt: demoPhotos.dish.alt, tone: "pollen", credit: demoPhotos.dish.credit, photographer: demoPhotos.dish.photographer, label: "Une table vivante. Une cuisine de saison.",
    services: [["À la carte", "Des assiettes qui suivent les saisons et les envies de la cuisine."], ["Le temps du déjeuner", "Une parenthèse gourmande pour se retrouver autour d’une belle assiette."], ["Les grandes occasions", "Un cadre chaleureux pour imaginer un repas à plusieurs."]],
  },
] as const;
export type TadapoDemo = (typeof demos)[number];
