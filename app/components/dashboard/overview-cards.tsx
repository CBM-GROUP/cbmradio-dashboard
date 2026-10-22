import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, Calendar, User as UserIcon } from "lucide-react";
import type {
  DashboardArticleSummary,
  DashboardCommentSummary,
  DashboardEpisodeSummary,
} from "../../types/dashboard-overview";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function OverviewMetricCard({
  label,
  value,
  href,
  icon,
}: {
  label: string;
  value: number;
  href: string;
  icon: ReactNode;
}) {
  return (
    <Link href={href} className="group block focus-visible:outline-none">
      <Card className="relative overflow-hidden p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-emerald-950/20">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-zinc-400">
            {label}
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-emerald-600 transition-colors group-hover:border-emerald-500/30 group-hover:text-emerald-700 dark:border-zinc-800 dark:bg-black dark:text-emerald-400 dark:group-hover:border-emerald-500/30 dark:group-hover:text-emerald-300">
            {icon}
          </div>
        </div>
        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {value.toLocaleString()}
          </span>
          <span className="flex items-center text-xs font-medium text-slate-400 transition-colors group-hover:text-emerald-600 dark:text-zinc-500 dark:group-hover:text-emerald-400">
            <span>Manage</span>
            <ArrowUpRight className="ml-0.5 h-3.5 w-3.5" />
          </span>
        </div>
      </Card>
    </Link>
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
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-slate-100 dark:border-zinc-800/80 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
            Latest Published Article
          </CardTitle>
          <Link
            href="/dashboard/articles"
            className="text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
          >
            All Articles &rarr;
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        {article ? (
          <div className="space-y-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-zinc-800 dark:bg-black">
              {article.cover_image ? (
                <Image
                  src={article.cover_image}
                  alt={article.title}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-400 dark:text-zinc-600">
                  No cover image
                </div>
              )}
            </div>
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1">
                  {article.title}
                </h3>
                <Badge variant="default" className="shrink-0 text-[10px]">
                  Published
                </Badge>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
                <span className="flex items-center gap-1">
                  <UserIcon className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
                  <span>{article.author || "Editorial Team"}</span>
                </span>
                <DateDisplay value={article.published_at} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center text-xs text-slate-400 dark:text-zinc-500">
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
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-slate-100 dark:border-zinc-800/80 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
            Latest Radio Episode
          </CardTitle>
          <Link
            href="/dashboard/episodes"
            className="text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
          >
            All Episodes &rarr;
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        {episode ? (
          <div className="space-y-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-zinc-800 dark:bg-black">
              {episode.cover_image ? (
                <Image
                  src={episode.cover_image}
                  alt={episode.title}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-400 dark:text-zinc-600">
                  No thumbnail
                </div>
              )}
            </div>
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1">
                  {episode.title}
                </h3>
                <Badge
                  variant={episode.is_active ? "default" : "secondary"}
                  className="shrink-0 text-[10px]"
                >
                  {episode.is_active ? "Active" : "Archived"}
                </Badge>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
                <span className="font-medium text-emerald-600 dark:text-emerald-400 truncate">
                  {episode.program_title || "Radio Broadcast"}
                </span>
                <DateDisplay value={episode.publish_date} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center text-xs text-slate-400 dark:text-zinc-500">
            No episodes recorded yet.
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
            <p className="font-semibold text-sm text-slate-800 truncate hover:text-emerald-600 dark:text-zinc-100 dark:hover:text-emerald-400">
              {item.title}
            </p>
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
    <OverviewList title="Recent Episodes" href="/dashboard/episodes" count={episodes.length}>
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
    <OverviewList title="Recent Listener Comments" href="/dashboard/comments" count={comments.length}>
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
          <p className="text-xs text-slate-600 dark:text-zinc-300 line-clamp-2 italic bg-slate-50 border border-slate-200 p-2 rounded-lg dark:bg-black dark:border-zinc-800">
            &ldquo;{item.body}&rdquo;
          </p>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
              {item.article !== null
                ? `Article #${item.article}`
                : item.episode !== null
                ? `Episode #${item.episode}`
                : "General comment"}
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
          <CardTitle className="text-sm font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
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
            No entries recorded yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
