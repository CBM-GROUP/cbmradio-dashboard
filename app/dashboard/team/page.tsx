"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  Edit2,
  Plus,
  Search,
  Sparkles,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import Toast from "../../components/toast";
import { extractApiError, SiteImageFields } from "../../components/site-image-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmationDialog } from "../../components/ui/confirmation-dialog";

interface TeamMember {
  id: string;
  name: string;
  position: string;
  category: string;
  bio: string;
  image: string;
  externalImage?: string;
  is_active: boolean;
}

export default function TeamPage() {
  const [list, setList] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [category, setCategory] = useState("Leadership");
  const [bio, setBio] = useState("");
  const [image, setImage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formError, setFormError] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TeamMember | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/team")
      .then((res) => res.json())
      .then((data) => {
        setList(Array.isArray(data) ? data : data.results || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !position || submitting) return;

    setSubmitting(true);
    setFormError("");
    const body = new FormData();
    if (editingMember) body.append("id", editingMember.id);
    body.append("name", name);
    body.append("role", position);
    body.append("bio", bio || "Station Staff Member.");
    body.append("photo", image);
    body.append("is_active", String(isActive));
    if (selectedFile) body.append("uploaded_photo", selectedFile);

    const res = await fetch("/api/team", {
      method: editingMember ? "PUT" : "POST",
      body,
    });
    if (!res.ok) {
      setFormError(await extractApiError(res));
      setSubmitting(false);
      return;
    }
    const saved = await res.json();
    setList(
      editingMember
        ? list.map((m) => (m.id === saved.id ? saved : m))
        : [saved, ...list]
    );
    setToast(
      editingMember
        ? "Team member details successfully updated!"
        : "New staff profile added to directory!"
    );
    setSubmitting(false);
    clearForm();
  };

  const startEdit = (m: TeamMember) => {
    setEditingMember(m);
    setName(m.name);
    setPosition(m.position);
    setCategory(m.category);
    setBio(m.bio);
    setImage(m.externalImage || "");
    setIsActive(m.is_active);
    setSelectedFile(null);
    setFormError("");
    setShowForm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/team?id=${encodeURIComponent(deleteTarget.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setToast("Unable to delete the team member.");
        return;
      }
      setList(list.filter((item) => item.id !== deleteTarget.id));
      setToast(`Profile for “${deleteTarget.name}” removed.`);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const clearForm = () => {
    setName("");
    setPosition("");
    setCategory("Leadership");
    setBio("");
    setImage("");
    setIsActive(true);
    setSelectedFile(null);
    setFormError("");
    setEditingMember(null);
    setShowForm(false);
  };

  const filteredList = list.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.position.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      <Toast message={toast} onDismiss={() => setToast(null)} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            <span>Station Team & Personnel</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage hosts, DJs, producers, station management, and on-air contributors.
          </p>
        </div>
        <Button
          onClick={() => (showForm ? clearForm() : setShowForm(true))}
          className="bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          <span>{showForm ? "Close Form" : "Add Team Member"}</span>
        </Button>
      </div>

      {/* Editor Form */}
      {showForm && (
        <Card className="border-emerald-500/30 bg-white shadow-xl dark:bg-slate-900/95">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>{editingMember ? `Edit: ${editingMember.name}` : "Add Staff Profile"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Column 1 */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Kawooya Mitzvah"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Role / On-Air Position <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      placeholder="e.g. Presenter, Host, Station Manager"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Roster Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                    >
                      <option value="Leadership">Leadership</option>
                      <option value="Presenters">Presenters</option>
                      <option value="Producers">Producers</option>
                      <option value="Guest Contributors">Guest Contributors</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Public Visibility
                    </label>
                    <select
                      value={isActive ? "active" : "inactive"}
                      onChange={(e) => setIsActive(e.target.value === "active")}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                    >
                      <option value="active">Active — Publicly displayed</option>
                      <option value="inactive">Inactive — Hidden from public site</option>
                    </select>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="space-y-4">
                  <SiteImageFields
                    currentUrl={editingMember?.image}
                    externalUrl={image}
                    file={selectedFile}
                    onExternalUrlChange={setImage}
                    onFileChange={setSelectedFile}
                  />

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Biography / Introduction
                    </label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Brief notes about the presenter, career highlights, shows they host..."
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-600"
                    />
                  </div>

                  {formError && (
                    <p className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-2.5 text-xs text-rose-500">
                      {formError}
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <Button variant="outline" type="button" onClick={clearForm} size="sm">
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      {submitting
                        ? "Saving…"
                        : editingMember
                        ? "Update Member"
                        : "Save Member"}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          value={search}
          placeholder="Search team by name or role..."
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs"
          >
            Clear
          </button>
        )}
      </div>

      {/* Team Roster Grid */}
      {loading ? (
        <div className="flex h-40 items-center justify-center text-xs text-slate-400 dark:text-slate-500">
          Fetching team directory…
        </div>
      ) : filteredList.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600" />
          <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">No Team Profiles Found</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {search ? "No profiles matched your search." : "Click 'Add Team Member' to create the first profile."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredList.map((m) => (
            <Card
              key={m.id}
              className="group flex flex-col justify-between overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-xl dark:hover:shadow-emerald-950/20"
            >
              <div>
                {/* Photo Header */}
                <div className="relative aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-950 sm:aspect-[4/3]">
                  {m.image ? (
                    <Image
                      src={m.image}
                      alt={m.name}
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-900 dark:text-slate-700">
                      <User className="h-16 w-16" />
                    </div>
                  )}

                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                    <Badge
                      variant={m.is_active ? "default" : "secondary"}
                      className="text-[10px] shadow-sm"
                    >
                      {m.is_active ? "Active" : "Hidden"}
                    </Badge>
                  </div>

                  <div className="absolute bottom-2 left-2">
                    <span className="rounded bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 backdrop-blur-xs">
                      {m.category || "Staff"}
                    </span>
                  </div>
                </div>

                {/* Profile Details */}
                <div className="p-5 space-y-2">
                  <h3 className="font-bold text-lg text-slate-900 group-hover:text-emerald-600 transition-colors dark:text-white dark:group-hover:text-emerald-400">
                    {m.name}
                  </h3>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{m.position}</p>
                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed pt-1 dark:text-slate-400">
                    {m.bio || "No biography details added yet."}
                  </p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-3 dark:border-slate-800/80 dark:bg-slate-950/40">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEdit(m)}
                  className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteTarget(m)}
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

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={!!deleteTarget}
        title="Remove Team Member?"
        description={
          deleteTarget
            ? `Are you sure you want to remove “${deleteTarget.name}”?`
            : ""
        }
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
