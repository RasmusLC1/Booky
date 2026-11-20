import { getServerSession } from "next-auth"
import "server-only"

export type Product = {
  id: string;
  name: string;
  author: string;
  priceInCents: number;
  imagePath: string;
  description: string;
  category: string;
  length: number;
  isAvailableForPurchase: boolean;
  createdAt: string;
  updatedAt?: string;
};

async function fetchProducts(path: string): Promise<Product[]> {
  const res = await fetch(`${process.env.API_URL}/api/products/${path}`, {
    headers: { "X-Internal-Key": process.env.INTERNAL_API_KEY! },
    cache: "no-store", // your cache() wrapper below handles the 2-hour caching
  })
  // Throw on failure so a bad response is never cached for two hours
  if (!res.ok) throw new Error(`Products API returned ${res.status}`)
  return res.json()
}

export type OrderWithProduct = {
  id: string
  priceInCents: number
  createdAt: string
  product: Product
  downloadVerificationId: string
}

export async function fetchMyOrders(): Promise<OrderWithProduct[]> {
  const session = await getServerSession() // add authOptions later
  if (!session?.user?.email) return []

  const res = await fetch(`${process.env.API_URL}/api/downloads/my-orders`, {
    headers: {
      "X-Internal-Key": process.env.INTERNAL_API_KEY!,
      "X-User-Email": session.user.email,
    },
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`Orders API returned ${res.status}`)
  return res.json()
}

export const fetchMostPopular = () => fetchProducts("popular?take=3")
export const fetchNewest = () => fetchProducts("newest?take=3")