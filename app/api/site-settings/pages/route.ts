import { requestError } from "../../../lib/backend-api";
import { BACKEND_API_V1_URL, getBackendAuthHeaders, unauthorizedResponse } from "../../../lib/backend-auth";

export async function GET() {
  const headers = await getBackendAuthHeaders();
  if (!headers) return unauthorizedResponse();

  try {
    const res = await fetch(`${BACKEND_API_V1_URL}/site-settings/pages/`, {
      headers,
      cache: "no-store",
    });
    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch {
    return requestError("Unable to reach Site Pages.", 502);
  }
}
