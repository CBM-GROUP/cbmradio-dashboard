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

function normalizeChartType(val: unknown, fallback = "hot_100"): string {
  if (typeof val !== "string") return fallback;
  const cleaned = val.trim().toLowerCase();
  if (cleaned === "hot100" || cleaned === "hot-100" || cleaned === "hot_100") return "hot_100";
  if (cleaned === "top50" || cleaned === "top-50" || cleaned === "top_50") return "top_50";
  if (cleaned === "top40" || cleaned === "top-40" || cleaned === "top_40") return "top_40";
  if (cleaned === "top20" || cleaned === "top-20" || cleaned === "top_20") return "top_20";
  if (cleaned === "top10" || cleaned === "top-10" || cleaned === "top_10") return "top_10";
  return cleaned || fallback;
}

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
      const currentChartType = form.get("chart_type") || form.get("chartType");
      form.set("chart_type", normalizeChartType(currentChartType, "hot_100"));
      const rawSlug = form.get("slug");
      if (typeof rawSlug === "string" && !rawSlug.trim()) {
        form.delete("slug");
      }
      if (form.get("cover_image") instanceof File) {
        form.set("uploaded_cover_image", form.get("cover_image")!);
        form.delete("cover_image");
      }
      body = form;
    } else {
      const incoming = asRecord(await request.json());
      const slugVal = text(incoming.slug).trim();
      const payload: Record<string, unknown> = {
        title: text(incoming.title),
        description: text(incoming.description),
        edition_date: text(incoming.edition_date, text(incoming.editionDate)),
        chart_type: normalizeChartType(incoming.chart_type ?? incoming.chartType, "hot_100"),
        cover_image: text(incoming.cover_image, text(incoming.cover_image_url)),
        display_order: number(incoming.display_order) ?? number(incoming.displayOrder) ?? 0,
        is_active: incoming.is_active !== false,
      };
      if (slugVal) {
        payload.slug = slugVal;
      }
      body = JSON.stringify(payload);
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
      if (form.has("chart_type") || form.has("chartType")) {
        const ct = form.get("chart_type") || form.get("chartType");
        form.set("chart_type", normalizeChartType(ct, "hot_100"));
      }
      if (form.get("cover_image") instanceof File) {
        form.set("uploaded_cover_image", form.get("cover_image")!);
        form.delete("cover_image");
      }
      body = form;
    } else {
      const incoming = asRecord(await request.json());
      slug = text(incoming.slug);
      body = JSON.stringify({
        title: text(incoming.title),
        description: text(incoming.description),
        edition_date: text(incoming.edition_date, text(incoming.editionDate)),
        chart_type:
          incoming.chart_type !== undefined || incoming.chartType !== undefined
            ? normalizeChartType(incoming.chart_type ?? incoming.chartType, "hot_100")
            : undefined,
        cover_image: text(incoming.cover_image, text(incoming.cover_image_url)),
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
