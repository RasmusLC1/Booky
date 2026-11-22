# Booky

An online bookstore I built to learn how a real shop fits together: accounts, payments, emails, protected downloads and an admin area. It started as a Next.js app with a Node/Prisma backend, and I migrated the backend to a custom **ASP.NET Core Web API**.

**Live demo:** [booky-mu.vercel.app](https://booky-mu.vercel.app) *(currently down: the frontend is on Vercel, but the API still needs a public host)*

This is a portfolio project, not a real shop. Payments run in Stripe test mode, so use the test card `4242 4242 4242 4242` with any future expiry and any CVC.

## How it's put together

```
Browser → Next.js (pages, session check, rate limiting) → ASP.NET Core API → SQLite
```

- **Next.js** renders the pages, handles login sessions with NextAuth and rate-limits requests. Its API routes act as thin proxies.
- **ASP.NET Core Web API** owns the data and business rules: orders, users, products, reviews, password-reset tokens, downloads and the admin area, using EF Core.
- The two talk over a shared service key. Next.js checks who is logged in and forwards the user's email, and the API only accepts requests that carry the key. The API is not meant to be reachable from the public internet.

## Tech stack

| Area | What I used |
|---|---|
| Backend | C#, ASP.NET Core Web API, Entity Framework Core, SQLite |
| Frontend | TypeScript, React, Next.js |
| Auth | NextAuth (credentials, Google, GitHub), bcrypt password hashing |
| Payments & email | Stripe (test mode), Resend |
| File storage | EdgeStore |
| Validation & protection | Zod, Upstash rate limiting |
| Hosting | Vercel (frontend) |

## What it does

- **Accounts:** register, log in with email, Google or GitHub, and view your orders.
- **Payments:** checkout through Stripe, with orders recorded in the .NET API.
- **Protected downloads:** a book can only be downloaded by someone who bought it. The API issues a download token that expires after 24 hours and streams the file, so the storage URL is never shown to the browser.
- **Password reset:** emailed reset links with expiring tokens.
- **Reviews:** star ratings per product.
- **Order history emails:** a customer can have their orders and fresh download links sent to their inbox.
- **Admin area:** manage products, users and orders.

## Running it locally

### Prerequisites

| Tool | Check with | Notes |
|---|---|---|
| Node.js and npm | `node -v` | <!-- TODO: minimum version --> |
| .NET SDK | `dotnet --version` | <!-- TODO: version your .csproj targets, e.g. 9.0 --> |
| EF Core CLI | `dotnet ef --version` | Install once with `dotnet tool install --global dotnet-ef` |
| Stripe CLI | `stripe --version` | Only needed to test payments locally |

You also need free accounts for Stripe (test mode), Resend, Upstash and EdgeStore. Google and GitHub OAuth are optional, because email login works without them.

### 1. Set up the backend

From the repository root:

```sh
cd Booky.Api
```

**Set the service key.** The API refuses every `/api` request that doesn't carry this key, so it has to match the one the frontend uses. It's stored in user-secrets, so it never ends up in Git:

```sh
dotnet user-secrets init
dotnet user-secrets set "InternalApiKey" "pick-a-long-random-string"
```

**Create the database.** The connection string is `Data Source=booky.db`, so the file is created in the folder you run the command from:

```sh
dotnet ef database update
```

This applies the migrations in `Booky.Api/Migrations/` and creates `booky.db` with all tables (products, users, orders, reviews, download verifications, password resets).

**Start the API on a fixed port:**

```sh
dotnet run --urls http://localhost:5123
```

Check that it's running: a request without the key should be rejected.

```sh
curl -i http://localhost:5123/api/products/newest
# HTTP/1.1 401  (expected: no service key)

curl -i -H "X-Internal-Key: pick-a-long-random-string" http://localhost:5123/api/products/newest
# HTTP/1.1 200  with [] on an empty database
```

Leave this terminal running.

### 2. Configure the frontend

Create a `.env` file in the repository root:

```
# Backend connection (must match the API)
API_URL=http://localhost:5123
INTERNAL_API_KEY=pick-a-long-random-string

# Auth
NEXTAUTH_SECRET=...            # generate with: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
GOOGLE_ID=...                  # optional
GOOGLE_SECRET=...              # optional
GITHUB_ID=...                  # optional
GITHUB_SECRET=...              # optional

# Payments and email
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=...
SENDER_EMAIL=...

# Rate limiting (the middleware needs these to start)
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# File uploads
EDGE_STORE_ACCESS_KEY=...
EDGE_STORE_SECRET_KEY=...

# Admin login
ADMIN_USERNAME=...
ADMIN_HASHED_PASSWORD=...
```

Don't put `# comments` on the same line as a value in your real `.env`. Some parsers treat them as part of the value.

### 3. Start the frontend

```sh
npm install
npm run dev
```

The app runs at http://localhost:3000. To test payments, forward Stripe webhooks in a third terminal and copy the `whsec_...` secret it prints into `STRIPE_WEBHOOK_SECRET`:

```sh
stripe listen --forward-to localhost:3000/webhooks/stripe
```

### 4. Add some data

The database starts empty. Sign in to the admin area at `/admin` and add products there (uploads go through EdgeStore, so those keys must be set). A user account is created when you sign up.

### Admin login

The admin area uses `ADMIN_USERNAME` and a **bcrypt hash** in `ADMIN_HASHED_PASSWORD`, not the plain password. Generate the hash once:

```sh
node -e "console.log(require('bcrypt').hashSync('your-password', 12))"
```

A bcrypt hash contains `$` characters, and Next.js expands `$NAME` in `.env` files. Escape each one with a backslash, otherwise the login always fails:

```
ADMIN_HASHED_PASSWORD=\$2b\$12\$abcdefghijklmnopqrstuv...
```

<!-- TODO: replace this with proper admin accounts -->

### Running the backend tests

```sh
dotnet test
```

<!-- TODO: only keep this once the test project exists and is committed -->

### Other commands

| Command | What it does |
|---|---|
| `npm run build` | Production build of the frontend |
| `npm run start` | Serve the production build |
| `npm run lint` | Check the code for lint errors |
| `npm run email` | Preview email templates on port 3001 (served from `src/email`) |
| `dotnet ef migrations add <Name>` | Create a migration after changing the entities (run in `Booky.Api`) |
| `dotnet ef database update` | Apply migrations to `booky.db` |

### Troubleshooting

| Symptom | Likely cause |
|---|---|
| Every request returns 401 | `InternalApiKey` (API) and `INTERNAL_API_KEY` (frontend) differ, or the secret isn't set. Check with `dotnet user-secrets list`. |
| "Internal Server Error" from the Next.js routes | The API isn't running, or `API_URL` has the wrong port. |
| "User not found" when ordering | The logged-in user's email doesn't exist in `booky.db`. Sign up again after pointing the frontend at the API. |
| The frontend crashes on startup | A missing Upstash variable. The rate-limit middleware reads them on every request. |
| `dotnet ef` says the build failed | Run `dotnet build` and read the actual compiler errors. |
| Admin login always fails | The `$` characters in the hash weren't escaped (see above). |

## Where the migration stands

I moved the backend to .NET one route at a time, keeping the frontend working at each step.

- **Done in .NET:** downloads, Stripe orders, users, admin, products, reviews, password reset and orders.
- **In progress:** unit tests for the order and user services.

## What I'd do next

- Host the API somewhere public so the demo runs end to end again.
- Add more interactivity to the site.
- Improve flow and general optimisations.

## Project structure
```
Booky/
├── Booky.Api/                  # ASP.NET Core Web API
│   ├── Controllers/            # HTTP endpoints (thin, delegate to services)
│   ├── Services/               # Business rules: orders, users, downloads, products, admin, password reset
│   ├── Data/                   # EF Core DbContext and entities
│   ├── Migrations/             # EF Core migrations
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
