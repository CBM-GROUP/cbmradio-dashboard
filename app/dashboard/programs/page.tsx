"use client";

import Image from "next/image";
import {
  Calendar,
  Clock,
  Edit2,
  Film,
  Plus,
  Radio,
  Search,
  Sparkles,
  Trash2,
  User,
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
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/surfaces";
import { apiClient, isApiError } from "../../lib/api-client";
import { appendEditorialFields, programPayload } from "../../lib/editorial-payloads";
import {
  normalizeYouTubeEmbedUrl,
  YOUTUBE_EMBED_ERROR,
  YOUTUBE_EMBED_HELP,
} from "../../lib/youtube-embed";
import type { PaginatedResponse } from "../../types/api";
import type { ProgramEditorial as Program } from "../../types/editorial";

const empty: PaginatedResponse<Program> = {
  count: 0,
  next: null,
  previous: null,
  results: [],
};

const initial = {
  title: "",
  presenter: "",
  short_description: "",
  description: "",
  schedule: "",
  cover_image: "",
  promo_video_url: "",
  display_order: 0,
  is_featured: false,
  is_active: true,
};

export default function ProgramsPage() {
  const [data, setData] = useState(empty);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(initial);
  const [file, setFile] = useState<File | null>(null);
  const [editing, setEditing] = useState<Program | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [target, setTarget] = useState<Program | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const p = new URLSearchParams({
        page: String(page),
        ordering: "display_order,title",
      });
      if (search.trim()) p.set("search", search.trim());
      setData(await apiClient.get(`/api/programs?${p}`));
    } catch (v) {
      setError(isApiError(v) ? v.message : "Unable to load radio programs.");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 250);
    return () => clearTimeout(t);
  }, [load]);

  const close = () => {
    setOpen(false);
    setEditing(null);
    setForm(initial);
    setFile(null);
    setFieldErrors({});
    setFormError("");
  };

  const edit = (v: Program) => {
    setEditing(v);
    setForm({
      title: v.title,
      presenter: v.presenter,
      short_description: v.short_description,
      description: v.description,
      schedule: v.schedule,
      cover_image: v.externalCoverImage || "",
      promo_video_url: v.promoVideoUrl || "",
      display_order: v.display_order,
      is_featured: v.is_featured,
      is_active: v.is_active,
    });
    setFile(null);
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const promo = normalizeYouTubeEmbedUrl(form.promo_video_url);
    if (promo === null) {
      setFieldErrors({ promo_video_url: [YOUTUBE_EMBED_ERROR] });
      return;
    }
    setSaving(true);
    setFieldErrors({});
    setFormError("");

    const body = appendEditorialFields(
      new FormData(),
      programPayload({ ...form, promo_video_url: promo })
    );
    if (editing) body.set("id", editing.id);
    if (file) body.set("uploaded_cover_image", file);

    try {
      await (editing
        ? apiClient.put("/api/programs", body)
        : apiClient.post("/api/programs", body));
      setToast(editing ? "Program updated successfully." : "New program created.");
      close();
      if (!editing && page !== 1) setPage(1);
      else await load();
    } catch (v) {
      if (isApiError(v)) {
        setFieldErrors(v.fieldErrors || {});
        setFormError(v.message);
      } else {
        setFormError("Unable to save Program.");
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!target) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/api/programs?id=${target.id}`);
      setToast("Program deleted.");
      setTarget(null);
      await load();
    } catch (v) {
      setFormError(isApiError(v) ? v.message : "Unable to delete Program.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <Toast message={toast} onDismiss={() => setToast(null)} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Radio className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            <span>Radio Programs</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Manage shows, broadcast schedules, presenter assignments, and public visibility.
          </p>
        </div>
        <Button
          onClick={() => (open ? close() : setOpen(true))}
          className="bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2"
        >
          {open ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          <span>{open ? "Close Editor" : "Add New Program"}</span>
        </Button>
      </div>

      {/* Program Creation/Edit Form */}
      {open && (
        <Card className="border-emerald-500/30 bg-white shadow-xl dark:bg-zinc-950">
          <CardHeader className="border-b border-slate-100 dark:border-zinc-800 pb-4">
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>{editing ? `Edit: ${editing.title}` : "Create Radio Program"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={save} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Column 1 */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Program Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.title}
                      placeholder="e.g. The Morning Drive"
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-black dark:text-white dark:placeholder:text-zinc-600"
                    />
                    {fieldErrors.title?.[0] && (
                      <p className="mt-1 text-xs text-rose-500">{fieldErrors.title[0]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Presenter / Host
                    </label>
                    <input
                      type="text"
                      value={form.presenter}
                      placeholder="e.g. Alex & Sarah"
                      onChange={(e) => setForm({ ...form, presenter: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-black dark:text-white dark:placeholder:text-zinc-600"
                    />
                    {fieldErrors.presenter?.[0] && (
                      <p className="mt-1 text-xs text-rose-500">{fieldErrors.presenter[0]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Broadcast Schedule
                    </label>
                    <input
                      type="text"
                      value={form.schedule}
                      placeholder="e.g. Mon - Fri, 6:00 AM - 10:00 AM"
                      onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-black dark:text-white dark:placeholder:text-zinc-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Short Description (Summary)
                    </label>
                    <input
                      type="text"
                      maxLength={300}
                      value={form.short_description}
                      placeholder="Short teaser shown on cards"
                      onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-black dark:text-white dark:placeholder:text-zinc-600"
                    />
                  </div>

                  {/* Image Uploader */}
                  <div className="pt-2">
                    <SiteImageFields
                      currentUrl={editing?.coverImage}
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
                      Full Show Description
                    </label>
                    <textarea
                      rows={5}
                      value={form.description}
                      placeholder="Detailed overview about this show, topics, call-in numbers, etc."
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-black dark:text-white dark:placeholder:text-zinc-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Promo / Livestream YouTube URL
                    </label>
                    <input
                      type="url"
                      value={form.promo_video_url}
                      placeholder="https://www.youtube.com/watch?v=..."
                      onChange={(e) => setForm({ ...form, promo_video_url: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none font-mono text-xs dark:border-zinc-800 dark:bg-black dark:text-white dark:placeholder:text-zinc-600"
                    />
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400">{YOUTUBE_EMBED_HELP}</p>
                    {fieldErrors.promo_video_url?.[0] && (
                      <p className="mt-1 text-xs text-rose-500">
                        {fieldErrors.promo_video_url[0]}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Display Order (Position)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.display_order}
                      onChange={(e) =>
                        setForm({ ...form, display_order: Number(e.target.value) })
                      }
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
                      <span>Feature this Program on Station Homepage</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 bg-white text-emerald-600 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-emerald-500"
                      />
                      <span>Active (Publicly Visible)</span>
                    </label>
                  </div>

                  {editing && (
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                      Slug: {editing.slug}
                    </p>
                  )}

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
                      {saving ? "Saving…" : editing ? "Update Program" : "Save Program"}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
        <input
          type="text"
          value={search}
          placeholder="Search programs by title, host, or schedule..."
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
        {search && (
          <button
            onClick={() => {
              setSearch("");
              setPage(1);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs"
          >
            Clear
          </button>
        )}
      </div>

      {/* Programs List */}
      {loading ? (
        <LoadingState label="Loading radio programs…" />
      ) : error && !data.results.length ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : !data.results.length ? (
        <EmptyState
          icon={<Radio className="h-10 w-10 text-slate-400 dark:text-zinc-600" />}
          title="No Programs Found"
          description={
            search ? "Try adjusting your search query." : "Click 'Add New Program' to create one."
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.results.map((v) => (
              <Card
                key={v.id}
                className="group flex flex-col justify-between overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-xl dark:hover:shadow-emerald-950/20"
              >
                <div>
                  {/* Cover Image Container */}
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-black">
                    {v.coverImage ? (
                      <Image
                        src={v.coverImage}
                        alt={v.title}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400 dark:bg-zinc-900 dark:text-zinc-700">
                        <Radio className="h-12 w-12" />
                      </div>
                    )}

                    {/* Overlay Badges */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                      {v.is_featured && (
                        <Badge variant="default" className="text-[10px] shadow-sm">
                          Featured
                        </Badge>
                      )}
                      <Badge
                        variant={v.is_active ? "default" : "secondary"}
                        className="text-[10px] shadow-sm"
                      >
                        {v.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <div className="absolute bottom-2 left-2">
                      <span className="rounded bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-slate-200 backdrop-blur-xs">
                        Order #{v.display_order}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <h2 className="font-bold text-lg text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1 dark:text-white dark:group-hover:text-emerald-400">
                      {v.title}
                    </h2>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed dark:text-zinc-400">
                      {v.short_description || "No short description provided for this show."}
                    </p>

                    <div className="space-y-1.5 pt-1 text-xs text-slate-600 border-t border-slate-100 dark:border-zinc-800/60 dark:text-zinc-400">
                      {v.presenter && (
                        <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-300">
                          <User className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="truncate">{v.presenter}</span>
                        </div>
                      )}
                      {v.schedule && (
                        <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
                          <Clock className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500 shrink-0" />
                          <span className="truncate">{v.schedule}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
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

          <Pagination
            count={data.count}
            currentPage={page}
            hasNext={!!data.next}
            hasPrevious={!!data.previous}
            onNext={() => setPage((v) => v + 1)}
            onPrevious={() => setPage((v) => Math.max(1, v - 1))}
          />
        </>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={!!target}
        title="Delete Program?"
        description={
          target
            ? `Are you sure you want to permanently delete “${target.title}”? This action cannot be undone.`
            : ""
        }
        loading={deleting}
        onConfirm={() => void remove()}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}
