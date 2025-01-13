"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { sendPasswordResetEmail } from "./_actions/_action/sendPasswordReset";

export default function ResetPassword() {
  const [status, setStatus] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ email?: string }>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus(null);
    setErrors({});

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get("email") as string;
      const result = await sendPasswordResetEmail(email);

      if (result?.error) {
        setErrors(result.error);
      } else if (result?.message) {
        setStatus(result.message);
      }
    } catch (error) {
      setStatus("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <main suppressHydrationWarning className="cover">
      <div className="box">
        <div className="textfield">
          <div className="my-4">
            <h1 className="text-3xl font-semibold">Reset Password</h1>
          </div>
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
            {errors.email && <p className="text-red-500">{errors.email}</p>} {/* Show errors */}
            <Button type="submit" className="top-10px">
              Send Email
            </Button>
          </form>

          {status && (
            <p className="mt-4 text-green-500">
              {status}
            </p>
          )}

          <p className="mt-4 text-xs text-slate-400">@2025 All rights reserved</p>
        </div>
      </div>
    </main>
  );
}
