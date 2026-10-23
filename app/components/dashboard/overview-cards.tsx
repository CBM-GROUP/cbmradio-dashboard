"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Film,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Newspaper,
  Play,
  Plus,
  Radio,
  Sparkles,
  User as UserIcon,
  Video,
} from "lucide-react";

import type {
  DashboardArticleSummary,
  DashboardCommentSummary,
  DashboardEpisodeSummary,
  DashboardOverviewCounts,
} from "../../types/dashboard-overview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function StationLiveHero() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-900 via-zinc-950 to-black p-6 md:p-8 text-white shadow-lg dark:border-zinc-800/80">
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50" />
            </span>
            <span className="font-mono text-xs font-bold tracking-widest text-emerald-400 uppercase">
              Broadcast Studio Active
            </span>
            <Badge
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/10 text-[11px] font-semibold text-emerald-300"
            >
              On-Air Telemetry
            </Badge>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
            CBM Radio Command Center
          </h1>
          <p className="max-w-2xl text-xs text-zinc-300 sm:text-sm leading-relaxed">
            Manage live broadcast programs, podcast archives, digital editorial publications, and community engagement from your studio workspace.
          </p>
        </div>

        {/* Quick Launch Actions */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            asChild
            size="sm"
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs shadow-sm"
          >
            <Link href="/dashboard/episodes">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New Episode
            </Link>
          </Button>

          <Button
            asChild
            size="sm"
            variant="outline"
            className="border-zinc-700 bg-zinc-900/60 text-zinc-100 hover:bg-zinc-800 text-xs"
          >
            <Link href="/dashboard/articles/new">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New Article
            </Link>
          </Button>

          <Button
            asChild
            size="sm"
            variant="outline"
            className="border-zinc-700 bg-zinc-900/60 text-zinc-100 hover:bg-zinc-800 text-xs"
          >
            <Link href="/dashboard/programs">
              <Radio className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
              Programs
            </Link>
          </Button>

          <Button
            asChild
            size="sm"
            variant="ghost"
            className="text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/60"
          >
            <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer">
              <span>Public Website</span>
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function OverviewMetricsGrid({ counts }: { counts: DashboardOverviewCounts }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Programs Metric */}
      <Link href="/dashboard/programs" className="group block focus-visible:outline-none">
        <Card className="flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-zinc-400">
                Radio Programs
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 bg-slate-50 text-emerald-600 transition-colors group-hover:border-emerald-500/30 group-hover:bg-emerald-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-emerald-400 dark:group-hover:bg-emerald-950/20">
                <Radio className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {counts.programs.toLocaleString()}
              </span>
              <span className="flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                <span>View shows</span>
                <ArrowUpRight className="ml-0.5 h-3.5 w-3.5" />
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500 dark:border-zinc-800/80 dark:text-zinc-400">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Broadcast schedule</span>
            </span>
            <Badge variant="secondary" className="text-[10px] font-mono">
              On-air grid
            </Badge>
          </div>
        </Card>
      </Link>

      {/* Episodes Metric */}
      <Link href="/dashboard/episodes" className="group block focus-visible:outline-none">
        <Card className="flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-zinc-400">
                Episode Archives
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 bg-slate-50 text-emerald-600 transition-colors group-hover:border-emerald-500/30 group-hover:bg-emerald-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-emerald-400 dark:group-hover:bg-emerald-950/20">
                <Film className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {counts.episodes.toLocaleString()}
              </span>
              <span className="flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                <span>Recordings</span>
                <ArrowUpRight className="ml-0.5 h-3.5 w-3.5" />
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500 dark:border-zinc-800/80 dark:text-zinc-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Video className="h-3 w-3 text-red-500" />
              <span>YouTube streams</span>
            </span>
            <Badge variant="secondary" className="text-[10px] font-mono">
              Archived
            </Badge>
          </div>
        </Card>
      </Link>

      {/* Articles Metric */}
      <Link href="/dashboard/articles" className="group block focus-visible:outline-none">
        <Card className="flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-zinc-400">
                Editorial News
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 bg-slate-50 text-emerald-600 transition-colors group-hover:border-emerald-500/30 group-hover:bg-emerald-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-emerald-400 dark:group-hover:bg-emerald-950/20">
                <Newspaper className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {counts.articles.toLocaleString()}
              </span>
              <div className="flex items-center gap-1.5 text-[11px] font-mono">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {counts.published_articles} pub
                </span>
                <span className="text-slate-300 dark:text-zinc-700">/</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {counts.draft_articles} draft
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500 dark:border-zinc-800/80 dark:text-zinc-400">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="h-3 w-3" />
              <span>{counts.published_articles} Live</span>
            </span>
            <span className="font-medium text-amber-600 dark:text-amber-400">
              {counts.draft_articles} In Draft
            </span>
          </div>
        </Card>
      </Link>

      {/* Gallery & Media Metric */}
      <Link href="/dashboard/gallery" className="group block focus-visible:outline-none">
        <Card className="flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-zinc-400">
                Media & Community
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 bg-slate-50 text-emerald-600 transition-colors group-hover:border-emerald-500/30 group-hover:bg-emerald-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-emerald-400 dark:group-hover:bg-emerald-950/20">
                <ImageIcon className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {counts.gallery_items.toLocaleString()}
              </span>
              <span className="flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                <span>View assets</span>
                <ArrowUpRight className="ml-0.5 h-3.5 w-3.5" />
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500 dark:border-zinc-800/80 dark:text-zinc-400">
            <span className="flex items-center gap-1 font-medium">
              <ImageIcon className="h-3 w-3 text-emerald-500" />
              <span>{counts.gallery_items} Photos</span>
            </span>
            <span className="flex items-center gap-1 font-medium text-teal-600 dark:text-teal-400">
              <MessageSquare className="h-3 w-3" />
              <span>{counts.comments} Comments</span>
            </span>
          </div>
        </Card>
      </Link>
    </div>
  );
}

function dateValue(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function DateDisplay({ value }: { value: string | null }) {
  const formatted = dateValue(value);
  return formatted ? (
    <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
      <Calendar className="h-3 w-3" />
      <time dateTime={value || undefined}>{formatted}</time>
    </span>
  ) : (
    <span className="text-[11px] text-slate-400 dark:text-zinc-600 font-mono">Unscheduled</span>
  );
}

export function LatestArticleCard({
  article,
}: {
  article: DashboardArticleSummary | null;
}) {
  return (
    <Card className="flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-950">
      <CardHeader className="border-b border-slate-100 p-4 pb-3 dark:border-zinc-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
              Latest Published Article
            </CardTitle>
          </div>
          <Link
            href="/dashboard/articles"
            className="text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
          >
            All Articles &rarr;
          </Link>
        </div>
      </CardHeader>

      <CardContent className="p-4 flex-1 flex flex-col justify-between">
        {article ? (
          <div className="space-y-3.5">
            <div className="group relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-slate-200/80 bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900">
              {article.cover_image ? (
                <Image
                  src={article.cover_image}
                  alt={article.title}
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-300 group-hover:scale-102"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-400 dark:text-zinc-600">
                  <FileText className="h-7 w-7 stroke-[1.5] text-slate-300 dark:text-zinc-700 mr-2" />
                  <span>No cover image</span>
                </div>
              )}

              {article.is_featured && (
                <div className="absolute top-2.5 left-2.5">
                  <Badge
                    variant="outline"
                    className="border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-bold shadow-xs backdrop-blur-md gap-1"
                  >
                    <Sparkles className="h-3 w-3 fill-amber-400 text-amber-500" />
                    <span>Featured</span>
                  </Badge>
                </div>
              )}
            </div>

            <div>
              <Link
                href={`/dashboard/articles/${encodeURIComponent(article.slug)}/edit`}
                className="font-bold text-base text-slate-900 hover:text-emerald-600 transition-colors line-clamp-2 dark:text-white dark:hover:text-emerald-400"
              >
                {article.title}
              </Link>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 border-t border-slate-100 dark:border-zinc-800/80 pt-2.5">
                <span className="flex items-center gap-1.5 font-medium truncate max-w-[55%] text-slate-600 dark:text-zinc-300">
                  <UserIcon className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500 shrink-0" />
                  <span className="truncate">{article.author || "CBM Editorial"}</span>
                </span>
                <DateDisplay value={article.published_at} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-44 items-center justify-center text-xs text-slate-400 dark:text-zinc-500">
            No published articles yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function LatestEpisodeCard({
  episode,
}: {
  episode: DashboardEpisodeSummary | null;
}) {
  return (
    <Card className="flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-950">
      <CardHeader className="border-b border-slate-100 p-4 pb-3 dark:border-zinc-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
              Latest On-Air Broadcast
            </CardTitle>
          </div>
          <Link
            href="/dashboard/episodes"
            className="text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
          >
            All Episodes &rarr;
          </Link>
        </div>
      </CardHeader>

      <CardContent className="p-4 flex-1 flex flex-col justify-between">
        {episode ? (
          <div className="space-y-3.5">
            <div className="group relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-slate-200/80 bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900">
              {episode.cover_image ? (
                <Image
                  src={episode.cover_image}
                  alt={episode.title}
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-300 group-hover:scale-102"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-400 dark:text-zinc-600">
                  <Film className="h-7 w-7 stroke-[1.5] text-slate-300 dark:text-zinc-700 mr-2" />
                  <span>No thumbnail</span>
                </div>
              )}

              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-md">
                  <Play className="h-4 w-4 fill-current ml-0.5" />
                </span>
              </div>

              <div className="absolute top-2.5 right-2.5">
                <Badge
                  variant={episode.is_active ? "default" : "secondary"}
                  className="text-[10px] shadow-xs backdrop-blur-md"
                >
                  {episode.is_active ? "Active On-Air" : "Archived"}
                </Badge>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-base text-slate-900 line-clamp-1 dark:text-white">
                {episode.title}
              </h3>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 border-t border-slate-100 dark:border-zinc-800/80 pt-2.5">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-[200px]">
                  {episode.program_title || "Radio Broadcast"}
                </span>
                <DateDisplay value={episode.publish_date} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-44 items-center justify-center text-xs text-slate-400 dark:text-zinc-500">
            No broadcast episodes recorded yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function RecentArticles({
  articles,
}: {
  articles: DashboardArticleSummary[];
}) {
  return (
    <OverviewList title="Recent Articles" href="/dashboard/articles" count={articles.length}>
      {articles.map((item) => (
        <li
          key={item.id}
          className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800/60 py-3 last:border-0"
        >
          <div className="min-w-0 flex-1">
            <Link
              href={`/dashboard/articles/${encodeURIComponent(item.slug)}/edit`}
              className="font-semibold text-sm text-slate-800 truncate hover:text-emerald-600 block dark:text-zinc-100 dark:hover:text-emerald-400 transition-colors"
            >
              {item.title}
            </Link>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              By {item.author || "CBM Radio"}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              variant={item.is_published ? "default" : "secondary"}
              className="text-[10px]"
            >
              {item.is_published ? "Published" : "Draft"}
            </Badge>
            <DateDisplay value={item.published_at} />
          </div>
        </li>
      ))}
    </OverviewList>
  );
}

export function RecentEpisodes({
  episodes,
}: {
  episodes: DashboardEpisodeSummary[];
}) {
  return (
    <OverviewList title="Recent Episodes" href="/dashboard/episodes" count={episodes.length}>
      {episodes.map((item) => (
        <li
          key={item.id}
          className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800/60 py-3 last:border-0"
        >
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-slate-800 truncate dark:text-zinc-100">
              {item.title}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400/90 font-medium mt-0.5 truncate">
              {item.program_title || "Radio Show"}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              variant={item.is_active ? "default" : "secondary"}
              className="text-[10px]"
            >
              {item.is_active ? "Active" : "Archived"}
            </Badge>
            <DateDisplay value={item.publish_date} />
          </div>
        </li>
      ))}
    </OverviewList>
  );
}

export function RecentComments({
  comments,
}: {
  comments: DashboardCommentSummary[];
}) {
  return (
    <OverviewList title="Listener Feedback" href="/dashboard/comments" count={comments.length}>
      {comments.map((item) => (
        <li
          key={item.id}
          className="space-y-1.5 border-b border-slate-100 dark:border-zinc-800/60 py-3 last:border-0"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-xs text-slate-700 dark:text-zinc-200">
              {item.name || "Anonymous Listener"}
            </span>
            <Badge
              variant={item.is_approved ? "default" : "destructive"}
              className="text-[10px]"
            >
              {item.is_approved ? "Approved" : "Pending"}
            </Badge>
          </div>
          <p className="text-xs text-slate-600 dark:text-zinc-300 line-clamp-2 italic bg-slate-50 border border-slate-200/80 p-2 rounded-md dark:bg-zinc-900/60 dark:border-zinc-800">
            &ldquo;{item.body}&rdquo;
          </p>
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
              {item.article !== null
                ? `Article #${item.article}`
                : item.episode !== null
                ? `Episode #${item.episode}`
                : "General Feedback"}
            </span>
            <DateDisplay value={item.created_at} />
          </div>
        </li>
      ))}
    </OverviewList>
  );
}

function OverviewList({
  title,
  href,
  count,
  children,
}: {
  title: string;
  href: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <Card className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-950">
      <CardHeader className="border-b border-slate-100 p-4 pb-3 dark:border-zinc-800/80">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
            {title}
          </CardTitle>
          <Link
            href={href}
            className="text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
          >
            View all &rarr;
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-1">
        {count > 0 ? (
          <ul className="space-y-0.5">{children}</ul>
        ) : (
          <div className="flex h-32 items-center justify-center text-xs text-slate-400 dark:text-zinc-500">
            No activity records yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
