"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Edit2,
  FileCheck2,
  FilePenLine,
  FileText,
  LayoutGrid,
  List,
  Newspaper,
  Plus,
  Search,
  Tags,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Toast from "../../components/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import type { PaginatedResponse } from "../../types/api";
import type { DashboardArticle } from "../../types/articles";

const emptyPage: PaginatedResponse<DashboardArticle> = {
  count: 0,
  next: null,
  previous: null,
  results: [],
};

export default function ArticlesPage() {
  const [data, setData] = useState(emptyPage);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ordering, setOrdering] = useState<string>("-created_at");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DashboardArticle | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("articles_view_mode");
    if (saved === "table" || saved === "grid") {
      setViewMode(saved);
    }
  }, []);

  const handleSetViewMode = (mode: "grid" | "table") => {
    setViewMode(mode);
    localStorage.setItem("articles_view_mode", mode);
  };

  const load = useCallback(async () => {
    setError("");
    const params = new URLSearchParams({
      page: String(page),
      ordering: ordering,
    });
    if (search.trim()) params.set("search", search.trim());
    try {
      setData(await apiClient.get(`/api/articles?${params}`));
    } catch (value) {
      setError(isApiError(value) ? value.message : "Unable to load articles.");
    } finally {
      setLoading(false);
    }
  }, [page, search, ordering]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  const remove = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await apiClient.delete(`/api/articles?slug=${encodeURIComponent(deleteTarget.slug)}`);
      setToast("Article deleted successfully.");
      setDeleteTarget(null);
      if (data.results.length === 1 && page > 1) {
        setPage((v) => v - 1);
      } else {
        await load();
      }
    } catch (value) {
      setDeleteError(isApiError(value) ? value.message : "Unable to delete article.");
    } finally {
      setDeleting(false);
    }
  };

  const filteredArticles = data.results.filter((article) => {
    if (statusFilter === "published" && !article.is_published) return false;
    if (statusFilter === "draft" && article.is_published) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-16 view-fade">
      <Toast message={toast} onDismiss={() => setToast(null)} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Newspaper className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            <span>Digital News & Articles</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Write, review, publish, and manage station news, devotionals, and community editorial stories.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link href="/dashboard/articles/categories">
              <Tags className="mr-1.5 h-3.5 w-3.5 text-slate-500 dark:text-zinc-400" />
              <span>Categories</span>
            </Link>
          </Button>
          <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wide uppercase px-4 py-2 shadow-sm transition-all">
            <Link href="/dashboard/articles/new">
              <Plus className="mr-1.5 h-4 w-4" />
              <span>Write Article</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
              <input
                type="text"
                value={search}
                placeholder="Search articles by headline, author, or content..."
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

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-black dark:text-zinc-300"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published Only</option>
              <option value="draft">Drafts Only</option>
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
              <option value="-created_at">Recently Created</option>
              <option value="-published_at">Recently Published</option>
              <option value="title">Headline (A–Z)</option>
            </select>
          </div>

          {/* Hybrid View Mode Toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-zinc-800 dark:bg-black">
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

      {/* Articles Content View */}
      {loading ? (
        <LoadingState label="Loading station news & articles…" />
      ) : error && !data.results.length ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : !filteredArticles.length ? (
        <EmptyState
          icon={<FileText className="h-10 w-10 text-slate-400 dark:text-zinc-600" />}
          title={search ? "No matching articles found" : "No articles published yet"}
          description={
            search
              ? "Try adjusting your search keywords or active filters."
              : "Start writing the first station news story or devotional article."
          }
          action={
            !search ? (
              <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                <Link href="/dashboard/articles/new">Write First Article</Link>
              </Button>
            ) : undefined
          }
        />
      ) : viewMode === "grid" ? (
        /* Rich Grid / Visual Cards View */
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map((article) => (
            <Card
              key={article.id}
              className="group flex flex-col justify-between overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-md dark:hover:shadow-xl dark:hover:shadow-emerald-950/20"
            >
              <div>
                {/* Cover Image Container */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-black">
                  {article.cover_image ? (
                    <Image
                      src={article.cover_image}
                      alt={article.title}
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400 dark:bg-zinc-900 dark:text-zinc-700">
                      <FileText className="h-12 w-12" />
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                    {article.is_featured && (
                      <Badge variant="default" className="text-[10px] shadow-sm">
                        Featured
                      </Badge>
                    )}
                    <Badge
                      variant={article.is_published ? "default" : "secondary"}
                      className="text-[10px] shadow-sm"
                    >
                      {article.is_published ? "Published" : "Draft"}
                    </Badge>
                  </div>

                  {article.category?.name && (
                    <div className="absolute bottom-2 left-2">
                      <span className="rounded bg-black/70 px-2 py-0.5 font-semibold text-[10px] text-emerald-400 backdrop-blur-xs">
                        {article.category.name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Article Info */}
                <div className="p-5 space-y-3">
                  <Link
                    href={`/dashboard/articles/${encodeURIComponent(article.slug)}/edit`}
                    className="block"
                  >
                    <h2 className="font-bold text-base text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2 dark:text-white dark:group-hover:text-emerald-400">
                      {article.title}
                    </h2>
                  </Link>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed dark:text-zinc-400">
                    {article.summary || "No preview summary written for this publication."}
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
                      <span>{article.author || "CBM Editorial"}</span>
                    </span>
                    <span className="flex items-center gap-1 text-[11px]">
                      <Calendar className="h-3 w-3 text-slate-400 dark:text-zinc-500" />
                      <span>
                        {article.published_at
                          ? new Date(article.published_at).toLocaleDateString()
                          : "Draft"}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-3 dark:border-zinc-800/80 dark:bg-zinc-950/40">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-emerald-600 dark:text-zinc-300 dark:hover:text-emerald-400"
                >
                  <Link href={`/dashboard/articles/${encodeURIComponent(article.slug)}/edit`}>
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Edit Article</span>
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteTarget(article)}
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
                <TableHead className="w-16">Cover</TableHead>
                <TableHead>Article Headline</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Publish Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredArticles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell>
                    <div className="relative h-10 w-16 overflow-hidden rounded border border-slate-200 bg-slate-100 dark:border-zinc-800 dark:bg-black">
                      {article.cover_image ? (
                        <Image
                          src={article.cover_image}
                          alt={article.title}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-400 dark:text-zinc-600">
                          <FileText className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/articles/${encodeURIComponent(article.slug)}/edit`}
                      className="font-semibold text-sm text-slate-900 hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400 line-clamp-1 block"
                    >
                      {article.title}
                    </Link>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono">
                      /{article.slug}
                    </p>
                  </TableCell>
                  <TableCell>
                    {article.category?.name ? (
                      <Badge variant="outline" className="text-xs">
                        {article.category.name}
                      </Badge>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-zinc-600">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-slate-700 dark:text-zinc-300 font-medium">
                      {article.author || "CBM"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-slate-500 dark:text-zinc-400">
                      {article.published_at
                        ? new Date(article.published_at).toLocaleDateString()
                        : "Draft"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={article.is_published ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {article.is_published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-600 hover:text-emerald-600 dark:text-zinc-300 dark:hover:text-emerald-400"
                        title="Edit article"
                      >
                        <Link href={`/dashboard/articles/${encodeURIComponent(article.slug)}/edit`}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(article)}
                        className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                        title="Delete article"
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
        hasNext={Boolean(data.next)}
        hasPrevious={Boolean(data.previous)}
        onNext={() => setPage((v) => v + 1)}
        onPrevious={() => setPage((v) => Math.max(1, v - 1))}
      />

      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        title="Delete Article?"
        description={
          deleteTarget
            ? `Are you sure you want to permanently delete "${deleteTarget.title}"? This also removes attached inline media.`
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
