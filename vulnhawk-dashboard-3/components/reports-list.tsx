"use client"

import { useState } from "react"
import { Eye, Trash2, AlertTriangle, Shield, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ReportDialog } from "@/components/report-dialog"
import { Report } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

interface ReportsListProps {
  reports: Report[]
  onDelete: (id: string) => void
}

export function ReportsList({ reports, onDelete }: ReportsListProps) {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "in-progress":
        return <Shield className="h-4 w-4 text-blue-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getRiskBadge = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>
      case "high":
        return <Badge variant="warning">High</Badge>
      case "medium":
        return <Badge variant="secondary">Medium</Badge>
      case "low":
        return <Badge variant="outline">Low</Badge>
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="h-12 px-4 text-left align-middle font-medium">Target</th>
              <th className="h-12 px-4 text-left align-middle font-medium">Date</th>
              <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
              <th className="h-12 px-4 text-left align-middle font-medium">Risk Level</th>
              <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id} className="border-b hover:bg-muted/50 transition-colors">
                <td className="p-4 font-medium">{report.target}</td>
                <td className="p-4 text-muted-foreground">
                  {new Date(report.createdAt).toLocaleDateString()}
                </td>
                <td className="p-4">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(report.status)}
                    <span className="capitalize">{report.status}</span>
                  </div>
                </td>
                <td className="p-4">
                  {report.enhancedReport && getRiskBadge(report.enhancedReport.riskAssessment.overallRisk)}
                </td>
                <td className="p-4">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedReport(report)}
                      className="hover:bg-primary/10"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View report</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(report.id)}
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete report</span>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedReport && (
        <ReportDialog
          report={selectedReport}
          open={!!selectedReport}
          onOpenChange={(open) => !open && setSelectedReport(null)}
        />
      )}
    </div>
  )
}
