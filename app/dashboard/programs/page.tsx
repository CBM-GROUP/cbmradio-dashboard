"use client";

import Image from "next/image";
import {
  Edit2,
  LayoutGrid,
  List,
  Plus,
  Radio,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { SiteImageFields } from "../../components/site-image-fields";
import Toast from "../../components/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmationDialog } from "../../components/ui/confirmation-dialog";
import { Pagination } from "../../components/ui/pagination";
import { ProgramCard } from "../../components/programs/program-card";
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
import { appendEditorialFields, programPayload } from "../../lib/editorial-payloads";
import {
  normalizeYouTubeEmbedUrl,
  YOUTUBE_EMBED_ERROR,
  YOUTUBE_EMBED_HELP,
} from "../../lib/youtube-embed";
import type { PaginatedResponse } from "../../types/api";
import type { ProgramEditorial as Program } from "../../types/editorial";

interface TeamMemberOption {
  id: string;
  name: string;
  role: string;
  category?: string;
  photo?: string;
}

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
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [featuredFilter, setFeaturedFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">(() => {
    if (typeof window === "undefined") return "grid";
    const saved = localStorage.getItem("programs_view_mode");
    return saved === "table" || saved === "grid" ? saved : "grid";
  });
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
  const [teamMembers, setTeamMembers] = useState<TeamMemberOption[]>([]);

  useEffect(() => {
    apiClient
      .get<PaginatedResponse<TeamMemberOption>>("/api/team?ordering=name")
      .then((res) => setTeamMembers(res.results || []))
      .catch(() => undefined);
  }, []);

  const matchedMember = teamMembers.find(
    (m) => m.name.toLowerCase() === form.presenter.trim().toLowerCase(),
  );

  const handleSetViewMode = (mode: "grid" | "table") => {
    setViewMode(mode);
    localStorage.setItem("programs_view_mode", mode);
  };

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

  const filteredPrograms = data.results.filter((item) => {
    if (activeFilter === "active" && !item.is_active) return false;
    if (activeFilter === "inactive" && item.is_active) return false;
    if (featuredFilter === "featured" && !item.is_featured) return false;
    if (featuredFilter === "standard" && item.is_featured) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-16 view-fade">
      <Toast message={toast} onDismiss={() => setToast(null)} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Radio className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            <span>Radio Programs</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Manage station shows, broadcast schedules, presenter assignments, and public visibility.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => {
              if (open) close();
              else {
                setEditing(null);
                setForm(initial);
                setOpen(true);
              }
            }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wide uppercase px-4 py-2 shadow-sm transition-all"
          >
            {open ? <X className="h-4 w-4 mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
            <span>{open ? "Close Editor" : "Add New Program"}</span>
          </Button>
        </div>
      </div>

      {/* Program Creation/Edit Form */}
      {open && (
        <Card className="rounded-xl border border-emerald-500/30 bg-white shadow-xl dark:bg-zinc-950">
          <CardHeader className="border-b border-slate-100 dark:border-zinc-800/80 p-5 pb-4">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>{editing ? `Edit Program: ${editing.title}` : "Create Radio Program"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 md:p-6">
            <form onSubmit={save} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Column 1 */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Program Title <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      required
                      value={form.title}
                      placeholder="e.g. The Morning Drive"
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                    {fieldErrors.title?.[0] && (
                      <p className="mt-1 text-xs text-rose-500">{fieldErrors.title[0]}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">
                        Presenter / Host
                      </Label>
                      {matchedMember && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          ✓ Verified Team Member: {matchedMember.role || "Host"}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        value=""
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) return;
                          if (!form.presenter.trim()) {
                            setForm({ ...form, presenter: val });
                          } else if (!form.presenter.toLowerCase().includes(val.toLowerCase())) {
                            setForm({ ...form, presenter: `${form.presenter.trim()} & ${val}` });
                          }
                        }}
                        className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 shadow-xs focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
                      >
                        <option value="">
                          {teamMembers.length > 0 ? "-- Select from Team Roster --" : "Loading Team..."}
                        </option>
                        {teamMembers.map((m) => (
                          <option key={m.id} value={m.name}>
                            {m.name} ({m.role || "Presenter"})
                          </option>
                        ))}
                      </select>

                      <Input
                        type="text"
                        list="team-members-list"
                        value={form.presenter}
                        placeholder="Type presenter name or co-hosts..."
                        onChange={(e) => setForm({ ...form, presenter: e.target.value })}
                      />
                      <datalist id="team-members-list">
                        {teamMembers.map((m) => (
                          <option key={m.id} value={m.name}>
                            {m.name} — {m.role}
                          </option>
                        ))}
                      </datalist>
                    </div>

                    {teamMembers.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                          Quick-assign from active team roster:
                        </span>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 rounded-lg border border-slate-200/60 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/40">
                          {teamMembers.map((m) => {
                            const isSelected = form.presenter
                              .toLowerCase()
                              .includes(m.name.toLowerCase());
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    const regex = new RegExp(`(^|\\s*&\\s*)${m.name}(\\s*&\\s*|$)`, "i");
                                    const updated = form.presenter
                                      .replace(regex, " ")
                                      .replace(/\s+&\s+$/, "")
                                      .replace(/^\s+&\s+/, "")
                                      .trim();
                                    setForm({ ...form, presenter: updated });
                                  } else {
                                    const updated = form.presenter.trim()
                                      ? `${form.presenter.trim()} & ${m.name}`
                                      : m.name;
                                    setForm({ ...form, presenter: updated });
                                  }
                                }}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-all border ${
                                  isSelected
                                    ? "bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-xs"
                                    : "bg-white text-slate-600 border-slate-200 hover:border-emerald-500/50 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
                                }`}
                              >
                                <span>{m.name}</span>
                                {m.role && (
                                  <span className="text-[9px] opacity-75">
                                    • {m.role}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {fieldErrors.presenter?.[0] && (
                      <p className="mt-1 text-xs text-rose-500">{fieldErrors.presenter[0]}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Broadcast Schedule
                    </Label>
                    <Input
                      type="text"
                      value={form.schedule}
                      placeholder="e.g. Mon - Fri, 6:00 AM - 10:00 AM"
                      onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Short Description (Summary)
                    </Label>
                    <Input
                      type="text"
                      maxLength={300}
                      value={form.short_description}
                      placeholder="Short teaser shown on cards"
                      onChange={(e) => setForm({ ...form, short_description: e.target.value })}
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
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Full Show Description
                    </Label>
                    <Textarea
                      rows={5}
                      value={form.description}
                      placeholder="Detailed overview about this show, topics, call-in numbers, etc."
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Promo / Livestream YouTube URL
                    </Label>
                    <Input
                      type="url"
                      value={form.promo_video_url}
                      placeholder="https://www.youtube.com/watch?v=..."
                      onChange={(e) => setForm({ ...form, promo_video_url: e.target.value })}
                      className="font-mono text-xs"
                    />
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">{YOUTUBE_EMBED_HELP}</p>
                    {fieldErrors.promo_video_url?.[0] && (
                      <p className="mt-1 text-xs text-rose-500">
                        {fieldErrors.promo_video_url[0]}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Display Order (Position)
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.display_order}
                      onChange={(e) =>
                        setForm({ ...form, display_order: Number(e.target.value) })
                      }
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

      {/* Filter and View Mode Toolbar */}
      <Card className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2.5">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
              <Input
                type="text"
                value={search}
                placeholder="Search programs by title or host..."
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-8 pr-8 h-9 text-xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Quick Status Filters */}
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 shadow-xs focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
            >
              <option value="all">All Visibility</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            <select
              value={featuredFilter}
              onChange={(e) => setFeaturedFilter(e.target.value)}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 shadow-xs focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
            >
              <option value="all">All Placement</option>
              <option value="featured">Featured Only</option>
              <option value="standard">Standard Only</option>
            </select>
          </div>

          {/* Hybrid View Mode Toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-zinc-800 dark:bg-zinc-900/60">
            <button
              type="button"
              onClick={() => handleSetViewMode("grid")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white text-emerald-600 shadow-xs dark:bg-zinc-800 dark:text-emerald-400"
                  : "text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Grid</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetViewMode("table")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                viewMode === "table"
                  ? "bg-white text-emerald-600 shadow-xs dark:bg-zinc-800 dark:text-emerald-400"
                  : "text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Programs Content View */}
      {loading ? (
        <LoadingState label="Loading radio programs…" />
      ) : error && !data.results.length ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : !filteredPrograms.length ? (
        <EmptyState
          icon={<Radio className="h-10 w-10 text-slate-400 dark:text-zinc-600" />}
          title="No Programs Found"
          description={
            search ? "Try adjusting your search query or filters." : "Click 'Add New Program' to create one."
          }
        />
      ) : viewMode === "grid" ? (
        /* Rich Grid View */
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPrograms.map((v) => (
            <ProgramCard
              key={v.id}
              program={v}
              teamMembers={teamMembers}
              onEdit={edit}
              onDelete={setTarget}
            />
          ))}
        </div>
      ) : (
        /* Dense Data Table View */
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Cover</TableHead>
                <TableHead>Program Title</TableHead>
                <TableHead>Host / Presenter</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead className="text-center">Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrograms.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <div className="relative h-10 w-16 overflow-hidden rounded border border-slate-200 bg-slate-100 dark:border-zinc-800 dark:bg-black">
                      {v.coverImage ? (
                        <Image
                          src={v.coverImage}
                          alt={v.title}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-400 dark:text-zinc-600">
                          <Radio className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-1">
                      {v.title}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono">
                      /{v.slug}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-700 dark:text-zinc-300 font-medium">
                        {v.presenter || "—"}
                      </span>
                      {v.presenter &&
                        teamMembers.some((m) =>
                          v.presenter.toLowerCase().includes(m.name.toLowerCase()),
                        ) && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold shrink-0">
                            Team
                          </span>
                        )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-slate-500 dark:text-zinc-400">
                      {v.schedule || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs">
                    #{v.display_order}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant={v.is_active ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {v.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {v.is_featured && (
                        <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                          Featured
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => edit(v)}
                        className="h-8 w-8 p-0 text-slate-600 hover:text-emerald-600 dark:text-zinc-300 dark:hover:text-emerald-400"
                        title="Edit program"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTarget(v)}
                        className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                        title="Delete program"
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
        title="Delete Radio Program?"
        description={
          target
            ? `Are you sure you want to delete "${target.title}"? Associated broadcast episodes will also be affected.`
            : ""
        }
        loading={deleting}
        onConfirm={() => void remove()}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}
