import { addUser } from "@/app/(customerFacing)/signup/_actions/user"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export default function SignUp() {
  return (
    <main className="cover">
      <div className="box">
        <div className="textfield">
          <div className="my-4">
            <h1 className="text-3xl font-semibold">Sign Up</h1>
          </div>
          {/*
            The `action={addUser}` attribute points to your server action.
            Next.js will handle sending the form submission to `addUser(formData)`.
          */}
          <form action={addUser}>
            <Label htmlFor="email">Email*</Label>
            <Input
              className="input"
              type="email"
              name="email"    // IMPORTANT: this must match what your schema expects
              id="email"
              placeholder="Email"
              required
            />

            <Label htmlFor="username">Username*</Label>
            <Input
              className="input"
              type="text"
              name="username" // IMPORTANT
              id="username"
              placeholder="Username"
              required
            />

            <Label htmlFor="password">Password*</Label>
            <Input
              className="input"
              type="password"
              name="password" // IMPORTANT
              id="password"
              placeholder="password"
              required
            />

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
