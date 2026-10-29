"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Props = {
  currentUrl?: string;
  externalUrl: string;
  file: File | null;
  onExternalUrlChange: (value: string) => void;
  onFileChange: (file: File | null) => void;
};

export function SiteImageFields({
  currentUrl,
  externalUrl,
  file,
  onExternalUrlChange,
  onFileChange,
}: Props) {
  const [filePreview, setFilePreview] = useState("");

  useEffect(
    () => () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    },
    [filePreview],
  );

  const preview = filePreview || currentUrl || externalUrl;
  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
        Local image file
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(event) => {
            const selected = event.target.files?.[0] || null;
            onFileChange(selected);
            setFilePreview(selected ? URL.createObjectURL(selected) : "");
          }}
          className="mt-1 w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 dark:border-zinc-800 dark:bg-black dark:text-white"
        />
        <span className="mt-1 block text-[10px] text-slate-500 dark:text-zinc-400">
          JPEG, PNG, WebP, or GIF; maximum 5 MB.
        </span>
      </label>
      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
        External image URL
        <input
          type="url"
          value={externalUrl}
          onChange={(event) => onExternalUrlChange(event.target.value)}
          placeholder="Optional legacy/external URL"
          className="mt-1 w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-slate-900 outline-none focus:border-emerald-500 dark:border-zinc-800 dark:bg-black dark:text-white"
        />
      </label>
      {preview && (
        <div className="relative aspect-video overflow-hidden rounded border border-slate-200 bg-slate-100 dark:border-zinc-800 dark:bg-black">
          <Image src={preview} alt="Selected image preview" fill unoptimized className="object-cover" />
        </div>
      )}
      {currentUrl && !file && (
        <p className="text-[10px] text-slate-500 dark:text-zinc-400">
          The current uploaded image is preserved unless you select a replacement.
        </p>
      )}
    </div>
  );
}

function findStringError(data: unknown): string | null {
  if (typeof data === "string" && data.trim() && !data.trim().startsWith("<")) {
    return data.trim();
  }
  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findStringError(item);
      if (found) return found;
    }
    return null;
  }
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    for (const key of ["error", "message", "detail", "non_field_errors"]) {
      const found = findStringError(obj[key]);
      if (found) return found;
    }
    for (const value of Object.values(obj)) {
      const found = findStringError(value);
      if (found) return found;
    }
  }
  return null;
}

export async function extractApiError(data: unknown): Promise<string> {
  if (typeof Response !== "undefined" && data instanceof Response) {
    if (data.status === 401) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("dashboard:session-expired"));
      }
      return "Your administrator session has expired. Please log in again.";
    }
    if (data.status === 403) {
      return "You do not have administrator permissions to perform this action.";
    }
    try {
      const json = await data.json();
      const extracted = findStringError(json);
      if (extracted) return extracted;
    } catch {
      // not JSON
    }
    if (data.status >= 500) {
      return `The backend server encountered an error (HTTP ${data.status}).`;
    }
    return data.statusText || "The request could not be completed.";
  }

  const extracted = findStringError(data);
  return extracted || "The request could not be completed.";
}
