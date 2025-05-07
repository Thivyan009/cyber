"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EnhancedReport } from "@/lib/services/gemini"

interface ReportDialogProps {
  report: {
    id: string
    target: string
    enhancedReport: EnhancedReport
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReportDialog({ report, open, onOpenChange }: ReportDialogProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "bg-red-500"
      case "high":
        return "bg-orange-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Security Report - {report.target}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Executive Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{report.enhancedReport.executiveSummary}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Badge className={getSeverityColor(report.enhancedReport.riskAssessment.overallRisk)}>
                      {report.enhancedReport.riskAssessment.overallRisk} Risk
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium">Key Risk Factors</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {report.enhancedReport.riskAssessment.riskFactors.map((factor, index) => (
                        <li key={index} className="text-muted-foreground">{factor}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vulnerabilities" className="space-y-4">
            {report.enhancedReport.vulnerabilities.map((vuln) => (
              <Card key={vuln.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{vuln.title}</CardTitle>
                    <Badge className={getSeverityColor(vuln.severity)}>{vuln.severity}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium">Description</h3>
                    <p className="text-muted-foreground">{vuln.description}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Impact</h3>
                    <p className="text-muted-foreground">{vuln.impact}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Remediation</h3>
                    <p className="text-muted-foreground">{vuln.remediation}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">References</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {vuln.references.map((ref, index) => (
                        <li key={index} className="text-muted-foreground">{ref}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            {report.enhancedReport.recommendations.map((rec, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{rec.title}</CardTitle>
                    <Badge className={getSeverityColor(rec.priority)}>{rec.priority} Priority</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium">Description</h3>
                    <p className="text-muted-foreground">{rec.description}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Implementation Steps</h3>
                    <p className="text-muted-foreground">{rec.implementation}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 