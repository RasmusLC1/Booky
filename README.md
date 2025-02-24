# Booky - E-Commerce Platform  
**Hosted on:** [Booky on Vercel](https://booky-mu.vercel.app)  

## 📖 Description  
Booky is a full-stack e-commerce platform for books, built with **Next.js** and **TypeScript**, featuring secure payments, user authentication, automated emails, and an admin dashboard. Designed for **scalability, performance, and security**.  

## 🛠️ Technology Stack  
- **Language:** TypeScript  
- **Frameworks:** [Next.js](https://nextjs.org/) (React), [Node.js](https://nodejs.org/) (Backend API)  
- **Authentication:** [NextAuth](https://next-auth.js.org/), bcrypt (password encryption)  
- **Database:** [PostgreSQL](https://www.postgresql.org/) via [Prisma ORM](https://www.prisma.io/) (hosted on [Supabase](https://supabase.com/))  
- **APIs:** [Stripe](https://stripe.com/) (Payments), [Resend](https://resend.com/) (Emails), [EdgeStore](https://edgestore.dev/) (File handling)  
- **Security:** HTML Sanitization (XSS prevention), [Zod](https://zod.dev/) (validation)  
- **Hosting & Deployment:** [Vercel](https://vercel.com/)  

## 🚀 Features  
✅ **User Authentication & Profiles** – Secure login via NextAuth & bcrypt, with profile management and order history.  
✅ **Secure Payments** – Fast, encrypted transactions using Stripe.  
✅ **Password Reset & Emails** – Automated secure reset links via Resend API.  
✅ **Secure File Uploads** – EdgeStore validation to prevent malicious content.  
✅ **Optimized Database Queries** – Indexed search and filtering via Prisma ORM & PostgreSQL.  
✅ **XSS & Input Sanitization** – Prevents cross-site scripting and unsafe user input.  
✅ **Dynamic Routing & URL Security** – Randomized product IDs to prevent scraping.  
✅ **Admin Dashboard** – Manage users, products, orders, feedback, and moderation.  
✅ **Scalable Cloud Deployment** – Hosted on Supabase & Vercel for reliability.  
✅ **CI/CD Integration** – Automated testing & deployment via GitHub Actions.  

## 🏗️ How to Run

## 1. Install Dependencies  
Ensure you have **Node.js** and **npm** installed, then run:  

```sh
npm install
```

2. Start the Development Server

To run the app in development mode, use:

```sh
npm run dev
```

This will:

  Start the Next.js development server
  Listen for Stripe webhooks and forward them to http://localhost:3000/webhooks/stripe

3. Build the Application

Before deploying, generate the Prisma client and build the Next.js app:

```sh
npm run build
```

4. Start the Production Server

After building, start the production server with:

```sh
  npm run start
```

5. Lint the Code

To check for linting errors, run:

```sh
npm run lint
```

6. Run the Email Development Server

To preview emails, run:

```sh
npm run email
```

This serves emails from the src/email directory on port 3001.
