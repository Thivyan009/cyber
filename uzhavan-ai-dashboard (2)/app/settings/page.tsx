"use client"

import Link from "next/link"
import { ArrowLeft, Bell, Globe, Lock, Moon, User, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Header } from "@/components/header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/context/auth-context"
import { CountrySelector } from "@/components/country-selector"
import { CurrencySelector } from "@/components/currency-selector"
import { getCurrencyByCountry } from "@/lib/currencies"
import { useToast } from "@/components/ui/use-toast"

export default function SettingsPage() {
  const { user, updateUserPreferences } = useAuth()
  const { toast } = useToast()

  const handleCountryChange = (country: string) => {
    // Get the default currency for the selected country
    const currency = getCurrencyByCountry(country)

    // Update user preferences
    updateUserPreferences({
      country,
      currency: {
        code: currency.code,
        symbol: currency.symbol,
        name: currency.name,
      },
    })

    toast({
      title: "Country updated",
      description: `Your country has been updated to ${country}`,
    })
  }

  const handleSaveChanges = () => {
    toast({
      title: "Settings saved",
      description: "Your settings have been saved successfully",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-10">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to Dashboard</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Manage your account preferences</p>
          </div>
        </div>

        <Tabs defaultValue="account" className="space-y-8">
          <TabsList className="w-full max-w-md grid grid-cols-6 h-auto p-1 bg-muted/50">
            <TabsTrigger value="account" className="rounded-md data-[state=active]:bg-background">
              <User className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline-block">Account</span>
            </TabsTrigger>
            <TabsTrigger value="currency" className="rounded-md data-[state=active]:bg-background">
              <DollarSign className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline-block">Currency</span>
            </TabsTrigger>
            <TabsTrigger value="language" className="rounded-md data-[state=active]:bg-background">
              <Globe className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline-block">Language</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-md data-[state=active]:bg-background">
              <Bell className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline-block">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="rounded-md data-[state=active]:bg-background">
              <Moon className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline-block">Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-md data-[state=active]:bg-background">
              <Lock className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline-block">Security</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <Card className="border-none bg-gradient-to-br from-background to-muted/50 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Account Settings
                </CardTitle>
                <CardDescription>Manage your account information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" defaultValue={user?.name} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" defaultValue={user?.phone} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address (Optional)</Label>
                  <Input id="email" defaultValue={user?.email} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <CountrySelector defaultValue={user?.country} onSelect={handleCountryChange} />
                </div>
                <Button onClick={handleSaveChanges}>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="currency">
            <Card className="border-none bg-gradient-to-br from-background to-muted/50 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Currency Settings
                </CardTitle>
                <CardDescription>Choose your preferred currency for prices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <CurrencySelector />
                  <p className="text-sm text-muted-foreground mt-2">
                    This will change how prices are displayed throughout the application.
                  </p>
                </div>
                <Button onClick={handleSaveChanges}>Save Currency Preference</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="language">
            <Card className="border-none bg-gradient-to-br from-background to-muted/50 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Language Settings
                </CardTitle>
                <CardDescription>Choose your preferred language</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <RadioGroup defaultValue="ta">
                  {[
                    { value: "en", label: "English", flag: "🇬🇧" },
                    { value: "ta", label: "தமிழ் (Tamil)", flag: "🇮🇳" },
                    { value: "hi", label: "हिंदी (Hindi)", flag: "🇮🇳" },
                    { value: "te", label: "తెలుగు (Telugu)", flag: "🇮🇳" },
                    { value: "kn", label: "ಕನ್ನಡ (Kannada)", flag: "🇮🇳" },
                  ].map((language) => (
                    <div key={language.value} className="flex items-center space-x-2 rounded-md p-2 hover:bg-muted">
                      <RadioGroupItem value={language.value} id={language.value} />
                      <Label htmlFor={language.value} className="flex items-center gap-2 cursor-pointer">
                        <span className="text-base">{language.flag}</span> {language.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                <Button onClick={handleSaveChanges}>Save Language Preference</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="border-none bg-gradient-to-br from-background to-muted/50 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Notification Settings
                </CardTitle>
                <CardDescription>Manage your notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {[
                    {
                      id: "weather-alerts",
                      title: "Weather Alerts",
                      description: "Receive alerts about weather changes",
                      defaultChecked: true,
                    },
                    {
                      id: "price-updates",
                      title: "Market Price Updates",
                      description: "Get notified when crop prices change significantly",
                      defaultChecked: true,
                    },
                    {
                      id: "farming-tips",
                      title: "Farming Tips",
                      description: "Receive daily farming tips and advice",
                      defaultChecked: true,
                    },
                    {
                      id: "sms-notifications",
                      title: "SMS Notifications",
                      description: "Receive notifications via SMS",
                      defaultChecked: false,
                    },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-md p-3 hover:bg-muted">
                      <div>
                        <h3 className="font-medium">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <Switch id={item.id} defaultChecked={item.defaultChecked} />
                    </div>
                  ))}
                </div>
                <Button onClick={handleSaveChanges}>Save Notification Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            <Card className="border-none bg-gradient-to-br from-background to-muted/50 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Moon className="h-5 w-5 text-primary" />
                  Appearance Settings
                </CardTitle>
                <CardDescription>Customize how the app looks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {[
                    {
                      id: "dark-mode",
                      title: "Dark Mode",
                      description: "Switch between light and dark themes",
                      defaultChecked: true,
                    },
                    {
                      id: "large-text",
                      title: "Large Text",
                      description: "Increase text size for better readability",
                      defaultChecked: false,
                    },
                    {
                      id: "reduce-animations",
                      title: "Reduce Animations",
                      description: "Minimize motion for accessibility",
                      defaultChecked: false,
                    },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-md p-3 hover:bg-muted">
                      <div>
                        <h3 className="font-medium">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <Switch id={item.id} defaultChecked={item.defaultChecked} />
                    </div>
                  ))}
                </div>
                <Button onClick={handleSaveChanges}>Save Appearance Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="border-none bg-gradient-to-br from-background to-muted/50 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Security Settings
                </CardTitle>
                <CardDescription>Manage your account security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Change Password</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input id="current-password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input id="new-password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input id="confirm-password" type="password" />
                    </div>
                  </div>
                  <Button className="mt-2" onClick={handleSaveChanges}>
                    Update Password
                  </Button>
                </div>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-md p-3 hover:bg-muted">
                    <div>
                      <h3 className="font-medium">Two-Factor Authentication</h3>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                    </div>
                    <Switch id="two-factor" />
                  </div>
                </div>
                <Separator />
                <div className="pt-2">
                  <Button variant="destructive">Log Out of All Devices</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
