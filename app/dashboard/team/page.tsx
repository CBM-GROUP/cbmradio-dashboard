"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  Edit2,
  LayoutGrid,
  List,
  Mic,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, LoadingState } from "../../components/ui/surfaces";

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
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">(() => {
    if (typeof window === "undefined") return "grid";
    const saved = localStorage.getItem("team_view_mode");
    return saved === "table" || saved === "grid" ? saved : "grid";
  });
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

  const handleSetViewMode = (mode: "grid" | "table") => {
    setViewMode(mode);
    localStorage.setItem("team_view_mode", mode);
  };

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
    body.append("category", category);
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
    setPosition(m.position || "");
    setCategory(m.category || "Leadership");
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

  const filteredList = list.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.position.toLowerCase().includes(search.toLowerCase()) ||
      (m.bio && m.bio.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (categoryFilter !== "all" && m.category !== categoryFilter) return false;
    if (statusFilter === "active" && !m.is_active) return false;
    if (statusFilter === "inactive" && m.is_active) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-16 view-fade">
      <Toast message={toast} onDismiss={() => setToast(null)} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            <span>Station Team & Personnel</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Manage station leadership, on-air presenters, broadcast producers, and guest contributors.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => (showForm ? clearForm() : setShowForm(true))}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wide uppercase px-4 py-2 shadow-sm transition-all"
          >
            {showForm ? <X className="h-4 w-4 mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
            <span>{showForm ? "Close Form" : "Add Staff Member"}</span>
          </Button>
        </div>
      </div>

      {/* Editor Form */}
      {showForm && (
        <Card className="border-emerald-500/30 bg-white shadow-xl dark:bg-zinc-950">
          <CardHeader className="border-b border-slate-100 dark:border-zinc-800 pb-4">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>{editingMember ? `Edit Profile: ${editingMember.name}` : "Add New Staff Member"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Column 1 */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Pastor David Ssemwogerere"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-black dark:text-white dark:placeholder:text-zinc-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Role / On-Air Position <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      placeholder="e.g. Senior Pastor & Morning Drive Host"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-black dark:text-white dark:placeholder:text-zinc-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Roster Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-black dark:text-white"
                    >
                      <option value="Leadership">Leadership</option>
                      <option value="Presenters">Presenters / Hosts</option>
                      <option value="Producers">Producers & Tech</option>
                      <option value="Guest Contributors">Guest Contributors</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Public Visibility
                    </label>
                    <select
                      value={isActive ? "active" : "inactive"}
                      onChange={(e) => setIsActive(e.target.value === "active")}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-black dark:text-white"
                    >
                      <option value="active">Active — Publicly displayed on website</option>
                      <option value="inactive">Hidden — Unlisted from public site</option>
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
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                      Biography & Ministry Introduction
                    </label>
                    <textarea
                      rows={4}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Brief notes about the presenter, their background, programs they host..."
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-black dark:text-white dark:placeholder:text-zinc-600"
                    />
                  </div>

                  {formError && (
                    <p className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-2.5 text-xs text-rose-500">
                      {formError}
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
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

      {/* Filter and View Mode Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
              <input
                type="text"
                value={search}
                placeholder="Search team by name or role..."
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-black dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-black dark:text-zinc-300"
            >
              <option value="all">All Departments</option>
              <option value="Leadership">Leadership</option>
              <option value="Presenters">Presenters</option>
              <option value="Producers">Producers</option>
              <option value="Guest Contributors">Guest Contributors</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-black dark:text-zinc-300"
            >
              <option value="all">All Visibility</option>
              <option value="active">Active Only</option>
              <option value="inactive">Hidden Only</option>
            </select>
          </div>

          {/* Hybrid View Mode Toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 shrink-0 self-start lg:self-center dark:border-zinc-800 dark:bg-black">
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

      {/* Team Content View */}
      {loading ? (
        <LoadingState label="Loading station team roster…" />
      ) : filteredList.length === 0 ? (
        <EmptyState
          icon={<Users className="h-10 w-10 text-slate-400 dark:text-zinc-600" />}
          title="No Team Profiles Found"
          description={
            search || categoryFilter !== "all" || statusFilter !== "all"
              ? "No team members matched the selected filters."
              : "Click 'Add Staff Member' to create the first profile."
          }
        />
      ) : viewMode === "grid" ? (
        /* Minimal Clean Staff Profile Cards */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredList.map((m) => (
            <Card
              key={m.id}
              className="group flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-950 dark:hover:shadow-emerald-950/20"
            >
              <div>
                {/* Top: Category & Status */}
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant="outline"
                    className="text-[10px] font-semibold px-2 py-0.5 border-slate-200 text-slate-700 dark:border-zinc-800 dark:text-zinc-300"
                  >
                    {m.category || "Staff"}
                  </Badge>
                  <span
                    className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-zinc-400"
                    title={m.is_active ? "Public on website" : "Hidden from website"}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        m.is_active ? "bg-emerald-500 animate-pulse" : "bg-slate-300 dark:bg-zinc-700"
                      }`}
                    />
                    <span>{m.is_active ? "Active" : "Hidden"}</span>
                  </span>
                </div>

                {/* Avatar & Title Block */}
                <div className="mt-4 flex flex-col items-center text-center">
                  <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-xs dark:border-zinc-800 dark:bg-black">
                    {m.image ? (
                      <Image
                        src={m.image}
                        alt={m.name}
                        fill
                        unoptimized
                        className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400 dark:text-zinc-600">
                        <User className="h-9 w-9 opacity-50" />
                      </div>
                    )}
                  </div>

                  <h3 className="mt-3 font-bold text-sm text-slate-900 dark:text-white truncate max-w-full">
                    {m.name}
                  </h3>

                  <div className="mt-0.5 flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-full">
                    <Mic className="h-3 w-3 shrink-0" />
                    <span className="truncate">{m.position}</span>
                  </div>
                </div>
              </div>

              {/* Minimal Actions Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startEdit(m)}
                  className="flex-1 h-7 text-xs font-semibold border-slate-200 hover:border-emerald-500 hover:text-emerald-600 dark:border-zinc-800 dark:text-zinc-200 dark:hover:border-emerald-500/50 dark:hover:text-emerald-400"
                >
                  <Edit2 className="h-3 w-3 mr-1.5" />
                  <span>Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteTarget(m)}
                  className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  title="Remove staff member"
                >
                  <Trash2 className="h-3.5 w-3.5" />
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
                <TableHead className="w-16">Photo</TableHead>
                <TableHead>Staff Name</TableHead>
                <TableHead>On-Air Position</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredList.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="relative h-10 w-10 overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-zinc-800 dark:bg-black">
                      {m.image ? (
                        <Image
                          src={m.image}
                          alt={m.name}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-400 dark:text-zinc-600">
                          <User className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-1">
                      {m.name}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono">
                      ID: {m.id}
                    </p>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-slate-700 dark:text-zinc-300 font-medium">
                      {m.position}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {m.category || "Staff"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={m.is_active ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {m.is_active ? "Active" : "Hidden"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(m)}
                        className="h-8 w-8 p-0 text-slate-600 hover:text-emerald-600 dark:text-zinc-300 dark:hover:text-emerald-400"
                        title="Edit profile"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(m)}
                        className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                        title="Delete profile"
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

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={!!deleteTarget}
        title="Remove Team Member?"
        description={
          deleteTarget
            ? `Are you sure you want to remove “${deleteTarget.name}” from the station directory?`
            : ""
        }
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
