import { getServerSession } from "next-auth";

const apiHeaders = (extra?: Record<string, string>) => ({
  "X-Internal-Key": process.env.INTERNAL_API_KEY!,
  ...extra,
});

export async function getUserIdFromSession(): Promise<string> {
  const session = await getServerSession();

  if (!session?.user?.email) {
    throw new Error("User is not authenticated");
  }

  const res = await fetch(
    `${process.env.API_URL}/api/users/find-by-email?email=${encodeURIComponent(session.user.email)}`,
    { headers: apiHeaders(), cache: "no-store" }
  );

  if (res.status === 404) {
    throw new Error("User not found");
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch user: ${res.status}`);
  }

  const user: { id: string } = await res.json();
  return user.id;
}