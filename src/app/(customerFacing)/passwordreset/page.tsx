"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { sendPasswordReset } from "./_actions/resetPassword";

export default function PasswordResetPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
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

    const formData = new FormData();
    formData.append("token", token);
    formData.append("password", password);

    const result = await sendPasswordReset(formData);

    if (result?.error) {
      setErrors(result.error);
    } else if (result?.message) {
      setStatus(result.message);
      setTimeout(() => (window.location.href = "/"), 3000); // Redirect after success
    }
  }

  return (
    <main className="cover">
      <div className="box">
        <div className="textfield">
          <h1 className="text-3xl font-semibold my-4">Reset Your Password</h1>
          <form onSubmit={handleSubmit}>
            <Label htmlFor="password">New Password*</Label>
            <Input
              className="input"
              type="password"
              name="password"
              id="password"
              placeholder="Enter your new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {errors.password && <p className="text-red-500">{errors.password}</p>}
            <Button type="submit" className="submit_button mt-4">
              Reset Password
            </Button>
          </form>
          {status && <p className="mt-4 text-green-500">{status}</p>}
          <p className="mt-4 text-xs text-slate-400">@2025 All rights reserved</p>
        </div>
      </div>
    </main>
  );
}
