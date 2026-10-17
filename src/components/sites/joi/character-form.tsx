"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { DEFAULT_MODEL, MODEL_OPTIONS } from "@/lib/companion/models";
import { CHARACTER_TAGS, DEFAULT_PARAMS, type Character, type CharacterTag } from "@/lib/companion/types";
import { useT } from "./lang-context";

const FIELDS: { key: string; label: string; hint?: string; rows?: number; advanced?: boolean }[] = [
  { key: "tagline", label: "Title", hint: "Job title shown on the card, e.g. Tax Lawyer" },
  { key: "description", label: "Background & credentials", rows: 3 },
  { key: "traits", label: "Personality & teaching style", rows: 2 },
  { key: "profileMd", label: "Expert profile (Markdown) — the knowledge sheet the expert follows", rows: 12 },
  { key: "greeting", label: "Greeting", hint: "First message in every new chat", rows: 2 },
  { key: "appearance", label: "Appearance", rows: 2, advanced: true },
  { key: "scenario", label: "Context", hint: "Optional. Use {{char}} and {{user}} as placeholders.", rows: 2, advanced: true },
  { key: "exampleDialogue", label: "Example dialogue", hint: "{{user}}: ...\n{{char}}: ...", rows: 4, advanced: true },
  { key: "imagePrompt", label: "Portrait prompt", hint: "Used to generate the profile picture and pictures in chat", rows: 2, advanced: true },
  { key: "voiceId", label: "ElevenLabs voice ID", hint: "Optional", advanced: true },
];

const EXAMPLES = ["Tax law", "React & Next.js", "Marathon training", "Real estate investing", "Vegan cooking", "Startup fundraising", "Psychology of habits", "Guitar"];

const input = "w-full rounded-[12px] border border-[#303030] bg-white/5 px-3 py-2 text-[14px] text-white outline-none focus:border-white/40";

const TEXT_KEYS = ["name", "gender", "expertise", ...FIELDS.map((f) => f.key)] as const;


type Draft = Record<string, unknown> & { tags?: CharacterTag[]; age?: number };

export function CharacterForm({ initial }: { initial?: Character }) {
  const router = useRouter();
  const { tr } = useT();
  const editing = Boolean(initial);
  const [values, setValues] = useState<Record<string, string>>(() => {
    if (!initial) return { name: "", age: "", gender: "female", expertise: "" };
    const v: Record<string, string> = { age: String(initial.age) };
    for (const k of TEXT_KEYS) v[k] = String((initial as unknown as Record<string, unknown>)[k] ?? "");
    return v;
  });
  const [params, setParams] = useState(initial?.params ?? DEFAULT_PARAMS);
  const [avatar, setAvatar] = useState<string | undefined>(initial?.avatar);
  const [tags, setTags] = useState<CharacterTag[]>(initial?.tags ?? []);
  const [style, setStyle] = useState<"realistic" | "anime">(initial?.style ?? "realistic");
  const [model, setModel] = useState(initial?.model ?? DEFAULT_MODEL);
  const [notes, setNotes] = useState("");
  const [showForm, setShowForm] = useState(editing);
  const [generating, setGenerating] = useState(false);
  const [genInfo, setGenInfo] = useState<string>();
  const [fictional, setFictional] = useState(editing);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  const onAvatar = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(String(reader.result));
    reader.readAsDataURL(file);
  };

  const generate = async () => {
    if (!values.expertise.trim()) {
      setErrors([tr("Enter a field of expertise first")]);
      return;
    }
    setGenerating(true);
    setErrors([]);
    setGenInfo(undefined);
    const res = await fetch("/api/characters/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expertise: values.expertise, gender: values.gender, style, notes }),
    }).catch(() => null);
    setGenerating(false);
    if (!res?.ok) {
      setErrors([tr("Could not generate right now. Try again or fill the fields yourself.")]);
      setShowForm(true);
      return;
    }
    const { draft, generated } = (await res.json()) as { draft: Draft; generated: boolean };
    setValues((v) => {
      const next = { ...v };
      for (const k of TEXT_KEYS) if (typeof draft[k] === "string" && k !== "gender") next[k] = draft[k] as string;
      if (draft.age) next.age = String(draft.age);
      return next;
    });
    if (draft.tags?.length) setTags(draft.tags);
    setGenInfo(generated ? tr("Generated with AI, including the expert profile (Markdown). Review and edit anything, then create.") : tr("The AI was busy, so a basic template was filled in. Edit it or generate again."));
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors([]);
    const res = await fetch(editing ? `/api/characters/${initial?.id}` : "/api/characters", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, age: Number(values.age), avatar: avatar ?? "", params, tags, style, model, fictionalConfirmed: fictional }),
    });
    if (!res.ok) {
      setSaving(false);
      const body = (await res.json().catch(() => ({}))) as { errors?: string[] };
      setErrors(body.errors ?? [tr("Could not save the expert")]);
      return;
    }
    const character = (await res.json()) as { id: string };
    if (editing) {
      router.push(`/character/${character.id}`);
      router.refresh();
    } else {
      const chatRes = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId: character.id }),
      });
      const chat = (await chatRes.json().catch(() => ({}))) as { id?: string };
      router.push(chat.id ? `/chat/${chat.id}?c=${character.id}` : `/character/${character.id}`);
    }
  };

  const fieldInput = (f: (typeof FIELDS)[number]) => (
    <label key={f.key} className="flex flex-col gap-1">
      <span className="text-[14px] font-medium">{tr(f.label)}</span>
      {f.rows ? (
        <textarea rows={f.rows} placeholder={f.hint ? tr(f.hint) : undefined} className={input} value={values[f.key] ?? ""} onChange={set(f.key)} />
      ) : (
        <input placeholder={f.hint ? tr(f.hint) : undefined} className={input} value={values[f.key] ?? ""} onChange={set(f.key)} />
      )}
    </label>
  );

  return (
    <form onSubmit={submit} className="mx-auto flex w-full max-w-[720px] flex-col gap-4 px-4 py-8">
      <h1 className="text-[28px] font-bold">{editing ? `${tr("Edit")} ${initial?.name}` : tr("Create your AI expert")}</h1>

      {/* Step 1: field of expertise -> AI writes the whole profile */}
      <section className="flex flex-col gap-3 rounded-[16px] bg-gradient-to-br from-[#ff2792]/20 to-white/5 p-4 ring-1 ring-white/10">
        <label className="flex flex-col gap-1">
          <span className="text-[14px] font-semibold">{tr("Field of expertise")}</span>
          <input
            aria-label={tr("Field of expertise")}
            placeholder={tr("e.g. Tax law, React development, marathon training…")}
            className={`${input} h-11 text-[15px]`}
            value={values.expertise}
            onChange={set("expertise")}
            maxLength={120}
            required
          />
        </label>
        {!editing && (
          <>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex) => (
                <button key={ex} type="button" onClick={() => setValues((v) => ({ ...v, expertise: tr(ex) }))} className="rounded-full bg-white/10 px-3 py-1 text-[12px] hover:bg-white/20">
                  {tr(ex)}
                </button>
              ))}
            </div>
            <div className="grid gap-2 sm:grid-cols-[140px_1fr]">
              <select aria-label="Gender" className={input} value={values.gender} onChange={set("gender")}>
                <option value="female">{tr("Female")}</option>
                <option value="male">{tr("Male")}</option>
                <option value="non-binary">{tr("Non-binary")}</option>
              </select>
              <input aria-label={tr("Extra wishes")} placeholder={tr("Extra wishes (optional): tone, background, language…")} className={input} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={300} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(["realistic", "anime"] as const).map((st) => (
                <button key={st} type="button" aria-pressed={style === st} onClick={() => setStyle(st)} className={`rounded-full px-4 py-1.5 text-[13px] capitalize ${style === st ? "bg-white text-black" : "bg-white/10"}`}>
                  {tr(st === "realistic" ? "Realistic" : "Anime")}
                </button>
              ))}
              <button
                type="button"
                onClick={generate}
                disabled={generating}
                className="ml-auto flex h-10 items-center gap-2 rounded-full bg-[#ff2792] px-5 text-[14px] font-semibold disabled:opacity-60 rtl:ml-0 rtl:mr-auto"
              >
                <Sparkles size={16} />
                {generating ? tr("Generating…") : showForm ? tr("Generate again") : tr("Generate with AI")}
              </button>
            </div>
            {!showForm && (
              <button type="button" onClick={() => setShowForm(true)} className="self-start text-[12px] text-[#aeaeae] underline">
                {tr("or fill in the profile yourself")}
              </button>
            )}
          </>
        )}
      </section>

      {genInfo && <p className="rounded-[12px] bg-white/5 px-3 py-2 text-[13px] text-[#aeaeae]">{genInfo}</p>}

      {showForm && (
        <>
          <div className="flex items-center gap-4">
            <label className="grid h-24 w-24 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-[12px] bg-white/10 text-center text-[11px] text-[#aeaeae]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : tr("Upload photo (or one is generated)")}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => onAvatar(e.target.files?.[0])} />
            </label>
            <div className="grid flex-1 grid-cols-[1fr_90px] gap-2">
              <input aria-label={tr("Name")} placeholder={tr("Name")} className={input} value={values.name} onChange={set("name")} required />
              <input aria-label={tr("Age")} placeholder={tr("Age")} type="number" min={18} className={input} value={values.age} onChange={set("age")} required />
            </div>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-[14px] font-medium">{tr("AI model this expert runs on")}</span>
            <select aria-label={tr("AI model")} className={input} value={model} onChange={(e) => setModel(e.target.value)}>
              {MODEL_OPTIONS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.family} · {m.label}
                </option>
              ))}
            </select>
            <span className="text-[12px] text-[#858585]">{tr("Uses OpenRouter when OPENROUTER_API_KEY is set; otherwise the free model answers.")}</span>
          </label>

          <div className="flex flex-col gap-2">
            <span className="text-[14px] font-medium">{tr("Categories")}</span>
            <div className="flex flex-wrap gap-2">
              {CHARACTER_TAGS.map((tag) => {
                const on = tags.includes(tag);
                return (
                  <button key={tag} type="button" aria-pressed={on} onClick={() => setTags((ts) => (on ? ts.filter((x) => x !== tag) : [...ts, tag]))} className={`rounded-full px-3 py-1 text-[13px] ${on ? "bg-white text-black" : "bg-white/10"}`}>
                    {tr(tag)}
                  </button>
                );
              })}
            </div>
          </div>

          {FIELDS.filter((f) => !f.advanced).map(fieldInput)}

          <details className="rounded-[12px] border border-[#303030] p-3">
            <summary className="cursor-pointer text-[14px] font-medium">{tr("Advanced")}</summary>
            <div className="mt-3 flex flex-col gap-4">
              {FIELDS.filter((f) => f.advanced).map(fieldInput)}
              <fieldset className="grid grid-cols-3 gap-3">
                <legend className="mb-1 text-[14px] font-medium">{tr("Answer settings")}</legend>
                {(
                  [
                    ["temperature", "Creativity", 0, 2, 0.05],
                    ["topP", "Top P", 0, 1, 0.05],
                    ["maxTokens", "Max reply tokens", 16, 2000, 16],
                  ] as const
                ).map(([k, label, min, max, step]) => (
                  <label key={k} className="flex flex-col gap-1 text-[12px] text-[#aeaeae]">
                    {tr(label)}: {params[k]}
                    <input type="range" min={min} max={max} step={step} value={params[k]} onChange={(e) => setParams((p) => ({ ...p, [k]: Number(e.target.value) }))} />
                  </label>
                ))}
              </fieldset>
            </div>
          </details>

          <label className={`flex items-start gap-2 text-[14px] ${editing ? "hidden" : ""}`}>
            <input type="checkbox" checked={fictional} onChange={(e) => setFictional(e.target.checked)} className="mt-1" />
            {tr("This expert is a fictional AI character and not based on a real person.")}
          </label>
        </>
      )}

      {errors.length > 0 && (
        <ul className="rounded-[12px] bg-[#e1002d]/15 p-3 text-[13px] text-[#ff6b86]">
          {errors.map((er) => <li key={er}>{er}</li>)}
        </ul>
      )}

      {showForm && (
        <button disabled={saving} className="h-11 rounded-full bg-[#ff2792] text-[15px] font-semibold disabled:opacity-50">
          {saving ? tr("Creating… (generating portrait)") : editing ? tr("Save changes") : tr("Create and start chatting")}
        </button>
      )}
    </form>
  );
}
