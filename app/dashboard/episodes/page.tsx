"use client";

import Image from "next/image";
import {
  Calendar,
  Clapperboard,
  Edit2,
  Film,
  LayoutGrid,
  List,
  Play,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { SiteImageFields } from "../../components/site-image-fields";
import Toast from "../../components/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmationDialog } from "../../components/ui/confirmation-dialog";
import { Pagination } from "../../components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/surfaces";
import { apiClient, isApiError } from "../../lib/api-client";
import { appendEditorialFields, episodeListQuery, episodePayload } from "../../lib/editorial-payloads";
import {
  normalizeYouTubeEmbedUrl,
  YOUTUBE_EMBED_ERROR,
  YOUTUBE_EMBED_HELP,
} from "../../lib/youtube-embed";
import type { PaginatedResponse } from "../../types/api";
import type { EpisodeEditorial as Episode, ProgramOption } from "../../types/editorial";

const empty: PaginatedResponse<Episode> = {
  count: 0,
  next: null,
  previous: null,
  results: [],
};

const initial = {
  program_id: 0,
  title: "",
  description: "",
  cover_image: "",
  youtube_link: "",
  publish_date: "",
  is_featured: false,
  featured_order: 0,
  is_active: true,
};

async function allPrograms() {
  const items: ProgramOption[] = [];
  let next: string | null = "/api/programs?page=1&ordering=display_order,title";
  while (next) {
    const data: PaginatedResponse<ProgramOption> = await apiClient.get(next);
    items.push(...data.results);
    next = data.next ? `/api/programs${new URL(data.next).search}` : null;
  }
  return items;
}

export default function EpisodesPage() {
  const [data, setData] = useState(empty);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [program, setProgram] = useState("");
  const [featured, setFeatured] = useState("");
  const [active, setActive] = useState("");
  const [ordering, setOrdering] = useState("-publish_date");
  const [viewMode, setViewMode] = useState<"grid" | "table">(() => {
    if (typeof window === "undefined") return "grid";
    const saved = localStorage.getItem("episodes_view_mode");
    return saved === "table" || saved === "grid" ? saved : "grid";
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(initial);
  const [file, setFile] = useState<File | null>(null);
  const [editing, setEditing] = useState<Episode | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState("");
  const [target, setTarget] = useState<Episode | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleSetViewMode = (mode: "grid" | "table") => {
    setViewMode(mode);
    localStorage.setItem("episodes_view_mode", mode);
  };

  const load = useCallback(async () => {
    setError("");
    try {
      setData(
        await apiClient.get(
          `/api/episodes?${episodeListQuery({
            page,
            search,
            program,
            featured,
            active,
            ordering,
          })}`
        )
      );
    } catch (v) {
      setError(isApiError(v) ? v.message : "Unable to load episodes.");
    } finally {
      setLoading(false);
    }
  }, [page, search, program, featured, active, ordering]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 250);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    void allPrograms()
      .then(setPrograms)
      .catch(() => setError("Episodes loaded, but Program options are unavailable."));
  }, []);

  const close = () => {
    setOpen(false);
    setEditing(null);
    setForm({ ...initial, program_id: Number(programs[0]?.id || 0) });
    setFile(null);
    setFieldErrors({});
    setFormError("");
  };

  const edit = (v: Episode) => {
    setEditing(v);
    setForm({
      program_id: v.programId,
      title: v.title,
      description: v.description,
      cover_image: v.externalThumbnailImage || "",
      youtube_link: v.youtubeEmbedUrl || v.youtubeLink,
      publish_date: v.publishDate || "",
      is_featured: v.is_featured,
      featured_order: v.featured_order,
      is_active: v.is_active,
    });
    setFile(null);
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const youtube = normalizeYouTubeEmbedUrl(form.youtube_link);
    if (!youtube) {
      setFieldErrors({ youtube_link: [YOUTUBE_EMBED_ERROR] });
      return;
    }
    setSaving(true);
    setFieldErrors({});
    setFormError("");

    const body = appendEditorialFields(
      new FormData(),
      episodePayload({ ...form, youtube_link: youtube })
    );
    if (editing) body.set("id", editing.id);
    if (file) body.set("uploaded_cover_image", file);

    try {
      await (editing
        ? apiClient.put("/api/episodes", body)
        : apiClient.post("/api/episodes", body));
      setToast(editing ? "Episode updated successfully." : "New episode recorded.");
      close();
      if (!editing && page !== 1) setPage(1);
      else await load();
    } catch (v) {
      if (isApiError(v)) {
        setFieldErrors(v.fieldErrors || {});
        setFormError(v.message);
      } else {
        setFormError("Unable to save Episode.");
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!target) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/api/episodes?id=${target.id}`);
      setToast("Episode deleted.");
      setTarget(null);
      await load();
    } catch (v) {
      setFormError(isApiError(v) ? v.message : "Unable to delete Episode.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 view-fade">
      <Toast message={toast} onDismiss={() => setToast(null)} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Film className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            <span>Radio Episode Archives</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Manage recorded broadcasts, YouTube livestream integrations, and featured episodes.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => {
              if (open) close();
              else {
                setEditing(null);
                setForm({ ...initial, program_id: Number(programs[0]?.id || 0) });
                setOpen(true);
              }
            }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wide uppercase px-4 py-2 shadow-sm transition-all"
          >
            {open ? <X className="h-4 w-4 mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
            <span>{open ? "Close Editor" : "Add New Episode"}</span>
          </Button>
        </div>
      </div>

      {/* Episode Creation/Edit Form */}
      {open && (
        <Card className="border-emerald-500/30 bg-white shadow-xl dark:bg-zinc-950">
          <CardHeader className="border-b border-slate-100 dark:border-zinc-800 pb-4">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>{editing ? `Edit Episode: ${editing.title}` : "Record Radio Episode"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={save} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Column 1 */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Parent Radio Show / Program <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={form.program_id || ""}
                      onChange={(e) => setForm({ ...form, program_id: Number(e.target.value) })}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-black dark:text-white"
                    >
                      <option value="">Select Parent Show</option>
                      {programs.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.title} {!v.is_active ? "(Inactive)" : ""}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.program_id?.[0] && (
                      <p className="mt-1 text-xs text-rose-500">{fieldErrors.program_id[0]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Episode Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.title}
                      placeholder="e.g. Episode #42: Sunday Gospel Reflections"
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-black dark:text-white dark:placeholder:text-zinc-600"
                    />
                    {fieldErrors.title?.[0] && (
                      <p className="mt-1 text-xs text-rose-500">{fieldErrors.title[0]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Broadcast / Air Date
                    </label>
                    <input
                      type="date"
                      value={form.publish_date}
                      onChange={(e) => setForm({ ...form, publish_date: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-black dark:text-white"
                    />
                    {fieldErrors.publish_date?.[0] && (
                      <p className="mt-1 text-xs text-rose-500">{fieldErrors.publish_date[0]}</p>
                    )}
                  </div>

                  {/* Thumbnail Image Fields */}
                  <div className="pt-2">
                    <SiteImageFields
                      currentUrl={editing?.thumbnailImage}
                      externalUrl={form.cover_image}
                      file={file}
                      onExternalUrlChange={(v) => setForm({ ...form, cover_image: v })}
                      onFileChange={setFile}
                    />
                  </div>
                </div>

                {/* Column 2 */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      YouTube Recording / Livestream URL <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="url"
                      required
                      value={form.youtube_link}
                      placeholder="https://www.youtube.com/watch?v=..."
                      onChange={(e) => setForm({ ...form, youtube_link: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none font-mono text-xs dark:border-zinc-800 dark:bg-black dark:text-white dark:placeholder:text-zinc-600"
                    />
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400">{YOUTUBE_EMBED_HELP}</p>
                    {fieldErrors.youtube_link?.[0] && (
                      <p className="mt-1 text-xs text-rose-500">{fieldErrors.youtube_link[0]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Episode Summary & Notes
                    </label>
                    <textarea
                      rows={5}
                      value={form.description}
                      placeholder="Show notes, scripture references, musical tracks featured, speaker notes..."
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-black dark:text-white dark:placeholder:text-zinc-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Featured Placement Order
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.featured_order}
                      onChange={(e) => setForm({ ...form, featured_order: Number(e.target.value) })}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-black dark:text-white"
                    />
                  </div>

                  {/* Toggles */}
                  <div className="flex flex-col gap-3 pt-2">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.is_featured}
                        onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 bg-white text-emerald-600 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-emerald-500"
                      />
                      <span>Feature this Episode on Station Homepage</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 bg-white text-emerald-600 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-emerald-500"
                      />
                      <span>Active (Publicly Streamable)</span>
                    </label>
                  </div>

                  {formError && (
                    <p className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-2.5 text-xs text-rose-500">
                      {formError}
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
                    <Button variant="outline" type="button" onClick={close} size="sm">
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={saving}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      {saving ? "Saving…" : editing ? "Update Episode" : "Save Episode"}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Advanced Filter Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:flex lg:flex-1 lg:items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
              <input
                type="text"
                value={search}
                placeholder="Search episodes by title..."
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-black dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Program Filter */}
            <select
              value={program}
              onChange={(e) => {
                setProgram(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-black dark:text-zinc-300"
            >
              <option value="">All Radio Programs</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>

            {/* Featured Filter */}
            <select
              value={featured}
              onChange={(e) => {
                setFeatured(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-black dark:text-zinc-300"
            >
              <option value="">All Features</option>
              <option value="true">Featured Only</option>
              <option value="false">Standard Only</option>
            </select>

            {/* Visibility Filter */}
            <select
              value={active}
              onChange={(e) => {
                setActive(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-black dark:text-zinc-300"
            >
              <option value="">All Statuses</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>

            {/* Ordering Filter */}
            <select
              value={ordering}
              onChange={(e) => {
                setOrdering(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-black dark:text-zinc-300"
            >
              <option value="-publish_date">Newest Air Date</option>
              <option value="publish_date">Oldest Air Date</option>
              <option value="-created_at">Recently Uploaded</option>
            </select>
          </div>

          {/* Hybrid View Mode Toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 shrink-0 self-start lg:self-center dark:border-zinc-800 dark:bg-black">
            <button
              onClick={() => handleSetViewMode("grid")}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white text-emerald-600 shadow-xs dark:bg-zinc-900 dark:text-emerald-400"
                  : "text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Grid</span>
            </button>
            <button
              onClick={() => handleSetViewMode("table")}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                viewMode === "table"
                  ? "bg-white text-emerald-600 shadow-xs dark:bg-zinc-900 dark:text-emerald-400"
                  : "text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Episodes Content View */}
      {loading ? (
        <LoadingState label="Loading radio episode archives…" />
      ) : error && !data.results.length ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : !data.results.length ? (
        <EmptyState
          icon={<Clapperboard className="h-10 w-10 text-slate-400 dark:text-zinc-600" />}
          title="No Broadcast Episodes Found"
          description={
            search || program || featured || active
              ? "Try adjusting your filters or search keywords."
              : "Click 'Add New Episode' to archive your first broadcast."
          }
        />
      ) : viewMode === "grid" ? (
        /* Rich Media Cards Grid */
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.results.map((v) => (
            <Card
              key={v.id}
              className="group flex flex-col justify-between overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-md dark:hover:shadow-xl dark:hover:shadow-emerald-950/20"
            >
              <div>
                {/* Media Thumbnail Container */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-black">
                  {v.thumbnailImage ? (
                    <Image
                      src={v.thumbnailImage}
                      alt={v.title}
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400 dark:bg-zinc-900 dark:text-zinc-700">
                      <Film className="h-12 w-12" />
                    </div>
                  )}

                  {/* Play Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-black shadow-lg">
                      <Play className="h-5 w-5 fill-current ml-0.5" />
                    </span>
                  </div>

                  {/* Overlay Badges */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                    {v.is_featured && (
                      <Badge variant="default" className="text-[10px] shadow-sm">
                        Featured #{v.featured_order}
                      </Badge>
                    )}
                    <Badge
                      variant={v.is_active ? "default" : "secondary"}
                      className="text-[10px] shadow-sm"
                    >
                      {v.is_active ? "Active" : "Archived"}
                    </Badge>
                  </div>

                  {v.youtubeLink && (
                    <div className="absolute bottom-2 left-2">
                      <span className="flex items-center gap-1 rounded bg-black/70 px-2 py-0.5 font-mono text-[10px] text-white backdrop-blur-xs">
                        <Video className="h-3 w-3 text-red-500" />
                        <span>YouTube Stream</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Content Details */}
                <div className="p-5 space-y-3">
                  <div>
                    <span className="font-semibold text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                      {v.programTitle || "Radio Show"}
                    </span>
                    <h2 className="font-bold text-base text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2 dark:text-white dark:group-hover:text-emerald-400">
                      {v.title}
                    </h2>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed dark:text-zinc-400">
                    {v.description || "No episode summary recorded."}
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
                      <span>{v.publishDate || "Unscheduled"}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-3 dark:border-zinc-800/80 dark:bg-zinc-950/40">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => edit(v)}
                  className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-emerald-600 dark:text-zinc-300 dark:hover:text-emerald-400"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTarget(v)}
                  className="flex items-center gap-1.5 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Dense Data Table View */
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Preview</TableHead>
                <TableHead>Episode Title</TableHead>
                <TableHead>Parent Program</TableHead>
                <TableHead>Air Date</TableHead>
                <TableHead className="text-center">Placement</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.results.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <div className="relative h-10 w-16 overflow-hidden rounded border border-slate-200 bg-slate-100 dark:border-zinc-800 dark:bg-black">
                      {v.thumbnailImage ? (
                        <Image
                          src={v.thumbnailImage}
                          alt={v.title}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-400 dark:text-zinc-600">
                          <Film className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-1">
                      {v.title}
                    </p>
                    {v.youtubeLink && (
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono truncate max-w-xs">
                        {v.youtubeLink}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-medium">
                      {v.programTitle || "Radio"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-slate-600 dark:text-zinc-300">
                      {v.publishDate || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {v.is_featured ? (
                      <Badge variant="default" className="text-[10px]">
                        Featured #{v.featured_order}
                      </Badge>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-zinc-600 font-mono">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={v.is_active ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {v.is_active ? "Active" : "Archived"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => edit(v)}
                        className="h-8 w-8 p-0 text-slate-600 hover:text-emerald-600 dark:text-zinc-300 dark:hover:text-emerald-400"
                        title="Edit episode"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTarget(v)}
                        className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                        title="Delete episode"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Pagination
        count={data.count}
        currentPage={page}
        hasNext={!!data.next}
        hasPrevious={!!data.previous}
        onNext={() => setPage((p) => p + 1)}
        onPrevious={() => setPage((p) => Math.max(1, p - 1))}
      />

      <ConfirmationDialog
        open={!!target}
        title="Delete Episode Archive?"
        description={
          target
            ? `Are you sure you want to permanently delete "${target.title}"?`
            : ""
        }
        loading={deleting}
        onConfirm={() => void remove()}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}
