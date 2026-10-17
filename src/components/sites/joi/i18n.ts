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
  "AI Tools": "כלי AI",
  "Generate images": "יצירת תמונות",
  "Generate videos": "יצירת וידאו",
  "Earn with us": "הרוויחו איתנו",
  "Become an expert creator": "הפכו ליוצרי מומחים",
  "Create an expert": "צור מומחה",
  "Health & Fitness": "בריאות וכושר",
  "All experts": "כל המומחים",
  Tech: "טכנולוגיה",
  Business: "עסקים",
  Finance: "פיננסים",
  Health: "בריאות",
  Fitness: "כושר",
  Food: "אוכל",
  Creative: "יצירה",
  Music: "מוזיקה",
  Education: "חינוך",
  Law: "משפט",
  Science: "מדע",
  Lifestyle: "לייף סטייל",
  "AI Expert": "מומחה AI משלך",
  "Become an affiliate": "הפכו לשותפים",
  "Creator Partnership": "שותפות יוצרים",
  "About us": "עלינו",
  "Advisory board": "ועדה מייעצת",
  "Safety at PRO": "בטיחות",
  Support: "תמיכה",
  "Complaints policy": "מדיניות תלונות",
  "Terms of Service": "תנאי שימוש",
  "Privacy Policy": "מדיניות פרטיות",
  "Refund policy": "מדיניות החזרים",
  "Say Hi": "שאל עכשיו",
  ONLINE: "מחובר/ת",
  "Any creator": "כל היוצרים",
  "PRO Original": "PRO מקורי",
  Community: "קהילה",
  "Any age": "כל הגילאים",
  Female: "נשים",
  Male: "גברים",
  "Non-binary": "א-בינארי",
  "Any gender": "כל המגדרים",
  All: "הכל",
  "AI Generator": "מחולל מומחים",
  "Create your own": "צור",
  Create: "צור",
  "Search characters": "חיפוש מומחים",
  "No characters match these filters.": "אין מומחים שמתאימים לסינון.",
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
