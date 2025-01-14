"use server";

import db from "@/db/db";

export async function createDownloadVerification(productid: string): Promise<string> {
  const millisecondsInDay = 1000 * 60 * 60 * 24;

  const verification = await db.downloadVerification.create({
    data: {
      productid,
      expiresAt: new Date(Date.now() + millisecondsInDay),
    },
  });

  return verification.id;
}