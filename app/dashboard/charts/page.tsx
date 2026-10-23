"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  CheckCircle2,
  Crown,
  Disc3,
  ExternalLink,
  Eye,
  EyeOff,
  LayoutGrid,
  List,
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
  Upload,
  Video,
  X,
  ImageIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  is_active?: boolean;
  movement?: ChartMovement;
}

export interface ChartSummary {
  id: string | number;
  title: string;
  slug: string;
  chart_type: string;
  edition_date: string;
  cover_image?: string;
  cover_image_url?: string;
  coverImage?: string;
  is_active: boolean;
  entries_count?: number;
  updated_at?: string;
}

export interface ChartDetail extends ChartSummary {
  description?: string;
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
  chart_type: "hot_100",
  cover_image_url: "",
  is_active: true,
};

const CHART_TYPE_OPTIONS = [
  { value: "hot_100", label: "Top 100 Hot Countdown", target: 100 },
  { value: "top_50", label: "Top 50 Countdown", target: 50 },
  { value: "top_40", label: "Top 40 Countdown", target: 40 },
  { value: "top_20", label: "Top 20 Countdown", target: 20 },
  { value: "top_10", label: "Top 10 Countdown", target: 10 },
  { value: "weekly", label: "Weekly Chart", target: 50 },
  { value: "monthly", label: "Monthly Chart", target: 50 },
  { value: "special", label: "Special Countdown", target: 20 },
  { value: "custom", label: "Custom Chart", target: 25 },
];

function getTargetPositions(chartType: string): number {
  const match = CHART_TYPE_OPTIONS.find((t) => t.value === chartType);
  return match?.target || 100;
}

export default function ChartsDashboardPage() {
  const [charts, setCharts] = useState<ChartSummary[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [activeChart, setActiveChart] = useState<ChartDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant?: "success" | "error" | "info" } | null>(null);

  // Search & Filtering & View Modes
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "top10" | "up" | "new">("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Modals state
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [entryForm, setEntryForm] = useState(initialEntryForm);
  const [entryFile, setEntryFile] = useState<File | null>(null);
  const [entryFilePreview, setEntryFilePreview] = useState("");
  const [entrySaving, setEntrySaving] = useState(false);

  const [chartModalOpen, setChartModalOpen] = useState(false);
  const [chartForm, setChartForm] = useState(initialChartForm);
  const [chartFile, setChartFile] = useState<File | null>(null);
  const [chartFilePreview, setChartFilePreview] = useState("");
  const [isEditingChart, setIsEditingChart] = useState(false);
  const [chartSaving, setChartSaving] = useState(false);
  const [quickHeroUploading, setQuickHeroUploading] = useState(false);

  // Deletion confirmations
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);
  const [deletingEntry, setDeletingEntry] = useState(false);
  const [deleteChartSlug, setDeleteChartSlug] = useState<string | null>(null);
  const [deletingChart, setDeletingChart] = useState(false);

  // Load list of charts
  const loadCharts = useCallback(async (selectSlug?: string) => {
    try {
      setError(null);
      const res = await apiClient.get<{ results: ChartSummary[]; count: number }>("/api/charts");
      const list = Array.isArray(res) ? res : res.results || [];
      setCharts(list);

      if (list.length > 0) {
        const nextSlug = selectSlug || selectedSlug || list[0].slug;
        const exists = list.some((c) => c.slug === nextSlug);
        const resolved = exists ? nextSlug : list[0].slug;
        setSelectedSlug(resolved);
      } else {
        setSelectedSlug("");
        setActiveChart(null);
      }
    } catch (err) {
      if (isApiError(err)) {
        setError(err.message);
      } else {
        setError("Failed to fetch charts.");
      }
    } finally {
      setLoading(false);
    }
  }, [selectedSlug]);

  // Load single chart detail with entries
  const loadChartDetail = useCallback(async (slug: string) => {
    if (!slug) return;
    setEntriesLoading(true);
    try {
      const res = await apiClient.get<ChartDetail>(`/api/charts?slug=${encodeURIComponent(slug)}`);
      setActiveChart(res);
    } catch (err) {
      if (isApiError(err)) {
        setToast({ message: err.message, variant: "error" });
      } else {
        setToast({ message: "Could not load chart entries.", variant: "error" });
      }
    } finally {
      setEntriesLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const t = setTimeout(() => void loadCharts(), 0);
    return () => clearTimeout(t);
  }, [loadCharts]);

  // When selected slug changes, reload detail
  useEffect(() => {
    if (selectedSlug) {
      const t = setTimeout(() => void loadChartDetail(selectedSlug), 0);
      return () => clearTimeout(t);
    }
  }, [selectedSlug, loadChartDetail]);

  // Track Entry Modal Openers
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
          setToast({ message: `Updated #${entryForm.rank} - ${entryForm.title}`, variant: "success" });
        } else {
          await apiClient.post("/api/charts/entries", formData);
          setToast({ message: `Added #${entryForm.rank} "${entryForm.title}"`, variant: "success" });
        }
      } else {
        const payload = {
          chart_slug: selectedSlug,
          rank: entryForm.rank,
          previous_rank: entryForm.previous_rank === "" ? null : Number(entryForm.previous_rank),
          peak_rank: entryForm.peak_rank || entryForm.rank,
          weeks_on_chart: entryForm.weeks_on_chart || 1,
          title: entryForm.title.trim(),
          artist: entryForm.artist.trim(),
          featured_artists: entryForm.featured_artists.trim() || null,
          album: entryForm.album.trim() || null,
          audio_url: entryForm.audio_url.trim() || null,
          youtube_url: entryForm.youtube_url.trim() || null,
          spotify_url: entryForm.spotify_url.trim() || null,
          apple_music_url: entryForm.apple_music_url.trim() || null,
        };

        if (entryForm.id) {
          await apiClient.put(`/api/charts/entries?id=${encodeURIComponent(entryForm.id)}`, payload);
          setToast({ message: `Updated #${entryForm.rank} - ${entryForm.title}`, variant: "success" });
        } else {
          await apiClient.post("/api/charts/entries", payload);
          setToast({ message: `Added #${entryForm.rank} "${entryForm.title}"`, variant: "success" });
        }
      }

      setEntryModalOpen(false);
      void loadChartDetail(selectedSlug);
      void loadCharts(selectedSlug);
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

    const adjacent = activeChart.entries.find((e) => e.rank === targetRank);

    try {
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
      void loadCharts(selectedSlug);
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
    setChartFile(null);
    setChartFilePreview("");
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
      chart_type: activeChart.chart_type || "hot_100",
      cover_image_url: activeChart.cover_image_url || activeChart.cover_image || activeChart.coverImage || "",
      is_active: activeChart.is_active,
    });
    setChartFile(null);
    setChartFilePreview("");
    setChartModalOpen(true);
  };

  // Quick 1-click Hero Upgrade from chart header
  const handleQuickHeroUpgrade = async (file: File) => {
    if (!activeChart) return;
    setQuickHeroUploading(true);
    try {
      const formData = new FormData();
      formData.append("slug", activeChart.slug);
      formData.append("cover_image", file);
      await apiClient.put("/api/charts", formData);
      setToast({ message: `Updated hero image for "${activeChart.title}"`, variant: "success" });
      void loadCharts(activeChart.slug);
      void loadChartDetail(activeChart.slug);
    } catch (err) {
      if (isApiError(err)) {
        setToast({ message: err.message, variant: "error" });
      } else {
        setToast({ message: "Failed to upgrade chart hero image.", variant: "error" });
      }
    } finally {
      setQuickHeroUploading(false);
    }
  };

  const handleSaveChart = async (e: React.FormEvent) => {
    e.preventDefault();
    setChartSaving(true);
    try {
      const targetSlug = isEditingChart
        ? chartForm.slug
        : chartForm.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");

      if (chartFile) {
        const formData = new FormData();
        formData.append("slug", targetSlug);
        formData.append("title", chartForm.title.trim());
        formData.append("description", chartForm.description.trim());
        formData.append("edition_date", chartForm.edition_date);
        formData.append("chart_type", chartForm.chart_type);
        formData.append("is_active", String(chartForm.is_active));
        formData.append("cover_image", chartFile);

        if (isEditingChart) {
          await apiClient.put("/api/charts", formData);
          setToast({ message: `Updated chart "${chartForm.title}"`, variant: "success" });
        } else {
          await apiClient.post("/api/charts", formData);
          setToast({ message: `Created new chart "${chartForm.title}"`, variant: "success" });
        }
      } else {
        const payload: Record<string, unknown> = {
          slug: targetSlug,
          title: chartForm.title.trim(),
          description: chartForm.description.trim(),
          edition_date: chartForm.edition_date,
          chart_type: chartForm.chart_type,
          is_active: chartForm.is_active,
        };
        if (chartForm.cover_image_url.trim()) {
          payload.cover_image = chartForm.cover_image_url.trim();
        }

        if (isEditingChart) {
          await apiClient.put("/api/charts", payload);
          setToast({ message: `Updated chart "${chartForm.title}"`, variant: "success" });
        } else {
          await apiClient.post("/api/charts", payload);
          setToast({ message: `Created new chart "${chartForm.title}"`, variant: "success" });
        }
      }

      setChartModalOpen(false);
      void loadCharts(targetSlug);
      void loadChartDetail(targetSlug);
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
      setToast({ message: "Chart deleted successfully.", variant: "success" });
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

  // Derived filtered & sorted entries
  const allEntries = activeChart?.entries || [];
  const targetPositions = activeChart ? getTargetPositions(activeChart.chart_type) : 100;
  const numberOneTrack = allEntries.find((e) => e.rank === 1);
  const chartTypeLabel =
    CHART_TYPE_OPTIONS.find((t) => t.value === activeChart?.chart_type)?.label ||
    activeChart?.chart_type ||
    "Hot Countdown";

  const filteredEntries = allEntries
    .filter((entry) => {
      // Tab filters
      if (filterTab === "top10" && entry.rank > 10) return false;
      if (filterTab === "up") {
        const isUp =
          entry.movement?.status === "up" ||
          (entry.previous_rank !== null && entry.previous_rank > entry.rank);
        if (!isUp) return false;
      }
      if (filterTab === "new") {
        const isNew =
          entry.movement?.status === "new" ||
          entry.previous_rank === null ||
          entry.previous_rank === undefined;
        if (!isNew) return false;
      }

      // Search keyword filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        entry.title.toLowerCase().includes(q) ||
        entry.artist.toLowerCase().includes(q) ||
        (entry.featured_artists && entry.featured_artists.toLowerCase().includes(q)) ||
        (entry.album && entry.album.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => a.rank - b.rank);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Feedback */}
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20 dark:bg-amber-400/10 dark:text-amber-400">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Music Charts
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Official gospel countdowns, weekly positions, and streaming catalog
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={openNewChartModal}
            size="sm"
            className="gap-1.5 border-slate-300 dark:border-zinc-700 font-medium shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5" />
            New Chart
          </Button>
          <Button
            onClick={openAddEntryModal}
            disabled={!activeChart}
            size="sm"
            className="gap-1.5 bg-amber-600 hover:bg-amber-500 text-white dark:bg-amber-500 dark:hover:bg-amber-400 font-semibold shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Track #{allEntries.length + 1}
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
          {/* Chart Selection & Control Deck */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-950/80 transition-all">
            {/* Mobile View (< md): Compact select with quick status */}
            <div className="flex flex-col gap-3 md:hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Select Chart
                </span>
                {activeChart && (
                  <Badge
                    variant={activeChart.is_active ? "default" : "secondary"}
                    className={
                      activeChart.is_active
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[11px]"
                        : "text-[11px]"
                    }
                  >
                    {activeChart.is_active ? "Public Active" : "Draft"}
                  </Badge>
                )}
              </div>
              <select
                value={selectedSlug}
                onChange={(e) => setSelectedSlug(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 shadow-2xs focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                {charts.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.title} ({c.entries_count ?? 0} tracks) • {c.is_active ? "Public" : "Draft"}
                  </option>
                ))}
              </select>

              {/* Mobile actions */}
              {activeChart && (
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-zinc-800/80">
                  <Badge variant="outline" className="text-[11px]">
                    {chartTypeLabel}
                  </Badge>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openEditChartModal}
                      className="h-7 px-2.5 text-xs"
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void loadChartDetail(selectedSlug)}
                      disabled={entriesLoading}
                      className="h-7 px-2.5 text-xs"
                    >
                      <RefreshCw className={`h-3 w-3 ${entriesLoading ? "animate-spin" : ""}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteChartSlug(activeChart.slug)}
                      className="h-7 px-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Tablet & Desktop View (md & lg screens): Interactive Segmented Bar */}
            <div className="hidden md:flex md:flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Left: Interactive Segmented Chart Tabs */}
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                <div className="flex items-center gap-2 mr-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400 ring-1 ring-amber-500/20">
                    <Trophy className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Charts:
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {charts.map((c) => {
                    const isSelected = c.slug === selectedSlug;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedSlug(c.slug)}
                        className={`group relative flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 border ${
                          isSelected
                            ? "bg-slate-900 text-white border-slate-900 shadow-sm dark:bg-white dark:text-zinc-950 dark:border-white ring-2 ring-slate-900/10 dark:ring-white/20"
                            : "bg-slate-50/80 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300 dark:bg-zinc-900/70 dark:text-zinc-300 dark:border-zinc-800 dark:hover:bg-zinc-850 dark:hover:border-zinc-700"
                        }`}
                      >
                        {/* Status indicator dot */}
                        <span
                          className={`h-2 w-2 rounded-full shrink-0 transition-opacity ${
                            c.is_active
                              ? isSelected
                                ? "bg-emerald-400 dark:bg-emerald-600 ring-2 ring-emerald-400/40"
                                : "bg-emerald-500 dark:bg-emerald-400"
                              : isSelected
                              ? "bg-slate-400 dark:bg-zinc-400"
                              : "bg-slate-300 dark:bg-zinc-600"
                          }`}
                          title={c.is_active ? "Public Active" : "Draft"}
                        />

                        {/* Title */}
                        <span className="truncate max-w-[180px] lg:max-w-[220px]">
                          {c.title}
                        </span>

                        {/* Track count pill */}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isSelected
                              ? "bg-slate-800 text-slate-200 dark:bg-zinc-200 dark:text-zinc-900"
                              : "bg-slate-200/80 text-slate-600 group-hover:bg-slate-300/80 dark:bg-zinc-800 dark:text-zinc-400 dark:group-hover:bg-zinc-750"
                          }`}
                        >
                          {c.entries_count ?? 0}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* If there are more than 4 charts, also show a compact select jump menu */}
                {charts.length > 4 && (
                  <div className="relative inline-block ml-1">
                    <select
                      value={selectedSlug}
                      onChange={(e) => setSelectedSlug(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 shadow-2xs hover:bg-slate-50 focus:border-amber-500 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                      title="Jump to another chart"
                    >
                      <option disabled value="">
                        Quick Jump…
                      </option>
                      {charts.map((c) => (
                        <option key={c.id} value={c.slug}>
                          {c.title} ({c.entries_count ?? 0} tracks)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Right: Chart Metadata & Actions */}
              {activeChart && (
                <div className="flex items-center gap-2 shrink-0 border-t border-slate-100 pt-3 lg:border-t-0 lg:pt-0 lg:pl-3 lg:border-l lg:border-slate-200 dark:border-zinc-800">
                  <div className="flex items-center gap-1.5 mr-1">
                    <Badge
                      variant="outline"
                      className="border-slate-200/90 bg-slate-50 text-[11px] font-medium text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                    >
                      {chartTypeLabel}
                    </Badge>

                    {activeChart.is_active ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400 gap-1 text-[11px]">
                        <Eye className="h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1 text-[11px] text-slate-500">
                        <EyeOff className="h-3 w-3" />
                        Draft
                      </Badge>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openEditChartModal}
                    className="h-8 gap-1.5 text-xs border-slate-300 hover:bg-slate-50 dark:border-zinc-700 dark:hover:bg-zinc-800 font-semibold"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void loadChartDetail(selectedSlug)}
                    disabled={entriesLoading}
                    className="h-8 gap-1.5 text-xs border-slate-300 hover:bg-slate-50 dark:border-zinc-700 dark:hover:bg-zinc-800 font-semibold"
                    title="Reload track data"
                  >
                    <RefreshCw className={`h-3 w-3 ${entriesLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteChartSlug(activeChart.slug)}
                    className="h-8 px-2.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title="Delete entire chart"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Active Chart Dedicated Hero Banner Card */}
          {activeChart && (
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-900 text-white shadow-md dark:border-zinc-800">
              {/* Background cover image if present */}
              {(activeChart.cover_image_url || activeChart.cover_image || activeChart.coverImage) ? (
                <>
                  <Image
                    src={activeChart.cover_image_url || activeChart.cover_image || activeChart.coverImage || ""}
                    alt={`${activeChart.title} Hero Banner`}
                    fill
                    className="object-cover object-center opacity-35 transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30" />
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-zinc-900 to-amber-950/40" />
              )}

              <div className="relative z-10 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 gap-1 text-[11px] font-semibold">
                      <Trophy className="h-3 w-3" />
                      {chartTypeLabel}
                    </Badge>
                    <Badge variant="outline" className="border-white/20 text-white/80 gap-1 text-[11px]">
                      <Calendar className="h-3 w-3 text-amber-400" />
                      {activeChart.edition_date || "Current Edition"}
                    </Badge>
                    {activeChart.is_active ? (
                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 gap-1 text-[11px]">
                        <Eye className="h-3 w-3" />
                        Live on Public Site
                      </Badge>
                    ) : (
                      <Badge className="bg-zinc-700/60 text-zinc-300 border-zinc-600 gap-1 text-[11px]">
                        <EyeOff className="h-3 w-3" />
                        Draft
                      </Badge>
                    )}
                  </div>

                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
                    {activeChart.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 line-clamp-2">
                    {activeChart.description || "Official weekly countdown and gospel music ranking."}
                  </p>
                </div>

                {/* Hero Image Actions / Quick Upgrade */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <label className="relative inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-sm transition-all hover:bg-amber-400 cursor-pointer">
                    <Upload className="h-3.5 w-3.5" />
                    <span>{quickHeroUploading ? "Upgrading..." : "Upgrade Hero Image"}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      disabled={quickHeroUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleQuickHeroUpgrade(file);
                      }}
                      className="sr-only"
                    />
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openEditChartModal}
                    className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white text-xs font-semibold backdrop-blur-xs"
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    Edit Chart
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Metrics Bar (Executive summary of the active chart) */}
          {activeChart && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Card 1: Edition & Type */}
              <Card className="border-slate-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900/50 shadow-2xs">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                      Current Edition
                    </p>
                    <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
                      <Calendar className="h-4 w-4 text-amber-500 shrink-0" />
                      <span>{activeChart.edition_date || "Not set"}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate max-w-[200px]">
                      {activeChart.description || "Official weekly ranking"}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
                    <Trophy className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Fill Progress / Total Tracks */}
              <Card className="border-slate-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900/50 shadow-2xs">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-1 flex-1 pr-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                      Countdown Positions
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-slate-900 dark:text-white">
                        {allEntries.length}
                      </span>
                      <span className="text-xs font-medium text-slate-400 dark:text-zinc-500">
                        / {targetPositions} target slots
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-slate-100 rounded-full h-1.5 dark:bg-zinc-800 overflow-hidden mt-1.5">
                      <div
                        className="bg-amber-500 h-1.5 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, Math.round((allEntries.length / targetPositions) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>

              {/* Card 3: Reigning #1 Track */}
              <Card className="border-slate-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900/50 shadow-2xs">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-1 min-w-0 flex-1 pr-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Crown className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                      Reigning #1 Song
                    </p>
                    {numberOneTrack ? (
                      <>
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {numberOneTrack.title}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                          {numberOneTrack.artist} • {numberOneTrack.weeks_on_chart} wks
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs font-medium text-slate-400 italic">No #1 ranked track yet</p>
                        <button
                          type="button"
                          onClick={openAddEntryModal}
                          className="text-[11px] font-semibold text-amber-600 hover:underline dark:text-amber-400"
                        >
                          + Set #1 track now
                        </button>
                      </>
                    )}
                  </div>
                  {numberOneTrack && (
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-amber-400/40 shadow-xs">
                      {numberOneTrack.cover_image_url || numberOneTrack.cover_image ? (
                        <Image
                          src={numberOneTrack.cover_image_url || numberOneTrack.cover_image || ""}
                          alt={numberOneTrack.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-amber-50 text-amber-500 dark:bg-amber-950/40">
                          <Crown className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Search, Filter Tabs & Layout Controls */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
            {/* Left: Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilterTab("all")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  filterTab === "all"
                    ? "bg-slate-900 text-white shadow-2xs dark:bg-white dark:text-black"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                All Tracks ({allEntries.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab("top10")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  filterTab === "top10"
                    ? "bg-slate-900 text-white shadow-2xs dark:bg-white dark:text-black"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                Top 10 Only
              </button>
              <button
                type="button"
                onClick={() => setFilterTab("up")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all inline-flex items-center gap-1 ${
                  filterTab === "up"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                <ArrowUp className="h-3 w-3 stroke-[2.5]" />
                Moving Up
              </button>
              <button
                type="button"
                onClick={() => setFilterTab("new")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all inline-flex items-center gap-1 ${
                  filterTab === "new"
                    ? "bg-amber-600 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                <Sparkles className="h-3 w-3" />
                New Entries
              </button>
            </div>

            {/* Right: Search box & View Mode Switcher */}
            <div className="flex items-center gap-2.5">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Filter song, artist, album…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8.5 h-8.5 text-xs bg-white dark:bg-zinc-900"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* View Toggle */}
              <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-zinc-800 dark:bg-zinc-900">
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`rounded-md p-1.5 text-xs transition-colors ${
                    viewMode === "table"
                      ? "bg-white text-slate-900 shadow-2xs dark:bg-zinc-800 dark:text-white"
                      : "text-slate-500 hover:text-slate-900 dark:text-zinc-400"
                  }`}
                  title="Table View"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`rounded-md p-1.5 text-xs transition-colors ${
                    viewMode === "grid"
                      ? "bg-white text-slate-900 shadow-2xs dark:bg-zinc-800 dark:text-white"
                      : "text-slate-500 hover:text-slate-900 dark:text-zinc-400"
                  }`}
                  title="Cards Grid View"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Results Summary & Track Content */}
          {entriesLoading ? (
            <LoadingState label="Loading countdown entries…" />
          ) : filteredEntries.length === 0 ? (
            <Card className="border-dashed border-slate-300 dark:border-zinc-800">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 mb-3">
                  <Music2 className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold text-slate-800 dark:text-zinc-200">
                  {searchQuery || filterTab !== "all"
                    ? "No tracks match your current filter"
                    : "No tracks added to this countdown yet"}
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 max-w-sm">
                  {searchQuery || filterTab !== "all"
                    ? "Clear your search or select 'All Tracks' to view all entries."
                    : "Start curating this countdown by adding the #1 gospel song."}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  {(searchQuery || filterTab !== "all") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchQuery("");
                        setFilterTab("all");
                      }}
                      className="text-xs"
                    >
                      Reset Filters
                    </Button>
                  )}
                  <Button
                    onClick={openAddEntryModal}
                    size="sm"
                    className="gap-1.5 bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Track #{allEntries.length + 1}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : viewMode === "grid" ? (
            /* Cards / Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
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
                  <Card
                    key={entry.id}
                    className="relative overflow-hidden border-slate-200/90 bg-white transition-all hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <CardContent className="p-4 flex gap-3.5">
                      {/* Left: Artwork + Rank Over Badge */}
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900 shadow-2xs">
                        {artworkUrl ? (
                          <Image src={artworkUrl} alt={entry.title} fill className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-400">
                            <Disc3 className="h-8 w-8" />
                          </div>
                        )}
                        <span
                          className={`absolute top-1 left-1 flex h-6 w-6 items-center justify-center rounded-md font-black text-xs shadow-xs ${
                            entry.rank === 1
                              ? "bg-amber-400 text-amber-950"
                              : entry.rank === 2
                              ? "bg-slate-200 text-slate-800"
                              : entry.rank === 3
                              ? "bg-amber-700 text-white"
                              : "bg-slate-900/80 text-white backdrop-blur-xs"
                          }`}
                        >
                          #{entry.rank}
                        </span>
                      </div>

                      {/* Right: Info & Actions */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            {/* Movement pill */}
                            {movement.status === "up" && (
                              <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 dark:text-emerald-400">
                                <ArrowUp className="h-2.5 w-2.5 stroke-[2.5]" />
                                {movement.label}
                              </span>
                            )}
                            {movement.status === "down" && (
                              <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold text-rose-600 bg-rose-500/10 dark:text-rose-400">
                                <ArrowDown className="h-2.5 w-2.5 stroke-[2.5]" />
                                {movement.label}
                              </span>
                            )}
                            {movement.status === "new" && (
                              <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold text-amber-600 bg-amber-500/15 dark:text-amber-400">
                                <Sparkles className="h-2.5 w-2.5" />
                                NEW
                              </span>
                            )}
                            {movement.status === "same" && (
                              <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-zinc-800">
                                <Minus className="h-2.5 w-2.5" />
                              </span>
                            )}

                            {/* Rank Nudgers */}
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => void handleShiftRank(entry, "up")}
                                disabled={entry.rank <= 1}
                                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-20 dark:hover:bg-zinc-800"
                                title="Move Rank Up"
                              >
                                <ArrowUp className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleShiftRank(entry, "down")}
                                disabled={entry.rank >= allEntries.length}
                                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-20 dark:hover:bg-zinc-800"
                                title="Move Rank Down"
                              >
                                <ArrowDown className="h-3 w-3" />
                              </button>
                            </div>
                          </div>

                          <p className="font-bold text-sm text-slate-900 dark:text-white truncate mt-1">
                            {entry.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">
                            {entry.artist}
                            {entry.featured_artists && ` ft. ${entry.featured_artists}`}
                          </p>
                        </div>

                        {/* Bottom stats & action footer */}
                        <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-2 dark:border-zinc-800/80">
                          <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                            Peak <strong>#{entry.peak_rank}</strong> • Last{" "}
                            <strong>{entry.previous_rank ? `#${entry.previous_rank}` : "—"}</strong> •{" "}
                            <strong>{entry.weeks_on_chart}w</strong>
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditEntryModal(entry)}
                              className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-zinc-800 dark:text-zinc-400"
                              title="Edit track"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteEntryId(entry.id)}
                              className="rounded p-1 text-rose-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                              title="Delete track"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            /* Redesigned Table View */
            <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs dark:border-zinc-800/90 dark:bg-zinc-950">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-200 bg-slate-50/75 dark:border-zinc-800 dark:bg-zinc-900/60 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-zinc-400">
                    <TableHead className="w-16 text-center py-3">Rank</TableHead>
                    <TableHead className="w-16 text-center py-3">Trend</TableHead>
                    <TableHead className="py-3">Track & Artist</TableHead>
                    <TableHead className="w-40 text-center py-3">Performance</TableHead>
                    <TableHead className="w-28 text-center py-3">Media</TableHead>
                    <TableHead className="w-36 text-right py-3 pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
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
                      <TableRow
                        key={entry.id}
                        className="transition-colors hover:bg-slate-50/70 dark:hover:bg-zinc-900/40 border-b border-slate-100 dark:border-zinc-800/60"
                      >
                        {/* Rank */}
                        <TableCell className="text-center py-3.5 px-3">
                          <span
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg font-black text-sm transition-all ${
                              entry.rank === 1
                                ? "bg-amber-400 text-amber-950 ring-2 ring-amber-400/50 shadow-xs"
                                : entry.rank === 2
                                ? "bg-slate-200 text-slate-800 ring-1 ring-slate-300 dark:bg-zinc-800 dark:text-zinc-200"
                                : entry.rank === 3
                                ? "bg-amber-700/20 text-amber-900 ring-1 ring-amber-700/30 dark:bg-amber-950/60 dark:text-amber-400"
                                : "text-slate-700 dark:text-zinc-300 font-bold bg-slate-100/70 dark:bg-zinc-900"
                            }`}
                          >
                            {entry.rank}
                          </span>
                        </TableCell>

                        {/* Trend Movement */}
                        <TableCell className="text-center py-3.5 px-2">
                          {movement.status === "up" && (
                            <span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/40 dark:text-emerald-400">
                              <ArrowUp className="h-3 w-3 stroke-[2.5]" />
                              {movement.label}
                            </span>
                          )}
                          {movement.status === "down" && (
                            <span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800/40 dark:text-rose-400">
                              <ArrowDown className="h-3 w-3 stroke-[2.5]" />
                              {movement.label}
                            </span>
                          )}
                          {movement.status === "new" && (
                            <span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-black tracking-wider text-amber-700 bg-amber-50 border border-amber-200 dark:bg-amber-950/50 dark:border-amber-800/40 dark:text-amber-400">
                              <Sparkles className="h-2.5 w-2.5" />
                              NEW
                            </span>
                          )}
                          {movement.status === "same" && (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium text-slate-400 bg-slate-100 dark:bg-zinc-800">
                              <Minus className="h-3 w-3" />
                            </span>
                          )}
                        </TableCell>

                        {/* Song & Artist */}
                        <TableCell className="py-3.5 px-3">
                          <div className="flex items-center gap-3">
                            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200/90 dark:border-zinc-800 shadow-2xs">
                              {artworkUrl ? (
                                <Image src={artworkUrl} alt={entry.title} fill className="object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-slate-400">
                                  <Disc3 className="h-5 w-5" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 dark:text-white truncate text-sm">
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
                        </TableCell>

                        {/* Consolidated Performance Stats */}
                        <TableCell className="py-3.5 px-3 text-center">
                          <div className="inline-flex items-center gap-3 rounded-lg border border-slate-200/80 bg-slate-50/70 px-2.5 py-1 text-xs dark:border-zinc-800 dark:bg-zinc-900/60">
                            <div className="text-center" title="Peak Rank">
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Peak</span>
                              <span className="font-bold text-slate-800 dark:text-zinc-200">#{entry.peak_rank}</span>
                            </div>
                            <div className="h-5 w-px bg-slate-200 dark:bg-zinc-800" />
                            <div className="text-center" title="Last Week Rank">
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Last</span>
                              <span className="text-slate-600 dark:text-zinc-400 font-medium">
                                {entry.previous_rank ? `#${entry.previous_rank}` : "—"}
                              </span>
                            </div>
                            <div className="h-5 w-px bg-slate-200 dark:bg-zinc-800" />
                            <div className="text-center" title="Weeks on Chart">
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Wks</span>
                              <span className="font-bold text-slate-800 dark:text-zinc-200">{entry.weeks_on_chart}</span>
                            </div>
                          </div>
                        </TableCell>

                        {/* Media Links */}
                        <TableCell className="py-3.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {entry.audio_url && (
                              <a
                                href={entry.audio_url}
                                target="_blank"
                                rel="noreferrer"
                                title="Listen to MP3 preview"
                                className="rounded-md p-1.5 text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/40"
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
                                className="rounded-md p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                              >
                                <Video className="h-3.5 w-3.5" />
                              </a>
                            )}
                            {entry.spotify_url && (
                              <a
                                href={entry.spotify_url}
                                target="_blank"
                                rel="noreferrer"
                                title="Spotify Track"
                                className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
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
                                className="rounded-md p-1.5 text-pink-600 hover:bg-pink-50 hover:text-pink-700 dark:text-pink-400 dark:hover:bg-pink-950/40"
                              >
                                <Music2 className="h-3.5 w-3.5" />
                              </a>
                            )}
                            {!entry.audio_url &&
                              !entry.youtube_url &&
                              !entry.spotify_url &&
                              !entry.apple_music_url && (
                                <span className="text-xs text-slate-300 dark:text-zinc-700">—</span>
                              )}
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="py-3.5 px-3 pr-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Reorder Arrows */}
                            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50/80 p-0.5 dark:border-zinc-800 dark:bg-zinc-900 mr-1">
                              <button
                                type="button"
                                onClick={() => void handleShiftRank(entry, "up")}
                                disabled={entry.rank <= 1}
                                title="Move Rank Up"
                                className="rounded p-1 text-slate-400 hover:bg-white hover:text-slate-800 disabled:opacity-20 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleShiftRank(entry, "down")}
                                disabled={entry.rank >= allEntries.length}
                                title="Move Rank Down"
                                className="rounded p-1 text-slate-400 hover:bg-white hover:text-slate-800 disabled:opacity-20 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => openEditEntryModal(entry)}
                              title="Edit track"
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => setDeleteEntryId(entry.id)}
                              title="Remove track"
                              className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      {/* Add / Edit Track Modal */}
      {entryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-zinc-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {entryForm.id ? "Edit Track Entry" : "Add Track to Countdown"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Target chart: <strong>{activeChart?.title}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEntryModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="mt-5 space-y-5">
              {/* Section 1: Track Details */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
                  <Music2 className="h-3.5 w-3.5 text-amber-500" />
                  Song Information
                </p>

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
                      onChange={(e) => setEntryForm({ ...entryForm, artist: e.target.value })}
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
                      onChange={(e) => setEntryForm({ ...entryForm, featured_artists: e.target.value })}
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

              {/* Section 2: Ranking & Performance */}
              <div className="space-y-3 border-t border-slate-100 pt-4 dark:border-zinc-800">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5 text-amber-500" />
                  Ranking & Movement
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <Label htmlFor="entry-rank" className="text-xs font-semibold">
                      Current Rank <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="entry-rank"
                      type="number"
                      min={1}
                      required
                      value={entryForm.rank}
                      onChange={(e) => setEntryForm({ ...entryForm, rank: Number(e.target.value) })}
                      className="mt-1 text-xs font-bold"
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
                      placeholder="Empty (New)"
                      value={entryForm.previous_rank}
                      onChange={(e) => setEntryForm({ ...entryForm, previous_rank: e.target.value })}
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
                      onChange={(e) => setEntryForm({ ...entryForm, peak_rank: Number(e.target.value) })}
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
                      onChange={(e) => setEntryForm({ ...entryForm, weeks_on_chart: Number(e.target.value) })}
                      className="mt-1 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Artwork & Streaming Media */}
              <div className="space-y-3 border-t border-slate-100 pt-4 dark:border-zinc-800">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
                  <Disc3 className="h-3.5 w-3.5 text-amber-500" />
                  Cover Artwork & Streaming Links
                </p>

                {/* Artwork Uploader */}
                <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 shadow-2xs">
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
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs font-semibold">Select Artwork Image</Label>
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
                      className="w-full text-xs file:mr-2 file:rounded-md file:border-0 file:bg-slate-200 file:px-2.5 file:py-1 file:text-xs file:font-semibold hover:file:bg-slate-300 dark:file:bg-zinc-800 dark:file:text-zinc-200"
                    />
                  </div>
                </div>

                {/* Streaming Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <Label htmlFor="entry-spotify" className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      Spotify Track URL
                    </Label>
                    <Input
                      id="entry-spotify"
                      type="url"
                      placeholder="https://open.spotify.com/track/…"
                      value={entryForm.spotify_url}
                      onChange={(e) => setEntryForm({ ...entryForm, spotify_url: e.target.value })}
                      className="mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="entry-apple" className="text-[11px] font-semibold text-pink-600 dark:text-pink-400">
                      Apple Music URL
                    </Label>
                    <Input
                      id="entry-apple"
                      type="url"
                      placeholder="https://music.apple.com/…"
                      value={entryForm.apple_music_url}
                      onChange={(e) => setEntryForm({ ...entryForm, apple_music_url: e.target.value })}
                      className="mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="entry-youtube" className="text-[11px] font-semibold text-rose-500">
                      YouTube Video URL
                    </Label>
                    <Input
                      id="entry-youtube"
                      type="url"
                      placeholder="https://youtube.com/watch?v=…"
                      value={entryForm.youtube_url}
                      onChange={(e) => setEntryForm({ ...entryForm, youtube_url: e.target.value })}
                      className="mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="entry-audio" className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      Direct Audio MP3 URL
                    </Label>
                    <Input
                      id="entry-audio"
                      type="url"
                      placeholder="https://…/song.mp3"
                      value={entryForm.audio_url}
                      onChange={(e) => setEntryForm({ ...entryForm, audio_url: e.target.value })}
                      className="mt-1 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 pt-4 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEntryModalOpen(false)}
                  disabled={entrySaving}
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={entrySaving}
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-500 text-white dark:bg-amber-500 dark:hover:bg-amber-400 font-semibold"
                >
                  {entrySaving ? "Saving…" : entryForm.id ? "Save Changes" : `Add Track #${entryForm.rank}`}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create / Edit Chart Modal */}
      {chartModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-zinc-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {isEditingChart ? "Edit Chart Details" : "Create New Music Chart"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Configure countdown type, publication date, and visibility
                </p>
              </div>
              <button
                type="button"
                onClick={() => setChartModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <Label htmlFor="chart-type" className="text-xs font-semibold">
                    Chart Type <span className="text-rose-500">*</span>
                  </Label>
                  <select
                    id="chart-type"
                    value={chartForm.chart_type}
                    onChange={(e) => setChartForm({ ...chartForm, chart_type: e.target.value })}
                    className="mt-1 flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-xs shadow-2xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                  >
                    {CHART_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-white dark:bg-zinc-900">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="chart-edition-date" className="text-xs font-semibold">
                  Edition Date / Period <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="chart-edition-date"
                  type="date"
                  required
                  value={chartForm.edition_date}
                  onChange={(e) => setChartForm({ ...chartForm, edition_date: e.target.value })}
                  className="mt-1 text-xs"
                />
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

              {/* Dedicated Chart Hero Image */}
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/50">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5 text-amber-500" />
                    Dedicated Chart Hero Image
                  </Label>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                    16:9 or Banner format recommended
                  </span>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 shadow-2xs">
                    {chartFilePreview || chartForm.cover_image_url ? (
                      <Image
                        src={chartFilePreview || chartForm.cover_image_url}
                        alt="Hero Preview"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center text-slate-400 dark:text-zinc-500">
                        <ImageIcon className="h-5 w-5" />
                        <span className="text-[9px] mt-0.5">No Hero</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setChartFile(file);
                        if (file) {
                          setChartFilePreview(URL.createObjectURL(file));
                        } else {
                          setChartFilePreview("");
                        }
                      }}
                      className="w-full text-xs file:mr-2 file:rounded-md file:border-0 file:bg-slate-200 file:px-2.5 file:py-1 file:text-xs file:font-semibold hover:file:bg-slate-300 dark:file:bg-zinc-800 dark:file:text-zinc-200"
                    />
                    <Input
                      type="url"
                      placeholder="Or enter image URL (https://…)"
                      value={chartForm.cover_image_url}
                      onChange={(e) => {
                        setChartForm({ ...chartForm, cover_image_url: e.target.value });
                        if (e.target.value && !chartFile) {
                          setChartFilePreview("");
                        }
                      }}
                      className="h-7 text-[11px]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/50">
                <div className="space-y-0.5">
                  <Label htmlFor="chart-active" className="text-xs font-semibold">
                    Public Active Status
                  </Label>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Visible immediately on public website /charts page
                  </p>
                </div>
                <Switch
                  id="chart-active"
                  checked={chartForm.is_active}
                  onCheckedChange={(checked) => setChartForm({ ...chartForm, is_active: checked })}
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 pt-4 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setChartModalOpen(false)}
                  disabled={chartSaving}
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={chartSaving}
                  size="sm"
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
        title="Remove Track from Countdown?"
        description="Are you sure you want to remove this track? Other rankings will remain in their positions."
        confirmLabel="Remove Track"
        loading={deletingEntry}
        onConfirm={() => void handleDeleteEntry()}
        onCancel={() => setDeleteEntryId(null)}
      />

      <ConfirmationDialog
        open={Boolean(deleteChartSlug)}
        title="Delete Entire Music Chart?"
        description="This will permanently delete this chart and all ranked track entries within it. This action cannot be undone."
        confirmLabel="Delete Chart"
        loading={deletingChart}
        onConfirm={() => void handleDeleteChart()}
        onCancel={() => setDeleteChartSlug(null)}
      />
    </div>
  );
}
