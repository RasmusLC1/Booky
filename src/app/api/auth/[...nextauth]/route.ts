// app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GitHubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import { loginVerification } from "./_actions/accountSignin"
import { createAccountIfNeeded } from "./_actions/createAccountIfNeeded"

export const authOptions = {
  providers: [
    // GitHub OAuth
    GitHubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
    }),

    // Google OAuth
    GoogleProvider({
        clientId: process.env.GOOGLE_ID ?? "",
        clientSecret: process.env.GOOGLE_SECRET ?? "",
      }),

    // Your custom email/password Credentials
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "text",
          placeholder: "placeholder@example.com",
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
  // 3. signIn callback
  callbacks: {
    async signIn({ user}) {
      try {
        // If user is valid, optionally create the account
        // in DB if it doesn’t exist.
        await createAccountIfNeeded(user);
        return true; // allow sign-in
      } catch (error) {
        console.error("Error creating user account after signIn:", error);
        return false; // reject sign-in
      }
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
