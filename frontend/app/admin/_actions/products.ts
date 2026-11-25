"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const addSchema = z.object({
  name: z.string().min(1),
  author: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  priceInCents: z.coerce.number().int().nonnegative(),
  filePath: z.string().url(),
  imagePath: z.string().url(),
});

const editSchema = addSchema.extend({
  filePath: z.string().url().optional().or(z.literal("")),
  imagePath: z.string().url().optional().or(z.literal("")),
});

function apiHeaders(extra?: Record<string, string>) {
  return {
    "Content-Type": "application/json",
    "X-Internal-Key": process.env.INTERNAL_API_KEY!,
    ...extra,
  };
}

function revalidateProductPages() {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin/products");
}

export async function addProduct(_prevState: unknown, formData: FormData) {
  const parsed = addSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return parsed.error.formErrors.fieldErrors;
  }

  const res = await fetch(`${process.env.API_URL}/api/products`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify(parsed.data),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to create product: ${res.status}`);
  }

  revalidateProductPages();
  redirect("/admin/products");
}

export async function toggleProductAvailability(
  id: string,
  isAvailableForPurchase: boolean
) {
  const res = await fetch(
    `${process.env.API_URL}/api/products/${encodeURIComponent(id)}/availability`,
    {
      method: "PATCH",
      headers: apiHeaders(),
      body: JSON.stringify({ isAvailableForPurchase }),
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to update availability: ${res.status}`);
  }

  revalidateProductPages();
}

export async function deleteProduct(
  id: string
): Promise<{ deleted: boolean; notFound?: boolean }> {
  const res = await fetch(
    `${process.env.API_URL}/api/products/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: apiHeaders(),
      cache: "no-store",
    }
  );

  if (res.status === 404) {
    return { deleted: false, notFound: true };
  }

  if (!res.ok) {
    throw new Error(`Failed to delete product: ${res.status}`);
  }

  revalidateProductPages();
  return { deleted: true };
}

export async function updateProduct(
  id: string,
  _prevState: unknown,
  formData: FormData
) {
  const parsed = editSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return parsed.error.formErrors.fieldErrors;
  }

  const payload = {
    ...parsed.data,
    filePath: parsed.data.filePath || null,
    imagePath: parsed.data.imagePath || null,
  };

  const res = await fetch(
    `${process.env.API_URL}/api/products/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: apiHeaders(),
      body: JSON.stringify(payload),
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to update product: ${res.status}`);
  }

  revalidateProductPages();
  redirect("/admin/products");
}