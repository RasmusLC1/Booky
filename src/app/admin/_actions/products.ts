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
  description: z.string().min(1),
  category: z.string().min(1),
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

  // Santise input to prevent sql injection
  data.name = sanitizeHtml(data.name);
  data.description = sanitizeHtml(data.description);
  data.category = sanitizeHtml(data.category);
  if (
    data.name.length > 0 ||
    data.description.length > 0 ||
    data.category.length > 0
  ) {
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
        category: data.category,
        priceInCents: data.priceInCents,
        filePath,
        imagePath,
        reviews: "",
        Score: 0,
        length: 0,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/products");
  redirect("/admin/products");
}

// Takes the data and updates the product
export async function toggleProductAvailability(
  id: string,
  isAvailabelForPurchase: boolean
) {
  await db.product.update({ where: { id }, data: { isAvailabelForPurchase } });
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
