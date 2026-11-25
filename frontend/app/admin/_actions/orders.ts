"use server";

export async function deleteOrder(id: string): Promise<{ deleted: boolean; notFound?: boolean }> {
  const res = await fetch(
    `${process.env.API_URL}/api/admin/orders/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: {
        "X-Internal-Key": process.env.INTERNAL_API_KEY!,
      },
      cache: "no-store",
    }
  );

  if (res.status === 404) {
    return { deleted: false, notFound: true };
  }

  if (!res.ok) {
    throw new Error(`Failed to delete order: ${res.status}`);
  }

  return { deleted: true };
}