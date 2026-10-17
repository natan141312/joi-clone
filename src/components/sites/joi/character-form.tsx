"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DEFAULT_PARAMS } from "@/lib/companion/types";

const FIELDS: { key: string; label: string; hint?: string; rows?: number }[] = [
  { key: "tagline", label: "Tagline", hint: "Short label shown on the card" },
  { key: "appearance", label: "Appearance", rows: 2 },
  { key: "traits", label: "Personality traits", rows: 2 },
  { key: "description", label: "Description", rows: 3 },
  { key: "scenario", label: "Scenario", hint: "Optional. Use {{char}} and {{user}} as placeholders.", rows: 2 },
  { key: "exampleDialogue", label: "Example dialogue", hint: "{{user}}: ...\n{{char}}: ...", rows: 4 },
  { key: "greeting", label: "Greeting", hint: "First message in every new chat", rows: 2 },
  { key: "imagePrompt", label: "Image prompt", hint: "Used when the character sends a picture", rows: 2 },
  { key: "voiceId", label: "ElevenLabs voice ID", hint: "Optional" },
];

const input = "w-full rounded-[12px] border border-[#303030] bg-white/5 px-3 py-2 text-[14px] text-white outline-none focus:border-white/40";

export function CharacterForm() {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({ name: "", age: "", gender: "female" });
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [avatar, setAvatar] = useState<string>();
  const [fictional, setFictional] = useState(false);
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors([]);
    const res = await fetch("/api/characters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, age: Number(values.age), avatar, params, fictionalConfirmed: fictional }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { errors?: string[] };
      setErrors(body.errors ?? ["Could not save the character"]);
      return;
    }
    const character = (await res.json()) as { id: string };
    router.push(`/chat/start/${character.id}`);
  };

  return (
    <form onSubmit={submit} className="mx-auto flex w-full max-w-[720px] flex-col gap-4 px-4 py-8">
      <h1 className="text-[28px] font-bold">Create a character</h1>

      <div className="flex items-center gap-4">
        <label className="grid h-24 w-24 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-[12px] bg-white/10 text-[12px] text-[#aeaeae]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : "Avatar"}
          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => onAvatar(e.target.files?.[0])} />
        </label>
        <div className="grid flex-1 grid-cols-[1fr_90px_120px] gap-2">
          <input aria-label="Name" placeholder="Name" className={input} value={values.name} onChange={set("name")} required />
          <input aria-label="Age" placeholder="Age" type="number" min={18} className={input} value={values.age} onChange={set("age")} required />
          <select aria-label="Gender" className={input} value={values.gender} onChange={set("gender")}>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="non-binary">Non-binary</option>
          </select>
        </div>
      </div>

      {FIELDS.map((f) => (
        <label key={f.key} className="flex flex-col gap-1">
          <span className="text-[14px] font-medium">{f.label}</span>
          {f.rows ? (
            <textarea rows={f.rows} placeholder={f.hint} className={input} value={values[f.key] ?? ""} onChange={set(f.key)} />
          ) : (
            <input placeholder={f.hint} className={input} value={values[f.key] ?? ""} onChange={set(f.key)} />
          )}
        </label>
      ))}

      <fieldset className="grid grid-cols-3 gap-3 rounded-[12px] border border-[#303030] p-3">
        <legend className="px-1 text-[14px] font-medium">Generation parameters</legend>
        {(
          [
            ["temperature", "Creativity", 0, 2, 0.05],
            ["topP", "Top P", 0, 1, 0.05],
            ["maxTokens", "Max reply tokens", 16, 2000, 16],
          ] as const
        ).map(([k, label, min, max, step]) => (
          <label key={k} className="flex flex-col gap-1 text-[12px] text-[#aeaeae]">
            {label}: {params[k]}
            <input type="range" min={min} max={max} step={step} value={params[k]} onChange={(e) => setParams((p) => ({ ...p, [k]: Number(e.target.value) }))} />
          </label>
        ))}
      </fieldset>

      <label className="flex items-start gap-2 text-[14px]">
        <input type="checkbox" checked={fictional} onChange={(e) => setFictional(e.target.checked)} className="mt-1" />
        This character is fictional, an adult (18+), and not based on a real person.
      </label>

      {errors.length > 0 && (
        <ul className="rounded-[12px] bg-[#e1002d]/15 p-3 text-[13px] text-[#ff6b86]">
          {errors.map((er) => <li key={er}>{er}</li>)}
        </ul>
      )}

      <button disabled={saving} className="h-11 rounded-full bg-[#ff2792] text-[15px] font-semibold disabled:opacity-50">
        {saving ? "Saving…" : "Create and start chatting"}
      </button>
    </form>
  );
}
