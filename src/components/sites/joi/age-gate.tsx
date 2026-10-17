"use client";

import { useEffect, useState } from "react";

const KEY = "joi_age_ok";

/** 18+ confirmation, remembered in this browser so it shows once. */
export function AgeGate() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let ok = false;
    try {
      ok = localStorage.getItem(KEY) === "1";
    } catch {
      // Storage blocked: ask every visit.
    }
    if (!ok) setShow(true); // eslint-disable-line react-hooks/set-state-in-effect -- reading browser storage after mount
  }, []);

  if (!show) return null;

  const confirm = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // ignore
    }
    setShow(false);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-[12px]" role="dialog" aria-modal="true" aria-labelledby="gate-title">
      <div className="w-[448px] max-w-[calc(100vw-32px)] rounded-[24px] bg-[#1a1a1a] px-14 pb-12 pt-[52px] max-md:px-6">
        <h2 id="gate-title" className="text-center text-[36px] font-semibold leading-[44px]">Mature content</h2>
        <p className="mt-[22px] max-w-[296px] text-[18px] font-medium leading-[26px]">
          This site is for adults only and may include mature themes. Please confirm that you are at least 18 years old to continue.
        </p>
        <button type="button" onClick={confirm} className="mt-8 h-[44px] w-full rounded-full border-2 border-white text-[15px] font-semibold">
          Yes, I’m over 18
        </button>
        <a href="https://www.google.com" className="mt-3 block text-center text-[13px] text-[#858585] hover:text-white">
          I’m under 18, leave
        </a>
      </div>
    </div>
  );
}
