import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DashboardCardProps {
  title: string
  icon: React.ReactNode
  content: React.ReactNode
}

export function DashboardCard({ title, icon, content }: DashboardCardProps) {
  return (
    <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
      <CardHeader className="pb-2 border-b bg-gray-50">
        <CardTitle className="text-lg flex items-center gap-2 text-gray-700">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">{content}</CardContent>
    </Card>
  )
}
