"use server"

import { z } from "zod"
import db from "@/db/db"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import sanitizeHtml from "sanitize-html"
import { createHash } from "crypto"  // Import the crypto module

const addSchema = z.object({
  email: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
})

export async function addUser(formData: FormData) {
  // 1. Parse form data
  const result = addSchema.safeParse({
    email: formData.get("email"),
    username: formData.get("username"),
    password: formData.get("password"),
  })
  if (!result.success) {
    return { error: "Validation error" }
  }

  // 2. Sanitize for safety
  const data = {
    email: sanitizeHtml(result.data.email),
    username: sanitizeHtml(result.data.username),
    password: sanitizeHtml(result.data.password),
  }

  // 3. Hash the password using SHA-256 (for basic example only)
  //    For production, consider using bcrypt or Argon2 for better security.
  data.password = createHash("sha256").update(data.password).digest("hex")



  // 4. Create user in DB
  await db.user.create({
    data: {
      email: data.email,
      username: data.username,
      password: data.password,
    },
  })

  // 5. Revalidate relevant paths if necessary
  revalidatePath("/")

  // 6. Redirect (or you could return a success message)
  redirect("/")
}
