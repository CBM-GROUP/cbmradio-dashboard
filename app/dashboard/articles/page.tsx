"use client";

import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  Copy,
  Edit2,
  ExternalLink,
  Eye,
  FileEdit,
  FileText,
  Filter,
  LayoutGrid,
  List,
  Newspaper,
  Plus,
  Search,
  Sparkles,
  Star,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Toast from "../../components/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmationDialog } from "../../components/ui/confirmation-dialog";
import { Pagination } from "../../components/ui/pagination";
import { DashboardArticleCard } from "../../components/articles/dashboard-article-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, ErrorState } from "../../components/ui/surfaces";
import { apiClient, isApiError } from "../../lib/api-client";
import type { PaginatedResponse } from "../../types/api";
import type { ArticleCategory, DashboardArticle } from "../../types/articles";

const emptyPage: PaginatedResponse<DashboardArticle> = {
  count: 0,
  next: null,
  previous: null,
  results: [],
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Draft";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Draft";
  }
}

export default function ArticlesPage() {
  const [data, setData] = useState(emptyPage);
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<"all" | "published" | "draft" | "featured">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [ordering, setOrdering] = useState<string>("-created_at");
  const [viewMode, setViewMode] = useState<"grid" | "table">(() => {
    if (typeof window === "undefined") return "grid";
    const saved = localStorage.getItem("articles_view_mode");
    return saved === "table" || saved === "grid" ? saved : "grid";
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DashboardArticle | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);

  const handleSetViewMode = (mode: "grid" | "table") => {
    setViewMode(mode);
    localStorage.setItem("articles_view_mode", mode);
  };

  // Load active categories for filter dropdown
  useEffect(() => {
    apiClient
      .get<PaginatedResponse<ArticleCategory>>("/api/article-categories?page=1&ordering=display_order,name")
      .then((res) => setCategories(res.results.filter((c) => c.is_active)))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setError("");
    const params = new URLSearchParams({
      page: String(page),
      ordering: ordering,
    });

    if (search.trim()) params.set("search", search.trim());
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (statusTab === "published") params.set("is_published", "true");
    if (statusTab === "draft") params.set("is_published", "false");
    if (statusTab === "featured") params.set("is_featured", "true");

    try {
      setData(await apiClient.get(`/api/articles?${params}`));
    } catch (value) {
      setError(isApiError(value) ? value.message : "Unable to load articles.");
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter, statusTab, ordering]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 200);
    return () => window.clearTimeout(timer);
  }, [load]);

  // Direct inline toggle for publication status
  const handleTogglePublish = async (article: DashboardArticle) => {
    const newStatus = !article.is_published;
    const key = `publish-${article.id}`;
    setActionLoading((prev) => ({ ...prev, [key]: true }));

    try {
      await apiClient.put("/api/articles", {
        slug: article.slug,
        is_published: newStatus,
        published_at: newStatus ? new Date().toISOString() : null,
      });

      setData((prev) => ({
        ...prev,
        results: prev.results.map((item) =>
          item.id === article.id
            ? {
                ...item,
                is_published: newStatus,
                status: newStatus ? "Published" : "Draft",
                published_at: newStatus ? new Date().toISOString() : null,
              }
            : item
        ),
      }));

      setToast(
        newStatus
          ? `“${article.title}” is now live on the public website.`
          : `“${article.title}” moved back to drafts.`
      );
    } catch (value) {
      setToast(isApiError(value) ? value.message : "Failed to update publication status.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Direct inline toggle for featured status
  const handleToggleFeatured = async (article: DashboardArticle) => {
    const newFeatured = !article.is_featured;
    const key = `feature-${article.id}`;
    setActionLoading((prev) => ({ ...prev, [key]: true }));

    try {
      await apiClient.put("/api/articles", {
        slug: article.slug,
        is_featured: newFeatured,
      });

      setData((prev) => ({
        ...prev,
        results: prev.results.map((item) =>
          item.id === article.id ? { ...item, is_featured: newFeatured } : item
        ),
      }));

      setToast(
        newFeatured
          ? `“${article.title}” pinned to featured stories.`
          : `“${article.title}” removed from featured stories.`
      );
    } catch (value) {
      setToast(isApiError(value) ? value.message : "Failed to update featured status.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Copy live link to clipboard
  const handleCopyLink = (slug: string) => {
    const url = `http://localhost:3000/news/${encodeURIComponent(slug)}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setToast("Public story link copied to clipboard!");
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await apiClient.delete(`/api/articles?slug=${encodeURIComponent(deleteTarget.slug)}`);
      setToast(`Article “${deleteTarget.title}” removed permanently.`);
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

  // Compute stats across current results for summary chips
  const stats = useMemo(() => {
    const list = data.results;
    return {
      total: data.count,
      published: list.filter((a) => a.is_published).length,
      drafts: list.filter((a) => !a.is_published).length,
      featured: list.filter((a) => a.is_featured).length,
    };
  }, [data]);

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
            Publish station news, devotionals, event recaps, and community editorial stories.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button asChild variant="outline" size="sm" className="text-xs font-semibold">
            <Link href="/dashboard/articles/categories">
              <Tags className="mr-1.5 h-3.5 w-3.5 text-slate-500 dark:text-zinc-400" />
              <span>Categories ({categories.length})</span>
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wide uppercase px-4 py-2 shadow-sm transition-all"
          >
            <Link href="/dashboard/articles/new">
              <Plus className="mr-1.5 h-4 w-4" />
              <span>Write Article</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Editorial KPI Ribbon (Clickable Overview Cards) */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {/* Total Articles */}
        <Card
          onClick={() => {
            setStatusTab("all");
            setPage(1);
          }}
          className={`p-4 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md ${
            statusTab === "all"
              ? "border-emerald-500 bg-emerald-50/50 dark:border-emerald-500/50 dark:bg-emerald-950/20"
              : "hover:border-slate-300 dark:hover:border-zinc-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Total Stories
            </span>
            <FileText className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.total}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400">articles</span>
          </div>
        </Card>

        {/* Published */}
        <Card
          onClick={() => {
            setStatusTab("published");
            setPage(1);
          }}
          className={`p-4 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md ${
            statusTab === "published"
              ? "border-emerald-500 bg-emerald-50/50 dark:border-emerald-500/50 dark:bg-emerald-950/20"
              : "hover:border-slate-300 dark:hover:border-zinc-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Live & Published
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.published}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              On Air & Web
            </span>
          </div>
        </Card>

        {/* Drafts */}
        <Card
          onClick={() => {
            setStatusTab("draft");
            setPage(1);
          }}
          className={`p-4 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md ${
            statusTab === "draft"
              ? "border-amber-500 bg-amber-50/50 dark:border-amber-500/50 dark:bg-amber-950/20"
              : "hover:border-slate-300 dark:hover:border-zinc-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Drafts / Review
            </span>
            <FileEdit className="h-4 w-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.drafts}
            </span>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              In progress
            </span>
          </div>
        </Card>

        {/* Featured */}
        <Card
          onClick={() => {
            setStatusTab("featured");
            setPage(1);
          }}
          className={`p-4 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md ${
            statusTab === "featured"
              ? "border-purple-500 bg-purple-50/50 dark:border-purple-500/50 dark:bg-purple-950/20"
              : "hover:border-slate-300 dark:hover:border-zinc-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Frontpage Featured
            </span>
            <Sparkles className="h-4 w-4 text-purple-500 dark:text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.featured}
            </span>
            <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
              Top showcase
            </span>
          </div>
        </Card>
      </div>

      {/* Control Bar: Segmented Status Tabs + Toolbar */}
      <Card className="p-4 space-y-3.5">
        {/* Segmented Status Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800 pb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "all", label: "All Stories", count: stats.total },
              { id: "published", label: "Published Live", count: stats.published },
              { id: "draft", label: "Drafts Only", count: stats.drafts },
              { id: "featured", label: "Featured Stories", count: stats.featured },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusTab(tab.id as typeof statusTab);
                  setPage(1);
                }}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  statusTab === tab.id
                    ? "bg-emerald-600 text-white shadow-xs dark:bg-emerald-500 dark:text-black"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                    statusTab === tab.id
                      ? "bg-black/20 text-white dark:bg-black/30 dark:text-black"
                      : "bg-white text-slate-700 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 shrink-0 dark:border-zinc-800 dark:bg-black">
            <button
              onClick={() => handleSetViewMode("grid")}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white text-emerald-600 shadow-xs dark:bg-zinc-900 dark:text-emerald-400"
                  : "text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
              title="Grid cards layout"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => handleSetViewMode("table")}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                viewMode === "table"
                  ? "bg-white text-emerald-600 shadow-xs dark:bg-zinc-900 dark:text-emerald-400"
                  : "text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
              title="Dense data table layout"
            >
              <List className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px] max-w-md">
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

            {/* Category Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-black dark:text-zinc-300"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

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

            {(search || categoryFilter !== "all" || statusTab !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setCategoryFilter("all");
                  setStatusTab("all");
                  setPage(1);
                }}
                className="text-xs text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white h-7 px-2"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                <span>Reset Filters</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Articles Content Section */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Card key={n} className="overflow-hidden animate-pulse">
              <div className="aspect-video bg-slate-200 dark:bg-zinc-800" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-3/4" />
                <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-full" />
                <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-2/3" />
                <div className="pt-2 flex justify-between">
                  <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-20" />
                  <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-16" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : error && !data.results.length ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : !data.results.length ? (
        <EmptyState
          icon={<FileText className="h-10 w-10 text-slate-400 dark:text-zinc-600" />}
          title={search ? "No matching articles found" : "No articles in this section"}
          description={
            search || categoryFilter !== "all" || statusTab !== "all"
              ? "Try adjusting your search keywords, clearing categories, or switching tabs."
              : "Start drafting inspiring stories, devotionals, or station bulletins."
          }
          action={
            <div className="flex items-center gap-2">
              {(search || categoryFilter !== "all" || statusTab !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setCategoryFilter("all");
                    setStatusTab("all");
                    setPage(1);
                  }}
                >
                  Clear Filters
                </Button>
              )}
              <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                <Link href="/dashboard/articles/new">Write First Article</Link>
              </Button>
            </div>
          }
        />
      ) : viewMode === "grid" ? (
        /* Visual Grid of Editorial Articles */
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.results.map((article) => (
            <DashboardArticleCard
              key={article.id}
              article={article}
              isPublishing={actionLoading[`publish-${article.id}`]}
              isFeaturing={actionLoading[`feature-${article.id}`]}
              onTogglePublish={handleTogglePublish}
              onToggleFeatured={handleToggleFeatured}
              onCopyLink={handleCopyLink}
              onDelete={setDeleteTarget}
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
                <TableHead>Headline & Summary</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Published Date</TableHead>
                <TableHead className="text-center w-20">Views</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.results.map((article) => {
                const isPublishing = actionLoading[`publish-${article.id}`];
                const isFeaturing = actionLoading[`feature-${article.id}`];

                return (
                  <TableRow key={article.id}>
                    <TableCell>
                      <div className="relative h-11 w-16 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-zinc-800 dark:bg-black">
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
                    <TableCell className="max-w-xs md:max-w-sm">
                      <Link
                        href={`/dashboard/articles/${encodeURIComponent(article.slug)}/edit`}
                        className="font-bold text-sm text-slate-900 hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400 line-clamp-1 block"
                      >
                        {article.title}
                      </Link>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                        {article.summary || `/${article.slug}`}
                      </p>
                    </TableCell>
                    <TableCell>
                      {article.category?.name ? (
                        <Badge variant="outline" className="text-xs font-semibold">
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
                      <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
                        {formatDate(article.published_at || article.created_at)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 font-mono">
                        <Eye className="h-3 w-3" />
                        {article.views_count ?? 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        disabled={isPublishing}
                        onClick={() => void handleTogglePublish(article)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${
                          article.is_published
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                            : "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800"
                        }`}
                        title={article.is_published ? "Click to set as draft" : "Click to publish live"}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            article.is_published ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                          }`}
                        />
                        <span>{isPublishing ? "Saving…" : article.is_published ? "Live" : "Draft"}</span>
                      </button>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        disabled={isFeaturing}
                        onClick={() => void handleToggleFeatured(article)}
                        className={`p-1.5 rounded-md transition cursor-pointer ${
                          article.is_featured
                            ? "text-amber-500 bg-amber-50 dark:bg-amber-950/30"
                            : "text-slate-300 hover:text-amber-400 dark:text-zinc-600"
                        }`}
                        title={article.is_featured ? "Featured story (click to unpin)" : "Click to pin to frontpage"}
                      >
                        <Star className={`h-4 w-4 ${article.is_featured ? "fill-amber-400" : ""}`} />
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {article.is_published && (
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                            title="Open live story on website"
                          >
                            <a
                              href={`http://localhost:3000/news/${encodeURIComponent(article.slug)}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyLink(article.slug)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                          title="Copy live link"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
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
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Pagination Controls */}
      <Pagination
        count={data.count}
        currentPage={page}
        hasNext={Boolean(data.next)}
        hasPrevious={Boolean(data.previous)}
        onNext={() => setPage((v) => v + 1)}
        onPrevious={() => setPage((v) => Math.max(1, v - 1))}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        title="Delete Article?"
        description={
          deleteTarget
            ? `Are you sure you want to permanently delete "${deleteTarget.title}"? This will unpublish the story and remove attached inline media.`
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
