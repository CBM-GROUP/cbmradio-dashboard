import { asRecord, requestError, text } from "../../lib/backend-api";
import { preserveBackendResponse } from "../../lib/media-proxy";
import { BACKEND_API_V1_URL, getBackendAuthHeaders, unauthorizedResponse } from "../../lib/backend-auth";

const identity = (item: Record<string, unknown>) => item;

export async function GET(request: Request) {
  const headers = await getBackendAuthHeaders();
  if (!headers) return unauthorizedResponse();
  const incoming = new URL(request.url).searchParams;
  const approved = new URLSearchParams();
  for (const key of ["page", "search", "ordering"] as const) {
    const value = incoming.get(key)?.trim(); if (value) approved.set(key, value);
  }
  const query = approved.size ? `?${approved}` : "";
  try { return preserveBackendResponse(await fetch(`${BACKEND_API_V1_URL}/articles/categories/${query}`, { headers, cache: "no-store" }), identity); }
  catch { return requestError("Unable to reach the article category service.", 502); }
}

async function mutate(request: Request, method: "POST" | "PATCH") {
  const headers = await getBackendAuthHeaders(true);
  if (!headers) return unauthorizedResponse();
  try {
    const incoming = asRecord(await request.json());
    const slug = text(incoming.slug); delete incoming.slug;
    if (method === "PATCH" && !slug) return requestError("Category slug is required.");
    return preserveBackendResponse(await fetch(`${BACKEND_API_V1_URL}/articles/categories/${slug ? `${encodeURIComponent(slug)}/` : ""}`, { method, headers, body: JSON.stringify(incoming) }), identity);
  } catch { return requestError("Unable to reach the article category service.", 502); }
}
export async function POST(request: Request) { return mutate(request, "POST"); }
export async function PUT(request: Request) { return mutate(request, "PATCH"); }
export async function DELETE(request: Request) {
  const headers = await getBackendAuthHeaders(); if (!headers) return unauthorizedResponse();
  const slug = new URL(request.url).searchParams.get("slug")?.trim(); if (!slug) return requestError("Category slug is required.");
  try { return preserveBackendResponse(await fetch(`${BACKEND_API_V1_URL}/articles/categories/${encodeURIComponent(slug)}/`, { method: "DELETE", headers }), identity); }
  catch { return requestError("Unable to reach the article category service.", 502); }
}
