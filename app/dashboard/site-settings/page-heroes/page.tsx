"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  BarChart3,
  Edit2,
  ExternalLink,
  Eye,
  Film,
  Home,
  Image as ImageIcon,
  Images,
  Info,
  Layers,
  Newspaper,
  Phone,
  Plus,
  Radio,
  Sliders,
  Sparkles,
  Trash2,
  Video,
  X as CloseIcon,
} from "lucide-react";
import Toast from "../../../components/toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ConfirmationDialog } from "../../../components/ui/confirmation-dialog";
import { ErrorState, LoadingState } from "../../../components/ui/surfaces";
import { apiClient, isApiError } from "../../../lib/api-client";
import { heroMediaFields } from "../../../lib/site-settings-payloads";
import type { PaginatedResponse } from "../../../types/api";
import {
  pageKeys,
  type HeroMediaType,
  type HeroSlide,
  type ImageSource,
  type OverlayPosition,
  type PageHero,
  type PageKey,
  type SitePagesConfigResponse,
} from "../../../types/site-settings";

type HeroForm = {
  page_key: PageKey;
  title: string;
  subtitle: string;
  description: string;
  media_type: HeroMediaType;
  image_source: ImageSource;
  external_image_url: string;
  video_url: string;
  cta_label: string;
  cta_url: string;
  overlay_strength: number;
  overlay_position: OverlayPosition;
  is_active: boolean;
};

type SlideForm = {
  title: string;
  subtitle: string;
  description: string;
  media_type: "image" | "video";
  image_source: ImageSource;
  external_image_url: string;
  video_url: string;
  cta_label: string;
  cta_url: string;
  display_order: number;
  is_active: boolean;
};

const heroForm = (key: PageKey, hero?: PageHero): HeroForm => ({
  page_key: key,
  title: hero?.title || key[0].toUpperCase() + key.slice(1),
  subtitle: hero?.subtitle || "",
  description: hero?.description || "",
  media_type: hero?.media_type || "none",
  image_source: hero?.image_source || "",
  external_image_url: hero?.external_image_url || "",
  video_url: hero?.video_url || "",
  cta_label: hero?.cta_label || "",
  cta_url: hero?.cta_url || "",
  overlay_strength: hero?.overlay_strength ?? 40,
  overlay_position: hero?.overlay_position || "center",
  is_active: hero?.is_active ?? true,
});

const blankSlide: SlideForm = {
  title: "",
  subtitle: "",
  description: "",
  media_type: "image",
  image_source: "external",
  external_image_url: "",
  video_url: "",
  cta_label: "",
  cta_url: "",
  display_order: 0,
  is_active: true,
};

function getPageIcon(key: PageKey) {
  switch (key) {
    case "home":
      return <Home className="h-4 w-4" />;
    case "programs":
      return <Radio className="h-4 w-4" />;
    case "episodes":
      return <Film className="h-4 w-4" />;
    case "charts":
      return <BarChart3 className="h-4 w-4" />;
    case "news":
      return <Newspaper className="h-4 w-4" />;
    case "gallery":
      return <ImageIcon className="h-4 w-4" />;
    case "about":
      return <Info className="h-4 w-4" />;
    case "contact":
      return <Phone className="h-4 w-4" />;
    default:
      return <Images className="h-4 w-4" />;
  }
}

export default function PageHeroesPage() {
  const [heroes, setHeroes] = useState<PageHero[]>([]);
  const [availableKeys, setAvailableKeys] = useState<PageKey[]>(pageKeys);
  const [selectedKey, setSelectedKey] = useState<PageKey | null>("programs");
  const [form, setForm] = useState<HeroForm | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [heroModalOpen, setHeroModalOpen] = useState(false);

  const [slideForm, setSlideForm] = useState<SlideForm | null>(null);
  const [slideFile, setSlideFile] = useState<File | null>(null);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [slideError, setSlideError] = useState("");
  const [deleteSlide, setDeleteSlide] = useState<HeroSlide | null>(null);

  const current = heroes.find((v) => v.page_key === selectedKey);

  const load = useCallback(async () => {
    setError("");
    try {
      const [heroesData, configData] = await Promise.all([
        apiClient.get<PaginatedResponse<PageHero>>("/api/site-settings/page-heroes"),
        apiClient.get<SitePagesConfigResponse>("/api/site-settings/pages").catch(() => null),
      ]);
      setHeroes(heroesData.results);
      if (configData?.hero_page_keys?.length) {
        setAvailableKeys(configData.hero_page_keys);
      }
      const activeKey = selectedKey || (configData?.hero_page_keys?.[0] as PageKey) || "programs";
      const fresh = heroesData.results.find((v) => v.page_key === activeKey);
      setForm(heroForm(activeKey, fresh));
      if (!selectedKey) setSelectedKey(activeKey);
    } catch (v) {
      setError(isApiError(v) ? v.message : "Unable to load Page Heroes.");
    } finally {
      setLoading(false);
    }
  }, [selectedKey]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const choose = (key: PageKey) => {
    const hero = heroes.find((v) => v.page_key === key);
    setSelectedKey(key);
    setForm(heroForm(key, hero));
    setFile(null);
    setSlideForm(null);
    setEditingSlide(null);
    setHeroModalOpen(false);
  };

  const saveHero = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError("");
    const fields = {
      ...form,
      ...heroMediaFields(form.media_type, form.image_source, form.external_image_url, form.video_url),
    };

    try {
      let saved: PageHero;
      if (file) {
        const body = new FormData();
        if (current) body.set("lookup_page_key", current.page_key);
        for (const [k, v] of Object.entries(fields)) {
          if (v === undefined) continue;
          if (v === null) body.set(k, "");
          else body.set(k, String(v));
        }
        body.set("uploaded_image", file);
        saved = await (current
          ? apiClient.put("/api/site-settings/page-heroes", body)
          : apiClient.post("/api/site-settings/page-heroes", body));
      } else {
        saved = await (current
          ? apiClient.put("/api/site-settings/page-heroes", {
              lookup_page_key: current.page_key,
              ...fields,
            })
          : apiClient.post("/api/site-settings/page-heroes", fields));
      }
      setToast(`Page Hero for "${saved.page_key}" saved successfully.`);
      setHeroes((values) => [...values.filter((v) => v.page_key !== saved.page_key), saved]);
      setForm(heroForm(saved.page_key, saved));
      setFile(null);
      setHeroModalOpen(false);
    } catch (v) {
      setError(isApiError(v) ? v.message : "Unable to save Page Hero.");
    } finally {
      setSaving(false);
    }
  };

  const saveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!current || !slideForm) return;
    setSaving(true);
    setSlideError("");
    const media =
      slideForm.media_type === "image"
        ? {
            image_source: slideForm.image_source,
            external_image_url:
              slideForm.image_source === "external" ? slideForm.external_image_url : "",
            video_url: "",
            uploaded_image: slideForm.image_source === "upload" ? undefined : null,
          }
        : {
            image_source: "" as ImageSource,
            external_image_url: "",
            video_url: slideForm.video_url,
            uploaded_image: null,
          };
    const fields = { ...slideForm, ...media, page_hero: current.id };

    try {
      if (slideFile) {
        const body = new FormData();
        if (editingSlide) body.set("id", String(editingSlide.id));
        for (const [k, v] of Object.entries(fields)) {
          if (v === undefined) continue;
          body.set(k, v === null ? "" : String(v));
        }
        body.set("uploaded_image", slideFile);
        await (editingSlide
          ? apiClient.put("/api/site-settings/hero-slides", body)
          : apiClient.post("/api/site-settings/hero-slides", body));
      } else {
        await (editingSlide
          ? apiClient.put("/api/site-settings/hero-slides", { id: editingSlide.id, ...fields })
          : apiClient.post("/api/site-settings/hero-slides", fields));
      }
      setSlideForm(null);
      setEditingSlide(null);
      setSlideFile(null);
      setToast("Hero Slide saved successfully.");
      await load();
    } catch (v) {
      setSlideError(isApiError(v) ? v.message : "Unable to save Hero Slide.");
    } finally {
      setSaving(false);
    }
  };

  const removeSlide = async () => {
    if (!deleteSlide) return;
    try {
      await apiClient.delete(`/api/site-settings/hero-slides?id=${deleteSlide.id}`);
      setDeleteSlide(null);
      setToast("Hero Slide removed.");
      await load();
    } catch (v) {
      setSlideError(isApiError(v) ? v.message : "Unable to delete Hero Slide.");
    }
  };

  if (loading) return <LoadingState label="Loading Page Hero configurations…" />;

  return (
    <div className="space-y-6 pb-20 view-fade max-w-6xl">
      <Toast message={toast} onDismiss={() => setToast(null)} />

      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-slate-100 dark:border-zinc-800 pb-4">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
          <Images className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          <span>Page Hero Banners</span>
        </h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-zinc-400">
          Design visual headers, typography overlays, and interactive call-to-actions across public pages.
        </p>
      </div>

      {error && !form && <ErrorState message={error} onRetry={() => void load()} />}

      {/* Page Tabs / Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
        {availableKeys.map((key) => {
          const hero = heroes.find((v) => v.page_key === key);
          const isSelected = selectedKey === key;
          const isConfigured = !!hero;
          const isActive = hero?.is_active;

          return (
            <button
              key={key}
              type="button"
              onClick={() => choose(key)}
              className={`flex flex-col items-start justify-between rounded-xl p-3.5 text-left border transition-all ${
                isSelected
                  ? "border-emerald-500 bg-emerald-500/10 shadow-sm ring-1 ring-emerald-500/30 dark:bg-emerald-500/10"
                  : "border-slate-200/80 bg-white hover:border-slate-300 dark:border-zinc-800/80 dark:bg-zinc-950 dark:hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-3">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                    isSelected
                      ? "bg-emerald-500 text-slate-950 font-bold"
                      : "bg-slate-100 text-slate-600 dark:bg-zinc-900 dark:text-zinc-400"
                  }`}
                >
                  {getPageIcon(key)}
                </div>
                <Badge
                  variant={isConfigured ? (isActive ? "default" : "secondary") : "outline"}
                  className="text-[9px] px-1.5 py-0"
                >
                  {isConfigured ? (isActive ? "Live" : "Inactive") : "Unset"}
                </Badge>
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-900 dark:text-white capitalize">
                  {key}
                </span>
                <span className="block text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                  {hero?.media_type ? `${hero.media_type} banner` : "Not configured"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {form && (
        <Card className="overflow-hidden border-slate-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-950 shadow-xs">
          <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                {getPageIcon(form.page_key)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white capitalize">
                    {form.page_key} Hero Banner
                  </CardTitle>
                  <Badge
                    variant={current ? (form.is_active ? "default" : "secondary") : "outline"}
                    className="text-[10px] px-2 py-0.5"
                  >
                    {current ? (form.is_active ? "Live on Site" : "Inactive") : "Unconfigured"}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] px-2 py-0.5 capitalize">
                    {form.media_type === "slides"
                      ? `Multi-Slide (${current?.slides?.length || 0} slides)`
                      : `${form.media_type} format`}
                  </Badge>
                </div>
                <CardDescription className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Alignment: <strong className="capitalize">{form.overlay_position}</strong> · Dark Tint: <strong>{form.overlay_strength}%</strong> · Destination: <strong>{form.cta_url || "None"}</strong>
                </CardDescription>
              </div>
            </div>

            <Button
              onClick={() => setHeroModalOpen(true)}
              className="gap-2 text-xs sm:text-sm font-semibold shadow-xs"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>{current ? "Edit Hero" : "Configure Hero"}</span>
            </Button>
          </CardHeader>

          {/* Current Details Summary */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800/80 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/50 dark:bg-zinc-900/30 text-xs">
            <div>
              <span className="block font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider text-[10px]">
                Headline Title
              </span>
              <p className="font-bold text-slate-900 dark:text-white mt-1 text-sm">
                {form.title || "Untitled"}
              </p>
            </div>
            <div>
              <span className="block font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider text-[10px]">
                Subtitle / Eyebrow
              </span>
              <p className="font-semibold text-slate-700 dark:text-zinc-300 mt-1">
                {form.subtitle || "None"}
              </p>
            </div>
            <div>
              <span className="block font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider text-[10px]">
                Action Button
              </span>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                {form.cta_label ? `${form.cta_label} → ${form.cta_url}` : "No button configured"}
              </p>
            </div>
          </div>

          {/* Real-Time Live Preview */}
          <div className="p-4 sm:p-6 bg-slate-950">
            <HeroPreview form={form} hero={current} />
          </div>
        </Card>
      )}

      {/* Multi-Slide Carousel Management */}
      {current && form?.media_type === "slides" && (
        <Card className="border-slate-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-950">
          <CardHeader className="p-5 border-b border-slate-100 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Carousel Slides ({current.slides?.length || 0})</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-zinc-400">
                The public portal rotates or showcases active slides configured in ascending order.
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setEditingSlide(null);
                setSlideForm(blankSlide);
              }}
              className="gap-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Slide</span>
            </Button>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            <div className="space-y-2">
              {[...(current.slides || [])]
                .sort((a, b) => a.display_order - b.display_order || a.id - b.id)
                .map((slide) => (
                  <div
                    key={slide.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200/80 p-3.5 bg-slate-50/50 dark:border-zinc-800/80 dark:bg-zinc-900/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-200 dark:bg-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-300">
                        #{slide.display_order}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-xs text-slate-900 dark:text-white">
                            {slide.title || `Slide ${slide.id}`}
                          </h4>
                          <Badge
                            variant={slide.is_active ? "default" : "secondary"}
                            className="text-[9px] px-1.5 py-0"
                          >
                            {slide.is_active ? "Active" : "Hidden"}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500 truncate max-w-sm">
                          {slide.subtitle || slide.description || "No description provided."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingSlide(slide);
                          setSlideForm({ ...slide });
                        }}
                        className="h-8 px-2.5 text-xs text-slate-600 dark:text-zinc-400 hover:text-emerald-600 gap-1"
                      >
                        <Edit2 className="h-3 w-3" />
                        <span>Edit</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteSlide(slide)}
                        className="h-8 px-2 text-xs text-slate-500 hover:text-rose-600 dark:text-zinc-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}

              {(!current.slides || current.slides.length === 0) && (
                <p className="text-xs text-slate-400 dark:text-zinc-500 text-center py-6">
                  No slides created yet. Click &quot;Add Slide&quot; to configure carousel items.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hero Edit Popup Modal */}
      {heroModalOpen && form && (
        <HeroEditorModal
          form={form}
          setForm={setForm}
          file={file}
          setFile={setFile}
          error={error}
          saving={saving}
          isConfigured={!!current}
          onSubmit={saveHero}
          onCancel={() => {
            setHeroModalOpen(false);
            setError("");
          }}
        />
      )}

      {/* Slide Edit Popup Modal */}
      {slideForm && (
        <SlideEditor
          isEditing={!!editingSlide}
          form={slideForm}
          setForm={setSlideForm}
          file={slideFile}
          setFile={setSlideFile}
          error={slideError}
          saving={saving}
          onSubmit={saveSlide}
          onCancel={() => {
            setSlideForm(null);
            setEditingSlide(null);
            setSlideError("");
          }}
        />
      )}

      {/* Slide Delete Confirmation */}
      <ConfirmationDialog
        open={!!deleteSlide}
        title="Delete Carousel Slide?"
        description="Are you sure you want to remove this slide? Stored image assets will be purged."
        onConfirm={() => void removeSlide()}
        onCancel={() => setDeleteSlide(null)}
      />
    </div>
  );
}

function HeroPreview({ form, hero }: { form: HeroForm; hero?: PageHero }) {
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);

  const activeSlides: HeroSlide[] = useMemo(() => {
    return (hero?.slides || [])
      .filter((s: HeroSlide) => s.is_active)
      .sort((a: HeroSlide, b: HeroSlide) => a.display_order - b.display_order || a.id - b.id);
  }, [hero?.slides]);

  const activeSlide =
    form.media_type === "slides" && activeSlides.length > 0
      ? activeSlides[Math.min(selectedSlideIndex, activeSlides.length - 1)]
      : null;

  const image =
    form.media_type === "image"
      ? form.image_source === "external"
        ? form.external_image_url
        : hero?.resolved_image_url
      : activeSlide?.media_type === "image"
      ? activeSlide.resolved_image_url
      : "";

  const isVideo =
    form.media_type === "video" ||
    (form.media_type === "slides" && activeSlide?.media_type === "video");

  const previewTitle =
    activeSlide?.title || form.title || "Untitled Banner";
  const previewSubtitle =
    activeSlide?.subtitle || form.subtitle;
  const previewDescription =
    activeSlide?.description || form.description;
  const previewCta =
    activeSlide?.cta_label || form.cta_label;

  const alignmentClass =
    form.overlay_position === "left"
      ? "text-left items-start"
      : form.overlay_position === "right"
      ? "text-right items-end ml-auto"
      : "text-center items-center mx-auto";

  return (
    <div className="space-y-3">
      <section className="relative min-h-[260px] md:min-h-[320px] rounded-xl overflow-hidden flex items-center p-6 sm:p-10 bg-slate-900 border border-zinc-800">
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            unoptimized
            className="object-cover transition-opacity duration-300"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-slate-900 to-emerald-950/40" />
        )}

        {/* Dynamic Overlay */}
        <div
          className="absolute inset-0 bg-black transition-opacity duration-200"
          style={{ opacity: form.overlay_strength / 100 }}
        />

        {/* Decorative emerald ambient glow */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Overlay Content */}
        <div className={`relative z-10 max-w-2xl flex flex-col gap-2.5 ${alignmentClass}`}>
          <div className="flex items-center gap-2">
            {previewSubtitle && (
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-emerald-400">
                {previewSubtitle}
              </span>
            )}
            {activeSlide && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-emerald-500/50 text-emerald-300 bg-black/40">
                {activeSlide.media_type.toUpperCase()} SLIDE
              </Badge>
            )}
          </div>
          <h2 className="text-2xl md:text-4xl font-black tracking-tight text-white leading-tight">
            {previewTitle}
          </h2>
          {previewDescription && (
            <p className="text-xs md:text-sm text-zinc-300 line-clamp-3 leading-relaxed">
              {previewDescription}
            </p>
          )}
          {previewCta && (
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20">
                {previewCta}
                <ExternalLink className="h-3 w-3" />
              </span>
            </div>
          )}
          {isVideo && (
            <p className="text-[11px] text-zinc-400 italic pt-1">
              * Video stream ({activeSlide?.video_url || form.video_url || "Configured URL"}) plays interactively on the public site.
            </p>
          )}
        </div>
      </section>

      {/* Multi-slide preview stepper */}
      {form.media_type === "slides" && activeSlides.length > 1 && (
        <div className="flex items-center justify-between px-2 text-xs">
          <span className="text-slate-500 dark:text-zinc-400 font-medium">
            Previewing Slide {selectedSlideIndex + 1} of {activeSlides.length}:
          </span>
          <div className="flex items-center gap-1.5">
            {activeSlides.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setSelectedSlideIndex(idx)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                  idx === selectedSlideIndex
                    ? "bg-emerald-500 text-slate-950 shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                {slide.media_type === "video" ? "🎬" : "🖼️"} #{idx + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SlideEditor({
  isEditing,
  form,
  setForm,
  file,
  setFile,
  error,
  saving,
  onSubmit,
  onCancel,
}: {
  isEditing: boolean;
  form: SlideForm;
  setForm: (v: SlideForm) => void;
  file: File | null;
  setFile: (v: File | null) => void;
  error: string;
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-5 md:p-6 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 sm:px-6 sm:py-4 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/60 backdrop-blur-md shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <span>{isEditing ? `Edit Slide: ${form.title || `#${form.display_order}`}` : "Add Carousel Slide"}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Configure headline, media asset, and call-to-action for this slide.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition cursor-pointer"
            aria-label="Close modal"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="slide_title">Slide Headline</Label>
                <Input
                  id="slide_title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Special Gospel Broadcast"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slide_subtitle">Eyebrow / Subtitle</Label>
                <Input
                  id="slide_subtitle"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  placeholder="e.g. This Sunday 8:00 PM"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slide_desc">Narrative Summary</Label>
              <Textarea
                id="slide_desc"
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Slide description..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="slide_media_type">Media Format</Label>
                <select
                  id="slide_media_type"
                  value={form.media_type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      media_type: e.target.value as "image" | "video",
                      image_source: e.target.value === "image" ? "external" : "",
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100"
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>

              {form.media_type === "image" ? (
                <div className="space-y-1.5 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="slide_image_input">
                      {form.image_source === "upload" ? "Upload Image File" : "Image Source URL"}
                    </Label>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant={form.image_source !== "upload" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-6 px-2 text-[10px]"
                        onClick={() => {
                          setForm({ ...form, image_source: "external" });
                          setFile(null);
                        }}
                      >
                        URL
                      </Button>
                      <Button
                        type="button"
                        variant={form.image_source === "upload" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-6 px-2 text-[10px]"
                        onClick={() => setForm({ ...form, image_source: "upload" })}
                      >
                        Upload
                      </Button>
                    </div>
                  </div>
                  {form.image_source === "upload" ? (
                    <div className="space-y-1">
                      <Input
                        id="slide_image_input"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="text-xs cursor-pointer"
                      />
                      {file && (
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono truncate">
                          Ready to upload: {file.name}
                        </p>
                      )}
                    </div>
                  ) : (
                    <Input
                      id="slide_image_input"
                      value={form.external_image_url}
                      onChange={(e) => setForm({ ...form, external_image_url: e.target.value })}
                      placeholder="https://..."
                    />
                  )}
                </div>
              ) : (
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="slide_video_url">Video URL</Label>
                  <Input
                    id="slide_video_url"
                    value={form.video_url}
                    onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="space-y-1.5">
                <Label htmlFor="slide_cta_label">CTA Label</Label>
                <Input
                  id="slide_cta_label"
                  value={form.cta_label}
                  onChange={(e) => setForm({ ...form, cta_label: e.target.value })}
                  placeholder="Learn More"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slide_cta_url">CTA Destination</Label>
                <Input
                  id="slide_cta_url"
                  value={form.cta_url}
                  onChange={(e) => setForm({ ...form, cta_url: e.target.value })}
                  placeholder="/programs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slide_order">Order Priority</Label>
                <Input
                  id="slide_order"
                  type="number"
                  min={0}
                  value={form.display_order}
                  onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-200/80 p-3 bg-slate-50/50 dark:border-zinc-800 dark:bg-zinc-900/40">
              <Label htmlFor="slide_is_active" className="cursor-pointer font-semibold text-xs">
                Slide Published & Active
              </Label>
              <Switch
                id="slide_is_active"
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
              />
            </div>

            {error && (
              <div className="rounded-md bg-rose-500/10 p-3 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
                {error}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3 sm:px-6 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/60 shrink-0">
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={saving}>
              {isEditing ? "Save Changes" : "Create Slide"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function HeroEditorModal({
  form,
  setForm,
  file,
  setFile,
  error,
  saving,
  isConfigured,
  onSubmit,
  onCancel,
}: {
  form: HeroForm;
  setForm: (v: HeroForm) => void;
  file: File | null;
  setFile: (v: File | null) => void;
  error: string;
  saving: boolean;
  isConfigured: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-5 md:p-6 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl xl:max-w-6xl max-h-[92vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 sm:px-6 sm:py-4 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/60 backdrop-blur-md shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white capitalize flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <span>{isConfigured ? `Edit ${form.page_key} Hero` : `Configure ${form.page_key} Hero`}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Customize typography copy, media asset, overlay darkness, and call-to-action buttons.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition cursor-pointer"
            aria-label="Close modal"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Content Details */}
              <div className="lg:col-span-7 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="modal_title">Hero Title *</Label>
                  <Input
                    id="modal_title"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Broadcast Schedule & Live Shows"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="modal_subtitle">Subtitle / Eyebrow</Label>
                  <Input
                    id="modal_subtitle"
                    value={form.subtitle}
                    onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                    placeholder="e.g. LIVE 24/7 FROM KAMPALA"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="modal_description">Introductory Narrative</Label>
                  <Textarea
                    id="modal_description"
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Brief overview explaining what listeners will discover on this page..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <Label htmlFor="modal_cta_label">Button Label</Label>
                    <Input
                      id="modal_cta_label"
                      value={form.cta_label}
                      onChange={(e) => setForm({ ...form, cta_label: e.target.value })}
                      placeholder="e.g. Listen Live Now"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="modal_cta_url">Button Destination URL</Label>
                    <Input
                      id="modal_cta_url"
                      value={form.cta_url}
                      onChange={(e) => setForm({ ...form, cta_url: e.target.value })}
                      placeholder="e.g. /episodes or https://..."
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-slate-200/80 p-3.5 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40">
                  <div className="space-y-0.5">
                    <Label htmlFor="modal_hero_is_active" className="cursor-pointer font-semibold text-xs">
                      Enable Page Hero
                    </Label>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                      When disabled, a compact minimalist breadcrumb is shown instead.
                    </p>
                  </div>
                  <Switch
                    id="modal_hero_is_active"
                    checked={form.is_active}
                    onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                  />
                </div>
              </div>

              {/* Right Column: Visuals & Media Parameters */}
              <div className="lg:col-span-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="modal_media_type">Hero Banner Type</Label>
                  <select
                    id="modal_media_type"
                    value={form.media_type}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        media_type: e.target.value as HeroMediaType,
                        image_source:
                          e.target.value === "image" ? form.image_source || "external" : "",
                      })
                    }
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100"
                  >
                    <option value="none">Text Only (Solid Dark Theme)</option>
                    <option value="image">Static High-Res Image</option>
                    <option value="video">Background Video Stream</option>
                    <option value="slides">Multi-Slide Carousel</option>
                  </select>
                </div>

                {form.media_type === "image" && (
                  <div className="space-y-3 rounded-lg border border-slate-200/80 p-3.5 bg-slate-50/50 dark:border-zinc-800 dark:bg-zinc-900/30">
                    <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-zinc-800">
                      <ImageIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">
                        Image Source
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={form.image_source === "external" ? "default" : "outline"}
                        onClick={() => setForm({ ...form, image_source: "external" })}
                        className="text-xs h-8"
                      >
                        External Link
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={form.image_source === "upload" ? "default" : "outline"}
                        onClick={() => setForm({ ...form, image_source: "upload" })}
                        className="text-xs h-8"
                      >
                        Upload File
                      </Button>
                    </div>

                    {form.image_source === "external" ? (
                      <div className="space-y-1.5 pt-1">
                        <Label htmlFor="modal_external_image_url" className="text-xs">
                          Direct Image URL
                        </Label>
                        <Input
                          id="modal_external_image_url"
                          type="url"
                          value={form.external_image_url}
                          onChange={(e) => setForm({ ...form, external_image_url: e.target.value })}
                          placeholder="https://images.unsplash.com/..."
                          className="font-mono text-xs"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1.5 pt-1">
                        <Label htmlFor="modal_image_file" className="text-xs">
                          Upload Banner Asset
                        </Label>
                        <Input
                          id="modal_image_file"
                          type="file"
                          accept="image/*"
                          onChange={(e) => setFile(e.target.files?.[0] || null)}
                          className="text-xs cursor-pointer file:cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                )}

                {form.media_type === "video" && (
                  <div className="space-y-2 rounded-lg border border-slate-200/80 p-3.5 bg-slate-50/50 dark:border-zinc-800 dark:bg-zinc-900/30">
                    <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-zinc-800">
                      <Video className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">
                        Video Stream URL
                      </span>
                    </div>
                    <Input
                      id="modal_video_url"
                      type="url"
                      value={form.video_url}
                      onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="font-mono text-xs"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label>Typography Alignment</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant={form.overlay_position === "left" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setForm({ ...form, overlay_position: "left" })}
                      className="gap-1.5 text-xs h-9"
                    >
                      <AlignLeft className="h-3.5 w-3.5" />
                      <span>Left</span>
                    </Button>
                    <Button
                      type="button"
                      variant={form.overlay_position === "center" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setForm({ ...form, overlay_position: "center" })}
                      className="gap-1.5 text-xs h-9"
                    >
                      <AlignCenter className="h-3.5 w-3.5" />
                      <span>Center</span>
                    </Button>
                    <Button
                      type="button"
                      variant={form.overlay_position === "right" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setForm({ ...form, overlay_position: "right" })}
                      className="gap-1.5 text-xs h-9"
                    >
                      <AlignRight className="h-3.5 w-3.5" />
                      <span>Right</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="modal_overlay_strength">Dark Tint Contrast</Label>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {form.overlay_strength}%
                    </span>
                  </div>
                  <input
                    id="modal_overlay_strength"
                    type="range"
                    min={0}
                    max={100}
                    value={form.overlay_strength}
                    onChange={(e) =>
                      setForm({ ...form, overlay_strength: Number(e.target.value) })
                    }
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-md bg-rose-500/10 p-3 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3.5 sm:px-6 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/60 shrink-0">
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={saving}>
              {isConfigured ? `Update ${form.page_key} Hero` : `Publish ${form.page_key} Hero`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
