import { Suspense } from "react"
import { ReportsClient } from "./reports-client"

export default function ReportsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    }>
      <ReportsClient />
    </Suspense>
  )
}
