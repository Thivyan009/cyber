"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Building2 } from "lucide-react"
import { BusinessSwitcher } from "@/components/business-switcher"
import { useBusiness } from "@/hooks/use-business"

export function BusinessName() {
  const { data: session } = useSession()
  const { businesses, currentBusinessId, setCurrentBusinessId } = useBusiness()
  const [businessName, setBusinessName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBusinessName() {
      if (!session?.user?.id) {
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch("/api/business/name")
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        setBusinessName(data.name)
        setError(null)
      } catch (error) {
        console.error("Failed to fetch business name:", error)
        setError("Failed to load business name")
      } finally {
        setIsLoading(false)
      }
    }

    fetchBusinessName()
  }, [session?.user?.id])

  if (!session?.user?.id) {
    return null
  }

  return (
    <BusinessSwitcher
      businesses={businesses}
      currentBusinessId={currentBusinessId || ""}
      onBusinessChange={setCurrentBusinessId}
    />
  )
} 