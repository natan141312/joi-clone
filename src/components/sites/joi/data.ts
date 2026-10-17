export const NAV = ["Explore", "Gallery", "Create AI", "Chats"] as const;

export const NAV_HREF: Record<(typeof NAV)[number], string> = {
  Explore: "/",
  Gallery: "/gallery",
  "Create AI": "/generate/character",
  Chats: "/chats",
};

export const FILTER_TAGS = [
  "All", "Anime", "LGBT+", "Fantasy", "Dominant", "Straight",
  "Kinky", "Trans", "Mommy", "Lesbian", "Gay",
] as const;

export const CREATOR_FILTERS = [
  { value: "any", label: "Any creator" },
  { value: "original", label: "Joi Original" },
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
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "non-binary", label: "Non-binary" },
  { value: "any", label: "Any gender" },
] as const;

export type HomeFilters = { q: string; creator: string; age: string; gender: string; tag: string };
export const DEFAULT_FILTERS: HomeFilters = { q: "", creator: "any", age: "any", gender: "female", tag: "All" };

export type HomeCard = {
  id: string;
  tagline: string;
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
      { label: "Women", href: "/?gender=female" },
      { label: "Men", href: "/?gender=male" },
      { label: "Anime", href: "/?tag=Anime&gender=any" },
      { label: "All categories", href: "/?gender=any" },
    ],
  },
  { title: "", items: [{ label: "Chats", href: "/chats" }] },
  {
    title: "AI Tools",
    items: [
      { label: "Create characters", href: "/generate/character" },
      { label: "Generate images", href: "/gallery" },
      { label: "Generate videos", href: "/info/generate-videos" },
    ],
  },
  {
    title: "Earn with us",
    items: [
      { label: "Meet the Joi Babes", href: "/info/creators" },
      { label: "Become an affiliate", href: "/info/affiliate" },
      { label: "Creator Partnership", href: "/info/creator-partnership" },
    ],
  },
  {
    title: "About us",
    items: [
      { label: "Advisory board", href: "/info/advisory-board" },
      { label: "Safety at Joi", href: "/info/safety" },
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

// Original copy describing this app (not taken from the source site).
export const INTRO = {
  title: "Your characters, your stories",
  text: "Chat with AI characters, or create your own from scratch: give them a personality, a backstory, a scenario and a voice. Every conversation is saved to your account, so you can pick up where you left off.",
};

export const FAQ = [
  { q: "1. How does chatting with a character work?", a: "Pick a character and say hi. Each character has a written persona (personality, background, scenario and example dialogue) that the AI model follows, and the conversation history is sent along so replies stay consistent." },
  { q: "2. Can I create my own character?", a: "Yes. Open Create AI, fill in the name, age (18+), appearance, personality, scenario and greeting, and start chatting right away. You can edit or delete your characters later from their profile." },
  { q: "3. Can I talk with my voice?", a: "Yes, when voice is enabled: press the microphone in a chat, speak, and your message is transcribed and sent. Replies can be read aloud with the character's voice." },
  { q: "4. Can I send and receive pictures?", a: "You can attach a picture to a message; models with vision support can describe it. When image generation is enabled, ask the character for a picture with the sparkle button." },
  { q: "5. Are my chats private?", a: "Chats are tied to your account (or to this browser if you are not signed in) and are only visible to you." },
  { q: "6. What are the filters for?", a: "Use search, creator, age, gender and category filters to narrow the character list. The side menu shortcuts (Women, Men, Anime) apply the same filters." },
  { q: "7. Do characters remember me?", a: "Within a chat, yes: recent messages are included each time. Starting a new chat with the same character begins a fresh conversation." },
  { q: "8. Can I change how creative the replies are?", a: "Each character has generation settings (creativity, top P and reply length) that you can adjust when you create it." },
];

export const DISCOVER = [
  { label: "NSFW Chat", href: "/chats" },
  { label: "Generation Image", href: "/gallery" },
  { label: "Generation Character", href: "/generate/character" },
  { label: "18 U.S.C. 2257", href: "/info/2257" },
];
