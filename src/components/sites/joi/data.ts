export const NAV = ["Explore", "Gallery", "Create AI", "Chats"] as const;

export const FILTER_TAGS = [
  "All", "Anime", "LGBT+", "Fantasy", "Dominant", "Straight",
  "Kinky", "Trans", "Mommy", "Lesbian", "Gay",
] as const;

export type CharacterCard = {
  tagline: string;
  name: string;
  age: number;
  blurb: string;
  likes: string;
  chats: string;
  badge: "Original" | "Verified";
  video?: boolean;
  /** Optional image path (e.g. /sites/joi/cards/01.jpg). Falls back to a gradient. */
  image?: string;
};

export const SIDE_MENU = [
  { title: "Explore", items: ["Women", "Men", "Anime", "All categories"] },
  { title: "", items: ["Chats"] },
  { title: "AI Tools", items: ["Create characters", "Generate images", "Generate videos"] },
  { title: "Earn with us", items: ["Meet the Joi Babes", "Become an affiliate", "Creator Partnership"] },
  { title: "About us", items: ["Advisory board", "Safety at Joi", "Support"] },
];

export const LEGAL = [
  "Complaints policy", "Terms of Service", "Privacy Policy", "Support", "18 U.S.C. 2257", "Refund policy",
];

export const HERO_SLIDES = Array.from({ length: 5 }, (_, i) => ({
  name: `Featured ${i + 1}`,
  tagline: "Placeholder tagline goes here.",
  image: undefined as string | undefined,
}));

const TAGLINES = [
  "Straight and Focused", "Curious Mind", "Blue Hair, No Rules", "Sunny Sweetheart",
  "Cosplay Streamer", "Night Shift Hero", "Road Trip Rebel", "Dominant Creator",
  "Switching Babe", "Soft Under the Ink", "Cyberpunk Anime", "Real Girl Next Door",
];

// Placeholder copy only: neutral text and fictional names, same shape as the source cards.
export const CARDS: CharacterCard[] = Array.from({ length: 24 }, (_, i) => ({
  tagline: TAGLINES[i % TAGLINES.length],
  name: `Character ${String(i + 1).padStart(2, "0")}`,
  age: 21 + (i % 9),
  blurb:
    "Placeholder description for this character card. It is clamped to two lines, just like the source layout.",
  likes: ["16.7K", "21.8K", "8.5K", "1.3K", "500+", "2.1K"][i % 6],
  chats: ["10.4M", "18.8M", "21.1M", "783.6K", "121.6K", "4.6M"][i % 6],
  badge: i % 4 === 3 ? "Verified" : "Original",
  video: i % 7 === 4,
}));

export const FAQ = Array.from({ length: 12 }, (_, i) => ({
  q: `${i + 1}. Placeholder question number ${i + 1}?`,
  a: "Placeholder answer. Replace this text with your own content.",
}));

export const DISCOVER = ["NSFW Chat", "Generation Image", "Generation Character", "18 U.S.C. 2257"];
