export const exampleSectors = [
  "Tous",
  "Artisanat",
  "Commerce",
  "Indépendants",
  "Professions libérales",
  "Associations",
];
export const examples = [
  {
    slug: "plombier",
    name: "Atelier Martin Plomberie",
    shortName: "Atelier Martin",
    sector: "Plombier",
    category: "Artisanat",
    theme: "plumber",
    tagline: "Le confort commence par un travail bien fait.",
    description:
      "Un site rassurant, une offre lisible et une demande de devis à portée de main.",
    palette: ["#153e5a", "#f5f7f8", "#c5d7e0"],
    type: "Sobre & professionnel",
  },
  {
    slug: "paysagiste",
    name: "Les Jardins d’Arthur",
    shortName: "Les Jardins d’Arthur",
    sector: "Paysagiste",
    category: "Artisanat",
    theme: "garden",
    tagline: "Le jardin, une autre façon d’habiter.",
    description:
      "Une expérience immersive, où les images et les matières racontent le savoir-faire.",
    palette: ["#3c4938", "#ede8dc", "#c5bd99"],
    type: "Naturel & immersif",
  },
  {
    slug: "coiffure",
    name: "Maison Camille",
    shortName: "Maison Camille",
    sector: "Salon de coiffure",
    category: "Commerce",
    theme: "salon",
    tagline: "Une allure. La vôtre.",
    description:
      "Un univers éditorial, des cadrages élégants et une identité qui se remarque.",
    palette: ["#272422", "#f2ece4", "#ae6249"],
    type: "Éditorial & minimal",
  },
  {
    slug: "conseil",
    name: "Horizon Conseil",
    shortName: "Horizon Conseil",
    sector: "Cabinet de conseil",
    category: "Indépendants",
    theme: "consulting",
    tagline: "Une vision claire. Des décisions qui avancent.",
    description:
      "Une présence premium et structurée qui rend l’expertise accessible.",
    palette: ["#142b43", "#ffffff", "#b7a176"],
    type: "Structuré & contemporain",
  },
  {
    slug: "bien-etre",
    name: "Équilibre & Sens",
    shortName: "Équilibre & Sens",
    sector: "Bien-être",
    category: "Professions libérales",
    theme: "wellness",
    tagline: "Faire de la place à l’essentiel.",
    description:
      "Un site chaleureux, une lecture paisible et une invitation à prendre contact.",
    palette: ["#657760", "#f9f7f0", "#dfd1bb"],
    type: "Doux & lumineux",
  },
  {
    slug: "association",
    name: "Ensemble & Demain",
    shortName: "Ensemble & Demain",
    sector: "Association",
    category: "Associations",
    theme: "community",
    tagline: "Le lien change tout.",
    description:
      "Une identité humaine et vivante pour présenter les actions et donner envie de participer.",
    palette: ["#136e77", "#fffdf7", "#f2ac77"],
    type: "Humain & dynamique",
  },
] as const;
export type ExampleSlug = (typeof examples)[number]["slug"];
export type Example = (typeof examples)[number];
