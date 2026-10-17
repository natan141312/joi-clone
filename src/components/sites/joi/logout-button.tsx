"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };
  return (
    <button type="button" onClick={logout} className="rounded-full bg-white/10 px-5 py-2.5 text-[14px] font-medium hover:bg-white/20">
      Log out
    </button>
  );
}
