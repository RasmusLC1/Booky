import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id.trim()) {
    return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
  }

  const upstream = await fetch(
    `${process.env.API_URL}/api/products/${encodeURIComponent(id)}/download`,
    {
      headers: {
        "X-Internal-Key": process.env.INTERNAL_API_KEY!,
      },
      cache: "no-store",
      signal: req.signal,
    }
  );

  if (upstream.status === 404) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!upstream.ok) {
    console.error(`Failed to fetch download from API: ${upstream.status} ${upstream.statusText}`);
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: upstream.status }
    );
  }

  const arrayBuffer = await upstream.arrayBuffer();
  const body = new Uint8Array(arrayBuffer);

  const headers = new Headers();
  headers.set(
    "Content-Type",
    upstream.headers.get("content-type") ?? "application/octet-stream"
  );
  headers.set("Content-Length", body.byteLength.toString());

  const contentDisposition = upstream.headers.get("content-disposition");
  if (contentDisposition) {
    headers.set("Content-Disposition", contentDisposition);
  } else {
    headers.set("Content-Disposition", `attachment; filename="download-${id}"`);
  }

  return new NextResponse(body, {
    status: 200,
    headers,
  });
}