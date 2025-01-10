"use client"


import { addUser } from "@/app/(customerFacing)/signup/_actions/user"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import React, { useState } from "react"


export default function SignUp() {

  // State to hold field errors returned by the server
  const [errors, setErrors] = useState<{ email?: string; username?: string; password?: string }>({})

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors({}) // Clear previous errors

    const formData = new FormData(e.currentTarget)
    const result = await addUser(formData)

    // If the server returns field-level errors, store them so we can display
    if (result?.error) {
      setErrors(result.error)
    } else if (result?.success) {
      
      // Redirect or do something else upon success
      window.location.href = "/"
    }
  }

  return (
    <main className="cover">
      
      <div className="box">
        <div className="textfield">
          <div className="my-4">
            <h1 className="text-3xl font-semibold">Sign Up</h1>
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
            {errors.email && <p className="text-red-500">{errors.email}</p>}


            <Label htmlFor="username">Username*</Label>
            <Input
              className="input"
              type="text"
              name="username" 
              id="username"
              placeholder="Username"
              required
            />
            {errors.username && <p className="text-red-500">{errors.username}</p>}


            <Label htmlFor="password">Password*</Label>
            <Input
              className="input"
              type="password"
              name="password" 
              id="password"
              placeholder="password"
              required
            />
            {errors.password && <p className="text-red-500">{errors.password}</p>}


            <Button type="submit" className="submit_button">
              Register
            </Button>
          </form>
          <p className="mt-4 text-xs text-slate-400">@2025 All rights reserved</p>
        </div>
      </div>
    </main>
  )
}
