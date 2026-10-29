import credits from "../public/images/demos/credits.json";

const descriptions = {
  "living-room": "Un salon lumineux aux fauteuils en lin, bois clair et matières naturelles",
  bathroom: "Une salle de bain contemporaine aux lignes épurées",
  workspace: "Un espace de travail lumineux avec des suspensions et un mur en bois",
  "meeting-room": "Un espace de réunion minimaliste et ses grandes ouvertures",
  house: "Une maison éclairée à la tombée du jour",
  dish: "Une assiette de volaille, légumes et sauce, dressée sur une table de restaurant",
  terrace: "Une terrasse végétalisée, avec mobilier en bois et grand parasol",
} as const;

export type DemoPhoto = { src: string; alt: string; photographer: string; credit: string };

function photo(id: keyof typeof descriptions): DemoPhoto {
  const asset = credits.find(item => item.id === id)!;
  return { ...asset, alt: descriptions[id] };
}

export const demoPhotos = {
  livingRoom: photo("living-room"), bathroom: photo("bathroom"), workspace: photo("workspace"),
  meetingRoom: photo("meeting-room"), house: photo("house"), dish: photo("dish"), terrace: photo("terrace"),
  electrical: { src: "/images/courant.jpg", alt: "Le câblage et les protections d’un tableau électrique", photographer: "Pixabay", credit: "https://www.pexels.com/photo/257736/" },
  architecture: { src: "/images/alba.jpg", alt: "Les lignes géométriques d’une façade contemporaine", photographer: "Juan Pablo Daniel", credit: "https://www.pexels.com/photo/modern-geometric-black-and-white-building-facade-36197789/" },
  restaurant: { src: "/images/pollen.jpg", alt: "Des tables en bois et des suspensions dans une salle de restaurant intimiste", photographer: "miniperde", credit: "https://www.pexels.com/photo/dark-modern-interior-of-a-restaurant-15626998/" },
} satisfies Record<string, DemoPhoto>;
