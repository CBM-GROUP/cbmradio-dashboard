import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const AUTH_COOKIE_NAME = "admin_jwt_token";

const configuredAuthApiBaseUrl =
  process.env.BACKEND_API_URL || "http://localhost:8000";

export const AUTH_API_BASE_URL = configuredAuthApiBaseUrl.replace(/\/$/, "");

export const BACKEND_API_V1_URL = `${AUTH_API_BASE_URL}/api/v1`;

export type AdminUser = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
};

export async function readJsonResponse(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    const data: unknown = JSON.parse(text);
    return data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  } catch {
    return { detail: text };
  }
}

export function getApiError(data: Record<string, unknown>, fallback: string) {
  const error = data.error ?? data.detail ?? data.message;
  return typeof error === "string" && error ? error : fallback;
}

export function isAdminUser(value: unknown): value is AdminUser {
  if (!value || typeof value !== "object") {
    return false;
  }

  const user = value as Partial<AdminUser>;
  return (
    typeof user.id === "number" &&
    typeof user.username === "string" &&
    typeof user.email === "string" &&
    typeof user.first_name === "string" &&
    typeof user.last_name === "string" &&
    typeof user.is_staff === "boolean"
  );
}

export async function getBackendAuthHeaders(includeJson = false) {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const headers = new Headers({
    Authorization: `Token ${token}`,
  });

  if (includeJson) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function backendAuthFailure(response: Response) {
  if (response.status !== 401 && response.status !== 403) {
    return null;
  }

  const data = await readJsonResponse(response);
  return NextResponse.json(
    { error: getApiError(data, "Your administrator session is no longer valid.") },
    { status: response.status }
  );
}
