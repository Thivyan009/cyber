"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { BusinessSwitcher } from "@/components/business-switcher"
import { Business } from "@/lib/types/business"

export function BusinessName() {
  const { data: session, status } = useSession()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [currentBusinessId, setCurrentBusinessId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBusinesses() {
      if (status === "loading") {
        return
      }

      if (!session?.user?.id) {
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch("/api/businesses", {
          credentials: "include",
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        console.log("Fetched businesses:", data) // Debug log
        setBusinesses(data)
        
        // Get current business ID from localStorage
        const storedBusinessId = localStorage.getItem("currentBusinessId")
        if (storedBusinessId && data.some((b: Business) => b.id === storedBusinessId)) {
          setCurrentBusinessId(storedBusinessId)
        } else if (data.length > 0) {
          // If no stored business ID or stored ID is invalid, use the first business
          setCurrentBusinessId(data[0].id)
          localStorage.setItem("currentBusinessId", data[0].id)
        }
        
        setError(null)
      } catch (error) {
        console.error("Failed to fetch businesses:", error)
        setError("Failed to load businesses")
      } finally {
        setIsLoading(false)
      }
    }

    fetchBusinesses()
  }, [session?.user?.id, status])

  const handleBusinessChange = (businessId: string) => {
    setCurrentBusinessId(businessId)
    localStorage.setItem("currentBusinessId", businessId)
    // You might want to trigger a refresh of the page or update other components
    window.location.reload()
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div>
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="mt-1 h-3 w-16 animate-pulse rounded bg-muted" />
        </div>
      </div>
    )
  }

  if (!session?.user?.id) {
    return null
  }

  console.log("Rendering with businesses:", businesses) // Debug log
  console.log("Current business ID:", currentBusinessId) // Debug log

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        {error ? (
          <div className="text-sm text-destructive">Error loading businesses</div>
        ) : businesses.length > 0 ? (
          <BusinessSwitcher
            businesses={businesses}
            currentBusinessId={currentBusinessId || ""}
            onBusinessChange={handleBusinessChange}
          />
        ) : (
          <div className="text-sm text-muted-foreground">No businesses found</div>
        )}
      </div>
    </div>
  )
} 