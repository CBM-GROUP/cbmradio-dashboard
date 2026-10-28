"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ExternalLink,
  Moon,
  Radio,
  Sun,
  Laptop,
} from "lucide-react";
import {
  dashboardNavigation,
  dashboardRouteIsActive,
} from "../../data/dashboard-navigation";
import { useDashboardTheme, type ThemeMode } from "./theme-provider";

export default function DashboardSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { mode, setMode } = useDashboardTheme();

  return (
    <div className="flex h-full min-h-screen flex-col justify-between border-r border-slate-200/90 bg-white p-4 text-slate-700 transition-colors duration-150 dark:border-zinc-800/80 dark:bg-zinc-950/95 dark:text-zinc-200">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-zinc-800/70">
          <Link
            href="/dashboard"
            onClick={onNavigate}
            className="flex items-center gap-3 transition-opacity hover:opacity-90"
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 shadow-md shadow-emerald-500/20">
              <Radio className="h-5 w-5 text-slate-950" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg tracking-wider text-slate-900 dark:text-white">CBM RADIO</span>
              </div>
              <span className="text-[10px] font-semibold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">
                Studio Console
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Groups */}
        <nav aria-label="Dashboard navigation" className="space-y-5">
          {dashboardNavigation.map((group) => (
            <div key={group.label} className="space-y-1">
              <p className="px-3 text-[10px] font-bold tracking-widest text-slate-400 dark:text-zinc-500 uppercase">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = dashboardRouteIsActive(pathname, item);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={`group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                        active
                          ? "bg-emerald-50 text-emerald-700 font-semibold shadow-xs border border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/20"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`h-4 w-4 transition-colors ${
                            active
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-slate-400 group-hover:text-slate-600 dark:text-zinc-500 dark:group-hover:text-zinc-300"
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {active && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer Utilities */}
      <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-zinc-800/70">
        {/* Quick link to live public site */}
        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-white"
        >
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>View Public Site</span>
          </span>
          <ExternalLink className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
        </a>

        {/* Theme Mode Selector */}
        <div className="flex items-center justify-between rounded-lg bg-slate-100 p-1 border border-slate-200 dark:bg-zinc-900/60 dark:border-zinc-800/80">
          {(["dark", "light", "system"] as ThemeMode[]).map((t) => {
            const isCurrent = mode === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setMode(t)}
                className={`flex flex-1 items-center justify-center gap-1 rounded-md py-1 text-[11px] font-medium transition-all cursor-pointer ${
                  isCurrent
                    ? "bg-white text-slate-900 shadow-xs dark:bg-zinc-800 dark:text-white"
                    : "text-slate-500 hover:text-slate-800 dark:text-zinc-500 dark:hover:text-zinc-300"
                }`}
              >
                {t === "dark" && <Moon className="h-3 w-3" />}
                {t === "light" && <Sun className="h-3 w-3" />}
                {t === "system" && <Laptop className="h-3 w-3" />}
                <span className="capitalize">{t}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
