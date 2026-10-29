import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params;
  if (
    !Array.isArray(slug) ||
    slug.length === 0 ||
    slug.some(
      (part) =>
        !part ||
        part === "." ||
        part === ".." ||
        part.includes("/") ||
        part.includes("\\") ||
        part.includes("\0"),
    )
  ) {
    return new NextResponse("Invalid media path", { status: 400 });
  }

  const defaultBackendUrl =
    process.env.NODE_ENV === "production"
      ? "https://apicbmradio.cbmgroupco.com"
      : "http://localhost:8000";
  const backendBase = (process.env.BACKEND_API_URL || defaultBackendUrl).replace(/\/$/, "");
  const safePath = slug.map((part) => encodeURIComponent(part)).join("/");
  const targetUrl = `${backendBase}/media/${safePath}`;

  try {
    const res = await fetch(targetUrl);
    if (!res.ok) {
      return new NextResponse("Media not found", { status: res.status });
    }

    const headers = new Headers();
    const contentType = res.headers.get("content-type");
    if (contentType) headers.set("Content-Type", contentType);
    const contentLength = res.headers.get("content-length");
    if (contentLength) headers.set("Content-Length", contentLength);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set(
      "Content-Security-Policy",
      "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    );

    return new NextResponse(res.body, {
      status: 200,
      headers,
    });
  } catch {
    return new NextResponse("Failed to fetch media", { status: 502 });
  }
}
