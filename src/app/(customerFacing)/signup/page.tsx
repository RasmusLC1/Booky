import React from "react";
import "./signupform.css";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";


export default function Login() {
  return (
    <main className="cover">
      <div className="box">
        <div className="textfield">
          <div className="my-4">
            <h1 className="text-3xl font-semibold">Sign Up</h1>
          </div>

          <form>
            <Label htmlFor="email">Email*</Label>
            <Input
              className="input"
              type="email"
              id="email"
              placeholder="Email"
            ></Input>
            <Label htmlFor="username">Username*</Label>
            <Input
              className="input"
              type="text"
              id="username"
              placeholder="Username"
            ></Input>
            <Label htmlFor="password">Password*</Label>
            <Input
              className="input"
              type="password"
              id="password"
              placeholder="password"
            ></Input>

            <Button type="submit" className = "submit_button">
                Registrer
            </Button>
          </form>
          <p className="mt-4 text-xs text-slate-400">@2025 All rights reserved</p>
        </div>
      </div>
    </main>
  );
}
