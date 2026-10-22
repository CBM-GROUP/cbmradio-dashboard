"use client";

import React, { useEffect, useState } from "react";
import {
  LayoutTemplate,
  Pencil,
  Plus,
  Sparkles,
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
import { LoadingState } from "../../components/ui/surfaces";

const sectionKeys = ["hero", "about", "mission", "vision", "contact", "footer", "sponsors", "gallery"];

interface Section {
  id: string;
  sectionName: string;
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
  sectionKey: string;
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
  sectionKey: "gallery",
  title: "",
  subtitle: "",
  body: "",
  image: "",
  ctaLabel: "",
  ctaUrl: "",
  isActive: true,
  order: 0,
};

export default function PageSectionsPage() {
  const [list, setList] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Section | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<SectionForm>(emptyForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/sections")
      .then((response) => response.json())
      .then((data) => setList(data.results || []))
      .finally(() => setLoading(false));
  }, []);

  const updateForm = <K extends keyof SectionForm>(key: K, value: SectionForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const openCreate = () => {
    const available = sectionKeys.find((key) => !list.some((section) => section.id === key));
    if (!available) {
      setToast("All supported page sections already exist.");
      return;
    }
    setEditing(null);
    setCreating(true);
    setForm({ ...emptyForm, sectionKey: available });
    setSelectedFile(null);
    setFormError("");
  };

  const openEdit = (section: Section) => {
    setCreating(false);
    setEditing(section);
    setForm({
      sectionKey: section.id,
      title: section.title,
      subtitle: section.subtitle,
      body: section.description,
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
    body.set("section_key", form.sectionKey);
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
      const saved = await response.json();
      setList((current) =>
        creating ? [...current, saved] : current.map((section) => (section.id === saved.id ? saved : section)),
      );
      setToast(creating ? "Page section created successfully." : "Page section updated successfully.");
      closeForm();
    } catch {
      setFormError("An unexpected error occurred while saving the section.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState label="Loading page sections…" />;
  const showingForm = creating || editing;

  return (
    <div className="space-y-6 pb-20 view-fade max-w-5xl">
      <Toast message={toast} onDismiss={() => setToast(null)} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <LayoutTemplate className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            <span>Homepage & Landing Sections</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-zinc-400">
            Configure standalone landing content blocks, mission declarations, sponsor grids, and promo features.
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
              <span>Add Section</span>
            </>
          )}
        </Button>
      </div>

      {/* Form Drawer */}
      {showingForm && (
        <Card className="border-emerald-500/30 bg-white dark:border-emerald-500/20 dark:bg-zinc-950 shadow-md">
          <CardHeader className="p-5 border-b border-slate-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                    {creating ? "Create Homepage Section" : `Edit Section: ${form.sectionKey}`}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 dark:text-zinc-400">
                    Set headline copy, body narrative, background imagery, and navigation action.
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="capitalize">
                {form.sectionKey}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-5">
            <form onSubmit={submit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left side: text copy */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="section_key">Target Section Placement</Label>
                    <select
                      id="section_key"
                      disabled={!creating}
                      value={form.sectionKey}
                      onChange={(e) => updateForm("sectionKey", e.target.value)}
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100 capitalize"
                    >
                      {sectionKeys
                        .filter((key) => key === form.sectionKey || !list.some((section) => section.id === key))
                        .map((key) => (
                          <option key={key} value={key} className="capitalize">
                            {key} section
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="section_title">Section Title *</Label>
                    <Input
                      id="section_title"
                      required
                      value={form.title}
                      onChange={(e) => updateForm("title", e.target.value)}
                      placeholder="e.g. Spreading Hope Through The Airwaves"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="section_subtitle">Eyebrow / Subtitle</Label>
                    <Input
                      id="section_subtitle"
                      value={form.subtitle}
                      onChange={(e) => updateForm("subtitle", e.target.value)}
                      placeholder="e.g. OUR MINISTERIAL MISSION"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="section_body">Body Narrative</Label>
                    <Textarea
                      id="section_body"
                      rows={5}
                      value={form.body}
                      onChange={(e) => updateForm("body", e.target.value)}
                      placeholder="Main descriptive text rendered for this section..."
                    />
                  </div>
                </div>

                {/* Right side: imagery & action */}
                <div className="space-y-4">
                  <div className="rounded-lg border border-slate-200/80 p-3.5 bg-slate-50/50 dark:border-zinc-800 dark:bg-zinc-900/30">
                    <Label className="text-xs font-semibold mb-2 block">Visual Artwork / Photo</Label>
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
                        placeholder="e.g. Read Full Story"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cta_url">CTA Destination URL</Label>
                      <Input
                        id="cta_url"
                        type="text"
                        value={form.ctaUrl}
                        onChange={(e) => updateForm("ctaUrl", e.target.value)}
                        placeholder="e.g. /about or https://..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <div className="space-y-1.5">
                      <Label htmlFor="order">Display Order</Label>
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
                  {creating ? "Create Section" : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Sections List */}
      <div className="space-y-3">
        {list.map((section) => (
          <Card
            key={section.id}
            className="border-slate-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-950 transition-all hover:shadow-xs hover:border-slate-300 dark:hover:border-zinc-700"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between p-5 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                    {section.sectionName || section.id}
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
                  <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                    Order #{section.order}
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
              </div>
            </div>
          </Card>
        ))}

        {list.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 p-8 text-center text-sm text-slate-500 dark:text-zinc-400">
            No page sections configured yet. Click &quot;Add Section&quot; to create one.
          </div>
        )}
      </div>
    </div>
  );
}
