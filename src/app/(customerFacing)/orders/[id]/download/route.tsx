import { notFound } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const res = await fetch(
    `${process.env.API_URL}/api/products/${encodeURIComponent(id)}/download`,
    {
      headers: {
        "X-Internal-Key": process.env.INTERNAL_API_KEY!,
      },
      cache: "no-store",
    }
  );

  if (res.status === 404) return notFound();

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: res.status }
    );
  }

  const headers = new Headers();
  const contentType = res.headers.get("content-type");
  const contentDisposition = res.headers.get("content-disposition");
  const contentLength = res.headers.get("content-length");

  if (contentType) headers.set("Content-Type", contentType);
  if (contentDisposition) headers.set("Content-Disposition", contentDisposition);
  if (contentLength) headers.set("Content-Length", contentLength);

  return new NextResponse(res.body, {
    status: 200,
    headers,
  });
}