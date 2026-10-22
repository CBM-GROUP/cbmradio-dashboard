import { asRecord, requestError, text } from "../../lib/backend-api";
import { preserveBackendResponse, requestIsMultipart } from "../../lib/media-proxy";
import { BACKEND_API_V1_URL, getBackendAuthHeaders, unauthorizedResponse } from "../../lib/backend-auth";

function toSection(item: Record<string, unknown>) {
  const key = text(item.section_key);
  const pk = text(item.id);
  const page = text(item.page, "home");
  const position = text(item.position, "middle");
  return {
    ...item,
    id: pk || key,
    pk,
    section_key: key,
    page,
    position,
    sectionName: text(item.title) || key.replaceAll("_", " "),
    description: text(item.body),
    externalImage: text(item.external_image_url),
  };
}

async function sectionPayload(request: Request, includeKey: boolean) {
  if (requestIsMultipart(request)) {
    const form = await request.formData();
    const key = text(form.get("section_key"), text(form.get("id")));
    const page = text(form.get("page"), "home");
    const position = text(form.get("position"), "middle");
    form.delete("id");
    if (!includeKey) form.delete("section_key");
    if (!form.has("page")) form.set("page", page);
    if (!form.has("position")) form.set("position", position);
    return { key, body: form as BodyInit };
  }

  const incoming = asRecord(await request.json());
  const key = text(incoming.section_key, text(incoming.id));
  const payload: Record<string, unknown> = {
    title: text(incoming.title),
    subtitle: text(incoming.subtitle),
    body: text(incoming.body, text(incoming.description)),
    page: text(incoming.page, "home"),
    position: text(incoming.position, "middle"),
    image: text(incoming.image),
    cta_label: text(incoming.cta_label),
    cta_url: text(incoming.cta_url),
    is_active: incoming.is_active !== false,
    order: Number(incoming.order) || 0,
  };
  if (includeKey && key) payload.section_key = key;
  return { key, body: JSON.stringify(payload) as BodyInit };
}

export async function GET(request: Request) {
  const headers = await getBackendAuthHeaders();
  if (!headers) return unauthorizedResponse();
  const search = new URL(request.url).search;
  try {
    return preserveBackendResponse(
      await fetch(`${BACKEND_API_V1_URL}/page-sections/${search}`, { headers, cache: "no-store" }),
      toSection,
    );
  } catch {
    return requestError("Unable to reach the page sections service.", 502);
  }
}

export async function POST(request: Request) {
  const multipart = requestIsMultipart(request);
  const headers = await getBackendAuthHeaders(!multipart);
  if (!headers) return unauthorizedResponse();
  try {
    const { body } = await sectionPayload(request, true);
    return preserveBackendResponse(
      await fetch(`${BACKEND_API_V1_URL}/page-sections/`, { method: "POST", headers, body }),
      toSection,
    );
  } catch {
    return requestError("Unable to reach the page sections service.", 502);
  }
}

export async function PUT(request: Request) {
  const multipart = requestIsMultipart(request);
  const headers = await getBackendAuthHeaders(!multipart);
  if (!headers) return unauthorizedResponse();
  try {
    const { key, body } = await sectionPayload(request, false);
    if (!key) return requestError("Section identifier is required.");
    return preserveBackendResponse(
      await fetch(`${BACKEND_API_V1_URL}/page-sections/${encodeURIComponent(key)}/`, {
        method: "PATCH",
        headers,
        body,
      }),
      toSection,
    );
  } catch {
    return requestError("Unable to reach the page sections service.", 502);
  }
}

export async function DELETE(request: Request) {
  const headers = await getBackendAuthHeaders();
  if (!headers) return unauthorizedResponse();
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return requestError("Section identifier is required.");
  try {
    return preserveBackendResponse(
      await fetch(`${BACKEND_API_V1_URL}/page-sections/${encodeURIComponent(id)}/`, {
        method: "DELETE",
        headers,
      }),
      (v) => v,
    );
  } catch {
    return requestError("Unable to delete section.", 502);
  }
}
