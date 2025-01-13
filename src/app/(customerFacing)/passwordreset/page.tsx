"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { sendPasswordReset } from "./_actions/resetPassword";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ResetPassword() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ password?: string }>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);
    setErrors({});

    if (!token) {
      setStatus("Invalid or missing token.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.append("token", token); // ✅ Append the token from the URL

    const result = await sendPasswordReset(formData);

    if (result?.error) {
      setErrors(result.error);
    } else if (result?.message) {
      setStatus(result.message);
      window.location.href = "/"

    }
  }

  return (
    <main className="cover">
      <div className="box">
        <div className="textfield">
          <div className="my-4">
            <h1 className="text-3xl font-semibold">Reset Your Password</h1>
          </div>

          <form onSubmit={handleSubmit}>
            <Label htmlFor="password">New Password*</Label>
            <Input
              className="input"
              type="password"
              name="password"
              id="password"
              placeholder="Enter your new password"
              required
            />
            {errors.password && <p className="text-red-500">{errors.password}</p>}

            <Button type="submit" className="submit_button mt-4">
              Reset Password
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
