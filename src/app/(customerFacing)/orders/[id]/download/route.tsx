import db from "@/db/db";
import { notFound } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Await the params to resolve it
  const { id } = await context.params;

  // Select the filepath and name based on id
  const product = await db.product.findUnique({
    where: { id },
    select: { filePath: true, name: true },
  });

  if (product == null) return notFound();

  const { size } = await fs.stat(product.filePath); // Get file size
  const file = await fs.readFile(product.filePath); // Read file
  const extension = product.filePath.split(".").pop(); // Get file extension

  // Handle the server response for downloading the file
  return new NextResponse(file, {
    headers: {
      "Content-Disposition": `attachment; filename="${product.name}.${extension}"`,
      "Content-Length": size.toString(),
    },
  });
}
