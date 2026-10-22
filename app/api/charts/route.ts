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

function toChart(item: Record<string, unknown>) {
  return {
    ...item,
    id: String(item.id ?? ""),
    coverImage: text(item.cover_image_url, text(item.cover_image)),
  };
}

export async function GET(request: Request) {
  const headers = await getBackendAuthHeaders();
  if (!headers) return unauthorizedResponse();

  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get("slug")?.trim();
    const endpoint = slug
      ? `${BACKEND_API_V1_URL}/charts/${encodeURIComponent(slug)}/`
      : `${BACKEND_API_V1_URL}/charts/`;

    const response = await fetch(endpoint, {
      headers,
      cache: "no-store",
    });

    return preserveBackendResponse(response, toChart);
  } catch {
    return requestError("Unable to reach the charts service.", 502);
  }
}

export async function POST(request: Request) {
  const multipart = requestIsMultipart(request);
  const headers = await getBackendAuthHeaders(!multipart);
  if (!headers) return unauthorizedResponse();

  try {
    let body: BodyInit;
    if (multipart) {
      const form = await request.formData();
      if (!form.has("is_active")) form.set("is_active", "true");
      body = form;
    } else {
      const incoming = asRecord(await request.json());
      body = JSON.stringify({
        title: text(incoming.title),
        slug: text(incoming.slug),
        description: text(incoming.description),
        edition_date: text(incoming.edition_date, text(incoming.editionDate)),
        chart_type: text(incoming.chart_type, text(incoming.chartType, "hot100")),
        display_order: number(incoming.display_order) ?? number(incoming.displayOrder) ?? 0,
        is_active: incoming.is_active !== false,
      });
    }

    const response = await fetch(`${BACKEND_API_V1_URL}/charts/`, {
      method: "POST",
      headers,
      body,
    });

    return preserveBackendResponse(response, toChart);
  } catch {
    return requestError("Unable to reach the charts service.", 502);
  }
}

export async function PUT(request: Request) {
  const multipart = requestIsMultipart(request);
  const headers = await getBackendAuthHeaders(!multipart);
  if (!headers) return unauthorizedResponse();

  try {
    let slug = "";
    let body: BodyInit;

    if (multipart) {
      const form = await request.formData();
      slug = text(form.get("slug"));
      body = form;
    } else {
      const incoming = asRecord(await request.json());
      slug = text(incoming.slug);
      body = JSON.stringify({
        title: text(incoming.title),
        description: text(incoming.description),
        edition_date: text(incoming.edition_date, text(incoming.editionDate)),
        chart_type: text(incoming.chart_type, text(incoming.chartType)),
        display_order: number(incoming.display_order) ?? number(incoming.displayOrder),
        is_active: bool(incoming.is_active),
      });
    }

    if (!slug) return requestError("Chart slug is required.");

    const response = await fetch(
      `${BACKEND_API_V1_URL}/charts/${encodeURIComponent(slug)}/`,
      { method: "PATCH", headers, body }
    );

    return preserveBackendResponse(response, toChart);
  } catch {
    return requestError("Unable to reach the charts service.", 502);
  }
}

export async function DELETE(request: Request) {
  const headers = await getBackendAuthHeaders();
  if (!headers) return unauthorizedResponse();

  const slug = new URL(request.url).searchParams.get("slug");
  if (!slug) return requestError("Chart slug is required.");

  try {
    const response = await fetch(
      `${BACKEND_API_V1_URL}/charts/${encodeURIComponent(slug)}/`,
      { method: "DELETE", headers }
    );
    return preserveBackendResponse(response, toChart);
  } catch {
    return requestError("Unable to reach the charts service.", 502);
  }
}
