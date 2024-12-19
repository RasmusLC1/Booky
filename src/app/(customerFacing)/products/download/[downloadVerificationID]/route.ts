import db from "@/db/db";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";

export async function GET(
  request: NextRequest,
  {
    params: { downloadVerificationID },
  }: { params: { downloadVerificationID: string } }
) {

    // Find data that matches the id and is not expired
  const data = await db.downloadVerification.findUnique({
    where: { id: downloadVerificationID, expiresAt: { gt: new Date() } },
    select: { product: { select: { filePath: true, name: true } } },
  });

  // Return if no data as it is not valid
  if (data == null) {
    return NextResponse.redirect(new URL("/products/download/expired", request.url))
  }


  const { size } = await fs.stat(data.product.filePath); // Get file size
  const file = await fs.readFile(data.product.filePath); // Read file
  const extension = data.product.filePath.split(".").pop(); // Get file extension

  // Handle the server response for downloading the file
  return new NextResponse(file, {
    headers: {
      "Content-Disposition": `attackment; filename="${data.product.name}.${extension}"`,
      "Content-Length": size.toString(),
    },
  });
}
