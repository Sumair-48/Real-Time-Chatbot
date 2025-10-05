"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)
    setResendSuccess(false)

    console.log("[v0] Attempting login for:", email)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log("[v0] Login response:", { data, error })

      if (error) {
        if (error.code === "email_not_confirmed") {
          throw new Error("EMAIL_NOT_CONFIRMED")
        }
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Invalid email or password. Please try again.")
        }
        throw error
      }

      console.log("[v0] Login successful, redirecting to chat")
      window.location.href = "/chat"
    } catch (error: unknown) {
      console.error("[v0] Login error:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    }
  }

  const handleResendConfirmation = async () => {
    if (!email) {
      setError("Please enter your email address first")
      return
    }

    const supabase = createClient()
    setIsResending(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/chat`,
        },
      })

      if (error) throw error

      setResendSuccess(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to resend confirmation email")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription>Enter your email below to login to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error && (
                  <div className="rounded-lg bg-destructive/10 p-3">
                    {error === "EMAIL_NOT_CONFIRMED" ? (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-destructive">Email Not Confirmed</p>
                        <p className="text-sm text-muted-foreground">
                          Please check your email inbox and click the confirmation link to activate your account.
                        </p>
                        {resendSuccess ? (
                          <p className="text-sm text-green-600">Confirmation email sent! Check your inbox.</p>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleResendConfirmation}
                            disabled={isResending}
                            className="mt-2 bg-transparent"
                          >
                            {isResending ? "Sending..." : "Resend Confirmation Email"}
                          </Button>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-destructive">{error}</p>
                    )}
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/auth/signup" className="underline underline-offset-4">
                  Sign up
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
