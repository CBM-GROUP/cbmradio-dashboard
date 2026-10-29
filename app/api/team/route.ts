import { asRecord, requestError, text } from "../../lib/backend-api";
import { preserveBackendResponse, requestIsMultipart } from "../../lib/media-proxy";
import { BACKEND_API_V1_URL, getBackendAuthHeaders, unauthorizedResponse } from "../../lib/backend-auth";

function toTeam(item: Record<string, unknown>) {
  const roleVal = text(item.role, "Presenter");
  const categoryVal = text(item.category, "Presenters");
  return {
    ...item,
    id: String(item.id ?? ""),
    role: roleVal,
    position: roleVal,
    category: categoryVal,
    image: text(item.photo),
    externalImage: text(item.external_photo_url),
  };
}

function jsonPayload(body: Record<string, unknown>) {
  const roleVal = text(body.role ?? body.position, "Presenter");
  const categoryVal = text(body.category, "Presenters");
  return {
    name: text(body.name),
    role: roleVal,
    category: categoryVal,
    bio: text(body.bio, text(body.biography)),
    photo: text(body.photo, text(body.image)),
    email: text(body.email),
    phone: text(body.phone),
    twitter: text(body.twitter),
    instagram: text(body.instagram),
    facebook: text(body.facebook),
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
      const roleVal = text(form.get("role") ?? form.get("position"), "Presenter");
      const categoryVal = text(form.get("category"), "Presenters");
      form.set("role", roleVal);
      form.set("category", categoryVal);
      if (method === "POST" && !form.has("is_active")) form.set("is_active", "true");
      form.delete("position");
      body = form;
    } else {
      const incoming = asRecord(await request.json());
      id = text(incoming.id);
      body = JSON.stringify(jsonPayload(incoming));
    }
    if (method === "PATCH" && !id) return requestError("Team member id is required.");
    return preserveBackendResponse(
      await fetch(
        `${BACKEND_API_V1_URL}/team/${method === "PATCH" ? `${encodeURIComponent(id)}/` : ""}`,
        { method, headers, body }
      ),
      toTeam
    );
  } catch {
    return requestError("Unable to reach the team service.", 502);
  }
}

export async function GET() {
  const headers = await getBackendAuthHeaders();
  if (!headers) return unauthorizedResponse();
  try {
    return preserveBackendResponse(
      await fetch(`${BACKEND_API_V1_URL}/team/`, { headers, cache: "no-store" }),
      toTeam
    );
  } catch {
    return requestError("Unable to reach the team service.", 502);
  }
}

export async function POST(request: Request) {
  return mutate(request, "POST");
}

export async function PUT(request: Request) {
  return mutate(request, "PATCH");
}

export async function DELETE(request: Request) {
  const headers = await getBackendAuthHeaders();
  if (!headers) return unauthorizedResponse();
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return requestError("Team member id is required.");
  try {
    return preserveBackendResponse(
      await fetch(`${BACKEND_API_V1_URL}/team/${encodeURIComponent(id)}/`, {
        method: "DELETE",
        headers,
      }),
      toTeam
    );
  } catch {
    return requestError("Unable to reach the team service.", 502);
  }
}
