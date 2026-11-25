import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ downloadVerificationId: string }> }
) {
  const { downloadVerificationId } = await context.params;

  const res = await fetch(
    `${process.env.API_URL}/api/downloads/${encodeURIComponent(downloadVerificationId)}`,
    {
      headers: {
        "X-Internal-Key": process.env.INTERNAL_API_KEY!,
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    return NextResponse.redirect(
      new URL("/products/download/expired", request.url)
    );
  }

  const arrayBuffer = await res.arrayBuffer();
  const body = new Uint8Array(arrayBuffer);
  const disposition =
    res.headers.get("content-disposition") ?? 'attachment; filename="download"';
  const contentType =
    res.headers.get("content-type") ?? "application/octet-stream";

  return new NextResponse(body, {
    headers: {
      "Content-Disposition": disposition,
      "Content-Type": contentType,
      "Content-Length": body.byteLength.toString(),
    },
  });
}