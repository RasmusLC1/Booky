"use server"

import { z } from "zod"
import db from "@/db/db"
import sanitizeHtml from "sanitize-html"
import { createHash } from "crypto"
import { SendAccountCreationEmail } from "./accontCreationEmail"


const addSchema = z.object({
  email: z.string().min(1, "Email is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
})

export async function addUser(formData: FormData) {
  // 1. Validate
  const result = addSchema.safeParse({
    email: formData.get("email"),
    username: formData.get("username"),
    password: formData.get("password"),
  })

  // 2. Return field-specific errors if validation fails
  if (!result.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of result.error.issues) {
      fieldErrors[issue.path[0]] = issue.message
    }
    return { error: fieldErrors } // No redirect, just return
  }

  // 3. Sanitize
  const data = {
    email: sanitizeHtml(result.data.email.toLowerCase()),
    username: sanitizeHtml(result.data.username.toLowerCase()),
    password: sanitizeHtml(result.data.password),
  }



  // 4. Check if user already exists
  const existingUser = await db.user.findFirst({
    where: {
      OR: [{ email: data.email }, { username: data.username }],
    },
  })
  if (existingUser) {
    // Return a field-level error for each conflict
    return {
      error: {
        email: existingUser.email === data.email ? "Email is already in use" : "",
        username: existingUser.username === data.username ? "Username is already in use" : "",
      },
    }
  }

  // 5. Hash password & create new user
  data.password = createHash("sha256").update(data.password).digest("hex")
  await db.user.create({ data })

  // 6. Call your email action
  const emailFormData = new FormData()
  emailFormData.append("email", data.email)
  await SendAccountCreationEmail(emailFormData)
  
  // 6. Return success or redirect
  // Return something so the client knows we're good:
  return { success: true }
}
