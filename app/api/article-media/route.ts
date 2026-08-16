import { asRecord, requestError, text } from "../../lib/backend-api";
import { preserveBackendResponse, requestIsMultipart } from "../../lib/media-proxy";
import { BACKEND_API_V1_URL, getBackendAuthHeaders, unauthorizedResponse } from "../../lib/backend-auth";

const identity = (item: Record<string, unknown>) => item;

export async function GET(request: Request) {
  const headers = await getBackendAuthHeaders();
  if (!headers) return unauthorizedResponse();
  const incoming = new URL(request.url).searchParams;
  const approved = new URLSearchParams();
  for (const key of ["page", "article", "upload_session"] as const) {
    const value = incoming.get(key)?.trim();
    if (value) approved.set(key, value);
  }
  const query = approved.size ? `?${approved.toString()}` : "";
  try {
    return preserveBackendResponse(await fetch(
      `${BACKEND_API_V1_URL}/articles/media/${query}`,
      { headers, cache: "no-store" },
    ), identity);
  } catch {
    return requestError("Unable to reach the article media service.", 502);
  }
}

export async function POST(request: Request) {
  const multipart = requestIsMultipart(request);
  const headers = await getBackendAuthHeaders(!multipart);
  if (!headers) return unauthorizedResponse();
  try {
    const body: BodyInit = multipart
      ? await request.formData()
      : JSON.stringify(asRecord(await request.json()));
    return preserveBackendResponse(await fetch(
      `${BACKEND_API_V1_URL}/articles/media/`,
      { method: "POST", headers, body },
    ), identity);
  } catch {
    return requestError("Unable to reach the article media service.", 502);
  }
}

export async function DELETE(request: Request) {
  const headers = await getBackendAuthHeaders();
  if (!headers) return unauthorizedResponse();
  const id = text(new URL(request.url).searchParams.get("id"));
  if (!id) return requestError("Article media id is required.");
  try {
    return preserveBackendResponse(await fetch(
      `${BACKEND_API_V1_URL}/articles/media/${encodeURIComponent(id)}/`,
      { method: "DELETE", headers },
    ), identity);
  } catch {
    return requestError("Unable to reach the article media service.", 502);
  }
}
