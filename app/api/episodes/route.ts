import { asRecord, bool, number, requestError, text } from "../../lib/backend-api";
import { preserveBackendResponse, requestIsMultipart } from "../../lib/media-proxy";
import { BACKEND_API_V1_URL, getBackendAuthHeaders, unauthorizedResponse } from "../../lib/backend-auth";

function toEpisode(item: Record<string, unknown>) {
  return {
    ...item, id: String(item.id ?? ""), programId: item.program_id,
    programTitle: text(item.program_title), thumbnailImage: text(item.cover_image),
    externalThumbnailImage: text(item.external_cover_image_url),
    youtubeLink: text(item.youtube_link), youtubeEmbedUrl: text(item.youtube_embed_url),
    publishDate: text(item.publish_date),
  };
}
function jsonPayload(body: Record<string, unknown>) {
  return {
    program_id: number(body.program_id ?? body.programId ?? body.program),
    title: text(body.title), description: text(body.description),
    cover_image: text(body.cover_image, text(body.thumbnailImage)),
    youtube_link: text(body.youtube_embed_url, text(body.youtubeEmbedUrl, text(body.youtube_link, text(body.youtubeLink)))),
    publish_date: text(body.publish_date, text(body.publishDate)) || null,
    is_featured: bool(body.is_featured), featured_order: number(body.featured_order),
    is_active: body.is_active !== false,
  };
}
async function mutate(request: Request, method: "POST" | "PATCH") {
  const multipart = requestIsMultipart(request);
  const headers = await getBackendAuthHeaders(!multipart);
  if (!headers) return unauthorizedResponse();
  try {
    let id = "";
    let body: BodyInit;
    if (multipart) {
      const form = await request.formData();
      id = text(form.get("id")); form.delete("id");
      if (form.has("youtube_embed_url")) {
        form.set("youtube_link", text(form.get("youtube_embed_url")));
        form.delete("youtube_embed_url");
      }
      if (method === "POST" && !form.has("is_active")) form.set("is_active", "true");
      body = form;
    } else {
      const incoming = asRecord(await request.json());
      id = text(incoming.id); body = JSON.stringify(jsonPayload(incoming));
    }
    if (method === "PATCH" && !id) return requestError("Episode id is required.");
    return preserveBackendResponse(await fetch(
      `${BACKEND_API_V1_URL}/episodes/${method === "PATCH" ? `${encodeURIComponent(id)}/` : ""}`,
      { method, headers, body },
    ), toEpisode);
  } catch { return requestError("Unable to reach the episodes service.", 502); }
}
export async function GET(request: Request) {
  const headers = await getBackendAuthHeaders();
  if (!headers) return unauthorizedResponse();
  try {
    const incoming = new URL(request.url).searchParams;
    const approved = new URLSearchParams();
    for (const key of ["page", "ordering", "search", "program", "is_featured", "is_active"] as const) {
      const value = incoming.get(key)?.trim();
      if (value) approved.set(key, value);
    }
    const query = approved.size ? `?${approved.toString()}` : "";
    return preserveBackendResponse(await fetch(`${BACKEND_API_V1_URL}/episodes/${query}`, { headers, cache: "no-store" }), toEpisode);
  }
  catch { return requestError("Unable to reach the episodes service.", 502); }
}
export async function POST(request: Request) { return mutate(request, "POST"); }
export async function PUT(request: Request) { return mutate(request, "PATCH"); }
export async function DELETE(request: Request) {
  const headers = await getBackendAuthHeaders();
  if (!headers) return unauthorizedResponse();
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return requestError("Episode id is required.");
  try { return preserveBackendResponse(await fetch(`${BACKEND_API_V1_URL}/episodes/${encodeURIComponent(id)}/`, { method: "DELETE", headers }), toEpisode); }
  catch { return requestError("Unable to reach the episodes service.", 502); }
}
