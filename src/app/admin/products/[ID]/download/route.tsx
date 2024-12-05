import db from "@/db/db";
import { notFound } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises"


export async function GET(
  req: NextRequest,
  { params: { ID } }: { params: { ID: string } }
) {
  const product = await db.product.findUnique({
    where: { ID },
    select: { filePath: true, name: true },
  });

  if (product == null) return notFound()


const {size} = await fs.stat(product.filePath) // Get file size
const file = await fs.readFile(product.filePath) // Read file
const extension = product.filePath.split(".").pop() // Get file extension

// Handle the server response for downloading the file
return new NextResponse(file, {headers: {
    "Content-Disposition": `attackment; filename="${product.name}.${extension}"`,
    "Content-Length": size.toString()
}})
}
