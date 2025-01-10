"use client"

import { FormEvent, useState } from "react"
import { emailOrderHistory } from "@/actions/orders"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function MyOrdersPage() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    setPending(true)
    setError("")
    setMessage("")

    const formData = new FormData(e.currentTarget)

    try {
      const result = await emailOrderHistory(null, formData)
      if (result.error) {
        setError(result.error)
      } else {
        setMessage(result.message || "")
      }
    } catch (err) {
      setError("Something went wrong. Please try again.")
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>My Orders</CardTitle>
          <CardDescription>
            Enter your email and we will email you your order history and
            download links.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input type="email" required name="email" id="email" />
            {error && <div className="text-destructive">{error}</div>}
          </div>
        </CardContent>
        <CardFooter>
          {message ? (
            <p>{message}</p>
          ) : (
            <SubmitButton pending={pending} />
          )}
        </CardFooter>
      </Card>
    </form>
  )
}

function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <Button className="w-full" size="lg" disabled={pending} type="submit">
      {pending ? "Sending..." : "Send"}
    </Button>
  )
}
