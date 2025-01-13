// app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GitHubProvider from "next-auth/providers/github"
import { loginVerification } from "./_actions/accountSignin"

export const authOptions = {
  providers: [
    // Example: GitHub OAuth
    GitHubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
    }),

    // Your custom email/password Credentials
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "text",
          placeholder: "jsmith@example.com",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials, req) {
        // The `credentials` object is whatever is passed to signIn("credentials", {...})
        // Call your existing loginVerification function
        const formData = new FormData()
        formData.set("email", credentials?.email || "")
        formData.set("password", credentials?.password || "")

        const result = await loginVerification(formData)
        if (result?.success) {
          // Return the user object that should be saved in session
          // Typically you'd return { id, name, email, ... } from your DB
          return {
            id: "UserIdInDB", 
            name: credentials?.email,
            email: credentials?.email,
          }
        }

        // If the credentials are invalid, return null or throw an Error
        return null
      },
    }),
  ],
  session: {
    strategy: "jwt", // or "database" or "session" if you prefer
  },
  // ...
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
