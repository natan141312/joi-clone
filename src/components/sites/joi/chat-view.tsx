"use client";
/* eslint-disable @next/next/no-img-element -- avatars and chat images are data URLs */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ImagePlus, Mic, Send, Sparkles, Square, Volume2, VolumeX } from "lucide-react";
import type { Character, Chat, Message } from "@/lib/companion/types";

type Status = { llm: string; vision: boolean; tts: boolean; stt: boolean; images: boolean };

export function ChatView({ initialChat, character }: { initialChat: Chat; character: Character }) {
  const [messages, setMessages] = useState<Message[]>(initialChat.messages);
  const [text, setText] = useState("");
  const [image, setImage] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [status, setStatus] = useState<Status>();
  const [autoVoice, setAutoVoice] = useState(true);
  const [recording, setRecording] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/status").then((r) => r.json()).then(setStatus).catch(() => {});
  }, []);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const speak = async (content: string) => {
    if (!status?.tts || !autoVoice || !content) return;
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: content, voiceId: character.voiceId }),
    });
    if (res.ok) new Audio(URL.createObjectURL(await res.blob())).play().catch(() => {});
  };

  const send = async (content: string, img?: string) => {
    if ((!content.trim() && !img) || busy) return;
    setBusy(true);
    setError(undefined);
    setText("");
    setImage(undefined);
    const now = new Date().toISOString();
    const replyId = `pending-${now}`;
    setMessages((m) => [
      ...m,
      { id: `local-${now}`, role: "user", content: content.trim(), image: img, createdAt: now },
      { id: replyId, role: "assistant", content: "", createdAt: now },
    ]);
    try {
      const res = await fetch(`/api/chats/${initialChat.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content, image: img }),
      });
      if (!res.ok || !res.body) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? `Error ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let reply = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        setMessages((m) => m.map((x) => (x.id === replyId ? { ...x, content: reply } : x)));
      }
      speak(reply);
    } catch (e) {
      setError((e as Error).message);
      setMessages((m) => m.filter((x) => x.id !== replyId));
    } finally {
      setBusy(false);
    }
  };

  const askPicture = async () => {
    setBusy(true);
    setError(undefined);
    const res = await fetch(`/api/chats/${initialChat.id}/image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: text }),
    });
    setBusy(false);
    if (!res.ok) return setError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Image failed");
    const msg = (await res.json()) as Message;
    setMessages((m) => [...m, msg]);
    setText("");
  };

  const toggleMic = async () => {
    if (recording) {
      recorder.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const parts: Blob[] = [];
      rec.ondataavailable = (e) => parts.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        const form = new FormData();
        form.append("audio", new Blob(parts, { type: rec.mimeType }));
        const res = await fetch("/api/stt", { method: "POST", body: form });
        const body = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
        if (body.text) send(body.text);
        else setError(body.error ?? "Could not transcribe");
      };
      recorder.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      setError("Microphone permission denied");
    }
  };

  const onFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex h-dvh flex-col bg-[#0f0f0f] text-white">
      <header className="flex h-[60px] shrink-0 items-center gap-3 border-b border-[#303030] px-3">
        <Link href="/" aria-label="Back" className="grid h-[38px] w-[38px] place-items-center rounded-full bg-white/10"><ChevronLeft size={20} /></Link>
        {character.avatar ? <img src={character.avatar} alt="" className="h-9 w-9 rounded-full object-cover" /> : <span className="grid h-9 w-9 place-items-center rounded-full bg-[#ff2792] font-semibold">{character.name[0]}</span>}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-medium">{character.name}, {character.age}</p>
          <p className="text-[11px] text-[#858585]">{status ? `model: ${status.llm}` : "…"}</p>
        </div>
        {status?.tts && (
          <button type="button" aria-label={autoVoice ? "Mute voice" : "Play voice"} onClick={() => setAutoVoice((v) => !v)} className="grid h-[38px] w-[38px] place-items-center rounded-full bg-white/10">
            {autoVoice ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mx-auto flex max-w-[760px] flex-col gap-3">
          {messages.map((m) => (
            <div key={m.id} className={`flex max-w-[80%] flex-col gap-1 ${m.role === "user" ? "self-end items-end" : "self-start"}`}>
              {m.image && <img src={m.image} alt="" className="max-h-80 rounded-[12px]" />}
              {(m.content || (m.role === "assistant" && !m.image)) && (
                <p className={`whitespace-pre-wrap rounded-[18px] px-4 py-2 text-[14px] leading-5 ${m.role === "user" ? "bg-[#ff2792]" : "bg-[#1a1a1a]"}`}>
                  {m.content || "…"}
                </p>
              )}
            </div>
          ))}
          <div ref={bottom} />
        </div>
      </div>

      {error && <p className="mx-auto mb-2 max-w-[760px] rounded-[12px] bg-[#e1002d]/15 px-3 py-2 text-[13px] text-[#ff6b86]">{error}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(text, image);
        }}
        className="mx-auto mb-3 flex w-full max-w-[760px] items-end gap-2 px-3"
      >
        <label className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full bg-white/10" aria-label="Attach picture">
          <ImagePlus size={18} />
          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
        <div className="flex flex-1 flex-col gap-2 rounded-[22px] bg-[#1a1a1a] px-4 py-2.5">
          {image && (
            <div className="relative w-fit">
              <img src={image} alt="" className="h-16 rounded-[8px]" />
              <button type="button" onClick={() => setImage(undefined)} className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-black text-[11px]">✕</button>
            </div>
          )}
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder={`Message ${character.name}`} className="bg-transparent text-[14px] outline-none" aria-label="Message" />
        </div>
        {status?.images && (
          <button type="button" disabled={busy} onClick={askPicture} aria-label="Ask for a picture" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 disabled:opacity-40">
            <Sparkles size={18} />
          </button>
        )}
        {status?.stt && (
          <button type="button" onClick={toggleMic} aria-label={recording ? "Stop recording" : "Record voice"} className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${recording ? "bg-[#e1002d]" : "bg-white/10"}`}>
            {recording ? <Square size={16} /> : <Mic size={18} />}
          </button>
        )}
        <button disabled={busy || (!text.trim() && !image)} aria-label="Send" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#ff2792] disabled:opacity-40">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
