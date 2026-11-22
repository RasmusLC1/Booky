# Booky

An online bookstore I built to learn how a real shop fits together: accounts, payments, emails, protected downloads and an admin area. It started as a Next.js app with a Node/Prisma backend, and I've been migrating the backend to a custom **ASP.NET Core Web API**.

**Live demo (Currently down) (frontend):** [booky-mu.vercel.app](https://booky-mu.vercel.app)
This is a portfolio project, not a real shop. Payments run in Stripe test mode, so use the test card `4242 4242 4242 4242` with any future expiry and any CVC.

## How it's put together

```
Browser → Next.js (pages, session check, rate limiting) → ASP.NET Core API → SQLite
```

- **Next.js** renders the pages, handles login sessions with NextAuth and rate-limits requests. Its API routes act as thin proxies.
- **ASP.NET Core Web API** owns the data and business rules: orders, users, products, reviews, password-reset tokens and download verification, using EF Core.
- The two talk over a shared service key. Next.js checks who is logged in and forwards the user's email, and the API only accepts requests that carry the key. The API is not meant to be reachable from the public internet.

## Tech stack

| Area | What I used |
|---|---|
| Backend | C#, ASP.NET Core Web API, Entity Framework Core, SQLite |
| Frontend | TypeScript, React, Next.js |
| Auth | NextAuth (credentials + Google), bcrypt password hashing |
| Payments & email | Stripe (test mode), Resend |
| File storage | EdgeStore |
| Validation & protection | Zod, Upstash rate limiting |
| Hosting | Vercel (frontend) |

## What it does

- **Accounts:** register, log in with email or Google, and view your orders.
- **Payments:** checkout through Stripe, with orders recorded in the .NET API.
- **Protected downloads:** a book can only be downloaded by someone who bought it. The API issues a download token that expires after 24 hours and streams the file, so the storage URL is never shown to the browser.
- **Password reset:** emailed reset links with expiring tokens.
- **Reviews:** star ratings per product.
- **Order history emails:** a customer can have their orders and fresh download links sent to their inbox.
- **Admin area:** manage products, users and orders.

## Running it locally

You'll need Node.js, npm and the .NET SDK installed.

### 1. Start the API

```sh
cd Booky.Api
dotnet user-secrets init
dotnet user-secrets set "InternalApiKey" "pick-a-long-random-string"
dotnet ef database update
dotnet run
```

`dotnet ef database update` creates `booky.db` with all the tables. Note the port that `dotnet run` prints.

### 2. Configure the frontend

Create a `.env` file in the project root:

```
API_URL=http://localhost:5123            # the port dotnet run printed
INTERNAL_API_KEY=pick-a-long-random-string   # must match the secret above

NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=...
SENDER_EMAIL=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
GOOGLE_ID=...
GOOGLE_SECRET=...
GITHUB_ID=...
GITHUB_SECRET=...
EDGE_STORE_ACCESS_KEY=...
EDGE_STORE_SECRET_KEY=...
ADMIN_USERNAME=...
ADMIN_HASHED_PASSWORD=...(For now manually encrypt password with Bcrypt)
```

### 3. Start the frontend

```sh
npm install
npm run dev
```

The app runs at http://localhost:3000. To test payments locally, forward Stripe webhooks with the Stripe CLI:

```sh
stripe listen --forward-to localhost:3000/webhooks/stripe
```

### Other commands

| Command | What it does |
|---|---|
| `npm run build` | Production build of the frontend |
| `npm run start` | Serve the production build |
| `npm run lint` | Check the code for lint errors |
| `npm run email` | Preview email templates on port 3001 (served from `src/email`) |

### Admin password

The admin area is protected by a password stored in `.env`. <!-- TODO: replace this with proper admin accounts -->

## Where the migration stands

I'm moving the backend to .NET one route at a time and keeping the frontend working at each step.

- **Done in .NET:** The functionality has been migrated over fully including downloads, stripe, users,
admin, products and orders
- **Still to move:** Unit testing is currently in progress

## What I'd do next

- Host the API somewhere public so the demo runs end to end again.
- Add more interactivity with the site
- Improve flow and general optimisations


## Architecture
```
Booky/
├── Booky.Api/                  # ASP.NET Core Web API
│   ├── Controllers/            # HTTP endpoints (thin, delegate to services)
│   ├── Services/               # Business rules: orders, users, downloads, products, admin, password reset
│   ├── Data/                   # EF Core DbContext and entities
│   ├── Utility/                # Shared validation helpers
│   └── Program.cs              # DI setup and service-key middleware
├── src/                        # Next.js frontend
│   ├── app/                    # Pages, route handlers (thin proxies to the API) and Stripe webhook
│   ├── actions/                # Server actions
│   ├── components/             # UI components
│   ├── email/                  # React Email templates
│   ├── lib/                    # Helpers and API clients
│   └── middleware.ts           # Upstash rate limiting
├── .github/workflows/          # CI
└── local_setup_guide.md        # Detailed local setup
```
