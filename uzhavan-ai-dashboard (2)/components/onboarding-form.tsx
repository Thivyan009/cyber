"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/components/ui/use-toast"

interface FarmProfile {
  location: {
    type: string
    latitude: string
    longitude: string
    address: string
    district: string
    state: string
  }
  farmType: string[]
  otherFarmType?: string
  language: string
  farmSize: string
  irrigationMethod: string
  otherIrrigationMethod?: string
  isOrganic: boolean
}

export function OnboardingForm() {
  const router = useRouter()
  const { user, updateUserPreferences } = useAuth()
  const { toast } = useToast()

  const [farmProfile, setFarmProfile] = useState<Partial<FarmProfile>>({
    location: {
      type: "Point",
      latitude: "",
      longitude: "",
      address: "",
      district: "",
      state: "",
    },
    farmType: [],
    language: "en",
    farmSize: "",
    irrigationMethod: "",
    isOrganic: false,
  })

  const handleLocationChange = (field: string, value: string) => {
    setFarmProfile((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value,
      },
    }))
  }

  const handleFarmTypeChange = (farmType: string[]) => {
    setFarmProfile((prev) => ({ ...prev, farmType }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target

    if (type === "checkbox") {
      setFarmProfile((prev) => ({ ...prev, [name]: checked }))
    } else {
      setFarmProfile((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Update user preferences
      updateUserPreferences({
        farmProfile: farmProfile,
        onboardingComplete: true,
      })

      // Set onboarding complete cookie
      document.cookie = "onboarding-complete=true; path=/; max-age=31536000" // 1 year

      toast({
        title: "Onboarding Complete",
        description: "Your farm profile has been created successfully",
      })

      router.push("/")
    } catch (error) {
      console.error("Onboarding failed:", error)
      toast({
        title: "Onboarding Failed",
        description: "There was an error creating your farm profile. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="border-none bg-gradient-to-br from-background to-muted/50 shadow-md">
      <CardHeader>
        <CardTitle>Farm Profile</CardTitle>
        <CardDescription>Tell us about your farm</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              type="text"
              id="address"
              name="address"
              value={farmProfile.location?.address || ""}
              onChange={(e) => handleLocationChange("address", e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="district">District</Label>
            <Input
              type="text"
              id="district"
              name="district"
              value={farmProfile.location?.district || ""}
              onChange={(e) => handleLocationChange("district", e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input
              type="text"
              id="state"
              name="state"
              value={farmProfile.location?.state || ""}
              onChange={(e) => handleLocationChange("state", e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="farmSize">Farm Size (acres)</Label>
            <Input
              type="number"
              id="farmSize"
              name="farmSize"
              value={farmProfile.farmSize || ""}
              onChange={handleInputChange}
              required
            />
          </div>
          <Button type="submit">Create Profile</Button>
        </form>
      </CardContent>
    </Card>
  )
}
