"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Toast from "../../components/toast";

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
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [caption, setCaption] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [category, setCategory] = useState<GalleryCategory>("Photos");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState("");
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState<string | null>(null);

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

  const filteredList = useMemo(
    () => selectedCategory === "All"
      ? list
      : list.filter((item) => item.category === selectedCategory),
    [list, selectedCategory],
  );

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

      setList((items) => editingItem
        ? items.map((item) => item.id === data.id ? data : item)
        : [data, ...items]);
      setToast(editingItem ? "Gallery image updated." : "Gallery image uploaded.");
      resetForm();
    } catch {
      setFormError("The gallery service could not be reached.");
    }
  };

  const handleDelete = async (id: string) => {
    const response = await fetch(`/api/gallery?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setToast(extractError(data));
      return;
    }
    setList((items) => items.filter((item) => item.id !== id));
    setToast("Gallery image deleted.");
  };

  if (loading) {
    return <div className="p-4 text-xs text-slate-500 animate-pulse">Loading gallery media…</div>;
  }

  return (
    <div className="space-y-6 view-fade pb-12">
      <Toast message={toast} onDismiss={() => setToast(null)} />
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 uppercase tracking-wider dark:text-white">Media Gallery</h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Upload and manage website gallery images.</p>
        </div>
        <button
          onClick={() => showForm ? resetForm() : setShowForm(true)}
          className="self-start rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-500 sm:self-center cursor-pointer"
        >
          {showForm ? "Dismiss" : "Upload image"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["All", "Photos", "Studio", "Community", "Team"] as const).map((item) => (
          <button
            key={item}
            onClick={() => setSelectedCategory(item)}
            className={`rounded-full border px-3 py-1 text-xs transition cursor-pointer ${
              selectedCategory === item
                ? "border-emerald-500 bg-emerald-500 font-bold text-white shadow-xs"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-5 text-xs shadow-md dark:border-slate-800 dark:bg-slate-900 md:grid-cols-2">
          <div className="space-y-3">
            <label className="block text-slate-700 dark:text-slate-300">
              Caption *
              <input required value={caption} onChange={(event) => setCaption(event.target.value)} className="mt-1 w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
            </label>
            <label className="block text-slate-700 dark:text-slate-300">
              Local image file
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  setSelectedFile(file);
                  setFilePreviewUrl(file ? URL.createObjectURL(file) : "");
                }}
                className="mt-1 w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
              <span className="mt-1 block text-[10px] text-slate-500">JPEG, PNG, WebP, or GIF; maximum 5 MB.</span>
            </label>
            <label className="block text-slate-700 dark:text-slate-300">
              External image URL
              <input type="url" value={externalUrl} onChange={(event) => setExternalUrl(event.target.value)} placeholder="Optional legacy/external URL" className="mt-1 w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
            </label>
          </div>
          <div className="flex flex-col gap-3">
            <label className="block text-slate-700 dark:text-slate-300">
              Category
              <select value={category} onChange={(event) => setCategory(event.target.value as GalleryCategory)} className="mt-1 w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white">
                <option value="Photos">Photos</option>
                <option value="Studio">Studio</option>
                <option value="Community">Community</option>
                <option value="Team">Team</option>
              </select>
            </label>
            {previewUrl && (
              <div className="relative aspect-video overflow-hidden rounded border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-950">
                <Image src={previewUrl} alt="Selected image preview" fill unoptimized className="object-cover" />
              </div>
            )}
            {editingItem && !selectedFile && (
              <p className="text-[10px] text-slate-500">The current uploaded image will be kept unless you select a replacement.</p>
            )}
            {formError && <p className="text-rose-500">{formError}</p>}
            <button type="submit" className="mt-auto w-full rounded-md bg-emerald-600 hover:bg-emerald-500 py-2 font-bold uppercase tracking-wider text-white transition cursor-pointer">
              {editingItem ? "Update gallery image" : "Save gallery image"}
            </button>
          </div>
        </form>
      )}

      {filteredList.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">No gallery images match this filter.</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredList.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
              <div className="relative aspect-video bg-slate-100 dark:bg-slate-950">
                <Image src={item.url} alt={item.caption} fill unoptimized className="object-cover" />
              </div>
              <div className="space-y-3 p-4">
                <div>
                  <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">{item.caption}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">{item.category}</p>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => startEdit(item)} className="rounded border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-bold uppercase text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer">Edit</button>
                  <button onClick={() => handleDelete(item.id)} className="rounded border border-rose-500/20 bg-rose-50 px-3 py-1 text-[10px] font-bold uppercase text-rose-600 transition hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 cursor-pointer">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
