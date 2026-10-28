import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params;
  const backendBase = (process.env.BACKEND_API_URL || "http://localhost:8000").replace(/\/$/, "");
  const targetUrl = `${backendBase}/media/${slug.join("/")}`;

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

    return new NextResponse(res.body, {
      status: 200,
      headers,
    });
  } catch {
    return new NextResponse("Failed to fetch media", { status: 502 });
  }
}
