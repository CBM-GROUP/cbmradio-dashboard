import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Film,
  FileCheck2,
  FilePenLine,
  Image as ImageIcon,
  MessageSquare,
  Newspaper,
  Play,
  Plus,
  Radio,
  User as UserIcon,
} from "lucide-react";
import type {
  DashboardArticleSummary,
  DashboardCommentSummary,
  DashboardEpisodeSummary,
  DashboardOverviewCounts,
} from "../../types/dashboard-overview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StationLiveHero() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 via-zinc-950 to-black p-6 shadow-xl dark:border-emerald-500/20">
      <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3.5 w-3.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            </span>
            <span className="font-mono text-xs font-bold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">
              Broadcast Studio Active
            </span>
            <Badge variant="outline" className="border-emerald-500/30 text-[10px] text-emerald-600 dark:text-emerald-400">
              Live Network
            </Badge>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            CBM Radio Command Center
          </h1>
          <p className="max-w-2xl text-xs text-slate-600 dark:text-zinc-400 sm:text-sm">
            Manage live broadcast programs, recorded podcast episodes, digital news articles, and listener moderation from a unified studio console.
          </p>
        </div>

        {/* Quick Launch Actions */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-900/20">
            <Link href="/dashboard/episodes">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New Episode
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="text-xs">
            <Link href="/dashboard/articles/new">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New Article
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="text-xs">
            <Link href="/dashboard/gallery">
              <ImageIcon className="mr-1.5 h-3.5 w-3.5" />
              Add Media
            </Link>
          </Button>
          <Button asChild size="sm" variant="ghost" className="text-xs text-slate-600 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400">
            <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer">
              <span>View Live Site</span>
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
        <Card className="relative overflow-hidden p-5 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-lg dark:hover:shadow-emerald-950/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-zinc-400">
              Radio Programs
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-emerald-600 transition-colors group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10 group-hover:text-emerald-500 dark:border-zinc-800 dark:bg-black dark:text-emerald-400">
              <Radio className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {counts.programs.toLocaleString()}
            </span>
            <span className="flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 group-hover:underline">
              <span>Station Shows</span>
              <ArrowUpRight className="ml-0.5 h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-zinc-900 text-[11px] text-slate-500 dark:text-zinc-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Active on-air schedules</span>
          </div>
        </Card>
      </Link>

      {/* Episodes Metric */}
      <Link href="/dashboard/episodes" className="group block focus-visible:outline-none">
        <Card className="relative overflow-hidden p-5 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-lg dark:hover:shadow-emerald-950/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-zinc-400">
              Episodes Archive
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-emerald-600 transition-colors group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10 group-hover:text-emerald-500 dark:border-zinc-800 dark:bg-black dark:text-emerald-400">
              <Film className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {counts.episodes.toLocaleString()}
            </span>
            <span className="flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 group-hover:underline">
              <span>View Recordings</span>
              <ArrowUpRight className="ml-0.5 h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-zinc-900 text-[11px] text-slate-500 dark:text-zinc-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal-500" />
            <span>YouTube broadcast archives</span>
          </div>
        </Card>
      </Link>

      {/* Articles Metric */}
      <Link href="/dashboard/articles" className="group block focus-visible:outline-none">
        <Card className="relative overflow-hidden p-5 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-lg dark:hover:shadow-emerald-950/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-zinc-400">
              Editorial Articles
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-emerald-600 transition-colors group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10 group-hover:text-emerald-500 dark:border-zinc-800 dark:bg-black dark:text-emerald-400">
              <Newspaper className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {counts.articles.toLocaleString()}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] font-mono">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{counts.published_articles} pub</span>
              <span className="text-slate-400 dark:text-zinc-600">/</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">{counts.draft_articles} draft</span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-900 text-[11px] text-slate-500 dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <FileCheck2 className="h-3 w-3 text-emerald-500" />
              <span>{counts.published_articles} Live</span>
            </span>
            <span className="flex items-center gap-1">
              <FilePenLine className="h-3 w-3 text-amber-500" />
              <span>{counts.draft_articles} Drafts</span>
            </span>
          </div>
        </Card>
      </Link>

      {/* Gallery & Feedback Metric */}
      <Link href="/dashboard/gallery" className="group block focus-visible:outline-none">
        <Card className="relative overflow-hidden p-5 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-lg dark:hover:shadow-emerald-950/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-zinc-400">
              Media & Community
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-emerald-600 transition-colors group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10 group-hover:text-emerald-500 dark:border-zinc-800 dark:bg-black dark:text-emerald-400">
              <ImageIcon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {counts.gallery_items.toLocaleString()}
            </span>
            <span className="flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 group-hover:underline">
              <span>Photo Gallery</span>
              <ArrowUpRight className="ml-0.5 h-3.5 w-3.5" />
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-900 text-[11px] text-slate-500 dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <ImageIcon className="h-3 w-3 text-emerald-500" />
              <span>{counts.gallery_items} Media Assets</span>
            </span>
            <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400">
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
    <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-zinc-400">
      <Calendar className="h-3 w-3" />
      <time dateTime={value || undefined}>{formatted}</time>
    </span>
  ) : (
    <span className="text-[11px] text-slate-400 dark:text-zinc-600">Date unavailable</span>
  );
}

export function LatestArticleCard({
  article,
}: {
  article: DashboardArticleSummary | null;
}) {
  return (
    <Card className="flex flex-col justify-between overflow-hidden">
      <CardHeader className="border-b border-slate-100 dark:border-zinc-800/80 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <CardTitle className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
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
      <CardContent className="p-5 flex-1 flex flex-col justify-between">
        {article ? (
          <div className="space-y-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-zinc-800 dark:bg-black group">
              {article.cover_image ? (
                <Image
                  src={article.cover_image}
                  alt={article.title}
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-400 dark:text-zinc-600">
                  No cover image
                </div>
              )}
              {article.is_featured && (
                <div className="absolute top-2.5 left-2.5">
                  <Badge variant="default" className="text-[10px] shadow-sm">
                    Featured Story
                  </Badge>
                </div>
              )}
            </div>
            <div>
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/dashboard/articles/${encodeURIComponent(article.slug)}/edit`}
                  className="font-bold text-base text-slate-900 hover:text-emerald-600 transition-colors line-clamp-2 dark:text-white dark:hover:text-emerald-400"
                >
                  {article.title}
                </Link>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 border-t border-slate-100 dark:border-zinc-900 pt-3">
                <span className="flex items-center gap-1.5 font-medium">
                  <UserIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{article.author || "Editorial Team"}</span>
                </span>
                <DateDisplay value={article.published_at} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center text-xs text-slate-400 dark:text-zinc-500">
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
    <Card className="flex flex-col justify-between overflow-hidden">
      <CardHeader className="border-b border-slate-100 dark:border-zinc-800/80 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <CardTitle className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
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
      <CardContent className="p-5 flex-1 flex flex-col justify-between">
        {episode ? (
          <div className="space-y-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-zinc-800 dark:bg-black group">
              {episode.cover_image ? (
                <Image
                  src={episode.cover_image}
                  alt={episode.title}
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-400 dark:text-zinc-600">
                  No thumbnail
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-black shadow-lg">
                  <Play className="h-5 w-5 fill-current ml-0.5" />
                </span>
              </div>
              <div className="absolute top-2.5 right-2.5">
                <Badge
                  variant={episode.is_active ? "default" : "secondary"}
                  className="shrink-0 text-[10px] shadow-sm"
                >
                  {episode.is_active ? "Active On-Air" : "Archived"}
                </Badge>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 line-clamp-1 dark:text-white">
                {episode.title}
              </h3>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 border-t border-slate-100 dark:border-zinc-900 pt-3">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-[200px]">
                  {episode.program_title || "Radio Broadcast"}
                </span>
                <DateDisplay value={episode.publish_date} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center text-xs text-slate-400 dark:text-zinc-500">
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
              className="font-semibold text-sm text-slate-800 truncate hover:text-emerald-600 block dark:text-zinc-100 dark:hover:text-emerald-400"
            >
              {item.title}
            </Link>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">By {item.author || "CBM Radio"}</p>
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
    <OverviewList title="Recent Radio Episodes" href="/dashboard/episodes" count={episodes.length}>
      {episodes.map((item) => (
        <li
          key={item.id}
          className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800/60 py-3 last:border-0"
        >
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-slate-800 truncate hover:text-emerald-600 dark:text-zinc-100 dark:hover:text-emerald-400">
              {item.title}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400/90 font-medium mt-0.5 truncate">
              {item.program_title || "Program"}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              variant={item.is_active ? "default" : "secondary"}
              className="text-[10px]"
            >
              {item.is_active ? "Active" : "Draft"}
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
              {item.is_approved ? "Approved" : "Pending Moderation"}
            </Badge>
          </div>
          <p className="text-xs text-slate-600 dark:text-zinc-300 line-clamp-2 italic bg-slate-50 border border-slate-200 p-2 rounded-lg dark:bg-black dark:border-zinc-800">
            &ldquo;{item.body}&rdquo;
          </p>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
              {item.article !== null
                ? `Article #${item.article}`
                : item.episode !== null
                ? `Episode #${item.episode}`
                : "General Station Feedback"}
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
    <Card className="flex flex-col justify-between">
      <CardHeader className="border-b border-slate-100 dark:border-zinc-800/80 pb-3">
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
