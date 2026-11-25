"use server";

export async function userOrderExists(
  email: string,
  productId: string
): Promise<boolean> {
  if (!email.trim() || !productId.trim()) return false;

  const params = new URLSearchParams({
    email: email.trim(),
    productId: productId.trim(),
  });

  const res = await fetch(
    `${process.env.API_URL}/api/downloads/exists?${params.toString()}`,
    {
      headers: {
        "X-Internal-Key": process.env.INTERNAL_API_KEY!,
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to check order existence: ${res.status}`);
  }

  const data: { exists: boolean } = await res.json();
  return data.exists;
}