"use client";

import { Star } from "lucide-react";
import { useState } from "react";

export function RateExpert({ id, initialRating, initialCount, initialMine }: { id: string; initialRating: number; initialCount: number; initialMine: number }) {
  const [mine, setMine] = useState(initialMine);
  const [hover, setHover] = useState(0);
  const [{ rating, count }, setAgg] = useState({ rating: initialRating, count: initialCount });
  const rate = async (value: number) => {
    setMine(value);
    const res = await fetch(`/api/characters/${id}/rate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value }) });
    if (res.ok) {
      const d = (await res.json()) as { rating: number; ratings: number };
      setAgg({ rating: d.rating, count: d.ratings });
    }
  };
  const shown = hover || mine;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Rate this expert">
        {[1, 2, 3, 4, 5].map((v) => (
          <button key={v} type="button" role="radio" aria-checked={mine === v} aria-label={`${v} stars`} onMouseEnter={() => setHover(v)} onClick={() => rate(v)} className="p-0.5">
            <Star size={20} className={v <= shown ? "fill-[#fbbf24] text-[#fbbf24]" : "text-[#555]"} />
          </button>
        ))}
      </div>
      <span className="text-[13px] text-[#aeaeae]">
        {count ? `${rating.toFixed(1)} · ${count} rating${count === 1 ? "" : "s"}` : "No ratings yet"}
        {mine ? " · thanks for rating!" : ""}
      </span>
    </div>
  );
}
