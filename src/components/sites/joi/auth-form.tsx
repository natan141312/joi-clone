"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Eye, EyeOff, X } from "lucide-react";

const input = "h-11 w-full rounded-[12px] border border-[#303030] bg-white/5 px-3 text-[14px] text-white outline-none focus:border-white/40";

function Rule({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={`flex items-center gap-1.5 ${ok ? "text-[#4ade80]" : "text-[#858585]"}`}>
      {ok ? <Check size={12} /> : <X size={12} />}
      {children}
    </li>
  );
}

export function AuthForm({ mode, next = "/" }: { mode: "login" | "signup"; next?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [adult, setAdult] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const signup = mode === "signup";

  const rules = {
    length: password.length >= 8,
    letter: /[A-Za-z֐-׿]/.test(password),
    number: /\d/.test(password),
    match: confirm.length > 0 && confirm === password,
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signup && (!rules.length || !rules.letter || !rules.number || !rules.match)) {
      setErrors(["Please fix the password requirements below"]);
      return;
    }
    setBusy(true);
    setErrors([]);
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(signup ? { name, email, password, passwordConfirm: confirm, adultConfirmed: adult } : { email, password }),
    }).catch(() => null);
    setBusy(false);
    if (!res) {
      setErrors(["Network error. Check your connection and try again."]);
      return;
    }
    if (!res.ok) {
      setErrors(((await res.json().catch(() => ({}))) as { errors?: string[] }).errors ?? ["Something went wrong"]);
      return;
    }
    router.push(next.startsWith("/") ? next : "/");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="mx-auto flex w-full max-w-[400px] flex-col gap-3 px-4 py-12" noValidate>
      <h1 className="text-center text-[28px] font-bold">{signup ? "Create your account" : "Welcome back"}</h1>
      <p className="mb-2 text-center text-[13px] text-[#aeaeae]">
        {signup ? "Save your experts and chats, and continue on any device." : "Log in to see your experts and chats."}
      </p>
      {signup && <input aria-label="Name" placeholder="Name" autoComplete="name" className={input} value={name} onChange={(e) => setName(e.target.value)} required maxLength={40} />}
      <input aria-label="Email" type="email" placeholder="Email" autoComplete="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} required />
      <div className="relative">
        <input
          aria-label="Password"
          type={show ? "text" : "password"}
          placeholder="Password"
          autoComplete={signup ? "new-password" : "current-password"}
          className={`${input} pe-11`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow((s) => !s)} className="absolute end-1 top-1 grid h-9 w-9 place-items-center rounded-full text-[#aeaeae] hover:bg-white/10">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {signup && (
        <>
          <input aria-label="Confirm password" type={show ? "text" : "password"} placeholder="Confirm password" autoComplete="new-password" className={input} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          <ul className="grid grid-cols-2 gap-1 text-[12px]">
            <Rule ok={rules.length}>8+ characters</Rule>
            <Rule ok={rules.letter}>A letter</Rule>
            <Rule ok={rules.number}>A number</Rule>
            <Rule ok={rules.match}>Passwords match</Rule>
          </ul>
          <label className="flex items-start gap-2 text-[13px] text-[#aeaeae]">
            <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} className="mt-0.5" />
            <span>
              I confirm I am 18 or older and accept the <Link href="/info/terms" className="underline">Terms</Link> and <Link href="/info/privacy" className="underline">Privacy Policy</Link>.
            </span>
          </label>
        </>
      )}
      {errors.length > 0 && (
        <ul role="alert" className="rounded-[12px] bg-[#e1002d]/15 p-3 text-[13px] text-[#ff6b86]">{errors.map((er) => <li key={er}>{er}</li>)}</ul>
      )}
      <button disabled={busy} className="h-11 rounded-full bg-[#ff2792] text-[15px] font-semibold disabled:opacity-50">
        {busy ? "Please wait…" : signup ? "Create account" : "Log in"}
      </button>
      <p className="text-center text-[13px] text-[#aeaeae]">
        {signup ? "Already have an account? " : "New here? "}
        <Link href={signup ? "/login" : "/signup"} className="text-white underline">{signup ? "Log in" : "Create an account"}</Link>
      </p>
    </form>
  );
}
