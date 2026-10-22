"use client";

import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileEdit,
  Globe,
  Save,
  Send,
} from "lucide-react";
import type { DashboardArticle } from "../../types/articles";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PublicationCardProps {
  article: DashboardArticle | null;
  publishedAt: string | null;
  publicationInput: string;
  onPublishedAtChange: (isoString: string | null) => void;
  saving: "draft" | "publish" | null;
  dirty: boolean;
  formError?: string;
  onSave: (action: "draft" | "publish") => void;
}

export default function PublicationCard({
  article,
  publicationInput,
  onPublishedAtChange,
  saving,
  dirty,
  formError,
  onSave,
}: PublicationCardProps) {
  const isPublished = article?.is_published;
  const publishLabel = isPublished ? "Update Published Story" : "Publish Story Live";

  const handleSetNow = () => {
    onPublishedAtChange(new Date().toISOString());
  };

  return (
    <Card className="border-slate-200/80 bg-white shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
      <CardHeader className="p-4 border-b border-slate-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Globe className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
              Publication & Visibility
            </CardTitle>
            <CardDescription className="text-[11px] text-slate-500 dark:text-zinc-400">
              Control live status, schedule, and public broadcast
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Status Callout Banner */}
        <div
          className={`flex items-start justify-between gap-3 rounded-xl border p-3 ${
            isPublished
              ? "border-emerald-500/30 bg-emerald-500/5 dark:border-emerald-500/20 dark:bg-emerald-500/10"
              : "border-amber-500/30 bg-amber-500/5 dark:border-amber-500/20 dark:bg-amber-500/10"
          }`}
        >
          <div className="flex items-start gap-2.5">
            <div
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                isPublished
                  ? "bg-emerald-500 text-black"
                  : "bg-amber-500 text-black"
              }`}
            >
              {isPublished ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <FileEdit className="h-3.5 w-3.5" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {isPublished ? "Live on Public Website" : "Draft in Progress"}
                </span>
                {isPublished && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-zinc-400 leading-normal">
                {isPublished
                  ? "Broadcasted live and available to public readers."
                  : "Hidden from readers. Only editors can preview."}
              </p>
            </div>
          </div>

          {isPublished && article?.slug && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                window.open(
                  `http://localhost:3000/news/${encodeURIComponent(article.slug)}`,
                  "_blank"
                )
              }
              className="h-7 px-2 text-[10px] font-semibold text-emerald-600 border-emerald-500/30 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30 shrink-0"
              title="Open public live article"
            >
              <span>Live Site</span>
              <ExternalLink className="h-2.5 w-2.5 ml-1" />
            </Button>
          )}
        </div>

        {/* Unsaved changes pill */}
        {dirty && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 text-[11px] text-amber-700 dark:text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Unsaved edits in article workspace</span>
          </div>
        )}

        {/* Schedule / Published At */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300">
              <Calendar className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
              <span>Publication Timestamp</span>
            </label>
            <button
              type="button"
              onClick={handleSetNow}
              className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 cursor-pointer"
            >
              <Clock className="h-3 w-3" />
              <span>Set to Now</span>
            </button>
          </div>

          <input
            type="datetime-local"
            value={publicationInput}
            onChange={(e) =>
              onPublishedAtChange(
                e.target.value ? new Date(e.target.value).toISOString() : null
              )
            }
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 transition focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-black dark:text-zinc-100"
          />
          <p className="mt-1 text-[10px] text-slate-400 dark:text-zinc-500 leading-normal">
            Optional. When publishing for the first time, defaults to current time if unselected.
          </p>
        </div>

        {/* Form Error Banner */}
        {formError && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-600 dark:text-rose-400">
            {formError}
          </div>
        )}

        {/* Publishing Action Buttons */}
        <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 space-y-2">
          {/* Primary Publish Button */}
          <Button
            type="button"
            disabled={Boolean(saving)}
            onClick={() => onSave("publish")}
            className="w-full h-9 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2"
          >
            {saving === "publish" ? (
              <span>Publishing Story…</span>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                <span>{publishLabel}</span>
              </>
            )}
          </Button>

          {/* Secondary Draft Button */}
          <Button
            type="button"
            variant="outline"
            disabled={Boolean(saving)}
            onClick={() => onSave("draft")}
            className="w-full h-8 text-xs font-semibold border-slate-200 hover:bg-slate-50 dark:border-zinc-800 dark:hover:bg-zinc-900 flex items-center justify-center gap-2"
          >
            {saving === "draft" ? (
              <span>Saving Draft…</span>
            ) : (
              <>
                <Save className="h-3.5 w-3.5 text-slate-400" />
                <span>{isPublished ? "Revert to Draft" : "Save as Draft"}</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
