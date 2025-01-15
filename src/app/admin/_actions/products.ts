"use server"; // Ensures it runs on the server

import { z } from "zod";
import db from "@/db/db";
import fs from "fs/promises";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import sanitizeHtml from "sanitize-html";

const fileSchema = z.instanceof(File, { message: "Required" }); // Ensure that the file schema is instance of File

// Checking if the file is an image type
const imageSchema = fileSchema.refine(
  (file) => file.size == 0 || file.type.startsWith("image/")
);

const addSchema = z.object({
  name: z.string().min(1),
  author: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  priceInCents: z.coerce.number().int(),
  filePath: z.string().url(),
  imagePath: z.string().url(),
});

// Update the `addProduct` function to handle EdgeStore URLs
export async function addProduct(prevState: unknown, formData: FormData) {
  const result = addSchema.safeParse(Object.fromEntries(formData.entries()));
  if (result.success === false) {
    return result.error.formErrors.fieldErrors;
  }
  const data = result.data;

  // Sanitize input to prevent SQL injection
  data.name = sanitizeHtml(data.name);
  data.description = sanitizeHtml(data.description);
  data.category = sanitizeHtml(data.category);

  // Ensure the form fields are valid
  if (
    data.name.length > 0 &&
    data.description.length > 0 &&
    data.category.length > 0
  ) {
    // Create the product in the SQL database
    await db.product.create({
      data: {
        isAvailableForPurchase: false,
        name: data.name,
        author: data.author,
        description: data.description,
        category: data.category,
        priceInCents: data.priceInCents,
        filePath: data.filePath, // Use the EdgeStore file URL
        imagePath: data.imagePath, // Use the EdgeStore image URL
        length: 0,
      },
    });
  }

  // Revalidate paths and redirect to the products admin page
  revalidatePath("/");
  revalidatePath("/products");
  redirect("/admin/products");
}

// Takes the data and updates the product
export async function toggleProductAvailability(
  id: string,
  isAvailableForPurchase: boolean
) {
  await db.product.update({ where: { id }, data: { isAvailableForPurchase } });
  revalidatePath("/");
  revalidatePath("/products");
}

export async function deleteProduct(id: string) {
  const product = await db.product.delete({ where: { id } });
  // Return error if product is not found
  if (product === null) return notFound();

  // Deletes the product and image file
  await fs.unlink(product.filePath);
  await fs.unlink(`public${product.imagePath}`);
  revalidatePath("/");
  revalidatePath("/products");
}

const editSchema = addSchema.extend({
  file: fileSchema.optional(),
  image: imageSchema.optional(),
});

export async function updateProduct(
  id: string,
  prevState: unknown,
  formData: FormData
) {
  const result = editSchema.safeParse(Object.fromEntries(formData.entries()));
  if (result.success === false) {
    return result.error.formErrors.fieldErrors;
  }
  const data = result.data;
  const product = await db.product.findUnique({ where: { id } });

  // Error handling in case the product is not found return
  if (product == null) return notFound();

  let filePath = product.filePath;
  if (data.file != null && data.file.size > 0) {
    // Handle multiple requests recursively
    await fs.unlink(product.filePath);
    // Create a unique file path
    filePath = `products/${crypto.randomUUID()}-${data.file.name}`;
    // Write the file
    await fs.writeFile(filePath, Buffer.from(await data.file.arrayBuffer()));
  }

  let imagePath = product.imagePath;
  if (data.image != null && data.image.size > 0) {
    // Handle multiple requests recursively
    await fs.unlink(`product${product.imagePath}`);
    // Create a unique file path
    imagePath = `/products/${crypto.randomUUID()}-${data.image.name}`;
    // Write the image to the path
    await fs.writeFile(
      `public${imagePath}`,
      Buffer.from(await data.image.arrayBuffer())
    );
  }

  // Create the product
  await db.product.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      category: data.category,
      priceInCents: data.priceInCents,
      filePath,
      imagePath,
    },
  });
  // Refresh homepage and products, then go to product page
  revalidatePath("/");
  revalidatePath("/products");
  redirect("/admin/products");
}
