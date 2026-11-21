📚 Booky Local Development Setup Guide

Use this guide to configure and run the Booky e-commerce application locally after a period of inactivity.

1. Environment Variables (.env.local)

Create a .env.local file in the root directory of your project and populate it with the following required variables:

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_generated_base64_secret_here

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# GitHub OAuth Credentials
GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_client_secret

# Email Service (Resend)
RESEND_API_KEY=re_your_resend_api_key

# EdgeStore & Database (Ensure your DB connection string is set)
DATABASE_URL=your_database_connection_string
NEXT_PUBLIC_EDGESTORE_ACCESS_KEY=your_edgestore_key
EDGESTORE_SECRET_KEY=your_edgestore_secret

# Strip
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_public_key
STRIPE_SECRET_KEY=your_stripe_secret_key

Generating NEXTAUTH_SECRET: Run the following command in your terminal if you don't have a secret yet:

node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"


2. OAuth Developer Console Configurations

Google and GitHub require precise redirect URIs to handle authentication locally.

Google Cloud Console (APIs & Services > Credentials)

Authorised JavaScript origins:

http://localhost:3000


Authorised redirect URIs:

http://localhost:3000/api/auth/callback/google
https://booky-mu.vercel.app/api/auth/callback/google


GitHub Developer Settings (OAuth Apps)

Homepage URL: http://localhost:3000 (or your production URL)

Authorization callback URL:

http://localhost:3000/api/auth/callback/github
https://booky-mu.vercel.app/api/auth/callback/github


3. NextAuth GitHub Provider Configuration

Due to recent OAuth issuer requirements, ensure your GitHub provider inside your NextAuth options explicitly includes the official login issuer string:

import GitHubProvider from "next-auth/providers/github";

// Inside your NextAuth configuration:
providers: [
  GitHubProvider({
    clientId: process.env.GITHUB_ID ?? "",
    clientSecret: process.env.GITHUB_SECRET ?? "",
    issuer: "https://github.com/login/oauth",
  }),
]


4. Resetting and Starting the Local Server

Whenever you update your environment variables or core auth configurations, clear the Next.js build cache to prevent stale artifact errors:

Stop the dev server (Ctrl + C).

Wipe the .next cache folder:

Remove-Item -Recurse -Force .next


Start the development server fresh:

npx next dev