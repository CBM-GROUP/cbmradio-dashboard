"use client";

import React, { useEffect, useState } from "react";
import {
  Globe,
  Layers,
  LayoutTemplate,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X as CloseIcon,
} from "lucide-react";
import Toast from "../../components/toast";
import { extractApiError, SiteImageFields } from "../../components/site-image-fields";
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
import { ConfirmationDialog } from "../../components/ui/confirmation-dialog";
import { LoadingState } from "../../components/ui/surfaces";

export const TARGET_PAGES = [
  { value: "home", label: "Homepage (/)" },
  { value: "about", label: "About Page (/about)" },
  { value: "programs", label: "Programs (/programs)" },
  { value: "episodes", label: "Episodes (/episodes)" },
  { value: "charts", label: "Charts (/charts)" },
  { value: "news", label: "News & Articles (/news)" },
  { value: "gallery", label: "Gallery (/gallery)" },
  { value: "contact", label: "Contact (/contact)" },
  { value: "all", label: "All Pages (Global Banner)" },
] as const;

export const SECTION_POSITIONS = [
  { value: "hero", label: "Hero Area (Top Banner)" },
  { value: "top", label: "Upper Page (Below Hero)" },
  { value: "middle", label: "Mid-Page Feature Block" },
  { value: "bottom", label: "Pre-Footer (Bottom)" },
] as const;

export type TargetPage = (typeof TARGET_PAGES)[number]["value"];
export type SectionPosition = (typeof SECTION_POSITIONS)[number]["value"];

interface Section {
  id: string;
  pk?: number | string;
  section_key: string;
  page: TargetPage;
  position: SectionPosition;
  sectionName?: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  externalImage?: string;
  cta_label: string;
  cta_url: string;
  is_active: boolean;
  order: number;
}

interface SectionForm {
  id?: string;
  section_key: string;
  page: TargetPage;
  position: SectionPosition;
  title: string;
  subtitle: string;
  body: string;
  image: string;
  ctaLabel: string;
  ctaUrl: string;
  isActive: boolean;
  order: number;
}

const emptyForm: SectionForm = {
  section_key: "",
  page: "home",
  position: "middle",
  title: "",
  subtitle: "",
  body: "",
  image: "",
  ctaLabel: "",
  ctaUrl: "",
  isActive: true,
  order: 0,
};

function getPageBadgeStyle(page: string) {
  switch (page) {
    case "home":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    case "about":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    case "programs":
      return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
    case "episodes":
      return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20";
    case "charts":
      return "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20";
    case "news":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    case "gallery":
      return "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20";
    case "contact":
      return "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20";
    case "all":
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
    default:
      return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20";
  }
}

export default function PageSectionsPage() {
  const [list, setList] = useState<Section[]>([]);
  const [availablePages, setAvailablePages] = useState<{ value: string; label: string }[]>([
    ...TARGET_PAGES,
  ]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Section | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<SectionForm>(emptyForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedPageFilter, setSelectedPageFilter] = useState<string>("all-filter");
  const [deleteTarget, setDeleteTarget] = useState<Section | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const load = async () => {
    try {
      const [sectionsRes, pagesRes] = await Promise.all([
        fetch("/api/sections"),
        fetch("/api/site-settings/pages").catch(() => null),
      ]);
      const data = await sectionsRes.json();
      setList(data.results || []);
      if (pagesRes?.ok) {
        const pagesConfig = await pagesRes.json();
        if (pagesConfig?.pages?.length) {
          setAvailablePages(
            pagesConfig.pages.map((p: { key: string; label: string }) => ({
              value: p.key,
              label: p.label,
            }))
          );
        }
      }
    } catch {
      setToast("Failed to load page sections.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, []);

  const updateForm = <K extends keyof SectionForm>(key: K, value: SectionForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const openCreate = () => {
    setEditing(null);
    setCreating(true);
    setForm({
      ...emptyForm,
      page: (selectedPageFilter !== "all-filter" ? selectedPageFilter : "home") as TargetPage,
    });
    setSelectedFile(null);
    setFormError("");
  };

  const openEdit = (section: Section) => {
    setCreating(false);
    setEditing(section);
    setForm({
      id: section.id,
      section_key: section.section_key || section.id,
      page: section.page || "home",
      position: section.position || "middle",
      title: section.title,
      subtitle: section.subtitle || "",
      body: section.description || "",
      image: section.externalImage || "",
      ctaLabel: section.cta_label || "",
      ctaUrl: section.cta_url || "",
      isActive: section.is_active,
      order: section.order || 0,
    });
    setSelectedFile(null);
    setFormError("");
  };

  const closeForm = () => {
    setCreating(false);
    setEditing(null);
    setSelectedFile(null);
    setFormError("");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    const body = new FormData();
    if (editing) {
      body.set("id", editing.section_key || editing.id);
    }
    body.set("section_key", form.section_key);
    body.set("page", form.page);
    body.set("position", form.position);
    body.set("title", form.title);
    body.set("subtitle", form.subtitle);
    body.set("body", form.body);
    body.set("image", form.image);
    body.set("cta_label", form.ctaLabel);
    body.set("cta_url", form.ctaUrl);
    body.set("is_active", String(form.isActive));
    body.set("order", String(form.order));
    if (selectedFile) body.set("uploaded_image", selectedFile);

    try {
      const response = await fetch("/api/sections", {
        method: creating ? "POST" : "PUT",
        body,
      });
      if (!response.ok) {
        setFormError(await extractApiError(response));
        return;
      }
      setToast(creating ? "Section created successfully." : "Section updated successfully.");
      closeForm();
      await load();
    } catch {
      setFormError("An unexpected error occurred while saving the section.");
    } finally {
      setSaving(false);
    }
  };

  const removeSection = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const targetId = deleteTarget.section_key || deleteTarget.id;
      const res = await fetch(`/api/sections?id=${encodeURIComponent(targetId)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setDeleteError("Unable to delete section.");
        return;
      }
      setToast("Section removed.");
      setDeleteTarget(null);
      await load();
    } catch {
      setDeleteError("Error removing section.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingState label="Loading page sections…" />;
  const showingForm = creating || editing;

  const filteredList =
    selectedPageFilter === "all-filter"
      ? list
      : list.filter((item) => item.page === selectedPageFilter || item.page === "all");

  return (
    <div className="space-y-6 pb-20 view-fade max-w-5xl">
      <Toast message={toast} onDismiss={() => setToast(null)} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <LayoutTemplate className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            <span>Multi-Page Dynamic Sections</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-zinc-400">
            Design and establish custom content sections, banner callouts, or sponsors on any page of your choice.
          </p>
        </div>
        <Button
          onClick={() => (showingForm ? closeForm() : openCreate())}
          variant={showingForm ? "outline" : "default"}
          className="gap-2 shadow-xs"
        >
          {showingForm ? (
            <>
              <CloseIcon className="h-4 w-4" />
              <span>Cancel</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>Create Section</span>
            </>
          )}
        </Button>
      </div>

      {/* Page Filter Tabs */}
      {!showingForm && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedPageFilter("all-filter")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
              selectedPageFilter === "all-filter"
                ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-xs"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800"
            }`}
          >
            All Pages ({list.length})
          </button>
          {availablePages.map((page) => {
            const count = list.filter((i) => i.page === page.value).length;
            const isSelected = selectedPageFilter === page.value;
            return (
              <button
                key={page.value}
                type="button"
                onClick={() => setSelectedPageFilter(page.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-xs"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800"
                }`}
              >
                <span>{page.label.split(" ")[0]}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 rounded-full ${
                      isSelected
                        ? "bg-white/20 text-white dark:bg-black/20 dark:text-black"
                        : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Form Drawer */}
      {showingForm && (
        <Card className="border-emerald-500/30 bg-white dark:border-emerald-500/20 dark:bg-zinc-950 shadow-md">
          <CardHeader className="p-5 border-b border-slate-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                    {creating ? "Create New Page Section" : `Edit Section: ${form.title || form.section_key}`}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 dark:text-zinc-400">
                    Choose which public page and position this section should be established on.
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className={getPageBadgeStyle(form.page)}>
                {availablePages.find((p) => p.value === form.page)?.label || form.page}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-5">
            <form onSubmit={submit} className="space-y-5">
              {/* Placement & Target Page Selection */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  <Globe className="h-4 w-4" />
                  <span>Section Placement & Page Target</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="target_page">Target Page Availability *</Label>
                    <select
                      id="target_page"
                      value={form.page}
                      onChange={(e) => updateForm("page", e.target.value as TargetPage)}
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100"
                    >
                      {availablePages.map((target) => (
                        <option key={target.value} value={target.value}>
                          {target.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                      Choose which public page will display this section, or select &quot;All Pages&quot; for a site-wide banner.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="section_position">Position On Page *</Label>
                    <select
                      id="section_position"
                      value={form.position}
                      onChange={(e) => updateForm("position", e.target.value as SectionPosition)}
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100"
                    >
                      {SECTION_POSITIONS.map((pos) => (
                        <option key={pos.value} value={pos.value}>
                          {pos.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                      Controls whether the block sits at the top, mid-body, or before the footer.
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Content Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="section_title">Section Title *</Label>
                    <Input
                      id="section_title"
                      required
                      value={form.title}
                      onChange={(e) => updateForm("title", e.target.value)}
                      placeholder="e.g. Special Revival Conference 2026"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="section_subtitle">Eyebrow / Subtitle</Label>
                    <Input
                      id="section_subtitle"
                      value={form.subtitle}
                      onChange={(e) => updateForm("subtitle", e.target.value)}
                      placeholder="e.g. LIVE BROADCAST EVENT"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="section_body">Body Narrative Text</Label>
                    <Textarea
                      id="section_body"
                      rows={5}
                      value={form.body}
                      onChange={(e) => updateForm("body", e.target.value)}
                      placeholder="Enter the descriptive narrative or announcements for this section..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="section_key">Custom Identifier / Slug (Optional)</Label>
                    <Input
                      id="section_key"
                      value={form.section_key}
                      onChange={(e) => updateForm("section_key", e.target.value)}
                      placeholder="Leave blank to auto-generate from title"
                      className="font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-lg border border-slate-200/80 p-3.5 bg-slate-50/50 dark:border-zinc-800 dark:bg-zinc-900/30">
                    <Label className="text-xs font-semibold mb-2 block">Visual Photo / Artwork</Label>
                    <SiteImageFields
                      currentUrl={editing?.image}
                      externalUrl={form.image}
                      file={selectedFile}
                      onExternalUrlChange={(value) => updateForm("image", value)}
                      onFileChange={setSelectedFile}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="cta_label">CTA Button Label</Label>
                      <Input
                        id="cta_label"
                        value={form.ctaLabel}
                        onChange={(e) => updateForm("ctaLabel", e.target.value)}
                        placeholder="e.g. Register Now"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cta_url">Button Destination</Label>
                      <Input
                        id="cta_url"
                        type="text"
                        value={form.ctaUrl}
                        onChange={(e) => updateForm("ctaUrl", e.target.value)}
                        placeholder="e.g. /programs or https://..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <div className="space-y-1.5">
                      <Label htmlFor="order">Display Priority Order</Label>
                      <Input
                        id="order"
                        type="number"
                        min={0}
                        value={form.order}
                        onChange={(e) => updateForm("order", Number(e.target.value))}
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-slate-200/80 p-3 bg-slate-50/50 dark:border-zinc-800 dark:bg-zinc-900/40">
                      <Label htmlFor="is_active" className="cursor-pointer font-semibold text-xs">
                        Publish Section
                      </Label>
                      <Switch
                        id="is_active"
                        checked={form.isActive}
                        onCheckedChange={(checked) => updateForm("isActive", checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {formError && (
                <div className="rounded-md bg-rose-500/10 p-3 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <Button type="button" variant="outline" onClick={closeForm}>
                  Cancel
                </Button>
                <Button type="submit" loading={saving}>
                  {creating ? "Establish Section" : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Sections List */}
      <div className="space-y-3">
        {filteredList.map((section) => {
          const targetPageLabel =
            availablePages.find((p) => p.value === section.page)?.label.split(" ")[0] || section.page;
          const positionLabel =
            SECTION_POSITIONS.find((pos) => pos.value === section.position)?.label.split(" ")[0] ||
            section.position;

          return (
            <Card
              key={section.id}
              className="border-slate-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-950 transition-all hover:shadow-xs hover:border-slate-300 dark:hover:border-zinc-700"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between p-5 gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={`text-[10px] font-bold ${getPageBadgeStyle(section.page)}`}>
                      Page: {targetPageLabel}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      Position: {positionLabel}
                    </Badge>
                    <Badge
                      variant={section.is_active ? "default" : "secondary"}
                      className={
                        section.is_active
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]"
                          : "text-[10px]"
                      }
                    >
                      {section.is_active ? "Live" : "Draft"}
                    </Badge>
                    <span className="text-[11px] text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                      <Layers className="h-3 w-3" />
                      Priority #{section.order}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {section.title || "Untitled Section"}
                  </h3>

                  {section.subtitle && (
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {section.subtitle}
                    </p>
                  )}

                  {section.description && (
                    <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 max-w-2xl leading-relaxed">
                      {section.description}
                    </p>
                  )}

                  {section.cta_label && (
                    <div className="pt-1 flex items-center gap-1.5 text-xs text-slate-600 dark:text-zinc-400">
                      <span className="font-semibold">{section.cta_label}</span>
                      <span className="text-slate-400 dark:text-zinc-500">({section.cta_url})</span>
                    </div>
                  )}
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(section)}
                    className="h-8 gap-1.5 text-xs"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteTarget(section)}
                    className="h-8 px-2 text-xs text-slate-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}

        {filteredList.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 p-8 text-center text-sm text-slate-500 dark:text-zinc-400">
            No sections established for {selectedPageFilter === "all-filter" ? "any page" : selectedPageFilter} yet. Click &quot;Create Section&quot; to establish one.
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={!!deleteTarget}
        title="Delete Page Section?"
        description={
          deleteTarget
            ? `Are you sure you want to remove "${deleteTarget.title || deleteTarget.section_key}"? It will immediately stop appearing on the public site.`
            : ""
        }
        loading={deleting}
        error={deleteError}
        onConfirm={() => void removeSection()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
