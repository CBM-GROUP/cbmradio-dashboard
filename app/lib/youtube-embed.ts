const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const ALLOWED_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
]);

export const YOUTUBE_EMBED_HELP =
  "Paste any YouTube video link (e.g., https://www.youtube.com/watch?v=... or https://youtu.be/...)";
export const YOUTUBE_EMBED_ERROR =
  "Enter a valid YouTube video link, embed URL, or 11-character video ID.";

export function normalizeYouTubeEmbedUrl(value: string): string | null {
  if (!value || !value.trim()) return "";
  const trimmed = value.trim();

  // If user pasted a bare 11-char ID
  if (VIDEO_ID_PATTERN.test(trimmed)) {
    return `https://www.youtube.com/embed/${trimmed}`;
  }

  try {
    const fullUrl =
      trimmed.startsWith("http://") || trimmed.startsWith("https://")
        ? trimmed
        : `https://${trimmed}`;
    const url = new URL(fullUrl);
    const host = url.hostname.toLowerCase();
    if (!ALLOWED_HOSTS.has(host)) return null;

    let videoId: string | null = null;
    const params = new URLSearchParams();

    // Parse start time / t parameter
    const startVal = url.searchParams.get("start") || url.searchParams.get("t");
    if (startVal) {
      const match = /^(\d+)s?$/.exec(startVal);
      if (match) {
        params.set("start", match[1]);
      } else {
        const timeMatch = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(startVal);
        if (timeMatch && (timeMatch[1] || timeMatch[2] || timeMatch[3])) {
          const h = parseInt(timeMatch[1] || "0", 10);
          const m = parseInt(timeMatch[2] || "0", 10);
          const s = parseInt(timeMatch[3] || "0", 10);
          const total = h * 3600 + m * 60 + s;
          if (total > 0) params.set("start", total.toString());
        }
      }
    }

    for (const key of ["rel", "controls"]) {
      const val = url.searchParams.get(key);
      if (val === "0" || val === "1") params.set(key, val);
    }

    const segments = url.pathname.split("/").filter(Boolean);

    // youtu.be/VIDEO_ID
    if (host === "youtu.be" && segments[0] && VIDEO_ID_PATTERN.test(segments[0])) {
      videoId = segments[0];
    }
    // youtube.com/embed/VIDEO_ID
    else if (
      segments[0] === "embed" &&
      segments[1] &&
      VIDEO_ID_PATTERN.test(segments[1])
    ) {
      videoId = segments[1];
    }
    // youtube.com/shorts/VIDEO_ID or youtube.com/live/VIDEO_ID
    else if (
      (segments[0] === "shorts" || segments[0] === "live") &&
      segments[1] &&
      VIDEO_ID_PATTERN.test(segments[1])
    ) {
      videoId = segments[1];
    }
    // youtube.com/watch?v=VIDEO_ID
    else if (
      url.searchParams.get("v") &&
      VIDEO_ID_PATTERN.test(url.searchParams.get("v")!)
    ) {
      videoId = url.searchParams.get("v")!;
    }
    // youtube.com/v/VIDEO_ID
    else if (
      segments[0] === "v" &&
      segments[1] &&
      VIDEO_ID_PATTERN.test(segments[1])
    ) {
      videoId = segments[1];
    }

    if (!videoId) return null;

    const query = params.toString();
    return `https://www.youtube.com/embed/${videoId}${query ? `?${query}` : ""}`;
  } catch {
    return null;
  }
}
