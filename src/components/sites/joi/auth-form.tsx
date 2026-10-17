"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const input = "h-11 w-full rounded-[12px] border border-[#303030] bg-white/5 px-3 text-[14px] text-white outline-none focus:border-white/40";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adult, setAdult] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const signup = mode === "signup";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors([]);
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(signup ? { name, email, password, adultConfirmed: adult } : { email, password }),
    });
    setBusy(false);
    if (!res.ok) {
      setErrors(((await res.json().catch(() => ({}))) as { errors?: string[] }).errors ?? ["Something went wrong"]);
      return;
    }
    router.push("/");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="mx-auto flex w-full max-w-[400px] flex-col gap-3 px-4 py-12">
      <h1 className="mb-2 text-center text-[28px] font-bold">{signup ? "Create your account" : "Welcome back"}</h1>
      {signup && <input aria-label="Name" placeholder="Name" className={input} value={name} onChange={(e) => setName(e.target.value)} required maxLength={40} />}
      <input aria-label="Email" type="email" placeholder="Email" autoComplete="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input aria-label="Password" type="password" placeholder="Password (8+ characters)" autoComplete={signup ? "new-password" : "current-password"} className={input} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
      {signup && (
        <label className="flex items-start gap-2 text-[13px] text-[#aeaeae]">
          <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} className="mt-0.5" />
          I confirm I am 18 or older and accept the <Link href="/info/terms" className="underline">Terms</Link>.
        </label>
      )}
      {errors.length > 0 && (
        <ul className="rounded-[12px] bg-[#e1002d]/15 p-3 text-[13px] text-[#ff6b86]">{errors.map((er) => <li key={er}>{er}</li>)}</ul>
      )}
      <button disabled={busy} className="h-11 rounded-full bg-[#ff2792] text-[15px] font-semibold disabled:opacity-50">
        {busy ? "Please wait…" : signup ? "Sign up" : "Log in"}
      </button>
      <p className="text-center text-[13px] text-[#aeaeae]">
        {signup ? "Already have an account? " : "New here? "}
        <Link href={signup ? "/login" : "/signup"} className="text-white underline">{signup ? "Log in" : "Sign up"}</Link>
      </p>
    </form>
  );
}
