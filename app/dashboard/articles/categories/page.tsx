"use client";

import Link from "next/link";
import { ArrowLeft, Edit2, Plus, Sparkles, Tags, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Toast, { type ToastVariant } from "../../../components/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmationDialog } from "../../../components/ui/confirmation-dialog";
import { Pagination } from "../../../components/ui/pagination";
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/surfaces";
import { apiClient, isApiError } from "../../../lib/api-client";
import type { PaginatedResponse } from "../../../types/api";
import type { ArticleCategory } from "../../../types/articles";

const emptyPage: PaginatedResponse<ArticleCategory> = {
  count: 0,
  next: null,
  previous: null,
  results: [],
};

type Form = {
  name: string;
  description: string;
  is_active: boolean;
  display_order: number;
};

const emptyForm: Form = {
  name: "",
  description: "",
  is_active: true,
  display_order: 0,
};

export default function ArticleCategoriesPage() {
  const [data, setData] = useState(emptyPage);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<ArticleCategory | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [deleteTarget, setDeleteTarget] = useState<ArticleCategory | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams({
      page: String(page),
      ordering: "display_order,name",
    });
    if (search.trim()) params.set("search", search.trim());
    setError("");
    try {
      setData(await apiClient.get(`/api/article-categories?${params}`));
    } catch (value) {
      setError(isApiError(value) ? value.message : "Unable to load categories.");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  const close = () => {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setFieldErrors({});
  };

  const edit = (item: ArticleCategory) => {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description,
      is_active: item.is_active,
      display_order: item.display_order,
    });
    setShowForm(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    setFieldErrors({});
    try {
      const payload = { ...form, ...(editing ? { slug: editing.slug } : {}) };
      await (editing
        ? apiClient.put("/api/article-categories", payload)
        : apiClient.post("/api/article-categories", payload));
      setToast({
        message: editing ? "Category updated." : "Category created.",
        variant: "success",
      });
      close();
      await load();
    } catch (value) {
      if (isApiError(value)) {
        setFormError(value.message);
        setFieldErrors(value.fieldErrors || {});
      } else {
        setFormError("Unable to save category.");
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await apiClient.delete(
        `/api/article-categories?slug=${encodeURIComponent(deleteTarget.slug)}`
      );
      setToast({ message: "Category deleted.", variant: "success" });
      setDeleteTarget(null);
      await load();
    } catch (value) {
      setDeleteError(isApiError(value) ? value.message : "Unable to delete category.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 view-fade">
      <Toast
        message={toast?.message || null}
        variant={toast?.variant}
        onDismiss={() => setToast(null)}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Tags className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            <span>Article Categories</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Organize digital news content, create publication topics, and configure public menu sections.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link href="/dashboard/articles">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              <span>Back to Articles</span>
            </Link>
          </Button>
          <Button
            size="sm"
            onClick={() => (showForm ? close() : setShowForm(true))}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wide uppercase px-4 py-2 shadow-sm transition-all"
          >
            {showForm ? <X className="mr-1.5 h-4 w-4" /> : <Plus className="mr-1.5 h-4 w-4" />}
            <span>{showForm ? "Close Form" : "Add Category"}</span>
          </Button>
        </div>
      </div>

      {/* Form Drawer */}
      {showForm && (
        <Card className="border-emerald-500/30 bg-white shadow-xl dark:bg-zinc-950">
          <CardHeader className="border-b border-slate-100 dark:border-zinc-800 pb-4">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>{editing ? `Edit Category: ${editing.name}` : "Create Article Category"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={save} className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  placeholder="e.g. Community News, Gospel Reflections, Sermons"
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-black dark:text-white dark:placeholder:text-zinc-600"
                />
                {fieldErrors.name?.[0] && (
                  <p className="mt-1 text-xs text-rose-500">{fieldErrors.name[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  placeholder="Optional brief description of this editorial section..."
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-black dark:text-white dark:placeholder:text-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.display_order}
                  onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-black dark:text-white"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 bg-white text-emerald-600 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-emerald-500"
                  />
                  <span>Active and available for article assignment</span>
                </label>
              </div>

              {editing && (
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono">
                  Slug identifier: {editing.slug}
                </p>
              )}

              {formError && (
                <p className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-2.5 text-xs text-rose-500">
                  {formError}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <Button variant="outline" type="button" onClick={close} size="sm">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {saving ? "Saving…" : editing ? "Update Category" : "Create Category"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Categories Grid */}
      {loading ? (
        <LoadingState label="Loading editorial categories…" />
      ) : error && !data.results.length ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : !data.results.length ? (
        <EmptyState
          icon={<Tags className="h-10 w-10 text-slate-400 dark:text-zinc-600" />}
          title="No Categories Configured"
          description="Create categories to organize news articles and devotionals."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.results.map((item) => (
            <Card
              key={item.id}
              className="flex flex-col justify-between p-5 transition hover:shadow-md dark:hover:border-zinc-700"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {item.name}
                  </h3>
                  <Badge variant={item.is_active ? "default" : "secondary"} className="text-[10px]">
                    {item.is_active ? "Active" : "Hidden"}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2 line-clamp-2">
                  {item.description || "No description provided."}
                </p>
                <div className="mt-3 font-mono text-[11px] text-slate-400 dark:text-zinc-500">
                  <span>/{item.slug}</span>
                  <span className="mx-1.5">·</span>
                  <span>Order #{item.display_order}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100 dark:border-zinc-900">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => edit(item)}
                  className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-emerald-600 dark:text-zinc-300 dark:hover:text-emerald-400"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteTarget(item)}
                  className="flex items-center gap-1.5 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Pagination
        count={data.count}
        currentPage={page}
        hasNext={Boolean(data.next)}
        hasPrevious={Boolean(data.previous)}
        onNext={() => setPage((v) => v + 1)}
        onPrevious={() => setPage((v) => Math.max(1, v - 1))}
      />

      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        title="Delete Category?"
        description={
          deleteTarget
            ? `Are you sure you want to remove "${deleteTarget.name}"? Active articles assigned to this category will become uncategorized.`
            : ""
        }
        loading={deleting}
        error={deleteError}
        onConfirm={() => void remove()}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteError("");
        }}
      />
    </div>
  );
}
