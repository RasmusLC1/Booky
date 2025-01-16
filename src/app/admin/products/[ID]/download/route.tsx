import db from "@/db/db";
import { notFound } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Await params as it's expected to be a Promise
  const { id } = await context.params;

  // Select the filepath and name based on id
  const product = await db.product.findUnique({
    where: { id },
    select: { filePath: true, name: true },
  });

  if (product == null) return notFound();

  const filePath = product.filePath;

  // Fetch the file from the remote URL
  const response = await fetch(filePath);

  if (!response.ok) {
    console.error(`Failed to fetch file: ${response.statusText}`);
    return notFound();
  }

  // Use arrayBuffer and convert to Buffer
  const arrayBuffer = await response.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer); // Convert ArrayBuffer to Buffer
  const fileSize = response.headers.get("content-length") || fileBuffer.length; // Get file size
  const extension = filePath.split(".").pop(); // Get file extension

  // Handle the server response for downloading the file
  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Disposition": `attachment; filename="${product.name}.${extension}"`,
      "Content-Length": fileSize.toString(),
    },
  });
}
