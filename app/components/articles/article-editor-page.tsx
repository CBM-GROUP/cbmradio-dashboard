"use client";

import { ArrowLeft, ExternalLink, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Toast from "../toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { apiClient, isApiError } from "../../lib/api-client";
import {
  articleToEditorDocument,
  buildArticlePayload,
  legacyBodyToDocument,
} from "../../lib/article-content";
import type { PaginatedResponse } from "../../types/api";
import type {
  ArticleCategory,
  ArticleDocument,
  DashboardArticle,
} from "../../types/articles";
import type { ArticleMedia } from "../../types/article-media";
import RichArticleEditor from "./rich-article-editor";
import EditorialSettingsCard from "./editorial-settings-card";
import FeaturedImageCard from "./featured-image-card";
import PublicationCard from "./publication-card";

async function loadActiveCategories() {
  const categories: ArticleCategory[] = [];
  let next = "/api/article-categories?page=1&ordering=display_order,name";
  const visited = new Set<string>();

  while (next && !visited.has(next) && visited.size < 25) {
    visited.add(next);
    const page = await apiClient.get<PaginatedResponse<ArticleCategory>>(next);
    categories.push(...page.results.filter((item) => item.is_active));
    if (!page.next) break;
    next = `/api/article-categories${new URL(page.next).search}`;
  }
  return categories;
}

async function loadArticleMedia(articleId: string) {
  const records: ArticleMedia[] = [];
  let next = `/api/article-media?article=${encodeURIComponent(articleId)}&page=1`;
  const visited = new Set<string>();

  while (next && !visited.has(next) && visited.size < 25) {
    visited.add(next);
    const page = await apiClient.get<PaginatedResponse<ArticleMedia>>(next);
    records.push(...page.results);
    if (!page.next) break;
    next = `/api/article-media${new URL(page.next).search}`;
  }
  return records;
}

export default function ArticleEditorPage({ slug }: { slug?: string }) {
  const router = useRouter();
  const [article, setArticle] = useState<DashboardArticle | null>(null);
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [loading, setLoading] = useState(Boolean(slug));
  const [loadError, setLoadError] = useState("");
  const [categoriesError, setCategoriesError] = useState("");

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("CBM Radio");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [isFeatured, setIsFeatured] = useState(false);
  const [coverImage, setCoverImage] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [document, setDocument] = useState<ArticleDocument>(() =>
    legacyBodyToDocument("")
  );
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState<"draft" | "publish" | null>(null);
  const [publicationChanged, setPublicationChanged] = useState(false);
  const [existingMedia, setExistingMedia] = useState<ArticleMedia[]>([]);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [toast, setToast] = useState<string | null>(null);

  const populate = useCallback((item: DashboardArticle) => {
    setArticle(item);
    setTitle(item.title);
    setAuthor(item.author);
    setCategoryId(item.category?.id || null);
    setIsFeatured(item.is_featured);
    setCoverImage(item.external_cover_image_url || "");
    setPublishedAt(item.published_at);
    setPublicationChanged(false);
    setDocument(articleToEditorDocument(item));
    setDirty(false);
  }, []);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setLoadError("");
    try {
      const item = await apiClient.get<DashboardArticle>(
        `/api/articles?slug=${encodeURIComponent(slug)}`
      );
      populate(item);
      setExistingMedia(await loadArticleMedia(item.id));
    } catch (value) {
      setLoadError(
        isApiError(value) && value.status === 404
          ? "This Article could not be found."
          : isApiError(value)
          ? value.message
          : "Unable to load the Article."
      );
    } finally {
      setLoading(false);
    }
  }, [populate, slug]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
      loadActiveCategories()
        .then(setCategories)
        .catch((value) =>
          setCategoriesError(
            isApiError(value) ? value.message : "Categories could not be loaded."
          )
        );
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const publicationInput = useMemo(
    () => (publishedAt ? toLocalDateTime(publishedAt) : ""),
    [publishedAt]
  );

  const save = async (action: "draft" | "publish") => {
    if (saving) return;
    if (!title.trim()) {
      setFieldErrors({ title: ["Enter an article title before saving."] });
      setToast("Please enter an article title.");
      return;
    }

    setSaving(action);
    setFormError("");
    setFieldErrors({});

    const existingPublication = article
      ? {
          ...article,
          published_at: publicationChanged ? null : article.published_at,
        }
      : undefined;

    const payload = buildArticlePayload(
      {
        title,
        author,
        categoryId,
        document,
        isFeatured,
        coverImage,
        publishedAt,
      },
      action,
      existingPublication
    );

    try {
      let saved: DashboardArticle;
      if (coverFile) {
        const form = new FormData();
        if (slug) form.set("slug", slug);
        for (const [key, value] of Object.entries(payload)) {
          if (key === "content_json") form.set(key, JSON.stringify(value));
          else if (value === null) form.set(key, "");
          else form.set(key, String(value));
        }
        form.set("uploaded_cover_image", coverFile);
        saved = await (slug
          ? apiClient.put("/api/articles", form)
          : apiClient.post("/api/articles", form));
      } else {
        saved = await (slug
          ? apiClient.put("/api/articles", { slug, ...payload })
          : apiClient.post("/api/articles", payload));
      }

      populate(saved);
      setCoverFile(null);
      setToast(
        action === "publish"
          ? "Story published live to public site!"
          : "Draft saved successfully."
      );

      if (!slug) {
        router.replace(
          `/dashboard/articles/${encodeURIComponent(saved.slug)}/edit`
        );
      }
    } catch (value) {
      if (isApiError(value)) {
        setFormError(value.message);
        setFieldErrors(value.fieldErrors || {});
        setToast(value.message);
      } else {
        setFormError("Unable to save the Article.");
        setToast("An unexpected error occurred while saving.");
      }
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
          Loading editorial workspace…
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-6 text-center">
        <h2 className="text-sm font-bold text-rose-600 dark:text-rose-400">
          Article Unavailable
        </h2>
        <p className="mt-1 text-xs text-rose-500">{loadError}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void load()}
          className="mt-4"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 view-fade">
      <Toast message={toast} onDismiss={() => setToast(null)} />

      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs font-semibold text-slate-700 dark:text-zinc-300"
          >
            <Link href="/dashboard/articles">
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              <span>Articles</span>
            </Link>
          </Button>

          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>{slug ? "Edit Story" : "Write New Story"}</span>
              {article?.is_featured && (
                <Sparkles className="h-4 w-4 text-amber-500" />
              )}
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {slug ? `Editing: ${article?.title || slug}` : "Draft a new publication for the radio station website."}
            </p>
          </div>
        </div>

        {/* Live Status and Public Link */}
        <div className="flex items-center gap-2.5">
          {article && (
            <Badge
              variant={article.is_published ? "default" : "secondary"}
              className="text-xs py-1 px-3 shadow-xs"
            >
              <span
                className={`h-2 w-2 rounded-full mr-1.5 ${
                  article.is_published ? "bg-emerald-400 animate-pulse" : "bg-slate-400"
                }`}
              />
              <span>{article.is_published ? "Live & Published" : "Draft Mode"}</span>
            </Badge>
          )}

          {article?.is_published && article.slug && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 text-xs font-semibold"
            >
              <a
                href={`http://localhost:3000/news/${encodeURIComponent(article.slug)}`}
                target="_blank"
                rel="noreferrer"
              >
                <span>Live View</span>
                <ExternalLink className="h-3 w-3 ml-1 text-emerald-500" />
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Editor Grid Layout: Main Canvas + Sidebar Controls */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px] items-start">
        {/* Main Writing Canvas */}
        <main className="space-y-4 min-w-0">
          {/* Headline Input Card */}
          <Card className="border-slate-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-2">
              Article Headline <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              error-field={fieldErrors.title ? "true" : undefined}
              onChange={(e) => {
                setTitle(e.target.value);
                setDirty(true);
              }}
              placeholder="Enter a compelling, clear headline for your story..."
              className="w-full text-lg sm:text-2xl font-black text-slate-900 placeholder:text-slate-300 focus:outline-none dark:text-white dark:placeholder:text-zinc-700 bg-transparent border-0 p-0"
            />
            {fieldErrors.title?.[0] && (
              <p className="mt-2 text-xs text-rose-500">{fieldErrors.title[0]}</p>
            )}
          </Card>

          {/* Rich Body Content Card */}
          <Card className="overflow-hidden border-slate-200/80 bg-white shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
            <RichArticleEditor
              initialDocument={document}
              existingMedia={existingMedia}
              onChange={(value) => {
                setDocument(value);
                setDirty(true);
              }}
            />
            {fieldErrors.content_json?.[0] && (
              <p className="p-3 text-xs text-rose-500 bg-rose-500/10 border-t border-rose-500/20">
                {fieldErrors.content_json[0]}
              </p>
            )}
          </Card>
        </main>

        {/* Sidebar Settings Column */}
        <aside className="space-y-5 lg:sticky lg:top-4">
          {/* 1. Publication Component */}
          <PublicationCard
            article={article}
            publishedAt={publishedAt}
            publicationInput={publicationInput}
            onPublishedAtChange={(isoString) => {
              setPublishedAt(isoString);
              setPublicationChanged(true);
              setDirty(true);
            }}
            saving={saving}
            dirty={dirty}
            formError={formError}
            onSave={save}
          />

          {/* 2. Featured Image Component */}
          <FeaturedImageCard
            currentUrl={article?.cover_image}
            externalUrl={coverImage}
            file={coverFile}
            onExternalUrlChange={(value) => {
              setCoverImage(value);
              setDirty(true);
            }}
            onFileChange={(value) => {
              setCoverFile(value);
              setDirty(true);
            }}
          />

          {/* 3. Editorial Settings Component */}
          <EditorialSettingsCard
            categoryId={categoryId}
            categories={categories}
            categoriesError={categoriesError}
            categoryError={fieldErrors.category_id?.[0]}
            onCategoryChange={(value) => {
              setCategoryId(value);
              setDirty(true);
            }}
            author={author}
            authorError={fieldErrors.author?.[0]}
            onAuthorChange={(value) => {
              setAuthor(value);
              setDirty(true);
            }}
            isFeatured={isFeatured}
            onFeaturedChange={(value) => {
              setIsFeatured(value);
              setDirty(true);
            }}
          />
        </aside>
      </div>
    </div>
  );
}

function toLocalDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}
