import { asRecord, bool, number, requestError, text } from "../../lib/backend-api";
import {
  preserveBackendResponse,
  requestIsMultipart,
} from "../../lib/media-proxy";
import {
  BACKEND_API_V1_URL,
  getBackendAuthHeaders,
  unauthorizedResponse,
} from "../../lib/backend-auth";

function toProgram(item: Record<string, unknown>) {
  return {
    ...item,
    id: String(item.id ?? ""),
    coverImage: text(item.cover_image),
    externalCoverImage: text(item.external_cover_image_url),
    promoVideoUrl: text(item.promo_video_url),
  };
}

function jsonPayload(body: Record<string, unknown>) {
  return {
    title: text(body.title),
    short_description: text(body.short_description),
    description: text(body.description),
    presenter: text(body.presenter),
    schedule: text(body.schedule),
    cover_image: text(body.cover_image, text(body.coverImage)),
    promo_video_url: text(body.promo_video_url, text(body.promoVideoUrl)),
    display_order: number(body.display_order),
    is_featured: bool(body.is_featured),
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
      id = text(form.get("id"));
      form.delete("id");
      if (method === "POST" && !form.has("is_active")) form.set("is_active", "true");
      body = form;
    } else {
      const incoming = asRecord(await request.json());
      id = text(incoming.id);
      body = JSON.stringify(jsonPayload(incoming));
    }
    if (method === "PATCH" && !id) return requestError("Program id is required.");
    const response = await fetch(
      `${BACKEND_API_V1_URL}/programs/${method === "PATCH" ? `${encodeURIComponent(id)}/` : ""}`,
      { method, headers, body },
    );
    return preserveBackendResponse(response, toProgram);
  } catch {
    return requestError("Unable to reach the programs service.", 502);
  }
}

export async function GET(request: Request) {
  const headers = await getBackendAuthHeaders();
  if (!headers) return unauthorizedResponse();
  try {
    const incoming = new URL(request.url).searchParams;
    const approved = new URLSearchParams();
    for (const key of ["page", "ordering", "search", "is_active", "is_featured"] as const) {
      const value = incoming.get(key)?.trim();
      if (value) approved.set(key, value);
    }
    const query = approved.size ? `?${approved.toString()}` : "";
    return preserveBackendResponse(
      await fetch(`${BACKEND_API_V1_URL}/programs/${query}`, { headers, cache: "no-store" }),
      toProgram,
    );
  } catch {
    return requestError("Unable to reach the programs service.", 502);
  }
}
export async function POST(request: Request) { return mutate(request, "POST"); }
export async function PUT(request: Request) { return mutate(request, "PATCH"); }
export async function DELETE(request: Request) {
  const headers = await getBackendAuthHeaders();
  if (!headers) return unauthorizedResponse();
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return requestError("Program id is required.");
  try {
    return preserveBackendResponse(
      await fetch(`${BACKEND_API_V1_URL}/programs/${encodeURIComponent(id)}/`, {
        method: "DELETE", headers,
      }),
      toProgram,
    );
  } catch {
    return requestError("Unable to reach the programs service.", 502);
  }
}
