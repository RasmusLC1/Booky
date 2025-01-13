"use client";
import "./loginform.css"; // Ensure this has the centering styles
import { signIn } from "next-auth/react";
import React, { useState } from "react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function googleLogo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="2em"
      height="2em"
      viewBox="0 0 256 262"
    >
      <path
        fill="#4285f4"
        d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
      />
      <path
        fill="#34a853"
        d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
      />
      <path
        fill="#fbbc05"
        d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
      />
      <path
        fill="#eb4335"
        d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
      />
    </svg>
  );
}

function githubLogo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      width="2em"
      height="2em"
      aria-label="GitHub"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.01.08-2.1 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.52-1.04 2.2-.82 2.2-.82.44 1.09.16 1.9.08 2.1.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"></path>
    </svg>
  );
}


export default function Login() {
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // NextAuth signIn with "credentials"
    const result = await signIn("credentials", {
      email,
      password,
      callbackUrl: "/",
      redirect: false,
    });

    if (result?.error) {
      setErrors({ email: "Invalid email or password" });
    } else {
      // Manually redirect if signIn was successful
      window.location.href = "/";
    }
  };

  return (
    <main suppressHydrationWarning className="cover">
      <div className="box">
        <div className="textfield">
          <div className="my-4">
            <h1 className="text-3xl font-semibold">Login</h1>
          </div>
          <span>
            {/* GitHub OAuth sign in, with callbackUrl */}
            <button className="githubAuthButton" onClick={() => signIn("github", { callbackUrl: "/" })}>
              {githubLogo()}
            </button>

            {/* Google OAuth sign in, with callbackUrl */}
            <button className="googleAuthButton" onClick={() => signIn("google", { callbackUrl: "/" })}>
              {googleLogo()}
            </button>
          </span>
          <form onSubmit={handleSubmit}>
            <Label htmlFor="email">Email*</Label>
            <Input
              className="input"
              type="email"
              name="email"
              id="email"
              placeholder="Email"
              required
            />
            {errors.email && <p className="text-red-500">{errors.email}</p>}

            <Label htmlFor="password">Password*</Label>
            <Input
              className="input"
              type="password"
              name="password"
              id="password"
              placeholder="Password"
              required
            />
            {errors.password && (
              <p className="text-red-500">{errors.password}</p>
            )}

            <Button type="submit" className="registrer_button">
              Login
            </Button>

            <Link href="/signup" passHref>
              <Button type="button" className="signup_button">
                Register
              </Button>
            </Link>

            <Link href="/requestpasswordreset" passHref>
              <Button type="button" className="signup_button">
                Reset Password
              </Button>
            </Link>
          </form>

          <p className="mt-4 text-xs text-slate-400">
            @2025 All rights reserved
          </p>
        </div>
      </div>
    </main>
  );
}
