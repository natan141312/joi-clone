import { completeText, isMockLlm } from "@/lib/companion/llm";
import { CHARACTER_TAGS, type CharacterTag } from "@/lib/companion/types";

type Draft = {
  name: string;
  age: number;
  gender: string;
  tagline: string;
  expertise: string;
  appearance: string;
  traits: string;
  description: string;
  scenario: string;
  exampleDialogue: string;
  greeting: string;
  imagePrompt: string;
  tags: CharacterTag[];
  profileMd: string;
};

function fallbackMd(name: string, title: string, expertise: string) {
  return [
    `# ${name} — ${title}`,
    "",
    "## Who I am",
    `An experienced specialist in ${expertise}, focused on practical, step-by-step help.`,
    "",
    "## Areas of expertise",
    `- Core concepts of ${expertise}`,
    "- Common problems and how to solve them",
    "- Planning, best practices and next steps",
    "",
    "## How I work with you",
    "1. Ask about your goal, situation and level.",
    "2. Explain the key idea simply, then go deeper.",
    "3. Give concrete steps, examples and a clear next action.",
    "",
    "## Boundaries",
    "General guidance only; for high-stakes decisions, confirm with a qualified professional.",
  ].join("\n");
}

const FIELDS = ["name", "tagline", "appearance", "traits", "description", "scenario", "exampleDialogue", "greeting", "imagePrompt"] as const;

function fallbackDraft(expertise: string, gender: string, style: string): Draft {
  const name = gender === "male" ? "Daniel" : gender === "non-binary" ? "Sam" : "Maya";
  const title = expertise.replace(/\b\w/g, (ch) => ch.toUpperCase());
  return {
    name,
    age: 35,
    gender,
    tagline: `${title} Expert`,
    expertise,
    appearance: "Friendly, professional look, smart casual clothes.",
    traits: "Knowledgeable, clear, patient, practical, encouraging.",
    description: `${name} has over 10 years of hands-on experience in ${expertise} and helps people with practical, step-by-step advice.`,
    scenario: `{{user}} asks {{char}} for expert help with ${expertise}.`,
    exampleDialogue: `{{user}}: Where should I start?\n{{char}}: Tell me your goal and your current level, and I'll give you the first three concrete steps.`,
    greeting: `Hi, I'm ${name}, your ${expertise} expert. What would you like help with?`,
    imagePrompt: `${style === "anime" ? "anime illustration" : "professional portrait photo"} of a ${gender === "male" ? "man" : gender === "non-binary" ? "person" : "woman"} expert in ${expertise}, friendly smile, studio light`,
    tags: [],
    profileMd: fallbackMd(name, `${title} Expert`, expertise),
  };
}

function extractJson(text: string): Record<string, unknown> | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// POST { expertise, gender?, style?, notes? } -> a full character draft written by the AI.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { expertise?: string; gender?: string; style?: string; notes?: string };
  const expertise = (body.expertise ?? "").trim().slice(0, 120);
  if (!expertise) return Response.json({ errors: ["Enter a field of expertise"] }, { status: 400 });
  const gender = ["female", "male", "non-binary"].includes(body.gender ?? "") ? (body.gender as string) : "female";
  const style = body.style === "anime" ? "anime" : "realistic";
  const notes = (body.notes ?? "").trim().slice(0, 300);
  const fallback = fallbackDraft(expertise, gender, style);
  if (isMockLlm()) return Response.json({ draft: fallback, generated: false });

  const prompt = [
    `Create a fictional AI expert character who is a top expert in: "${expertise}".`,
    `Gender: ${gender}. Visual style: ${style}. The character is an adult (25-60).`,
    notes && `Extra wishes from the user: ${notes}`,
    "Write the profile fields in the same language as the field of expertise above (English if unclear), except imagePrompt which must be English.",
    `Choose 1-3 tags from: ${CHARACTER_TAGS.join(", ")}.`,
    "Use {{user}} and {{char}} placeholders in scenario and exampleDialogue (exampleDialogue: 2-4 lines, one per speaker turn).",
    "Return ONLY a JSON object, no markdown, with keys:",
    `{"name": string, "age": number, "tagline": "job title, max 6 words", "appearance": string, "traits": string, "description": "2-3 sentences on credentials and experience", "scenario": string, "exampleDialogue": string, "greeting": "first message, 1-2 sentences, introduces themselves and asks how they can help", "imagePrompt": "English portrait prompt, ${style === "anime" ? "anime illustration" : "professional portrait photo"}", "tags": string[]}`,
  ]
    .filter(Boolean)
    .join("\n");

  let raw: Record<string, unknown> | null = null;
  try {
    const text = await completeText([{ role: "user", content: prompt }], { temperature: 0.9, topP: 0.95, maxTokens: 900 }, req.signal);
    raw = extractJson(text);
  } catch {
    raw = null;
  }
  if (!raw) return Response.json({ draft: fallback, generated: false });

  const draft: Draft = { ...fallback };
  for (const k of FIELDS) {
    const v = raw[k];
    if (typeof v === "string" && v.trim()) draft[k] = v.trim().slice(0, k === "description" || k === "exampleDialogue" ? 4000 : 1000);
  }
  draft.profileMd = fallbackMd(draft.name, draft.tagline, expertise);
  // Second pass: the AI writes the expert's knowledge sheet (Markdown) that the chat follows.
  try {
    const mdPrompt = [
      `Write the expert profile for ${draft.name}, ${draft.tagline}, a top expert in "${expertise}".`,
      `Background: ${draft.description}`,
      "Write it in Markdown, in the same language as the field of expertise above (English if unclear), with exactly these sections:",
      `# ${draft.name} — ${draft.tagline}`,
      "## Who I am (2 sentences)",
      "## Areas of expertise (5-7 bullets)",
      "## How I work with you (3-4 numbered steps)",
      "## Core knowledge (5-7 bullets with real, accurate facts, rules of thumb, numbers or frameworks from this field)",
      "## Typical questions (3 example questions)",
      "## Boundaries (1-2 sentences; when to see a licensed professional if relevant)",
      "Be accurate and specific. Output only the Markdown.",
    ].join("\n");
    const md = await completeText([{ role: "user", content: mdPrompt }], { temperature: 0.6, topP: 0.9, maxTokens: 1400 }, req.signal);
    const clean = md
      .replace(/^```(?:markdown|md)?\s*/i, "")
      .replace(/```\s*$/, "")
      // Drop instruction hints the model sometimes copies into headings, e.g. "## Who I am (2 sentences)".
      .replace(/^(#{1,3} .*?)\s*\([^)]*\)\s*$/gm, "$1")
      .trim();
    if (clean.includes("##") && clean.length > 200) draft.profileMd = clean.slice(0, 12000);
  } catch {
    // keep the template
  }
  const age = Number(raw.age);
  if (Number.isInteger(age) && age >= 21 && age <= 80) draft.age = age;
  if (Array.isArray(raw.tags)) draft.tags = raw.tags.filter((t): t is CharacterTag => CHARACTER_TAGS.includes(t as CharacterTag)).slice(0, 3);
  return Response.json({ draft, generated: true });
}
