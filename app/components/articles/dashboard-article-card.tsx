"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Copy,
  Edit2,
  ExternalLink,
  Eye,
  FileText,
  Sparkles,
  Star,
  Trash2,
  User,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DashboardArticle } from "../../types/articles";

interface DashboardArticleCardProps {
  article: DashboardArticle;
  isPublishing?: boolean;
  isFeaturing?: boolean;
  onTogglePublish: (article: DashboardArticle) => void;
  onToggleFeatured: (article: DashboardArticle) => void;
  onCopyLink: (slug: string) => void;
  onDelete: (article: DashboardArticle) => void;
}

function estimateReadingTime(text: string): string {
  const wordCount = text ? text.trim().split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.ceil(wordCount / 180));
  return `${minutes} min read`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Draft";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Draft";
  }
}

export function DashboardArticleCard({
  article,
  isPublishing = false,
  isFeaturing = false,
  onTogglePublish,
  onToggleFeatured,
  onCopyLink,
  onDelete,
}: DashboardArticleCardProps) {
  const readingTime = estimateReadingTime(article.body || article.summary || "");
  const editHref = `/dashboard/articles/${encodeURIComponent(article.slug)}/edit`;

  return (
    <Card className="group flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:shadow-black/40">
      <div className="flex flex-col">
        {/* Cover Media Section */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100 border-b border-slate-100 dark:bg-zinc-900/60 dark:border-zinc-800/80">
          {article.cover_image ? (
            <>
              <Image
                src={article.cover_image}
                alt={article.title}
                fill
                unoptimized
                className="object-cover transition-transform duration-300 group-hover:scale-102"
              />
              <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/50 via-black/20 to-transparent pointer-events-none" />
            </>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-slate-50 text-slate-400 dark:bg-zinc-900/40 dark:text-zinc-500">
              <FileText className="h-8 w-8 stroke-[1.5] text-slate-300 dark:text-zinc-600 mb-1" />
              <span className="text-xs font-medium text-slate-400 dark:text-zinc-500">
                No cover image
              </span>
            </div>
          )}

          {/* Floating Badges */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
            <Badge
              variant="secondary"
              className="backdrop-blur-md bg-white/90 text-slate-800 dark:bg-zinc-900/90 dark:text-zinc-200 border border-slate-200/80 dark:border-zinc-700/80 text-[11px] font-medium shadow-xs"
            >
              {article.category?.name || "General"}
            </Badge>

            <div className="flex items-center gap-1.5">
              {article.is_featured && (
                <Badge
                  variant="outline"
                  className="backdrop-blur-md bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300 text-[11px] font-semibold gap-1 shadow-xs"
                >
                  <Sparkles className="h-3 w-3 fill-amber-400 text-amber-500" />
                  <span>Featured</span>
                </Badge>
              )}

              <Badge
                variant={article.is_published ? "default" : "secondary"}
                className={cn(
                  "backdrop-blur-md text-[11px] font-medium gap-1.5 shadow-xs",
                  article.is_published
                    ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-300"
                    : "bg-white/90 text-slate-600 dark:bg-zinc-900/90 dark:text-zinc-400 border-slate-200/80 dark:border-zinc-700"
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    article.is_published ? "bg-emerald-500" : "bg-slate-400"
                  )}
                />
                <span>{article.is_published ? "Published" : "Draft"}</span>
              </Badge>
            </div>
          </div>
        </div>

        {/* Card Header */}
        <CardHeader className="p-4 pb-2 space-y-1.5">
          <CardTitle className="text-base font-semibold leading-snug tracking-tight text-slate-900 dark:text-zinc-100 line-clamp-2">
            <Link
              href={editHref}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              {article.title}
            </Link>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed min-h-[2.5rem]">
            {article.summary || "No teaser or summary preview written for this publication."}
          </CardDescription>
        </CardHeader>

        {/* Card Content (Metadata & Metrics) */}
        <CardContent className="p-4 pt-2 pb-3 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
            <span className="flex items-center gap-1.5 font-medium truncate max-w-[55%] text-slate-600 dark:text-zinc-300">
              <User className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500 shrink-0" />
              <span className="truncate">{article.author || "CBM Editorial"}</span>
            </span>
            <span className="flex items-center gap-1 text-[11px] font-mono shrink-0">
              <Calendar className="h-3 w-3 text-slate-400 dark:text-zinc-500" />
              <span>{formatDate(article.published_at || article.created_at)}</span>
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800/80 text-xs">
            <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-zinc-400">
              <Clock className="h-3 w-3 text-slate-400 dark:text-zinc-500" />
              <span>{readingTime}</span>
            </span>

            {/* Dashboard-only views metric badge */}
            <Badge
              variant="secondary"
              className="font-mono text-[11px] font-semibold gap-1 text-slate-700 dark:text-zinc-300 bg-slate-100/80 dark:bg-zinc-800/80 border-slate-200/80 dark:border-zinc-700/80"
              title="Total public readership views"
            >
              <Eye className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              <span>{(article.views_count ?? 0).toLocaleString()} views</span>
            </Badge>
          </div>
        </CardContent>
      </div>

      {/* Card Footer Actions */}
      <CardFooter className="px-4 py-2.5 bg-slate-50/50 dark:bg-zinc-950/40 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1">
          {/* Quick Publish / To Draft Toggle */}
          <Button
            variant="outline"
            size="sm"
            disabled={isPublishing}
            onClick={() => void onTogglePublish(article)}
            className={cn(
              "h-8 text-xs font-medium border transition-colors",
              article.is_published
                ? "border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900/50 dark:text-amber-400 dark:hover:bg-amber-950/30"
                : "border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
            )}
            title={article.is_published ? "Unpublish to draft" : "Publish article immediately"}
          >
            {isPublishing ? "Updating..." : article.is_published ? "To Draft" : "Publish"}
          </Button>

          {/* Quick Toggle Featured */}
          <Button
            variant="ghost"
            size="icon"
            disabled={isFeaturing}
            onClick={() => void onToggleFeatured(article)}
            className={cn(
              "h-8 w-8 transition-colors",
              article.is_featured
                ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                : "text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-zinc-800"
            )}
            title={article.is_featured ? "Remove from featured" : "Pin to featured"}
          >
            <Star className={cn("h-4 w-4", article.is_featured && "fill-amber-400 text-amber-500")} />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          {/* Live Link on public site */}
          {article.is_published && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-zinc-800 dark:hover:text-emerald-400"
              onClick={() =>
                window.open(
                  `http://localhost:3000/news/${encodeURIComponent(article.slug)}`,
                  "_blank"
                )
              }
              title="Open live story on radio website"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}

          {/* Copy Public Link */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            onClick={() => onCopyLink(article.slug)}
            title="Copy public link"
          >
            <Copy className="h-4 w-4" />
          </Button>

          {/* Edit Button */}
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs font-semibold border-slate-200 hover:border-emerald-500 hover:text-emerald-600 dark:border-zinc-800 dark:text-zinc-200 dark:hover:border-emerald-500/50 dark:hover:text-emerald-400"
          >
            <Link href={editHref}>
              <Edit2 className="h-3 w-3 mr-1" />
              <span>Edit</span>
            </Link>
          </Button>

          {/* Delete Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
            onClick={() => onDelete(article)}
            title="Delete article"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
