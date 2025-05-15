"use client"

import { useAuth } from "@/context/auth-context"
import { useLanguage } from "@/components/language-provider"
import { Header } from "@/components/header"
import { AiChat } from "@/components/ai-chat"
import { CloudSun, TrendingUp, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/currencies"

export default function Home() {
  const { user } = useAuth()
  const { getTranslation } = useLanguage()

  // Market prices in base currency (INR)
  const marketPrices = [
    { name: "Rice", price: 42, change: 2 },
    { name: "Tomatoes", price: 35, change: -5 },
    { name: "Onions", price: 28, change: 3 },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-10 space-y-10">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {getTranslation("welcome")}, {user?.name}
          </h2>
          <p className="text-muted-foreground">Your personalized farming insights and assistance</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="overflow-hidden border-none bg-gradient-to-br from-sky-500/10 to-sky-500/5 shadow-md dark:shadow-sky-900/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg font-medium">
                <CloudSun className="h-5 w-5 text-sky-500" />
                {getTranslation("weather")}
              </CardTitle>
              <CardDescription>Today and tomorrow's conditions</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-2 divide-x">
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <div className="mb-2 rounded-full bg-sky-500/20 p-2">
                    <CloudSun className="h-8 w-8 text-sky-500" />
                  </div>
                  <span className="text-4xl font-light">32°</span>
                  <span className="mt-1 text-sm text-muted-foreground">Sunny</span>
                  <span className="mt-2 text-xs text-muted-foreground">Today</span>
                </div>
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <div className="mb-2 rounded-full bg-blue-500/20 p-2">
                    <CloudSun className="h-8 w-8 text-blue-500" />
                  </div>
                  <span className="text-4xl font-light">30°</span>
                  <span className="mt-1 text-sm text-muted-foreground">Partly Cloudy</span>
                  <span className="mt-2 text-xs text-muted-foreground">Tomorrow</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-none bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 shadow-md dark:shadow-emerald-900/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg font-medium">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                {getTranslation("market")}
              </CardTitle>
              <CardDescription>Current crop prices in {user?.country || "your area"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {marketPrices.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-2 w-2 rounded-full ${item.change >= 0 ? "bg-emerald-500" : "bg-red-500"}`}
                      ></div>
                      <span>{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {user?.currency ? formatCurrency(item.price, user.currency.code) : `₹${item.price}`}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          item.change >= 0
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : "bg-red-500/10 text-red-500 border-red-500/20"
                        }`}
                      >
                        {item.change >= 0 ? "+" : ""}
                        {item.change}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-none bg-gradient-to-br from-amber-500/10 to-amber-500/5 shadow-md dark:shadow-amber-900/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg font-medium">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                {getTranslation("suggestions")}
              </CardTitle>
              <CardDescription>AI-powered farming advice</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="rounded-lg bg-amber-500/10 p-4">
                  <p className="text-sm">
                    Consider harvesting your tomatoes in the early morning to maintain freshness and maximize market
                    value.
                  </p>
                </div>
                <Button variant="outline" className="w-full">
                  View more suggestions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2">
            <TabsTrigger value="chat">AI Chat</TabsTrigger>
            <TabsTrigger value="voice">Voice Assistant</TabsTrigger>
          </TabsList>
          <TabsContent value="chat" className="mt-4">
            <AiChat />
          </TabsContent>
          <TabsContent value="voice" className="mt-4">
            <Card className="border-none bg-gradient-to-br from-primary/10 to-primary/5 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-primary"></span>
                  </span>
                  Voice Assistant
                </CardTitle>
                <CardDescription>Speak to get farming assistance</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center gap-6 py-10">
                <div className="relative flex h-24 w-24 items-center justify-center">
                  <div className="absolute h-full w-full animate-ping rounded-full bg-primary/10"></div>
                  <div className="absolute h-[80%] w-[80%] rounded-full bg-primary/20"></div>
                  <div className="absolute h-[60%] w-[60%] rounded-full bg-primary/30"></div>
                  <Button size="lg" className="relative z-10 h-16 w-16 rounded-full">
                    <Lightbulb className="h-6 w-6" />
                  </Button>
                </div>
                <p className="text-center text-sm text-muted-foreground">Tap the button and ask a question</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
