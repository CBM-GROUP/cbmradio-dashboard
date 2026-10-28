import { asRecord, number, requestError, text } from "../../../lib/backend-api";
import {
  preserveBackendResponse,
  requestIsMultipart,
} from "../../../lib/media-proxy";
import {
  BACKEND_API_V1_URL,
  getBackendAuthHeaders,
  unauthorizedResponse,
} from "../../../lib/backend-auth";

function toEntry(item: Record<string, unknown>) {
  return {
    ...item,
    id: String(item.id ?? ""),
    coverImage: text(item.cover_image_url, text(item.cover_image)),
  };
}

export async function POST(request: Request) {
  const multipart = requestIsMultipart(request);
  const headers = await getBackendAuthHeaders(!multipart);
  if (!headers) return unauthorizedResponse();

  const url = new URL(request.url);
  const chartSlug = url.searchParams.get("chart")?.trim();

  try {
    let targetChartSlug = chartSlug;
    let body: BodyInit;

    if (multipart) {
      const form = await request.formData();
      if (!targetChartSlug) {
        targetChartSlug = text(form.get("chart_slug"), text(form.get("chart")));
      }
      form.delete("chart");
      form.delete("chart_slug");
      if (form.get("cover_image") instanceof File) {
        form.set("uploaded_cover_image", form.get("cover_image")!);
        form.delete("cover_image");
      }
      body = form;
    } else {
      const incoming = asRecord(await request.json());
      if (!targetChartSlug) {
        targetChartSlug = text(incoming.chart_slug, text(incoming.chart));
      }
      body = JSON.stringify({
        rank: number(incoming.rank) ?? 1,
        previous_rank: incoming.previous_rank !== null && incoming.previous_rank !== undefined && incoming.previous_rank !== ""
          ? (number(incoming.previous_rank) ?? null)
          : null,
        peak_rank: number(incoming.peak_rank) ?? number(incoming.rank) ?? 1,
        weeks_on_chart: number(incoming.weeks_on_chart) ?? 1,
        title: text(incoming.title),
        artist: text(incoming.artist),
        featured_artists: text(incoming.featured_artists),
        album: text(incoming.album),
        cover_image: text(incoming.cover_image, text(incoming.cover_image_url, "")),
        audio_url: text(incoming.audio_url, ""),
        youtube_url: text(incoming.youtube_url, ""),
        spotify_url: text(incoming.spotify_url, ""),
        apple_music_url: text(incoming.apple_music_url, ""),
      });
    }

    if (!targetChartSlug) {
      return requestError("Chart slug is required to add an entry.");
    }

    const response = await fetch(
      `${BACKEND_API_V1_URL}/charts/${encodeURIComponent(targetChartSlug)}/entries/`,
      { method: "POST", headers, body }
    );

    return preserveBackendResponse(response, toEntry);
  } catch {
    return requestError("Unable to reach the charts service.", 502);
  }
}

export async function PUT(request: Request) {
  const multipart = requestIsMultipart(request);
  const headers = await getBackendAuthHeaders(!multipart);
  if (!headers) return unauthorizedResponse();

  const url = new URL(request.url);
  let id = url.searchParams.get("id")?.trim();

  try {
    let body: BodyInit;

    if (multipart) {
      const form = await request.formData();
      if (!id) id = text(form.get("id"));
      form.delete("id");
      if (form.get("cover_image") instanceof File) {
        form.set("uploaded_cover_image", form.get("cover_image")!);
        form.delete("cover_image");
      }
      body = form;
    } else {
      const incoming = asRecord(await request.json());
      if (!id) id = text(incoming.id);
      body = JSON.stringify({
        rank: incoming.rank !== undefined ? number(incoming.rank) : undefined,
        previous_rank: incoming.previous_rank !== undefined
          ? (incoming.previous_rank === null || incoming.previous_rank === "" ? null : number(incoming.previous_rank))
          : undefined,
        peak_rank: incoming.peak_rank !== undefined ? number(incoming.peak_rank) : undefined,
        weeks_on_chart: incoming.weeks_on_chart !== undefined ? number(incoming.weeks_on_chart) : undefined,
        title: incoming.title !== undefined ? text(incoming.title) : undefined,
        artist: incoming.artist !== undefined ? text(incoming.artist) : undefined,
        featured_artists: incoming.featured_artists !== undefined ? text(incoming.featured_artists) : undefined,
        album: incoming.album !== undefined ? text(incoming.album) : undefined,
        cover_image: incoming.cover_image !== undefined || incoming.cover_image_url !== undefined
          ? text(incoming.cover_image, text(incoming.cover_image_url, ""))
          : undefined,
        audio_url: incoming.audio_url !== undefined ? text(incoming.audio_url, "") : undefined,
        youtube_url: incoming.youtube_url !== undefined ? text(incoming.youtube_url, "") : undefined,
        spotify_url: incoming.spotify_url !== undefined ? text(incoming.spotify_url, "") : undefined,
        apple_music_url: incoming.apple_music_url !== undefined ? text(incoming.apple_music_url, "") : undefined,
      });
    }

    if (!id) {
      return requestError("Entry id is required to update.");
    }

    const response = await fetch(
      `${BACKEND_API_V1_URL}/charts/entries/${encodeURIComponent(id)}/`,
      { method: "PATCH", headers, body }
    );

    return preserveBackendResponse(response, toEntry);
  } catch {
    return requestError("Unable to reach the charts service.", 502);
  }
}

export async function DELETE(request: Request) {
  const headers = await getBackendAuthHeaders();
  if (!headers) return unauthorizedResponse();

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return requestError("Entry id is required.");

  try {
    const response = await fetch(
      `${BACKEND_API_V1_URL}/charts/entries/${encodeURIComponent(id)}/`,
      { method: "DELETE", headers }
    );
    return preserveBackendResponse(response, toEntry);
  } catch {
    return requestError("Unable to reach the charts service.", 502);
  }
}
