import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { loginVerification } from "./_actions/accountSignin";
import { createAccountIfNeeded } from "./_actions/createAccountIfNeeded";

const handler = NextAuth({
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID ?? "",
      clientSecret: process.env.GOOGLE_SECRET ?? "",
    }),
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
      async authorize(credentials) {
        const formData = new FormData();
        formData.set("email", credentials?.email || "");
        formData.set("password", credentials?.password || "");

        const result = await loginVerification(formData);
        if (result?.success) {
          return {
            id: "UserIdInDB",
            name: credentials?.email,
            email: credentials?.email,
          };
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user }) {
      try {
        await createAccountIfNeeded(user);
        return true;
      } catch (error) {
        console.error("Error creating user account after signIn:", error);
        return false;
      }
    },
  },
});

export { handler as GET, handler as POST };
