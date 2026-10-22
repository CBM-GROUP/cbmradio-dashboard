"use client";

import { Menu, Radio } from "lucide-react";
import type { AdminUser } from "../../lib/backend-auth";
import ProfileMenu from "./profile-menu";
import { Badge } from "@/components/ui/badge";

export default function DashboardHeader({
  user,
  navigationOpen,
  onOpenNavigation,
  menuTriggerRef,
}: {
  user: AdminUser;
  navigationOpen: boolean;
  onOpenNavigation: () => void;
  menuTriggerRef: React.RefObject<HTMLButtonElement | null>;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 md:px-6 backdrop-blur-md transition-colors duration-150 dark:border-zinc-800/80 dark:bg-black/80">
      <div className="flex items-center gap-3">
        <button
          ref={menuTriggerRef}
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-700 transition hover:bg-slate-200 md:hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-white"
          onClick={onOpenNavigation}
          aria-label="Open dashboard navigation"
          aria-expanded={navigationOpen}
          aria-controls="dashboard-mobile-navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <Badge
            variant="default"
            className="flex items-center gap-1.5 border-emerald-500/20 bg-emerald-50 text-emerald-700 px-2.5 py-1 font-mono text-[11px] dark:bg-emerald-500/10 dark:text-emerald-400"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-500"></span>
            </span>
            <span>BROADCAST LIVE</span>
          </Badge>
          <span className="hidden text-xs text-slate-300 dark:text-zinc-600 sm:inline">|</span>
          <span className="hidden text-xs font-medium text-slate-500 dark:text-zinc-400 sm:inline">
            CBM Digital Operations
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ProfileMenu user={user} />
      </div>
    </header>
  );
}
