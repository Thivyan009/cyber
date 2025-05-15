"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { OnboardingForm } from "@/components/onboarding-form"
import { Sprout } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { LanguageSelector } from "@/components/language-selector"

export default function OnboardingPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  // Redirect to dashboard if user has already completed onboarding
  useEffect(() => {
    if (!isLoading && user?.onboardingComplete) {
      router.push("/")
    }
  }, [user, isLoading, router])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <Sprout className="h-5 w-5 text-primary" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                ai
              </span>
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Uzhavan.ai</h1>
              <p className="text-xs text-muted-foreground">உழவனுக்காக... இலவசமாக</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="container py-10">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold">Welcome to Uzhavan.ai</h1>
            <p className="text-muted-foreground mt-2">
              Let's set up your farm profile to provide you with personalized insights
            </p>
          </div>

          <OnboardingForm />
        </div>
      </main>
    </div>
  )
}
