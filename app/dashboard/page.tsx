"use client";

import {
  BarChart3,
  Film,
  Image as ImageIcon,
  MessageSquare,
  Newspaper,
  Radio,
  RefreshCw,
  Share2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  LatestArticleCard,
  LatestEpisodeCard,
  OverviewMetricsGrid,
  RecentArticles,
  RecentComments,
  RecentEpisodes,
  StationLiveHero,
} from "../components/dashboard/overview-cards";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, LoadingState } from "../components/ui/surfaces";
import { apiClient, isApiError } from "../lib/api-client";
import { isDashboardOverview, type DashboardOverview } from "../types/dashboard-overview";

export default function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState("");
  const controllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const loadOverview = useCallback(async (retry: boolean) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const requestId = ++requestIdRef.current;
    if (retry) setRetrying(true);
    setError("");

    try {
      const response = await apiClient.get<unknown>("/api/dashboard/overview", {
        signal: controller.signal,
      });
      if (!isDashboardOverview(response)) {
        throw new Error("The overview service returned an unexpected response.");
      }
      if (requestId === requestIdRef.current) {
        setOverview(response);
      }
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") {
        return;
      }
      if (requestId === requestIdRef.current) {
        setError(
          isApiError(requestError)
            ? requestError.message
            : requestError instanceof Error
            ? requestError.message
            : "Unable to load the dashboard overview."
        );
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setRetrying(false);
      }
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadOverview(false), 0);
    return () => {
      window.clearTimeout(timer);
      requestIdRef.current += 1;
      controllerRef.current?.abort();
    };
  }, [loadOverview]);

  if (loading) {
    return <LoadingState label="Connecting to studio broadcast console & telemetry…" />;
  }

  if (error && !overview) {
    return (
      <ErrorState
        title="Studio Console Offline"
        message={error}
        onRetry={() => void loadOverview(true)}
        retrying={retrying}
      />
    );
  }

  if (!overview) {
    return (
      <ErrorState
        title="Studio Console Offline"
        message="No overview telemetry is currently available."
        onRetry={() => void loadOverview(true)}
        retrying={retrying}
      />
    );
  }

  const { counts } = overview;

  return (
    <div className="space-y-8 pb-16 view-fade">
      {/* Broadcast Studio Active Hero Banner */}
      <StationLiveHero />

      {/* Primary Metrics Grid */}
      <section aria-labelledby="metrics-title" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="metrics-title" className="text-xs font-bold tracking-widest text-slate-400 dark:text-zinc-500 uppercase">
            Station Telemetry & Content Metrics
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void loadOverview(true)}
            disabled={retrying}
            className="h-7 text-xs text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
          >
            <RefreshCw className={`mr-1.5 h-3 w-3 ${retrying ? "animate-spin" : ""}`} />
            <span>{retrying ? "Syncing…" : "Sync Telemetry"}</span>
          </Button>
        </div>
        <OverviewMetricsGrid counts={counts} />
      </section>

      {error && (
        <ErrorState
          title="Telemetry sync warning"
          message={error}
          onRetry={() => void loadOverview(true)}
          retrying={retrying}
        />
      )}

      {/* Featured On-Air & Latest Publications */}
      <section aria-labelledby="featured-title" className="space-y-3">
        <h2 id="featured-title" className="text-xs font-bold tracking-widest text-slate-400 dark:text-zinc-500 uppercase">
          Featured Broadcast & Published Stories
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <LatestEpisodeCard episode={overview.latest_episode} />
          <LatestArticleCard article={overview.latest_article} />
        </div>
      </section>

      {/* Real-Time Activity Streams */}
      <section aria-labelledby="activity-title" className="space-y-3">
        <h2 id="activity-title" className="text-xs font-bold tracking-widest text-slate-400 dark:text-zinc-500 uppercase">
          Live Content Stream & Listener Activity
        </h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <RecentEpisodes episodes={overview.recent_episodes} />
          <RecentArticles articles={overview.recent_articles} />
          <RecentComments comments={overview.recent_comments} />
        </div>
      </section>

      {/* Studio Quick Shortcuts */}
      <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-zinc-400">
            Studio Quick Access & Modules
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            <Link
              href="/dashboard/programs"
              className="flex flex-col items-center justify-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50/50 p-3.5 text-center transition hover:border-emerald-500/40 hover:bg-emerald-50/40 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-950/20"
            >
              <Radio className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">Programs</span>
            </Link>
            <Link
              href="/dashboard/episodes"
              className="flex flex-col items-center justify-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50/50 p-3.5 text-center transition hover:border-emerald-500/40 hover:bg-emerald-50/40 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-950/20"
            >
              <Film className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">Episodes</span>
            </Link>
            <Link
              href="/dashboard/articles"
              className="flex flex-col items-center justify-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50/50 p-3.5 text-center transition hover:border-emerald-500/40 hover:bg-emerald-50/40 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-950/20"
            >
              <Newspaper className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">Articles</span>
            </Link>
            <Link
              href="/dashboard/charts"
              className="flex flex-col items-center justify-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50/50 p-3.5 text-center transition hover:border-emerald-500/40 hover:bg-emerald-50/40 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-950/20"
            >
              <BarChart3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">Charts</span>
            </Link>
            <Link
              href="/dashboard/gallery"
              className="flex flex-col items-center justify-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50/50 p-3.5 text-center transition hover:border-emerald-500/40 hover:bg-emerald-50/40 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-950/20"
            >
              <ImageIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">Gallery</span>
            </Link>
            <Link
              href="/dashboard/team"
              className="flex flex-col items-center justify-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50/50 p-3.5 text-center transition hover:border-emerald-500/40 hover:bg-emerald-50/40 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-950/20"
            >
              <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">Staff Team</span>
            </Link>
            <Link
              href="/dashboard/comments"
              className="flex flex-col items-center justify-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50/50 p-3.5 text-center transition hover:border-emerald-500/40 hover:bg-emerald-50/40 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-950/20"
            >
              <MessageSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">Feedback</span>
            </Link>
            <Link
              href="/dashboard/site-settings/social-links"
              className="flex flex-col items-center justify-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50/50 p-3.5 text-center transition hover:border-emerald-500/40 hover:bg-emerald-50/40 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-950/20"
            >
              <Share2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">Settings</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
