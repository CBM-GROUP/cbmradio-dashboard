"use client";

import {
  FileCheck2,
  FilePenLine,
  GalleryHorizontal,
  MessageSquare,
  Newspaper,
  Radio,
  RefreshCw,
  ScrollText,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  LatestArticleCard,
  LatestEpisodeCard,
  OverviewMetricCard,
  RecentArticles,
  RecentComments,
  RecentEpisodes,
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
    return <LoadingState label="Loading studio analytics and content overview…" />;
  }

  if (error && !overview) {
    return (
      <ErrorState
        title="Dashboard overview unavailable"
        message={error}
        onRetry={() => void loadOverview(true)}
        retrying={retrying}
      />
    );
  }

  if (!overview) {
    return (
      <ErrorState
        title="Dashboard overview unavailable"
        message="No overview data is currently available."
        onRetry={() => void loadOverview(true)}
        retrying={retrying}
      />
    );
  }

  const { counts } = overview;

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Studio Overview
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Real-time analytics and management for CBM Radio broadcast & publications.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadOverview(true)}
            disabled={retrying}
            className="flex items-center gap-1.5 border-slate-800 bg-slate-900 text-xs text-slate-300 hover:text-white"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${retrying ? "animate-spin" : ""}`} />
            <span>{retrying ? "Refreshing…" : "Refresh"}</span>
          </Button>
          <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-xs text-white">
            <Link href="/dashboard/episodes">
              <Plus className="mr-1 h-3.5 w-3.5" />
              New Episode
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <ErrorState
          title="Unable to refresh overview"
          message={error}
          onRetry={() => void loadOverview(true)}
          retrying={retrying}
        />
      )}

      {/* Content Totals Grid */}
      <section aria-labelledby="overview-counts-title" className="space-y-3">
        <h2 id="overview-counts-title" className="text-xs font-bold tracking-widest text-slate-500 uppercase">
          Content Metrics & Totals
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          <OverviewMetricCard
            label="Programs"
            value={counts.programs}
            href="/dashboard/programs"
            icon={<Radio className="h-4 w-4" />}
          />
          <OverviewMetricCard
            label="Episodes"
            value={counts.episodes}
            href="/dashboard/episodes"
            icon={<ScrollText className="h-4 w-4" />}
          />
          <OverviewMetricCard
            label="Articles"
            value={counts.articles}
            href="/dashboard/articles"
            icon={<Newspaper className="h-4 w-4" />}
          />
          <OverviewMetricCard
            label="Gallery"
            value={counts.gallery_items}
            href="/dashboard/gallery"
            icon={<GalleryHorizontal className="h-4 w-4" />}
          />
          <OverviewMetricCard
            label="Published"
            value={counts.published_articles}
            href="/dashboard/articles"
            icon={<FileCheck2 className="h-4 w-4 text-emerald-400" />}
          />
          <OverviewMetricCard
            label="Drafts"
            value={counts.draft_articles}
            href="/dashboard/articles"
            icon={<FilePenLine className="h-4 w-4 text-amber-400" />}
          />
          <OverviewMetricCard
            label="Comments"
            value={counts.comments}
            href="/dashboard/comments"
            icon={<MessageSquare className="h-4 w-4 text-teal-400" />}
          />
        </div>
      </section>

      {/* Latest Featured Content */}
      <section aria-labelledby="overview-latest-title" className="space-y-3">
        <h2 id="overview-latest-title" className="text-xs font-bold tracking-widest text-slate-500 uppercase">
          On-Air & Latest Publications
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <LatestArticleCard article={overview.latest_article} />
          <LatestEpisodeCard episode={overview.latest_episode} />
        </div>
      </section>

      {/* Recent Records Streams */}
      <section aria-labelledby="overview-recent-title" className="space-y-3">
        <h2 id="overview-recent-title" className="text-xs font-bold tracking-widest text-slate-500 uppercase">
          Recent Activity & Moderation
        </h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <RecentArticles articles={overview.recent_articles} />
          <RecentEpisodes episodes={overview.recent_episodes} />
          <RecentComments comments={overview.recent_comments} />
        </div>
      </section>

      {/* Quick Actions Bar */}
      <Card className="border-slate-800 bg-slate-900/60 p-6">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-sm font-bold tracking-wider text-slate-300 uppercase">
            Quick Studio Shortcuts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-wrap gap-2.5">
            <Button asChild variant="outline" size="sm" className="border-slate-800 bg-slate-950 text-xs text-slate-300 hover:text-white hover:border-slate-700">
              <Link href="/dashboard/programs">Manage Programs</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="border-slate-800 bg-slate-950 text-xs text-slate-300 hover:text-white hover:border-slate-700">
              <Link href="/dashboard/episodes">Manage Episodes</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="border-slate-800 bg-slate-950 text-xs text-slate-300 hover:text-white hover:border-slate-700">
              <Link href="/dashboard/articles">Manage Articles</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="border-slate-800 bg-slate-950 text-xs text-slate-300 hover:text-white hover:border-slate-700">
              <Link href="/dashboard/gallery">Manage Gallery</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="border-slate-800 bg-slate-950 text-xs text-slate-300 hover:text-white hover:border-slate-700">
              <Link href="/dashboard/team">Manage Team & Staff</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="border-slate-800 bg-slate-950 text-xs text-slate-300 hover:text-white hover:border-slate-700">
              <Link href="/dashboard/comments">Moderate Comments</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="border-slate-800 bg-slate-950 text-xs text-slate-300 hover:text-white hover:border-slate-700">
              <Link href="/dashboard/site-settings/social-links">Station Settings</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
