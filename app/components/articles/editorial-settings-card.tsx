"use client";

import Link from "next/link";
import {
  ExternalLink,
  SlidersHorizontal,
  Sparkles,
  Tags,
  User,
} from "lucide-react";
import type { ArticleCategory } from "../../types/articles";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface EditorialSettingsCardProps {
  categoryId: number | null;
  categories: ArticleCategory[];
  categoriesError?: string;
  categoryError?: string;
  onCategoryChange: (id: number | null) => void;
  author: string;
  authorError?: string;
  onAuthorChange: (author: string) => void;
  isFeatured: boolean;
  onFeaturedChange: (featured: boolean) => void;
}

const AUTHOR_PRESETS = ["CBM Radio", "Pastor David", "Kawooya Mitzvah", "News Desk"];

export default function EditorialSettingsCard({
  categoryId,
  categories,
  categoriesError,
  categoryError,
  onCategoryChange,
  author,
  authorError,
  onAuthorChange,
  isFeatured,
  onFeaturedChange,
}: EditorialSettingsCardProps) {
  return (
    <Card className="border-slate-200/80 bg-white shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
      <CardHeader className="p-4 border-b border-slate-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
              Editorial Settings
            </CardTitle>
            <CardDescription className="text-[11px] text-slate-500 dark:text-zinc-400">
              Categorization, byline credit, and showcase flags
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Category Selection */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300">
              <Tags className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
              <span>Publication Category</span>
            </label>
            <Link
              href="/dashboard/articles/categories"
              target="_blank"
              className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-0.5"
            >
              <span>Manage</span>
              <ExternalLink className="h-2.5 w-2.5" />
            </Link>
          </div>

          <select
            value={categoryId || ""}
            onChange={(e) =>
              onCategoryChange(e.target.value ? Number(e.target.value) : null)
            }
            className={`w-full rounded-lg border bg-white px-3 py-2 text-xs text-slate-900 transition focus:border-emerald-500 focus:outline-none dark:bg-black dark:text-zinc-100 ${
              categoryError
                ? "border-rose-500 dark:border-rose-500"
                : "border-slate-200 dark:border-zinc-800"
            }`}
          >
            <option value="">General / Uncategorized</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          {categoryError && (
            <p className="mt-1 text-[11px] text-rose-500">{categoryError}</p>
          )}
          {categoriesError && (
            <p className="mt-1 text-[11px] text-amber-500">{categoriesError}</p>
          )}
        </div>

        {/* Author Byline */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
            <User className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
            <span>Author Attribution <span className="text-rose-500">*</span></span>
          </label>
          <input
            type="text"
            required
            value={author}
            onChange={(e) => onAuthorChange(e.target.value)}
            placeholder="e.g. CBM Editorial Desk"
            className={`w-full rounded-lg border bg-white px-3 py-2 text-xs text-slate-900 transition placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:bg-black dark:text-zinc-100 dark:placeholder:text-zinc-600 ${
              authorError
                ? "border-rose-500 dark:border-rose-500"
                : "border-slate-200 dark:border-zinc-800"
            }`}
          />
          {authorError && (
            <p className="mt-1 text-[11px] text-rose-500">{authorError}</p>
          )}

          {/* Byline Presets */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-slate-400 dark:text-zinc-500">Quick:</span>
            {AUTHOR_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onAuthorChange(preset)}
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition cursor-pointer ${
                  author === preset
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Showcase Interactive Card */}
        <div
          onClick={() => onFeaturedChange(!isFeatured)}
          className={`flex items-start gap-3 rounded-xl border p-3 transition-all cursor-pointer select-none ${
            isFeatured
              ? "border-amber-500/50 bg-amber-500/5 dark:border-amber-500/40 dark:bg-amber-500/10"
              : "border-slate-200 bg-slate-50/50 hover:border-slate-300 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700"
          }`}
        >
          <div
            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
              isFeatured
                ? "bg-amber-500 text-black shadow-xs"
                : "bg-slate-200 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            <Sparkles className="h-4 w-4" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Frontpage Showcase
              </span>
              <div
                className={`h-4 w-7 rounded-full transition-colors relative ${
                  isFeatured ? "bg-amber-500" : "bg-slate-300 dark:bg-zinc-700"
                }`}
              >
                <div
                  className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform ${
                    isFeatured ? "right-0.5" : "left-0.5"
                  }`}
                />
              </div>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-zinc-400 leading-normal">
              Pin story to top banners and breaking editorial news reels.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
