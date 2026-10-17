export type Lang = "en" | "he";
export const LANG_COOKIE = "joi_lang";

// Keyed by the English UI string; missing keys fall back to English.
const HE: Record<string, string> = {
  Explore: "גלה",
  Gallery: "גלריה",
  "Create AI": "צור AI",
  Chats: "צ'אטים",
  "Sign up": "הרשמה",
  "Log in": "התחברות",
  "Log out": "התנתקות",
  Language: "שפה",
  "My characters": "הדמויות שלי",
  Women: "נשים",
  Men: "גברים",
  Anime: "אנימה",
  "All categories": "כל הקטגוריות",
  "AI Tools": "כלי AI",
  "Create characters": "יצירת דמויות",
  "Generate images": "יצירת תמונות",
  "Generate videos": "יצירת וידאו",
  "Earn with us": "הרוויחו איתנו",
  "Meet the Joi Babes": "הכירו את היוצרות",
  "Become an affiliate": "הפכו לשותפים",
  "Creator Partnership": "שותפות יוצרים",
  "About us": "עלינו",
  "Advisory board": "ועדה מייעצת",
  "Safety at Joi": "בטיחות",
  Support: "תמיכה",
  "Complaints policy": "מדיניות תלונות",
  "Terms of Service": "תנאי שימוש",
  "Privacy Policy": "מדיניות פרטיות",
  "Refund policy": "מדיניות החזרים",
  "Say Hi": "תגיד היי",
  ONLINE: "מחובר/ת",
  "Any creator": "כל היוצרים",
  "Joi Original": "Joi מקורי",
  Community: "קהילה",
  "Any age": "כל הגילאים",
  Female: "נשים",
  Male: "גברים",
  "Non-binary": "א-בינארי",
  "Any gender": "כל המגדרים",
  All: "הכל",
  Fantasy: "פנטזיה",
  Dominant: "דומיננטי",
  Straight: "סטרייט",
  Kinky: "קינקי",
  Trans: "טרנס",
  Mommy: "מאמי",
  Lesbian: "לסביות",
  Gay: "גאה",
  "AI Generator": "מחולל AI",
  "Create your own": "צור את",
  "AI Girlfriend": "החברה שלך",
  Create: "צור",
  "Search characters": "חיפוש דמויות",
  "No characters match these filters.": "אין דמויות שמתאימות לסינון.",
  "Reset filters": "איפוס סינון",
  "Frequently Asked Questions": "שאלות נפוצות",
  "Discover more": "גלה עוד",
  Yours: "שלך",
};

export function t(lang: Lang, s: string) {
  return lang === "he" ? HE[s] ?? s : s;
}

export function parseLang(v: string | undefined): Lang {
  return v === "he" ? "he" : "en";
}
