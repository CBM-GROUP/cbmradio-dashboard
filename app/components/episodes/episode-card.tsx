"use client";

import Image from "next/image";
import {
  Calendar,
  Edit2,
  Film,
  Play,
  Sparkles,
  Trash2,
  Video,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { EpisodeEditorial as Episode } from "../../types/editorial";

interface EpisodeCardProps {
  episode: Episode;
  onEdit: (episode: Episode) => void;
  onDelete: (episode: Episode) => void;
}

export function EpisodeCard({
  episode,
  onEdit,
  onDelete,
}: EpisodeCardProps) {
  return (
    <Card className="group flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700">
      <div className="flex flex-col">
        {/* Cover Media Section */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100 border-b border-slate-100 dark:bg-zinc-900/60 dark:border-zinc-800/80">
          {episode.thumbnailImage ? (
            <>
              <Image
                src={episode.thumbnailImage}
                alt={episode.title}
                fill
                unoptimized
                className="object-cover transition-transform duration-300 group-hover:scale-102"
              />
              <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/50 via-black/20 to-transparent pointer-events-none" />
            </>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-slate-50 text-slate-400 dark:bg-zinc-900/40 dark:text-zinc-500">
              <Film className="h-8 w-8 stroke-[1.5] text-slate-300 dark:text-zinc-600 mb-1" />
              <span className="text-xs font-medium text-slate-400 dark:text-zinc-500">
                No thumbnail
              </span>
            </div>
          )}

          {/* Center Play Overlay on hover */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-md">
              <Play className="h-4 w-4 fill-current ml-0.5" />
            </span>
          </div>

          {/* Floating Badges */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
            <Badge
              variant="secondary"
              className="backdrop-blur-md bg-white/90 text-slate-800 dark:bg-zinc-900/90 dark:text-zinc-200 border border-slate-200/80 dark:border-zinc-700/80 text-[11px] font-medium shadow-xs truncate max-w-[170px]"
            >
              {episode.programTitle || "Radio Show"}
            </Badge>

            <div className="flex items-center gap-1.5">
              {episode.is_featured && (
                <Badge
                  variant="outline"
                  className="backdrop-blur-md bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300 text-[11px] font-semibold gap-1 shadow-xs"
                >
                  <Sparkles className="h-3 w-3 fill-amber-400 text-amber-500" />
                  <span>#{episode.featured_order}</span>
                </Badge>
              )}

              <Badge
                variant={episode.is_active ? "default" : "secondary"}
                className={cn(
                  "backdrop-blur-md text-[11px] font-medium gap-1.5 shadow-xs",
                  episode.is_active
                    ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-300"
                    : "bg-white/90 text-slate-600 dark:bg-zinc-900/90 dark:text-zinc-400 border-slate-200/80 dark:border-zinc-700"
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    episode.is_active ? "bg-emerald-500" : "bg-slate-400"
                  )}
                />
                <span>{episode.is_active ? "Active" : "Archived"}</span>
              </Badge>
            </div>
          </div>
        </div>

        {/* Card Header */}
        <CardHeader className="p-4 pb-2 space-y-1.5">
          <CardTitle
            onClick={() => onEdit(episode)}
            className="text-base font-semibold leading-snug tracking-tight text-slate-900 dark:text-zinc-100 line-clamp-2 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            {episode.title}
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed min-h-[2.5rem]">
            {episode.description || "No episode summary recorded."}
          </CardDescription>
        </CardHeader>

        {/* Card Content (Air Date & Stream) */}
        <CardContent className="p-4 pt-1 pb-3 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 pt-1 border-t border-slate-100 dark:border-zinc-800/80">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500 shrink-0" />
              <span className="font-mono text-[11px]">
                {episode.publishDate || "Unscheduled broadcast"}
              </span>
            </span>

            {episode.youtubeLink && (
              <Badge
                variant="outline"
                className="font-mono text-[10px] text-red-600 dark:text-red-400 border-red-500/30 bg-red-500/5 gap-1 shrink-0"
              >
                <Video className="h-3 w-3 text-red-500" />
                <span>YouTube</span>
              </Badge>
            )}
          </div>
        </CardContent>
      </div>

      {/* Card Footer */}
      <CardFooter className="px-4 py-2.5 bg-slate-50/50 dark:bg-zinc-950/40 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between gap-1.5">
        <div>
          {episode.youtubeLink ? (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-slate-500 hover:text-red-600 dark:hover:text-red-400"
              title="Watch broadcast on YouTube"
            >
              <a href={episode.youtubeLink} target="_blank" rel="noopener noreferrer">
                <Play className="h-3 w-3 mr-1 fill-current" />
                <span>Watch</span>
              </a>
            </Button>
          ) : (
            <span className="text-[11px] text-slate-400 dark:text-zinc-600 font-mono">
              Recorded Broadcast
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(episode)}
            className="h-8 px-2.5 text-xs font-semibold border-slate-200 hover:border-emerald-500 hover:text-emerald-600 dark:border-zinc-800 dark:text-zinc-200 dark:hover:border-emerald-500/50 dark:hover:text-emerald-400"
          >
            <Edit2 className="h-3 w-3 mr-1" />
            <span>Edit</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(episode)}
            className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
            title="Delete Episode"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
