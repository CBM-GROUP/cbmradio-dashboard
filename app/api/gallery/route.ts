import { asRecord, requestError, text } from "../../lib/backend-api";
import { preserveBackendResponse } from "../../lib/media-proxy";
import {
  BACKEND_API_V1_URL,
  getBackendAuthHeaders,
  unauthorizedResponse,
} from "../../lib/backend-auth";

const categoryMap: Record<string, string> = {
  Photos: "general",
  Videos: "general",
  Studio: "studio",
  Community: "events",
  Team: "team",
};

function toGallery(item: Record<string, unknown>) {
  const source = text(item.category);
  const category =
    source === "studio"
      ? "Studio"
      : source === "events"
        ? "Community"
        : source === "team"
          ? "Team"
          : "Photos";
  return {
    ...item,
    id: String(item.id ?? ""),
    url: text(item.image),
    externalUrl: text(item.external_image_url),
    category,
  };
}

async function galleryResponse(response: Response) {
  return preserveBackendResponse(response, toGallery);
}

async function requestPayload(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const category = text(form.get("category"));
    form.set("category", categoryMap[category] || category || "general");
    if (!form.get("title")) form.set("title", text(form.get("caption")));
    return form;
  }

  const body = asRecord(await request.json());
  return JSON.stringify({
    id: body.id,
    title: text(body.title, text(body.caption)),
    caption: text(body.caption),
    image: text(body.image, text(body.url)),
    category: categoryMap[text(body.category)] || text(body.category, "general"),
    is_active: body.is_active !== false,
  });
}

export async function GET() {
  const headers = await getBackendAuthHeaders();
  if (!headers) return unauthorizedResponse();
  try {
    return galleryResponse(await fetch(`${BACKEND_API_V1_URL}/gallery/`, {
      headers,
      cache: "no-store",
    }));
  } catch {
    return requestError("Unable to reach the gallery service.", 502);
  }
}

export async function POST(request: Request) {
  const isMultipart = (request.headers.get("content-type") || "").includes("multipart/form-data");
  const headers = await getBackendAuthHeaders(!isMultipart);
  if (!headers) return unauthorizedResponse();
  try {
    return galleryResponse(await fetch(`${BACKEND_API_V1_URL}/gallery/`, {
      method: "POST",
      headers,
      body: await requestPayload(request),
    }));
  } catch {
    return requestError("Unable to reach the gallery service.", 502);
  }
}

export async function PUT(request: Request) {
  const isMultipart = (request.headers.get("content-type") || "").includes("multipart/form-data");
  const headers = await getBackendAuthHeaders(!isMultipart);
  if (!headers) return unauthorizedResponse();
  try {
    const payload = await requestPayload(request);
    let id = "";
    let body: BodyInit;
    if (payload instanceof FormData) {
      id = text(payload.get("id"));
      payload.delete("id");
      body = payload;
    } else {
      const record = asRecord(JSON.parse(payload));
      id = text(record.id);
      delete record.id;
      body = JSON.stringify(record);
    }
    if (!id) return requestError("Gallery item id is required.");
    return galleryResponse(await fetch(
      `${BACKEND_API_V1_URL}/gallery/${encodeURIComponent(id)}/`,
      { method: "PATCH", headers, body },
    ));
  } catch {
    return requestError("Unable to reach the gallery service.", 502);
  }
}

export async function DELETE(request: Request) {
  const headers = await getBackendAuthHeaders();
  if (!headers) return unauthorizedResponse();
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return requestError("Gallery item id is required.");
  try {
    return galleryResponse(await fetch(
      `${BACKEND_API_V1_URL}/gallery/${encodeURIComponent(id)}/`,
      { method: "DELETE", headers },
    ));
  } catch {
    return requestError("Unable to reach the gallery service.", 502);
  }
}
