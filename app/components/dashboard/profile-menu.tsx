"use client";

import { LogOut, ShieldCheck, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AdminUser } from "../../lib/backend-auth";

export default function ProfileMenu({ user }: { user: AdminUser }) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const displayName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username;

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeEscape);
    };
  }, [open]);

  const logout = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.replace("/login");
    }
  };

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        ref={triggerRef}
        type="button"
        className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white py-1 pl-3 pr-1 text-left transition hover:border-slate-300 hover:bg-slate-50 cursor-pointer dark:border-zinc-800 dark:bg-zinc-900/90 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
        aria-label={`Open account menu for ${displayName}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <div className="hidden text-right text-xs md:block">
          <p className="font-semibold text-slate-900 leading-tight dark:text-white">{displayName}</p>
          <p className="text-[10px] text-emerald-600 font-medium dark:text-emerald-400">Administrator</p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 font-bold text-xs text-slate-950 shadow-inner">
          {initials}
        </div>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account menu"
          className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-100 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="px-3 py-2 border-b border-slate-100 dark:border-zinc-800/80">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <p className="text-xs font-semibold text-slate-900 truncate dark:text-white">{displayName}</p>
            </div>
            <p className="text-[11px] text-slate-500 truncate mt-0.5 dark:text-zinc-400">{user.email || user.username}</p>
          </div>

          <div className="pt-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={() => void logout()}
              disabled={signingOut}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 cursor-pointer disabled:opacity-50 dark:text-rose-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
            >
              <LogOut className="h-4 w-4" />
              <span>{signingOut ? "Signing out…" : "Sign out"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
