"use server"; // Ensures it runs on the server

import { z } from "zod";
import db from "@/db/db";
import fs from "fs/promises";
import { notFound, redirect } from "next/navigation";

const fileSchema = z.instanceof(File, { message: "Required" }); // Ensure that the file schema is instance of File

// Checking if the file is an image type
const imageSchema = fileSchema.refine(
  (file) => file.size == 0 || file.type.startsWith("image/")
);

const addSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  priceInCents: z.coerce.number().int().min(1),
  file: fileSchema.refine((file) => file.size > 0, "Required"),
  image: imageSchema.refine((file) => file.size > 0, "Required"),
});

export async function addProduct(prevState: unknown, formData: FormData) {
  const result = addSchema.safeParse(Object.fromEntries(formData.entries()));
  if (result.success === false) {
    return result.error.formErrors.fieldErrors;
  }
  const data = result.data;

  // Handle multiple requests recursively
  await fs.mkdir("products", { recursive: true });
  // Create a unique file path
  const filePath = `products/${crypto.randomUUID()}-${data.file.name}`;
  // Write the file
  await fs.writeFile(filePath, Buffer.from(await data.file.arrayBuffer()));

  // Use 'public' for ease of use
  await fs.mkdir("public/products", { recursive: true });
  // Create a unique image path
  const imagePath = `/products/${crypto.randomUUID()}-${data.image.name}`;
  // Write the image to the path
  await fs.writeFile(
    `public${imagePath}`,
    Buffer.from(await data.image.arrayBuffer())
  );

  // Create the product
  await db.product.create({
    data: {
      isAvailabelForPurchase: false,
      name: data.name,
      description: data.description,
      priceInCents: data.priceInCents,
      filePath,
      imagePath,
    },
  });

  redirect("/admin/products");
}

// Takes the data and updates the product
export async function toggleProductAvailability(
  ID: string,
  isAvailabelForPurchase: boolean
) {
  await db.product.update({ where: { ID }, data: { isAvailabelForPurchase } });
}

export async function deleteProduct(ID: string) {
  const product = await db.product.delete({ where: { ID } });
  // Return error if product is not found
  if (product === null) return notFound()
}
