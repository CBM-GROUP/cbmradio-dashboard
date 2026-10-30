"use client";

import Image from "next/image";
import {
  Edit2,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  LayoutGrid,
  List,
  Maximize2,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Toast from "../../components/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmationDialog } from "../../components/ui/confirmation-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, LoadingState } from "../../components/ui/surfaces";

type GalleryCategory = "Photos" | "Studio" | "Community" | "Team";

interface GalleryItem {
  id: string;
  title?: string;
  caption: string;
  url: string;
  externalUrl?: string;
  category: GalleryCategory;
}

function extractError(data: unknown): string {
  if (!data || typeof data !== "object") return "The gallery item could not be saved.";
  const values = Object.values(data as Record<string, unknown>);
  for (const value of values) {
    if (typeof value === "string") return value;
    if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    if (value && typeof value === "object") {
      const nested: string = extractError(value);
      if (nested) return nested;
    }
  }
  return "The gallery item could not be saved.";
}

export default function GalleryPage() {
  const [list, setList] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<"All" | GalleryCategory>("All");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">(() => {
    if (typeof window === "undefined") return "grid";
    const saved = localStorage.getItem("gallery_view_mode");
    return saved === "table" || saved === "grid" ? saved : "grid";
  });
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [caption, setCaption] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [category, setCategory] = useState<GalleryCategory>("Photos");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState("");
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GalleryItem | null>(null);
  const [activeLightbox, setActiveLightbox] = useState<GalleryItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const handleSetViewMode = (mode: "grid" | "table") => {
    setViewMode(mode);
    localStorage.setItem("gallery_view_mode", mode);
  };

  useEffect(() => {
    fetch("/api/gallery")
      .then(async (response) => {
        if (!response.ok) throw new Error("Gallery request failed");
        return response.json();
      })
      .then((data) => setList(Array.isArray(data) ? data : data.results || []))
      .catch(() => setToast("Unable to load gallery records."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(
    () => () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    },
    [filePreviewUrl],
  );

  const previewUrl = filePreviewUrl || editingItem?.url || externalUrl;

  const filteredList = useMemo(() => {
    return list.filter((item) => {
      if (selectedCategory !== "All" && item.category !== selectedCategory) {
        return false;
      }
      if (
        search.trim() &&
        !item.caption.toLowerCase().includes(search.trim().toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [list, selectedCategory, search]);

  const resetForm = () => {
    setCaption("");
    setExternalUrl("");
    setCategory("Photos");
    setSelectedFile(null);
    setFilePreviewUrl("");
    setEditingItem(null);
    setFormError("");
    setShowForm(false);
  };

  const startEdit = (item: GalleryItem) => {
    setEditingItem(item);
    setCaption(item.caption);
    setExternalUrl(item.externalUrl || "");
    setCategory(item.category);
    setSelectedFile(null);
    setFilePreviewUrl("");
    setFormError("");
    setShowForm(true);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");
    if (!caption.trim() || (!selectedFile && !externalUrl.trim() && !editingItem)) {
      setFormError("Add a caption and select an image file or external URL.");
      return;
    }

    const form = new FormData();
    if (editingItem) form.set("id", editingItem.id);
    form.set("title", caption.trim());
    form.set("caption", caption.trim());
    form.set("category", category);
    form.set("is_active", "true");
    if (selectedFile) form.set("uploaded_image", selectedFile);
    if (externalUrl.trim()) form.set("image", externalUrl.trim());

    try {
      const response = await fetch("/api/gallery", {
        method: editingItem ? "PUT" : "POST",
        body: form,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setFormError(extractError(data));
        return;
      }

      setList((items) =>
        editingItem
          ? items.map((item) => (item.id === data.id ? data : item))
          : [data, ...items]
      );
      setToast(editingItem ? "Gallery image updated." : "Gallery image uploaded.");
      resetForm();
    } catch {
      setFormError("The gallery service could not be reached.");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      const response = await fetch(`/api/gallery?id=${encodeURIComponent(deleteTarget.id)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setToast(extractError(data));
        return;
      }
      setList((items) => items.filter((item) => item.id !== deleteTarget.id));
      setToast("Gallery image deleted.");
      setDeleteTarget(null);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-16 view-fade">
      <Toast message={toast} onDismiss={() => setToast(null)} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <ImageIcon className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            <span>Media & Photo Gallery</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Upload studio photography, community outreach events, presenter headshots, and station visuals.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => (showForm ? resetForm() : setShowForm(true))}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wide uppercase px-4 py-2 shadow-sm transition-all"
          >
            {showForm ? <X className="mr-1.5 h-4 w-4" /> : <Upload className="mr-1.5 h-4 w-4" />}
            <span>{showForm ? "Close Form" : "Upload Image"}</span>
          </Button>
        </div>
      </div>

      {/* Upload/Edit Form Drawer */}
      {showForm && (
        <Card className="border-emerald-500/30 bg-white shadow-xl dark:bg-zinc-950">
          <CardHeader className="border-b border-slate-100 dark:border-zinc-800 pb-4">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>{editingItem ? "Edit Gallery Image" : "Upload New Visual Asset"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Column 1: Metadata */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Image Caption / Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    value={caption}
                    onChange={(event) => setCaption(event.target.value)}
                    placeholder="e.g. Broadcast desk during the morning drive"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-black dark:text-white dark:placeholder:text-zinc-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Gallery Category
                  </label>
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value as GalleryCategory)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-black dark:text-white"
                  >
                    <option value="Photos">General Photos</option>
                    <option value="Studio">Broadcast Studio</option>
                    <option value="Community">Community Events</option>
                    <option value="Team">Station Staff & Team</option>
                  </select>
                </div>
              </div>

              {/* Column 2: Image Selection */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Select Local Photo File
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      setSelectedFile(file);
                      setFilePreviewUrl(file ? URL.createObjectURL(file) : "");
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-zinc-800 dark:bg-black dark:text-white"
                  />
                  <span className="mt-1 block text-[10px] text-slate-500 dark:text-zinc-400">
                    High-res JPEG, PNG, or WebP; maximum 5 MB.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    External / Legacy Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={externalUrl}
                    onChange={(event) => setExternalUrl(event.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-900 outline-none focus:border-emerald-500 dark:border-zinc-800 dark:bg-black dark:text-white"
                  />
                </div>
              </div>

              {/* Column 3: Preview & Actions (Landscape Sidebar) */}
              <div className="flex flex-col justify-between space-y-4 lg:border-l lg:border-slate-100 dark:lg:border-zinc-800/80 lg:pl-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Selected Image Preview
                  </label>
                  {previewUrl ? (
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-zinc-800 dark:bg-black">
                      <Image
                        src={previewUrl}
                        alt="Selected preview"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-400 dark:border-zinc-800 dark:bg-zinc-900/40">
                      No Image Selected
                    </div>
                  )}

                  {editingItem && !selectedFile && (
                    <p className="mt-2 text-[11px] text-slate-500 dark:text-zinc-400">
                      The current image file is preserved unless you choose a replacement above.
                    </p>
                  )}

                  {formError && (
                    <p className="mt-2 rounded-lg bg-rose-500/10 border border-rose-500/20 p-2.5 text-xs text-rose-500">
                      {formError}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
                  <Button variant="outline" type="button" onClick={resetForm} size="sm">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer"
                  >
                    {editingItem ? "Update Image" : "Upload Asset"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filter and View Mode Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
              <input
                type="text"
                value={search}
                placeholder="Search gallery captions..."
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-black dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-1.5">
              {(["All", "Photos", "Studio", "Community", "Team"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-emerald-600 text-white font-bold shadow-xs"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-zinc-800 dark:bg-black dark:text-zinc-400 dark:hover:bg-zinc-900"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
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

      {/* Gallery Content */}
      {loading ? (
        <LoadingState label="Loading gallery photo collection…" />
      ) : !filteredList.length ? (
        <EmptyState
          icon={<ImageIcon className="h-10 w-10 text-slate-400 dark:text-zinc-600" />}
          title="No Images Found"
          description={
            search || selectedCategory !== "All"
              ? "No gallery images matched the selected filter or search term."
              : "Upload your first station studio or community visual asset."
          }
        />
      ) : viewMode === "grid" ? (
        /* Visual Cards Grid */
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredList.map((item) => (
            <Card
              key={item.id}
              className="group overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-emerald-950/20"
            >
              <div className="relative aspect-video bg-slate-100 dark:bg-black overflow-hidden">
                <Image
                  src={item.url}
                  alt={item.caption}
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />

                <div className="absolute top-2.5 left-2.5">
                  <Badge variant="default" className="text-[10px] shadow-sm">
                    {item.category}
                  </Badge>
                </div>

                {/* Hover overlay with zoom button */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveLightbox(item)}
                    className="bg-black/60 border-white/30 text-white hover:bg-black text-xs backdrop-blur-xs"
                  >
                    <Maximize2 className="mr-1.5 h-3.5 w-3.5" />
                    <span>View Fullscreen</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-3 p-4">
                <p className="font-semibold text-xs text-slate-900 line-clamp-2 dark:text-white">
                  {item.caption}
                </p>

                <div className="flex items-center justify-between border-t border-slate-100 dark:border-zinc-900 pt-3">
                  <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono">
                    ID #{item.id}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(item)}
                      className="h-7 px-2 text-xs text-slate-700 hover:text-emerald-600 dark:text-zinc-300 dark:hover:text-emerald-400"
                    >
                      <Edit2 className="mr-1 h-3 w-3" />
                      <span>Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(item)}
                      className="h-7 px-2 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-500/10"
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      <span>Delete</span>
                    </Button>
                  </div>
                </div>
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
                <TableHead>Caption / Label</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Source URL</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredList.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div
                      onClick={() => setActiveLightbox(item)}
                      className="relative h-10 w-16 overflow-hidden rounded border border-slate-200 bg-slate-100 cursor-pointer dark:border-zinc-800 dark:bg-black group"
                    >
                      <Image
                        src={item.url}
                        alt={item.caption}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-1">
                      {item.caption}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono">
                      Asset ID: {item.id}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {item.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono truncate max-w-xs block">
                      {item.externalUrl || item.url}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveLightbox(item)}
                        className="h-8 w-8 p-0 text-slate-600 hover:text-emerald-600 dark:text-zinc-300 dark:hover:text-emerald-400"
                        title="View image"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(item)}
                        className="h-8 w-8 p-0 text-slate-600 hover:text-emerald-600 dark:text-zinc-300 dark:hover:text-emerald-400"
                        title="Edit image"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(item)}
                        className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                        title="Delete image"
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

      {/* Lightbox Modal */}
      {activeLightbox && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setActiveLightbox(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 px-2 border-b border-zinc-800">
              <span className="text-xs font-bold text-white truncate max-w-md">
                {activeLightbox.caption}
              </span>
              <button
                onClick={() => setActiveLightbox(null)}
                className="rounded-lg p-1 text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="relative aspect-video w-full mt-3 overflow-hidden rounded-xl bg-black">
              <Image
                src={activeLightbox.url}
                alt={activeLightbox.caption}
                fill
                unoptimized
                className="object-contain"
              />
            </div>
            <div className="mt-3 flex items-center justify-between px-2 text-xs text-zinc-400">
              <Badge variant="outline" className="text-[10px]">
                {activeLightbox.category}
              </Badge>
              <a
                href={activeLightbox.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-emerald-400 hover:underline"
              >
                <span>Open Original File</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        title="Delete Gallery Asset?"
        description={
          deleteTarget
            ? `Are you sure you want to permanently remove "${deleteTarget.caption}" from the website gallery?`
            : ""
        }
        loading={Boolean(deletingId)}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
