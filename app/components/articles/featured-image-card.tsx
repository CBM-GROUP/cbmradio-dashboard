"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Image as ImageIcon,
  Link2,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FeaturedImageCardProps {
  currentUrl?: string;
  externalUrl: string;
  file: File | null;
  onExternalUrlChange: (url: string) => void;
  onFileChange: (file: File | null) => void;
}

export default function FeaturedImageCard({
  currentUrl,
  externalUrl,
  file,
  onExternalUrlChange,
  onFileChange,
}: FeaturedImageCardProps) {
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filePreview = useMemo(() => {
    if (!file) return "";
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  const activePreview = filePreview || externalUrl || currentUrl;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type.startsWith("image/")) {
      onFileChange(droppedFile);
    }
  };

  const handleClearImage = () => {
    onFileChange(null);
    onExternalUrlChange("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Card className="border-slate-200/80 bg-white shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
      <CardHeader className="p-4 border-b border-slate-100 dark:border-zinc-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ImageIcon className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                Featured Cover Image
              </CardTitle>
              <CardDescription className="text-[11px] text-slate-500 dark:text-zinc-400">
                16:9 banner thumbnail for editorial stories
              </CardDescription>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-zinc-800 dark:bg-black">
            <button
              type="button"
              onClick={() => setMode("upload")}
              className={`flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold transition cursor-pointer ${
                mode === "upload"
                  ? "bg-white text-emerald-600 shadow-xs dark:bg-zinc-900 dark:text-emerald-400"
                  : "text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              <UploadCloud className="h-3 w-3" />
              <span>Upload</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("url")}
              className={`flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold transition cursor-pointer ${
                mode === "url"
                  ? "bg-white text-emerald-600 shadow-xs dark:bg-zinc-900 dark:text-emerald-400"
                  : "text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              <Link2 className="h-3 w-3" />
              <span>URL</span>
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3.5">
        {/* Active Image Preview Box */}
        {activePreview ? (
          <div className="group relative aspect-video w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-inner dark:border-zinc-800 dark:bg-black">
            <Image
              src={activePreview}
              alt="Article cover preview"
              fill
              unoptimized
              className="object-cover transition-transform duration-300 group-hover:scale-102"
            />
            {/* Gradient Scrim & Top Badge */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 opacity-80" />

            <div className="absolute top-2 left-2 flex items-center gap-1.5">
              <span className="rounded bg-black/60 px-2 py-0.5 text-[10px] font-mono font-bold text-white backdrop-blur-md">
                16:9 Cover
              </span>
              {file && (
                <span className="rounded bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold text-black backdrop-blur-md">
                  New File
                </span>
              )}
            </div>

            {/* Remove / Change actions overlay */}
            <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (mode === "upload") fileInputRef.current?.click();
                  else handleClearImage();
                }}
                className="h-6 px-2 text-[10px] bg-black/70 text-white hover:bg-black border border-white/20 backdrop-blur-xs"
              >
                Change
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleClearImage}
                className="h-6 w-6 p-0 bg-rose-600/90 hover:bg-rose-600 text-white backdrop-blur-xs"
                title="Remove image"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : null}

        {/* Input Control Mode */}
        {mode === "upload" ? (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => {
                const selected = e.target.files?.[0] || null;
                onFileChange(selected);
              }}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition-all cursor-pointer ${
                isDragging
                  ? "border-emerald-500 bg-emerald-50/50 dark:border-emerald-400 dark:bg-emerald-950/20"
                  : "border-slate-200 bg-slate-50/50 hover:border-emerald-500/50 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900/30 dark:hover:border-emerald-500/40"
              }`}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400 mb-2">
                <UploadCloud className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                {file ? file.name : "Click to upload or drag photo"}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-400 dark:text-zinc-500">
                PNG, JPG, WebP up to 5 MB
              </p>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
              Image Web Link
            </label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => onExternalUrlChange(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-8 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-black dark:text-zinc-100 dark:placeholder:text-zinc-600 font-mono"
              />
              {externalUrl && (
                <button
                  type="button"
                  onClick={() => onExternalUrlChange("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <p className="mt-1 text-[10px] text-slate-400 dark:text-zinc-500">
              Paste a direct HTTPS image URL from Unsplash or CDN.
            </p>
          </div>
        )}

        {currentUrl && !file && !externalUrl && (
          <p className="text-[10px] text-slate-400 dark:text-zinc-500 italic">
            Existing photo is retained unless a replacement is chosen.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
