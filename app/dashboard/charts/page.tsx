"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  Disc3,
  ExternalLink,
  Minus,
  Music2,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Trophy,
  Video,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ConfirmationDialog } from "../../components/ui/confirmation-dialog";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/surfaces";
import Toast from "../../components/toast";
import { apiClient, isApiError } from "../../lib/api-client";

export interface ChartMovement {
  status: "up" | "down" | "same" | "new";
  diff: number;
  label: string;
}

export interface ChartEntry {
  id: string;
  chart?: string;
  chart_slug?: string;
  rank: number;
  previous_rank: number | null;
  peak_rank: number;
  weeks_on_chart: number;
  title: string;
  artist: string;
  featured_artists?: string;
  album?: string;
  cover_image?: string;
  cover_image_url?: string;
  coverImage?: string;
  audio_url?: string;
  youtube_url?: string;
  spotify_url?: string;
  apple_music_url?: string;
  movement?: ChartMovement;
}

export interface ChartSummary {
  id: string;
  title: string;
  slug: string;
  description: string;
  edition_date: string;
  chart_type: string;
  cover_image?: string;
  cover_image_url?: string;
  is_active: boolean;
  display_order: number;
  entries_count?: number;
}

export interface ChartDetail extends ChartSummary {
  entries: ChartEntry[];
}

const initialEntryForm = {
  id: "",
  rank: 1,
  previous_rank: "" as number | string,
  peak_rank: 1,
  weeks_on_chart: 1,
  title: "",
  artist: "",
  featured_artists: "",
  album: "",
  audio_url: "",
  youtube_url: "",
  spotify_url: "",
  apple_music_url: "",
  cover_image_url: "",
};

const initialChartForm = {
  title: "",
  slug: "",
  description: "",
  edition_date: new Date().toISOString().split("T")[0],
  chart_type: "hot100",
  is_active: true,
};

export default function ChartsDashboardPage() {
  const [charts, setCharts] = useState<ChartSummary[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [activeChart, setActiveChart] = useState<ChartDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant?: "success" | "error" | "info" } | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [entryForm, setEntryForm] = useState(initialEntryForm);
  const [entryFile, setEntryFile] = useState<File | null>(null);
  const [entryFilePreview, setEntryFilePreview] = useState("");
  const [entrySaving, setEntrySaving] = useState(false);

  const [chartModalOpen, setChartModalOpen] = useState(false);
  const [chartForm, setChartForm] = useState(initialChartForm);
  const [isEditingChart, setIsEditingChart] = useState(false);
  const [chartSaving, setChartSaving] = useState(false);

  // Delete dialogs
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);
  const [deletingEntry, setDeletingEntry] = useState(false);
  const [deleteChartSlug, setDeleteChartSlug] = useState<string | null>(null);
  const [deletingChart, setDeletingChart] = useState(false);

  // Load Charts List
  const loadCharts = useCallback(async (selectSlug?: string) => {
    try {
      const data = await apiClient.get<ChartSummary[] | { results: ChartSummary[] }>("/api/charts");
      const list = Array.isArray(data) ? data : data.results || [];
      setCharts(list);

      const targetSlug = selectSlug || selectedSlug || (list[0]?.slug ?? "");
      if (targetSlug) {
        setSelectedSlug(targetSlug);
      }
    } catch (err) {
      if (isApiError(err)) {
        setError(err.message);
      } else {
        setError("Unable to load music charts.");
      }
    } finally {
      setLoading(false);
    }
  }, [selectedSlug]);

  // Load Selected Chart Detail
  const loadChartDetail = useCallback(async (slug: string) => {
    if (!slug) return;
    setEntriesLoading(true);
    try {
      const data = await apiClient.get<ChartDetail>(`/api/charts?slug=${encodeURIComponent(slug)}`);
      setActiveChart(data);
    } catch (err) {
      if (isApiError(err)) {
        setToast({ message: err.message, variant: "error" });
      } else {
        setToast({ message: "Failed to load chart details.", variant: "error" });
      }
    } finally {
      setEntriesLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void loadCharts(), 0);
    return () => clearTimeout(t);
  }, [loadCharts]);

  useEffect(() => {
    if (selectedSlug) {
      const t = setTimeout(() => void loadChartDetail(selectedSlug), 0);
      return () => clearTimeout(t);
    }
  }, [selectedSlug, loadChartDetail]);

  // Handle Entry Modal Open (Add or Edit)
  const openAddEntryModal = () => {
    const nextRank = (activeChart?.entries?.length || 0) + 1;
    setEntryForm({
      ...initialEntryForm,
      rank: nextRank,
      peak_rank: nextRank,
      weeks_on_chart: 1,
    });
    setEntryFile(null);
    setEntryFilePreview("");
    setEntryModalOpen(true);
  };

  const openEditEntryModal = (entry: ChartEntry) => {
    setEntryForm({
      id: entry.id,
      rank: entry.rank,
      previous_rank: entry.previous_rank ?? "",
      peak_rank: entry.peak_rank,
      weeks_on_chart: entry.weeks_on_chart,
      title: entry.title,
      artist: entry.artist,
      featured_artists: entry.featured_artists || "",
      album: entry.album || "",
      audio_url: entry.audio_url || "",
      youtube_url: entry.youtube_url || "",
      spotify_url: entry.spotify_url || "",
      apple_music_url: entry.apple_music_url || "",
      cover_image_url: entry.cover_image_url || entry.cover_image || entry.coverImage || "",
    });
    setEntryFile(null);
    setEntryFilePreview("");
    setEntryModalOpen(true);
  };

  // Save Entry (Create / Update)
  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlug) return;
    setEntrySaving(true);

    try {
      if (entryFile) {
        const formData = new FormData();
        if (entryForm.id) formData.append("id", entryForm.id);
        formData.append("chart_slug", selectedSlug);
        formData.append("rank", String(entryForm.rank));
        if (entryForm.previous_rank !== "") {
          formData.append("previous_rank", String(entryForm.previous_rank));
        }
        formData.append("peak_rank", String(entryForm.peak_rank || entryForm.rank));
        formData.append("weeks_on_chart", String(entryForm.weeks_on_chart || 1));
        formData.append("title", entryForm.title.trim());
        formData.append("artist", entryForm.artist.trim());
        if (entryForm.featured_artists) formData.append("featured_artists", entryForm.featured_artists.trim());
        if (entryForm.album) formData.append("album", entryForm.album.trim());
        if (entryForm.audio_url) formData.append("audio_url", entryForm.audio_url.trim());
        if (entryForm.youtube_url) formData.append("youtube_url", entryForm.youtube_url.trim());
        if (entryForm.spotify_url) formData.append("spotify_url", entryForm.spotify_url.trim());
        if (entryForm.apple_music_url) formData.append("apple_music_url", entryForm.apple_music_url.trim());
        formData.append("cover_image", entryFile);

        if (entryForm.id) {
          await apiClient.put(`/api/charts/entries?id=${encodeURIComponent(entryForm.id)}`, formData);
          setToast({ message: `Updated "${entryForm.title}" (#${entryForm.rank})`, variant: "success" });
        } else {
          await apiClient.post(`/api/charts/entries?chart=${encodeURIComponent(selectedSlug)}`, formData);
          setToast({ message: `Added "${entryForm.title}" to chart (#${entryForm.rank})`, variant: "success" });
        }
      } else {
        const payload = {
          id: entryForm.id || undefined,
          chart_slug: selectedSlug,
          rank: Number(entryForm.rank),
          previous_rank: entryForm.previous_rank !== "" ? Number(entryForm.previous_rank) : null,
          peak_rank: Number(entryForm.peak_rank || entryForm.rank),
          weeks_on_chart: Number(entryForm.weeks_on_chart || 1),
          title: entryForm.title.trim(),
          artist: entryForm.artist.trim(),
          featured_artists: entryForm.featured_artists?.trim() || "",
          album: entryForm.album?.trim() || "",
          audio_url: entryForm.audio_url?.trim() || "",
          youtube_url: entryForm.youtube_url?.trim() || "",
          spotify_url: entryForm.spotify_url?.trim() || "",
          apple_music_url: entryForm.apple_music_url?.trim() || "",
        };

        if (entryForm.id) {
          await apiClient.put(`/api/charts/entries?id=${encodeURIComponent(entryForm.id)}`, payload);
          setToast({ message: `Updated "${entryForm.title}" (#${entryForm.rank})`, variant: "success" });
        } else {
          await apiClient.post(`/api/charts/entries?chart=${encodeURIComponent(selectedSlug)}`, payload);
          setToast({ message: `Added "${entryForm.title}" to chart (#${entryForm.rank})`, variant: "success" });
        }
      }

      setEntryModalOpen(false);
      void loadChartDetail(selectedSlug);
    } catch (err) {
      if (isApiError(err)) {
        setToast({ message: err.message, variant: "error" });
      } else {
        setToast({ message: "Failed to save track entry.", variant: "error" });
      }
    } finally {
      setEntrySaving(false);
    }
  };

  // Reorder Rank (Shift rank Up or Down)
  const handleShiftRank = async (entry: ChartEntry, direction: "up" | "down") => {
    if (!activeChart?.entries) return;
    const currentRank = entry.rank;
    const targetRank = direction === "up" ? currentRank - 1 : currentRank + 1;
    if (targetRank < 1 || targetRank > activeChart.entries.length) return;

    // Find the adjacent entry
    const adjacent = activeChart.entries.find((e) => e.rank === targetRank);

    try {
      // Update target entry first
      await apiClient.put(`/api/charts/entries?id=${encodeURIComponent(entry.id)}`, {
        rank: targetRank,
      });

      if (adjacent) {
        await apiClient.put(`/api/charts/entries?id=${encodeURIComponent(adjacent.id)}`, {
          rank: currentRank,
        });
      }

      setToast({ message: `Moved "${entry.title}" to #${targetRank}`, variant: "success" });
      void loadChartDetail(selectedSlug);
    } catch (err) {
      if (isApiError(err)) {
        setToast({ message: err.message, variant: "error" });
      } else {
        setToast({ message: "Could not shift track rank.", variant: "error" });
      }
    }
  };

  // Delete Entry
  const handleDeleteEntry = async () => {
    if (!deleteEntryId) return;
    setDeletingEntry(true);
    try {
      await apiClient.delete(`/api/charts/entries?id=${encodeURIComponent(deleteEntryId)}`);
      setToast({ message: "Track removed from chart.", variant: "success" });
      setDeleteEntryId(null);
      void loadChartDetail(selectedSlug);
    } catch (err) {
      if (isApiError(err)) {
        setToast({ message: err.message, variant: "error" });
      } else {
        setToast({ message: "Failed to delete track entry.", variant: "error" });
      }
    } finally {
      setDeletingEntry(false);
    }
  };

  // Chart Create / Edit Modal
  const openNewChartModal = () => {
    setIsEditingChart(false);
    setChartForm({
      ...initialChartForm,
      slug: `chart-${Date.now().toString().slice(-4)}`,
    });
    setChartModalOpen(true);
  };

  const openEditChartModal = () => {
    if (!activeChart) return;
    setIsEditingChart(true);
    setChartForm({
      title: activeChart.title,
      slug: activeChart.slug,
      description: activeChart.description || "",
      edition_date: activeChart.edition_date,
      chart_type: activeChart.chart_type,
      is_active: activeChart.is_active,
    });
    setChartModalOpen(true);
  };

  const handleSaveChart = async (e: React.FormEvent) => {
    e.preventDefault();
    setChartSaving(true);
    try {
      if (isEditingChart) {
        await apiClient.put("/api/charts", {
          slug: chartForm.slug,
          title: chartForm.title.trim(),
          description: chartForm.description.trim(),
          edition_date: chartForm.edition_date,
          chart_type: chartForm.chart_type,
          is_active: chartForm.is_active,
        });
        setToast({ message: `Updated chart "${chartForm.title}"`, variant: "success" });
        setChartModalOpen(false);
        void loadCharts(chartForm.slug);
        void loadChartDetail(chartForm.slug);
      } else {
        await apiClient.post("/api/charts", {
          title: chartForm.title.trim(),
          slug: chartForm.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
          description: chartForm.description.trim(),
          edition_date: chartForm.edition_date,
          chart_type: chartForm.chart_type,
          is_active: chartForm.is_active,
        });
        setToast({ message: `Created new chart "${chartForm.title}"`, variant: "success" });
        setChartModalOpen(false);
        const newSlug = chartForm.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");
        void loadCharts(newSlug);
        setSelectedSlug(newSlug);
      }
    } catch (err) {
      if (isApiError(err)) {
        setToast({ message: err.message, variant: "error" });
      } else {
        setToast({ message: "Failed to save chart.", variant: "error" });
      }
    } finally {
      setChartSaving(false);
    }
  };

  // Delete Chart
  const handleDeleteChart = async () => {
    if (!deleteChartSlug) return;
    setDeletingChart(true);
    try {
      await apiClient.delete(`/api/charts?slug=${encodeURIComponent(deleteChartSlug)}`);
      setToast({ message: "Chart deleted.", variant: "success" });
      setDeleteChartSlug(null);
      void loadCharts();
    } catch (err) {
      if (isApiError(err)) {
        setToast({ message: err.message, variant: "error" });
      } else {
        setToast({ message: "Failed to delete chart.", variant: "error" });
      }
    } finally {
      setDeletingChart(false);
    }
  };

  // Filter entries
  const filteredEntries = (activeChart?.entries || []).filter((entry) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      entry.title.toLowerCase().includes(query) ||
      entry.artist.toLowerCase().includes(query) ||
      (entry.featured_artists && entry.featured_artists.toLowerCase().includes(query)) ||
      (entry.album && entry.album.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 dark:bg-amber-400/10 dark:text-amber-400">
              <Trophy className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Music Charts
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
            Curate and maintain gospel countdowns, rankings, peak positions, and streaming links.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={openNewChartModal}
            className="gap-2 border-slate-300 dark:border-zinc-700"
          >
            <Plus className="h-4 w-4" />
            New Chart
          </Button>
          <Button
            onClick={openAddEntryModal}
            disabled={!activeChart}
            className="gap-2 bg-amber-600 hover:bg-amber-500 text-white dark:bg-amber-500 dark:hover:bg-amber-400 font-semibold shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Track
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingState label="Loading music charts…" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void loadCharts()} />
      ) : charts.length === 0 ? (
        <EmptyState
          title="No Music Charts Found"
          description="Create your first gospel countdown (e.g. CBM Gospel Hot 100) to start managing track rankings."
          action={
            <Button onClick={openNewChartModal} className="mt-4 bg-amber-600 hover:bg-amber-500 text-white">
              Create First Chart
            </Button>
          }
        />
      ) : (
        <>
          {/* Chart Switcher & Active Chart Banner */}
          <div className="space-y-4">
            {/* Chart Selector Pills */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 dark:border-zinc-800">
              <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mr-2">
                Active Charts:
              </span>
              {charts.map((c) => {
                const isSelected = c.slug === selectedSlug;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedSlug(c.slug)}
                    className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-black"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    }`}
                  >
                    <span>{c.title}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                        isSelected
                          ? "bg-slate-700 text-white dark:bg-zinc-200 dark:text-black"
                          : "bg-slate-200 text-slate-600 dark:bg-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {c.entries_count ?? 0} tracks
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Chart Card Banner */}
            {activeChart && (
              <Card className="border-slate-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                          {activeChart.title}
                        </h2>
                        {activeChart.is_active ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 dark:text-emerald-400">
                            Active Public
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Draft / Hidden</Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {activeChart.chart_type}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          Edition: <strong>{activeChart.edition_date}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Ranked Tracks: <strong>{activeChart.entries?.length || 0}</strong>
                        </span>
                        {activeChart.description && (
                          <>
                            <span>•</span>
                            <span className="italic truncate max-w-md">
                              {activeChart.description}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={openEditChartModal}
                        className="gap-1.5 text-xs border-slate-300 dark:border-zinc-700"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit Info
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void loadChartDetail(selectedSlug)}
                        disabled={entriesLoading}
                        className="gap-1.5 text-xs border-slate-300 dark:border-zinc-700"
                      >
                        <RefreshCw
                          className={`h-3.5 w-3.5 ${entriesLoading ? "animate-spin" : ""}`}
                        />
                        Refresh
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteChartSlug(activeChart.slug)}
                        className="text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Search and Filters Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Filter tracks by title, artist, or album…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
              <span>
                Showing <strong>{filteredEntries.length}</strong> of{" "}
                <strong>{activeChart?.entries?.length || 0}</strong> tracks
              </span>
            </div>
          </div>

          {/* Tracks Table */}
          {entriesLoading ? (
            <LoadingState label="Loading countdown entries…" />
          ) : filteredEntries.length === 0 ? (
            <Card className="border-dashed border-slate-300 dark:border-zinc-800">
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <Music2 className="h-10 w-10 text-slate-400 dark:text-zinc-600 mb-3" />
                <h3 className="text-base font-semibold text-slate-800 dark:text-zinc-200">
                  {searchQuery ? "No matching tracks found" : "No tracks on this chart yet"}
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 max-w-sm">
                  {searchQuery
                    ? "Try adjusting your search keywords."
                    : "Add the #1 gospel song and start filling out the countdown."}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={openAddEntryModal}
                    size="sm"
                    className="mt-4 gap-1.5 bg-amber-600 hover:bg-amber-500 text-white"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Track #1
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400">
                    <tr>
                      <th className="py-3 px-3 text-center w-14">Rank</th>
                      <th className="py-3 px-3 w-16 text-center">Trend</th>
                      <th className="py-3 px-3">Song & Artist</th>
                      <th className="py-3 px-3 text-center w-24">Last Week</th>
                      <th className="py-3 px-3 text-center w-20">Peak</th>
                      <th className="py-3 px-3 text-center w-24">Weeks</th>
                      <th className="py-3 px-3 text-center w-28">Streaming</th>
                      <th className="py-3 px-3 text-right w-36">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                    {filteredEntries.map((entry) => {
                      const artworkUrl = entry.cover_image_url || entry.cover_image || entry.coverImage;
                      const movement = entry.movement || {
                        status:
                          entry.previous_rank === null
                            ? "new"
                            : entry.previous_rank > entry.rank
                            ? "up"
                            : entry.previous_rank < entry.rank
                            ? "down"
                            : "same",
                        diff:
                          entry.previous_rank !== null
                            ? Math.abs(entry.previous_rank - entry.rank)
                            : 0,
                        label:
                          entry.previous_rank === null
                            ? "NEW"
                            : entry.previous_rank > entry.rank
                            ? `+${entry.previous_rank - entry.rank}`
                            : entry.previous_rank < entry.rank
                            ? `-${entry.rank - entry.previous_rank}`
                            : "=",
                      };

                      return (
                        <tr
                          key={entry.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-zinc-900/50 transition-colors"
                        >
                          {/* Rank */}
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-flex h-8 w-8 items-center justify-center rounded-md font-bold text-sm ${
                                entry.rank === 1
                                  ? "bg-amber-400/20 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400 ring-1 ring-amber-400/40"
                                  : entry.rank === 2
                                  ? "bg-slate-300/40 text-slate-700 dark:bg-zinc-700 dark:text-zinc-200 ring-1 ring-slate-400/30"
                                  : entry.rank === 3
                                  ? "bg-amber-700/20 text-amber-800 dark:bg-amber-700/15 dark:text-amber-500 ring-1 ring-amber-700/30"
                                  : "text-slate-600 dark:text-zinc-400 font-semibold"
                              }`}
                            >
                              {entry.rank}
                            </span>
                          </td>

                          {/* Movement */}
                          <td className="py-3 px-3 text-center">
                            {movement.status === "up" && (
                              <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 dark:text-emerald-400">
                                <ArrowUp className="h-3 w-3 stroke-[2.5]" />
                                {movement.label}
                              </span>
                            )}
                            {movement.status === "down" && (
                              <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-semibold text-rose-600 bg-rose-500/10 dark:text-rose-400">
                                <ArrowDown className="h-3 w-3 stroke-[2.5]" />
                                {movement.label}
                              </span>
                            )}
                            {movement.status === "new" && (
                              <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-bold text-amber-700 bg-amber-500/15 dark:text-amber-400 dark:bg-amber-400/10">
                                <Sparkles className="h-2.5 w-2.5" />
                                NEW
                              </span>
                            )}
                            {movement.status === "same" && (
                              <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium text-slate-400 bg-slate-100 dark:text-zinc-500 dark:bg-zinc-800">
                                <Minus className="h-3 w-3" />
                              </span>
                            )}
                          </td>

                          {/* Title & Artist & Artwork */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-3">
                              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-800">
                                {artworkUrl ? (
                                  <Image
                                    src={artworkUrl}
                                    alt={entry.title}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                                    <Disc3 className="h-5 w-5" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 dark:text-white truncate text-sm">
                                  {entry.title}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">
                                  {entry.artist}
                                  {entry.featured_artists && (
                                    <span className="text-slate-400 dark:text-zinc-500">
                                      {" "}
                                      ft. {entry.featured_artists}
                                    </span>
                                  )}
                                </p>
                                {entry.album && (
                                  <p className="text-[11px] text-slate-400 dark:text-zinc-500 truncate italic">
                                    {entry.album}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Last Week */}
                          <td className="py-3 px-3 text-center text-xs text-slate-600 dark:text-zinc-400">
                            {entry.previous_rank ? `#${entry.previous_rank}` : "—"}
                          </td>

                          {/* Peak */}
                          <td className="py-3 px-3 text-center text-xs font-semibold text-slate-800 dark:text-zinc-200">
                            #{entry.peak_rank}
                          </td>

                          {/* Weeks on Chart */}
                          <td className="py-3 px-3 text-center text-xs text-slate-600 dark:text-zinc-400">
                            {entry.weeks_on_chart} {entry.weeks_on_chart === 1 ? "wk" : "wks"}
                          </td>

                          {/* Streaming Links */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {entry.audio_url && (
                                <a
                                  href={entry.audio_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Audio Preview"
                                  className="text-amber-600 hover:text-amber-500 dark:text-amber-400"
                                >
                                  <Play className="h-3.5 w-3.5" />
                                </a>
                              )}
                              {entry.youtube_url && (
                                <a
                                  href={entry.youtube_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="YouTube Video"
                                  className="text-rose-500 hover:text-rose-400"
                                >
                                  <Video className="h-3.5 w-3.5" />
                                </a>
                              )}
                              {entry.spotify_url && (
                                <a
                                  href={entry.spotify_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Spotify"
                                  className="text-emerald-500 hover:text-emerald-400"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              )}
                              {entry.apple_music_url && (
                                <a
                                  href={entry.apple_music_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Apple Music"
                                  className="text-pink-500 hover:text-pink-400"
                                >
                                  <Music2 className="h-3.5 w-3.5" />
                                </a>
                              )}
                              {!entry.audio_url &&
                                !entry.youtube_url &&
                                !entry.spotify_url &&
                                !entry.apple_music_url && (
                                  <span className="text-[11px] text-slate-300 dark:text-zinc-700">
                                    —
                                  </span>
                                )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* Reorder Arrows */}
                              <button
                                type="button"
                                onClick={() => void handleShiftRank(entry, "up")}
                                disabled={entry.rank <= 1}
                                title="Move Rank Up"
                                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-20 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleShiftRank(entry, "down")}
                                disabled={entry.rank >= (activeChart?.entries?.length || 1)}
                                title="Move Rank Down"
                                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-20 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>

                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => openEditEntryModal(entry)}
                                title="Edit track"
                                className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() => setDeleteEntryId(entry.id)}
                                title="Remove track"
                                className="rounded p-1 text-rose-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add / Edit Entry Dialog Modal */}
      {entryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-zinc-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {entryForm.id ? "Edit Track Entry" : "Add Track to Chart"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Target chart: {activeChart?.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEntryModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="mt-5 space-y-4">
              {/* Rank & Stats Row */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <Label htmlFor="entry-rank" className="text-xs font-semibold">
                    Rank # <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="entry-rank"
                    type="number"
                    min={1}
                    required
                    value={entryForm.rank}
                    onChange={(e) =>
                      setEntryForm({ ...entryForm, rank: Number(e.target.value) })
                    }
                    className="mt-1 text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="entry-prev-rank" className="text-xs font-semibold">
                    Last Week Rank
                  </Label>
                  <Input
                    id="entry-prev-rank"
                    type="number"
                    min={1}
                    placeholder="None (New)"
                    value={entryForm.previous_rank}
                    onChange={(e) =>
                      setEntryForm({ ...entryForm, previous_rank: e.target.value })
                    }
                    className="mt-1 text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="entry-peak-rank" className="text-xs font-semibold">
                    Peak Rank
                  </Label>
                  <Input
                    id="entry-peak-rank"
                    type="number"
                    min={1}
                    value={entryForm.peak_rank}
                    onChange={(e) =>
                      setEntryForm({ ...entryForm, peak_rank: Number(e.target.value) })
                    }
                    className="mt-1 text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="entry-weeks" className="text-xs font-semibold">
                    Weeks on Chart
                  </Label>
                  <Input
                    id="entry-weeks"
                    type="number"
                    min={1}
                    value={entryForm.weeks_on_chart}
                    onChange={(e) =>
                      setEntryForm({
                        ...entryForm,
                        weeks_on_chart: Number(e.target.value),
                      })
                    }
                    className="mt-1 text-xs"
                  />
                </div>
              </div>

              {/* Title & Artist */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="entry-title" className="text-xs font-semibold">
                    Song Title <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="entry-title"
                    type="text"
                    required
                    placeholder="e.g. Goodness of God"
                    value={entryForm.title}
                    onChange={(e) => setEntryForm({ ...entryForm, title: e.target.value })}
                    className="mt-1 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="entry-artist" className="text-xs font-semibold">
                      Primary Artist <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="entry-artist"
                      type="text"
                      required
                      placeholder="e.g. CeCe Winans"
                      value={entryForm.artist}
                      onChange={(e) =>
                        setEntryForm({ ...entryForm, artist: e.target.value })
                      }
                      className="mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="entry-featured" className="text-xs font-semibold">
                      Featured Artists
                    </Label>
                    <Input
                      id="entry-featured"
                      type="text"
                      placeholder="e.g. Elevation Worship"
                      value={entryForm.featured_artists}
                      onChange={(e) =>
                        setEntryForm({ ...entryForm, featured_artists: e.target.value })
                      }
                      className="mt-1 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="entry-album" className="text-xs font-semibold">
                    Album / Single Name
                  </Label>
                  <Input
                    id="entry-album"
                    type="text"
                    placeholder="e.g. Believe For It (Live)"
                    value={entryForm.album}
                    onChange={(e) => setEntryForm({ ...entryForm, album: e.target.value })}
                    className="mt-1 text-xs"
                  />
                </div>
              </div>

              {/* Artwork */}
              <div>
                <Label className="text-xs font-semibold">Cover Artwork</Label>
                <div className="mt-1.5 flex items-center gap-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900">
                    {entryFilePreview || entryForm.cover_image_url ? (
                      <Image
                        src={entryFilePreview || entryForm.cover_image_url}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <Disc3 className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setEntryFile(file);
                        if (file) {
                          setEntryFilePreview(URL.createObjectURL(file));
                        } else {
                          setEntryFilePreview("");
                        }
                      }}
                      className="w-full text-xs file:mr-2 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold hover:file:bg-slate-200 dark:file:bg-zinc-800 dark:file:text-zinc-200"
                    />
                    <p className="text-[10px] text-slate-400">
                      Square format recommended (1:1), 500x500px or larger.
                    </p>
                  </div>
                </div>
              </div>

              {/* Streaming Links */}
              <div className="space-y-2 border-t border-slate-100 pt-3 dark:border-zinc-800">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Audio & Streaming Links (Optional)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="entry-audio" className="text-[11px] font-semibold">
                      Direct Audio MP3 URL
                    </Label>
                    <Input
                      id="entry-audio"
                      type="url"
                      placeholder="https://…/song.mp3"
                      value={entryForm.audio_url}
                      onChange={(e) =>
                        setEntryForm({ ...entryForm, audio_url: e.target.value })
                      }
                      className="mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="entry-youtube" className="text-[11px] font-semibold">
                      YouTube URL
                    </Label>
                    <Input
                      id="entry-youtube"
                      type="url"
                      placeholder="https://youtube.com/watch?v=…"
                      value={entryForm.youtube_url}
                      onChange={(e) =>
                        setEntryForm({ ...entryForm, youtube_url: e.target.value })
                      }
                      className="mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="entry-spotify" className="text-[11px] font-semibold">
                      Spotify URL
                    </Label>
                    <Input
                      id="entry-spotify"
                      type="url"
                      placeholder="https://open.spotify.com/track/…"
                      value={entryForm.spotify_url}
                      onChange={(e) =>
                        setEntryForm({ ...entryForm, spotify_url: e.target.value })
                      }
                      className="mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="entry-apple" className="text-[11px] font-semibold">
                      Apple Music URL
                    </Label>
                    <Input
                      id="entry-apple"
                      type="url"
                      placeholder="https://music.apple.com/…"
                      value={entryForm.apple_music_url}
                      onChange={(e) =>
                        setEntryForm({ ...entryForm, apple_music_url: e.target.value })
                      }
                      className="mt-1 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEntryModalOpen(false)}
                  disabled={entrySaving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={entrySaving}
                  className="bg-amber-600 hover:bg-amber-500 text-white dark:bg-amber-500 dark:hover:bg-amber-400 font-semibold"
                >
                  {entrySaving ? "Saving…" : entryForm.id ? "Update Track" : "Add to Chart"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create / Edit Chart Modal */}
      {chartModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-zinc-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {isEditingChart ? "Edit Chart Details" : "Create New Music Chart"}
              </h3>
              <button
                type="button"
                onClick={() => setChartModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveChart} className="mt-5 space-y-4">
              <div>
                <Label htmlFor="chart-title" className="text-xs font-semibold">
                  Chart Title <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="chart-title"
                  type="text"
                  required
                  placeholder="e.g. CBM Gospel Hot 100"
                  value={chartForm.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    const slug = !isEditingChart
                      ? title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
                      : chartForm.slug;
                    setChartForm({ ...chartForm, title, slug });
                  }}
                  className="mt-1 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="chart-slug" className="text-xs font-semibold">
                    Slug <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="chart-slug"
                    type="text"
                    required
                    disabled={isEditingChart}
                    placeholder="hot-100"
                    value={chartForm.slug}
                    onChange={(e) => setChartForm({ ...chartForm, slug: e.target.value })}
                    className="mt-1 text-xs font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="chart-edition-date" className="text-xs font-semibold">
                    Edition Date <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="chart-edition-date"
                    type="date"
                    required
                    value={chartForm.edition_date}
                    onChange={(e) =>
                      setChartForm({ ...chartForm, edition_date: e.target.value })
                    }
                    className="mt-1 text-xs"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="chart-desc" className="text-xs font-semibold">
                  Description
                </Label>
                <Input
                  id="chart-desc"
                  type="text"
                  placeholder="Weekly countdown of the most played gospel and worship songs."
                  value={chartForm.description}
                  onChange={(e) => setChartForm({ ...chartForm, description: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-zinc-800">
                <div className="space-y-0.5">
                  <Label htmlFor="chart-active" className="text-xs font-semibold">
                    Public Active Status
                  </Label>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Visible on public website /charts page
                  </p>
                </div>
                <Switch
                  id="chart-active"
                  checked={chartForm.is_active}
                  onCheckedChange={(checked) =>
                    setChartForm({ ...chartForm, is_active: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setChartModalOpen(false)}
                  disabled={chartSaving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={chartSaving}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-semibold"
                >
                  {chartSaving ? "Saving…" : isEditingChart ? "Save Changes" : "Create Chart"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        open={Boolean(deleteEntryId)}
        title="Remove Track from Chart?"
        description="Are you sure you want to remove this track from the countdown? This action cannot be undone."
        confirmLabel="Remove Track"
        loading={deletingEntry}
        onConfirm={() => void handleDeleteEntry()}
        onCancel={() => setDeleteEntryId(null)}
      />

      <ConfirmationDialog
        open={Boolean(deleteChartSlug)}
        title="Delete Entire Chart?"
        description={`Are you sure you want to delete chart "${activeChart?.title}" and all its ranked tracks? This cannot be undone.`}
        confirmLabel="Delete Chart"
        loading={deletingChart}
        onConfirm={() => void handleDeleteChart()}
        onCancel={() => setDeleteChartSlug(null)}
      />
    </div>
  );
}
