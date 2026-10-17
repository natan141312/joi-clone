import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MARKDOWN } from "./markdown";

/** Renders an expert's Markdown knowledge sheet. */
export function ExpertProfile({ markdown }: { markdown: string }) {
  return (
    <div dir="auto" className={`rounded-[14px] bg-[#141414] p-5 text-[14px] leading-6 text-[#d4d4d4] ring-1 ring-white/5 ${MARKDOWN}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
}
