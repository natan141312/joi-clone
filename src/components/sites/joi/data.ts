export const NAV = ["Explore", "Gallery", "Create AI", "Chats"] as const;

export const NAV_HREF: Record<(typeof NAV)[number], string> = {
  Explore: "/",
  Gallery: "/gallery",
  "Create AI": "/generate/character",
  Chats: "/chats",
};

export const FILTER_TAGS = [
  "All", "Tech", "Business", "Finance", "Health", "Fitness", "Food", "Creative", "Music", "Education", "Law", "Science", "Lifestyle",
] as const;

export const CREATOR_FILTERS = [
  { value: "any", label: "Any creator" },
  { value: "original", label: "PRO Original" },
  { value: "community", label: "Community" },
  { value: "mine", label: "My characters" },
] as const;

export const AGE_FILTERS = [
  { value: "any", label: "Any age", min: 18, max: 200 },
  { value: "18-24", label: "18-24", min: 18, max: 24 },
  { value: "25-34", label: "25-34", min: 25, max: 34 },
  { value: "35+", label: "35+", min: 35, max: 200 },
] as const;

export const GENDER_FILTERS = [
  { value: "any", label: "Any gender" },
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "non-binary", label: "Non-binary" },
] as const;

export type HomeFilters = { q: string; creator: string; age: string; gender: string; tag: string; sort: string };
export const DEFAULT_FILTERS: HomeFilters = { q: "", creator: "any", age: "any", gender: "any", tag: "All", sort: "trending" };

export const SORTS = [
  { value: "trending", label: "Trending" },
  { value: "chats", label: "Most chats" },
  { value: "rating", label: "Top rated" },
  { value: "new", label: "Newest" },
] as const;

/** Short description of each category, shown in the sidebar. */
export const CATEGORY_INFO: Record<string, string> = {
  Tech: "Code, AI, security",
  Business: "Startups, strategy, marketing",
  Finance: "Money, investing, real estate",
  Health: "Body, mind, wellbeing",
  Fitness: "Training and nutrition",
  Food: "Cooking and recipes",
  Creative: "Writing, design, art",
  Music: "Production and songwriting",
  Education: "Languages and learning",
  Law: "Contracts and your rights",
  Science: "Physics, data, research",
  Lifestyle: "Travel, habits, life",
};

export type HomeCard = {
  id: string;
  tagline: string;
  expertise: string;
  rating: number;
  ratings: number;
  createdAt: string;
  name: string;
  age: number;
  gender: string;
  blurb: string;
  tags: string[];
  style: "realistic" | "anime";
  /** "original" (built-in), "mine" (viewer created it) or "community". */
  creator: "original" | "mine" | "community";
  chats: number;
  messages: number;
  image?: string;
};

export const SIDE_MENU: { title: string; items: { label: string; href: string }[] }[] = [
  {
    title: "Explore",
    items: [
      { label: "Tech", href: "/?tag=Tech" },
      { label: "Health & Fitness", href: "/?tag=Fitness" },
      { label: "Finance", href: "/?tag=Finance" },
      { label: "All experts", href: "/" },
    ],
  },
  { title: "", items: [{ label: "Chats", href: "/chats" }] },
  {
    title: "AI Tools",
    items: [
      { label: "Create an expert", href: "/generate/character" },
      { label: "Generate images", href: "/gallery" },
      { label: "Generate videos", href: "/info/generate-videos" },
    ],
  },
  {
    title: "Earn with us",
    items: [
      { label: "Become an expert creator", href: "/info/creators" },
      { label: "Become an affiliate", href: "/info/affiliate" },
      { label: "Creator Partnership", href: "/info/creator-partnership" },
    ],
  },
  {
    title: "About us",
    items: [
      { label: "Advisory board", href: "/info/advisory-board" },
      { label: "Safety at PRO", href: "/info/safety" },
      { label: "Support", href: "/info/support" },
    ],
  },
];

export const LEGAL = [
  { label: "Complaints policy", href: "/info/complaints" },
  { label: "Terms of Service", href: "/info/terms" },
  { label: "Privacy Policy", href: "/info/privacy" },
  { label: "Support", href: "/info/support" },
  { label: "18 U.S.C. 2257", href: "/info/2257" },
  { label: "Refund policy", href: "/info/refunds" },
];

// Copy for the PRO expert-chat concept.
export const INTRO = {
  title: "An expert in any field, one message away",
  text: "Pick an AI expert or create your own: type a field like tax law, React, marathon training or Italian cooking, and the AI builds a complete expert with a name, background, teaching style and portrait. Then ask anything, in any language.",
};

export const FAQ = [
  { q: "1. How do I create an expert?", a: "Open Create AI, type the field of expertise and press Generate with AI. The AI writes the full profile (name, title, background, personality, greeting and portrait prompt). Review it, edit anything, and start chatting." },
  { q: "2. What can I ask an expert?", a: "Anything in their field: explanations, step-by-step plans, reviews of your code or writing, recipes, training programs, budgets and more. Each expert answers with concrete, practical detail." },
  { q: "3. Which language do experts speak?", a: "Yours. Experts reply in the language you write in, including Hebrew." },
  { q: "4. Can I trust the answers?", a: "Experts are AI and can make mistakes. For medical, legal or financial decisions, use the advice as a starting point and confirm with a qualified professional." },
  { q: "5. Can I send pictures?", a: "Yes. Attach a picture to your message (for example a chart, a dish or an error screen). The expert can also send pictures with the sparkle button." },
  { q: "6. Are my chats private?", a: "Chats are tied to your account (or to this browser if you are not signed in) and are only visible to you." },
  { q: "7. Can I edit or delete my experts?", a: "Yes. Open the expert's profile from the card's person icon; creators see Edit and Delete." },
  { q: "8. Can I change how detailed the answers are?", a: "Each expert has answer settings (creativity and reply length) under Advanced when you create or edit it." },
];

export const DISCOVER = [
  { label: "Expert Chat", href: "/chats" },
  { label: "Generation Image", href: "/gallery" },
  { label: "Create an Expert", href: "/generate/character" },
  { label: "Safety", href: "/info/safety" },
];
