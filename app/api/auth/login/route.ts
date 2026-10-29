import { NextResponse } from "next/server";
import {
  AUTH_API_BASE_URL,
  AUTH_COOKIE_NAME,
  getApiError,
  isAdminUser,
  readJsonResponse,
} from "../../../lib/backend-auth";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null);
    const credentials =
      body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const username =
      typeof credentials.username === "string" ? credentials.username.trim() : "";
    const password = typeof credentials.password === "string" ? credentials.password : "";

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required." },
        { status: 400 }
      );
    }

    const backendResponse = await fetch(`${AUTH_API_BASE_URL}/api/v1/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await readJsonResponse(backendResponse);

    if (backendResponse.ok) {
      const token = data.token;
      const tokenType = data.token_type;
      const user = data.user;

      if (
        typeof token !== "string" ||
        !token ||
        tokenType !== "Token" ||
        !isAdminUser(user) ||
        !user.is_staff
      ) {
        return NextResponse.json(
          { error: "Authentication server returned an invalid administrator session." },
          { status: 502 }
        );
      }

      const response = NextResponse.json({
        token_type: tokenType,
        user,
      });

      response.cookies.set(AUTH_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
      });

      return response;
    }

    return NextResponse.json(
      { error: getApiError(data, "Unauthorized Access: Invalid Administrator Credentials.") },
      { status: backendResponse.status || 401 }
    );
  } catch {
    return NextResponse.json(
      { error: "Network connection error to the authentication server." },
      { status: 500 }
    );
  }
}
