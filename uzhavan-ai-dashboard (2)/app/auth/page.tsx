"use client"

import Link from "next/link"
import { Sprout } from "lucide-react"
import { AuthForm } from "@/components/auth-form"
import { ModeToggle } from "@/components/mode-toggle"
import { LanguageSelector } from "@/components/language-selector"
import { useLanguage } from "@/components/language-provider"

export default function AuthPage() {
  const { getTranslation } = useLanguage()

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:block relative bg-muted">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
        <div className="absolute inset-0 flex items-center justify-center p-10">
          <div className="max-w-md space-y-6 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Sprout className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Uzhavan.ai</h1>
            <p className="text-muted-foreground">
              AI-powered farming assistant designed to help smallholder farmers make better decisions about crops,
              weather, and market prices.
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-background/50 p-4 text-center backdrop-blur">
                <h3 className="font-medium">{getTranslation("weather")}</h3>
                <p className="text-xs text-muted-foreground">Real-time forecasts</p>
              </div>
              <div className="rounded-lg bg-background/50 p-4 text-center backdrop-blur">
                <h3 className="font-medium">{getTranslation("market")}</h3>
                <p className="text-xs text-muted-foreground">Market updates</p>
              </div>
              <div className="rounded-lg bg-background/50 p-4 text-center backdrop-blur">
                <h3 className="font-medium">AI Chat</h3>
                <p className="text-xs text-muted-foreground">Smart assistance</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
              <Sprout className="h-4 w-4 text-primary" />
              <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-primary text-[8px] text-primary-foreground">
                ai
              </span>
            </div>
            <span className="text-lg font-semibold">Uzhavan.ai</span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <ModeToggle />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="mx-auto w-full max-w-md">
            <AuthForm />
          </div>
        </div>
      </div>
    </div>
  )
}
