"use server";

import { getServerSession } from "next-auth/next";

export async function createDownloadVerification(productid: string): Promise<string> {
  const session = await getServerSession(); // add authOptions later
  if (!session?.user?.email) {
    throw new Error("Not logged in");
  }

  const res = await fetch(`${process.env.API_URL}/api/downloads/verification`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Key": process.env.INTERNAL_API_KEY!,
      "X-User-Email": session.user.email,
    },
    body: JSON.stringify({ productId: productid }),
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.id) {
    throw new Error(data?.error ?? "Failed to create download verification");
  }

  return data.id as string;
}