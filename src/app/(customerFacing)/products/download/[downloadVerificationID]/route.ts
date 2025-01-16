import db from "@/db/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ downloadVerificationId: string }> }
) {
  // Await the params before accessing downloadVerificationId
  const { downloadVerificationId } = await context.params;

  // Find data that matches the id and is not expired
  const data = await db.downloadVerification.findUnique({
    where: { id: downloadVerificationId, expiresAt: { gt: new Date() } },
    select: { product: { select: { filePath: true, name: true } } },
  });

  // Redirect to "expired" page if no valid data
  if (data == null) {
    return NextResponse.redirect(
      new URL("/products/download/expired", request.url)
    );
  }

  const product = data.product;

  // Fetch the file from the remote URL
  const response = await fetch(product.filePath);

  if (!response.ok) {
    console.error(`Failed to fetch file: ${response.statusText}`);
    return NextResponse.redirect(
      new URL("/products/download/expired", request.url)
    );
  }

  // Use arrayBuffer and convert to Buffer
  const arrayBuffer = await response.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer); // Convert ArrayBuffer to Buffer
  const fileSize = response.headers.get("content-length"); // Get file size
  const extension = product.filePath.split(".").pop(); // Get file extension

  // Handle the server response for downloading the file
  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Disposition": `attachment; filename="${product.name}.${extension}"`,
      "Content-Length": fileSize || fileBuffer.length.toString(), // Fallback to buffer size
    },
  });
}
