"use client";

import { useEffect, useState } from "react";
import { Building2, Mail, MapPin, Phone, Save, Sparkles } from "lucide-react";
import Toast from "../../../components/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ErrorState, LoadingState } from "../../../components/ui/surfaces";
import { apiClient, isApiError } from "../../../lib/api-client";
import type { SiteContact } from "../../../types/site-settings";

export default function ContactSettingsPage() {
  const [contact, setContact] = useState<SiteContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = async () => {
    setError("");
    try {
      setContact(await apiClient.get("/api/site-settings/contact"));
    } catch (v) {
      setError(isApiError(v) ? v.message : "Unable to load contact settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact) return;
    setSaving(true);
    setError("");

    try {
      const updated = await apiClient.put<SiteContact>("/api/site-settings/contact", {
        business_phone: contact.business_phone,
        business_email: contact.business_email,
        physical_address: contact.physical_address,
      });
      setContact(updated);
      setToast("Station contact details updated successfully.");
    } catch (v) {
      setError(isApiError(v) ? v.message : "Unable to save contact settings.");
      setToast("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState label="Loading station contact parameters…" />;
  if (!contact && error) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <div className="space-y-6 pb-16 view-fade max-w-4xl">
      <Toast message={toast} onDismiss={() => setToast(null)} />

      {/* Page Header */}
      <div className="flex flex-col gap-2 border-b border-slate-100 dark:border-zinc-800 pb-4">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
          <Building2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          <span>Station Contact & Headquarters</span>
        </h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-zinc-400">
          Configure public office coordinates, broadcast helplines, and ministry inquiry email addresses.
        </p>
      </div>

      <form onSubmit={save}>
        <Card className="border-slate-200/80 bg-white shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
          <CardHeader className="p-6 border-b border-slate-100 dark:border-zinc-800/80">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                  Direct Station Channels
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-zinc-400">
                  Displayed on the public website footer, prayer line, and Contact Us page.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Business Phone */}
              <div className="space-y-2">
                <Label htmlFor="business_phone" className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
                  <span>Main Studio & Office Phone</span>
                </Label>
                <Input
                  id="business_phone"
                  type="text"
                  value={contact?.business_phone || ""}
                  onChange={(e) =>
                    contact && setContact({ ...contact, business_phone: e.target.value })
                  }
                  placeholder="+256 700 000 000"
                  className="font-mono text-xs"
                />
                <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                  Primary listener helpline and pastoral counseling line.
                </p>
              </div>

              {/* Business Email */}
              <div className="space-y-2">
                <Label htmlFor="business_email" className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
                  <span>Official Inquiry Email</span>
                </Label>
                <Input
                  id="business_email"
                  type="email"
                  value={contact?.business_email || ""}
                  onChange={(e) =>
                    contact && setContact({ ...contact, business_email: e.target.value })
                  }
                  placeholder="contact@cbmradio.org"
                  className="font-mono text-xs"
                />
                <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                  Receives digital contact form inquiries and sponsorship requests.
                </p>
              </div>
            </div>

            {/* Physical Address */}
            <div className="space-y-2 pt-2">
              <Label htmlFor="physical_address" className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
                <span>Station Studio Location & Postal Address</span>
              </Label>
              <Textarea
                id="physical_address"
                rows={3}
                value={contact?.physical_address || ""}
                onChange={(e) =>
                  contact && setContact({ ...contact, physical_address: e.target.value })
                }
                placeholder="Plot 12, Kampala Road, Broadcast Tower, Kampala, Uganda"
                className="text-xs leading-relaxed"
              />
              <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                Official office and studio directions provided to visitors and ministry partners.
              </p>
            </div>

            {error && (
              <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
                {error}
              </div>
            )}
          </CardContent>

          <CardFooter className="p-6 border-t border-slate-100 bg-slate-50/60 dark:border-zinc-800/80 dark:bg-black/40 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono">
              Last saved coordinates in sync with database.
            </span>
            <Button
              type="submit"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? "Saving Changes…" : "Save Contact Info"}</span>
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
