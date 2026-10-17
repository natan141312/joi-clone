"use client";
/* eslint-disable @next/next/no-img-element -- avatars and chat images are data URLs */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ImagePlus, Mic, Send, Sparkles, Square, Volume2, VolumeX } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Character, Chat, Message } from "@/lib/companion/types";

// Expert answers come back as Markdown (headings, lists, tables, code).
const MARKDOWN =
  "[&_h1]:mt-3 [&_h1]:text-[17px] [&_h1]:font-bold [&_h2]:mt-3 [&_h2]:text-[16px] [&_h2]:font-bold [&_h3]:mt-2 [&_h3]:font-semibold " +
  "[&_p]:my-1.5 [&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:ps-5 [&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:ps-5 [&_li]:my-0.5 [&_strong]:font-semibold " +
  "[&_a]:text-[#ff6bb5] [&_a]:underline [&_hr]:my-3 [&_hr]:border-white/10 [&_blockquote]:border-s-2 [&_blockquote]:border-white/20 [&_blockquote]:ps-3 [&_blockquote]:text-[#aeaeae] " +
  "[&_code]:rounded [&_code]:bg-black/40 [&_code]:px-1 [&_code]:text-[13px] [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-[10px] [&_pre]:bg-black/50 [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0 " +
  "[&_table]:my-2 [&_table]:w-full [&_table]:border-collapse [&_table]:text-[13px] [&_th]:border [&_th]:border-white/15 [&_th]:bg-white/5 [&_th]:px-2 [&_th]:py-1 [&_th]:text-start [&_td]:border [&_td]:border-white/15 [&_td]:px-2 [&_td]:py-1";

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

  // Browser backup of the conversation: restores it if the server copy is shorter (for example
  // when another server instance answers), and is sent along so the server can rebuild the chat.
  const backupKey = `joi_chat_${initialChat.id}`;
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(backupKey) ?? "null") as Message[] | null;
      if (Array.isArray(saved) && saved.length > initialChat.messages.length) setMessages(saved);
    } catch {
      // Storage unavailable: the server copy is used.
    }
  }, [backupKey, initialChat.messages.length]);
  useEffect(() => {
    try {
      // Text only: pictures are too large for localStorage.
      localStorage.setItem(backupKey, JSON.stringify(messages.filter((m) => m.content).map((m) => ({ id: m.id, role: m.role, content: m.content, createdAt: m.createdAt }))));
    } catch {
      // ignore
    }
  }, [backupKey, messages]);

  const history = () => messages.filter((m) => m.content).map((m) => ({ role: m.role, content: m.content }));
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
        body: JSON.stringify({ text: content, image: img, characterId: character.id, history: history() }),
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
      body: JSON.stringify({ prompt: text, characterId: character.id, history: history() }),
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
                m.role === "user" ? (
                  <p dir="auto" className="msg-bubble whitespace-pre-wrap rounded-[18px] bg-[#ff2792] px-4 py-2 text-[14px] leading-5">{m.content}</p>
                ) : (
                  <div dir="auto" className={`msg-bubble max-w-full overflow-x-auto rounded-[18px] bg-[#1a1a1a] px-4 py-2 text-[14px] leading-6 ${MARKDOWN}`}>
                    {m.content ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown> : "…"}
                  </div>
                )
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
