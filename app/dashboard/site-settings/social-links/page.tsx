"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ExternalLink,
  Globe,
  Layers,
  MessageCircle,
  Pencil,
  Plus,
  Share2,
  Trash2,
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ConfirmationDialog } from "../../../components/ui/confirmation-dialog";
import { Pagination } from "../../../components/ui/pagination";
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/surfaces";
import { apiClient, isApiError } from "../../../lib/api-client";
import { socialPayload } from "../../../lib/site-settings-payloads";
import type { PaginatedResponse } from "../../../types/api";
import {
  socialPlatforms,
  type SocialLink,
  type SocialPlatform,
} from "../../../types/site-settings";

const empty: PaginatedResponse<SocialLink> = {
  count: 0,
  next: null,
  previous: null,
  results: [],
};

const initial = {
  platform_key: "facebook" as SocialPlatform,
  url: "",
  is_active: true,
  display_order: 0,
};

function PlatformIcon({ platform, className = "h-4 w-4" }: { platform: string; className?: string }) {
  switch (platform) {
    case "whatsapp":
      return <MessageCircle className={className} />;
    default:
      return <Globe className={className} />;
  }
}

function getPlatformBadge(platform: string) {
  switch (platform) {
    case "facebook":
      return {
        label: "Facebook",
        color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        placeholder: "https://facebook.com/cbmradioug",
      };
    case "instagram":
      return {
        label: "Instagram",
        color: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
        placeholder: "https://instagram.com/cbmradio",
      };
    case "youtube":
      return {
        label: "YouTube",
        color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
        placeholder: "https://youtube.com/@cbmradio",
      };
    case "x":
      return {
        label: "X (Twitter)",
        color: "bg-slate-500/10 text-slate-800 dark:text-slate-300 border-slate-500/20",
        placeholder: "https://x.com/cbmradio",
      };
    case "linkedin":
      return {
        label: "LinkedIn",
        color: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
        placeholder: "https://linkedin.com/company/cbmradio",
      };
    case "tiktok":
      return {
        label: "TikTok",
        color: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
        placeholder: "https://tiktok.com/@cbmradio",
      };
    case "whatsapp":
      return {
        label: "WhatsApp",
        color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        placeholder: "https://wa.me/256700000000",
      };
    default:
      return {
        label: platform.toUpperCase(),
        color: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
        placeholder: "https://...",
      };
  }
}

export default function SocialLinksPage() {
  const [data, setData] = useState(empty);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(initial);
  const [editing, setEditing] = useState<SocialLink | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<SocialLink | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError("");
    try {
      setData(
        await apiClient.get(
          `/api/site-settings/social-links?page=${page}&ordering=display_order,platform_key`,
        ),
      );
    } catch (v) {
      setError(isApiError(v) ? v.message : "Unable to load Social Links.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const close = () => {
    setOpen(false);
    setEditing(null);
    setForm(initial);
    setFormError("");
  };

  const edit = (v: SocialLink) => {
    setEditing(v);
    setForm({
      platform_key: v.platform_key,
      url: v.url,
      is_active: v.is_active,
      display_order: v.display_order,
    });
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      await (editing
        ? apiClient.put("/api/site-settings/social-links", {
            id: editing.id,
            ...socialPayload(form),
          })
        : apiClient.post("/api/site-settings/social-links", socialPayload(form)));
      setToast(editing ? "Social channel updated." : "Social channel created.");
      close();
      await load();
    } catch (v) {
      setFormError(isApiError(v) ? v.message : "Unable to save Social Link.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/api/site-settings/social-links?id=${deleteTarget.id}`);
      setDeleteTarget(null);
      setToast("Social channel deleted.");
      await load();
    } catch (v) {
      setDeleteError(isApiError(v) ? v.message : "Unable to delete Social Link.");
    } finally {
      setDeleting(false);
    }
  };

  const currentPlatformInfo = getPlatformBadge(form.platform_key);

  return (
    <div className="space-y-6 pb-16 view-fade max-w-5xl">
      <Toast message={toast} onDismiss={() => setToast(null)} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Share2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            <span>Social Networks & Channels</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-zinc-400">
            Public social handles, streaming accounts, and ministry chat links across footers and live feeds.
          </p>
        </div>
        <Button
          onClick={() => (open ? close() : setOpen(true))}
          variant={open ? "outline" : "default"}
          className="gap-2 shadow-xs"
        >
          {open ? (
            <>
              <CloseIcon className="h-4 w-4" />
              <span>Cancel</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>Add Channel</span>
            </>
          )}
        </Button>
      </div>

      {/* Add / Edit Form Drawer */}
      {open && (
        <Card className="border-emerald-500/30 bg-white/95 dark:border-emerald-500/20 dark:bg-zinc-950 shadow-md">
          <CardHeader className="p-5 border-b border-slate-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                  {editing ? `Edit ${editing.platform_label}` : "Configure New Channel"}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-zinc-400">
                  Select network platform, enter destination URL, and configure display ordering.
                </CardDescription>
              </div>
              <Badge variant="outline" className={currentPlatformInfo.color}>
                {currentPlatformInfo.label}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-5">
            <form onSubmit={save} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Platform Selection */}
                <div className="space-y-2">
                  <Label htmlFor="platform_key">Platform</Label>
                  <select
                    id="platform_key"
                    value={form.platform_key}
                    onChange={(e) =>
                      setForm({ ...form, platform_key: e.target.value as SocialPlatform })
                    }
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100"
                  >
                    {socialPlatforms.map((v) => {
                      const info = getPlatformBadge(v);
                      return (
                        <option key={v} value={v}>
                          {info.label}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Destination URL */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="url">Channel URL</Label>
                  <Input
                    id="url"
                    type="url"
                    required
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    placeholder={currentPlatformInfo.placeholder}
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center pt-2 border-t border-slate-100 dark:border-zinc-800/60">
                {/* Display Order */}
                <div className="space-y-1.5">
                  <Label htmlFor="display_order">Display Priority Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    min={0}
                    value={form.display_order}
                    onChange={(e) =>
                      setForm({ ...form, display_order: Number(e.target.value) })
                    }
                    className="w-32 font-mono text-xs"
                  />
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                    Lower values appear first in public footers (e.g. 0, 1, 2).
                  </p>
                </div>

                {/* Active Switch */}
                <div className="flex items-center justify-between rounded-lg border border-slate-200/80 p-3 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40">
                  <div className="space-y-0.5">
                    <Label htmlFor="is_active" className="cursor-pointer font-semibold">
                      Publish Channel
                    </Label>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                      Show in public footers and navigation links
                    </p>
                  </div>
                  <Switch
                    id="is_active"
                    checked={form.is_active}
                    onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                  />
                </div>
              </div>

              {formError && (
                <div className="rounded-md bg-rose-500/10 p-3 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2">
                <Button type="button" variant="outline" onClick={close}>
                  Cancel
                </Button>
                <Button type="submit" loading={saving}>
                  {editing ? "Save Changes" : "Create Channel"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Main Content List */}
      {loading ? (
        <LoadingState label="Loading social channels…" />
      ) : error && !data.results.length ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : !data.results.length ? (
        <EmptyState
          icon={<Share2 className="h-8 w-8 text-slate-400 dark:text-zinc-600" />}
          title="No Social Channels Configured"
          description="Add your official YouTube, Facebook, WhatsApp, or Twitter channels to engage listeners."
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.results.map((item) => {
              const info = getPlatformBadge(item.platform_key);
              return (
                <Card
                  key={item.id}
                  className="flex flex-col justify-between border-slate-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-950 transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-zinc-700"
                >
                  <CardHeader className="p-4 pb-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-md border ${info.color}`}>
                          <PlatformIcon platform={item.platform_key} className="h-4 w-4" />
                        </div>
                        <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                          {item.platform_label}
                        </h2>
                      </div>
                      <Badge
                        variant={item.is_active ? "default" : "secondary"}
                        className={
                          item.is_active
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]"
                            : "text-[10px]"
                        }
                      >
                        {item.is_active ? "Active" : "Hidden"}
                      </Badge>
                    </div>

                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 truncate"
                    >
                      <span className="truncate font-mono">{item.url}</span>
                      <ExternalLink className="h-3 w-3 shrink-0 opacity-60 group-hover:opacity-100" />
                    </a>
                  </CardHeader>

                  <div className="p-4 pt-3 flex items-center justify-between border-t border-slate-100 dark:border-zinc-800/60 mt-auto">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-zinc-500">
                      <Layers className="h-3.5 w-3.5" />
                      <span>Priority #{item.display_order}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => edit(item)}
                        className="h-7 px-2 text-xs text-slate-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteTarget(item)}
                        className="h-7 px-2 text-xs text-slate-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <Pagination
            count={data.count}
            currentPage={page}
            hasNext={!!data.next}
            hasPrevious={!!data.previous}
            onNext={() => setPage((v) => v + 1)}
            onPrevious={() => setPage((v) => Math.max(1, v - 1))}
          />
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={!!deleteTarget}
        title="Delete Social Channel?"
        description={
          deleteTarget
            ? `Are you sure you want to delete ${deleteTarget.platform_label} (${deleteTarget.url})? This will immediately remove it from the public site.`
            : ""
        }
        loading={deleting}
        error={deleteError}
        onConfirm={() => void remove()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
