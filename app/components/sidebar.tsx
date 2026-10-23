"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
// ⚡ FORCE IMPORT DYNAMIC VECTOR ICONS FROM INSTALLED PACKAGE
import {
  LayoutDashboard,
  LayoutTemplate,
  Users,
  Radio,
  Film,
  Newspaper,
  Image,
  Trophy,
  SunMoon,
} from "lucide-react";

interface SidebarProps { 
  themeMode: "dark" | "light" | "system";
  setThemeMode: (mode: "dark" | "light" | "system") => void;
  resolvedDark: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export default function Sidebar({
  themeMode,
  setThemeMode,
  resolvedDark,
  setMobileOpen,
}: SidebarProps) {
  const pathname = usePathname();

  // 🛡️ REPLACED ALL STICKERS WITH PURE SVG LUCIDE COMPONENTS
  const links = [
    { href: "/dashboard", label: "Overview Matrix", icon: LayoutDashboard },
    {
      href: "/dashboard/page-sections",
      label: "Page Hero Zones",
      icon: LayoutTemplate,
    },
    { href: "/dashboard/team", label: "Station Team", icon: Users },
    { href: "/dashboard/programs", label: "Radio Programs", icon: Radio },
    { href: "/dashboard/episodes", label: "Episode Archives", icon: Film },
    { href: "/dashboard/charts", label: "Music Charts", icon: Trophy },
    { href: "/dashboard/articles", label: "News Articles", icon: Newspaper },
    { href: "/dashboard/gallery", label: "Media Gallery", icon: Image },
  ];

  const activeLinkClass = resolvedDark
    ? "bg-slate-800 text-emerald-400 border-slate-700/60"
    : "bg-slate-900 text-emerald-400 shadow-md";

  const inactiveLinkClass = resolvedDark
    ? "text-slate-400 hover:bg-slate-800/50 hover:text-white"
    : "text-slate-700 hover:bg-slate-300/60 hover:text-slate-950";

  const brandingLineColor = resolvedDark
    ? "border-slate-800"
    : "border-slate-300";
  const labelTextColor = resolvedDark
    ? "text-slate-500"
    : "text-slate-600 font-bold";

    // ✅ Strict-safe layout lookup: Clears out all red underlines without using 'any'
  
   return (
    <div
      className="w-full flex flex-col justify-between p-4 min-h-full font-sans transition-colors duration-300"
      style={{ backgroundColor: resolvedDark ? "#0b131a" : "#e2e8f0" }}
    >
      <div className="w-full">
        {/* ✅ FIXED: Restored the exact branding style wrapper and cleared the overlapping tag */}
        <div className={`h-12 flex items-center px-3 border-b ${brandingLineColor} mb-4 whitespace-nowrap`}>
          <Radio className="h-5 w-5 text-emerald-500 dark:text-emerald-400 animate-pulse mr-2" />
          <span className="ml-2 text-xl font-black text-emerald-500 dark:text-emerald-400 tracking-wider">
            CBM
          </span>
        </div>

        <div className={`text-[10px] font-bold uppercase tracking-widest ${labelTextColor} px-3 mb-2 font-mono`}>
          Control Tower
        </div>

        <nav className="flex flex-col space-y-1 w-full">
          {links.map((link) => {
            const isActive = pathname === link.href;
            const IconComponent = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => {
                  if (setMobileOpen) setMobileOpen(false);
                }}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-bold transition duration-200 border border-transparent w-full ${
                  isActive ? activeLinkClass : inactiveLinkClass
                }`}
              >
                <IconComponent className="w-4 h-4 shrink-0 stroke-[2.25]" />
                <span className="truncate">{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className={`pt-4 border-t ${brandingLineColor} mt-6 px-1`}>
        <div className="flex items-center space-x-2 text-slate-500 mb-2">
          <SunMoon className="w-3.5 h-3.5" />
          <label className={`block text-[10px] font-bold ${labelTextColor} uppercase tracking-widest font-mono`}>
            Interface Theme
          </label>
        </div>
        <div className="relative w-full">
          <select
            value={themeMode}
            onChange={(e) => setThemeMode(e.target.value as "dark" | "light" | "system")}
            className="w-full text-xs font-bold px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 outline-none cursor-pointer focus:border-emerald-500/50 transition duration-200"
            style={{
              backgroundColor: resolvedDark ? "#1e293b" : "#ffffff",
              borderColor: resolvedDark ? "rgba(255,255,255,0.1)" : "#cbd5e1",
              color: resolvedDark ? "#f8fafc" : "#0f172a",
            }}
          >
            <option value="dark">🌙 Dark Mode</option>
            <option value="light">☀️ Light Mode</option>
            <option value="system">💻 System Default</option>
          </select>
        </div>
      </div>
    </div>
  );
}
