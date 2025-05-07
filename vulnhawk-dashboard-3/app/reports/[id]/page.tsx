"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { AlertTriangle, CheckCircle, Clock, Download, FileText, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { EnhancedReport } from "@/lib/services/gemini"

interface Vulnerability {
  id: string
  title: string
  severity: "Critical" | "High" | "Medium" | "Low"
  description: string
  details: Record<string, unknown>
}

interface Report {
  id: string
  target: string
  status: string
  createdAt: string
  critical: number
  high: number
  medium: number
  low: number
  rawOutput: Record<string, unknown>
  enhancedReport: EnhancedReport
  vulnerabilitiesList: Vulnerability[]
}

export default function ReportPage() {
  const params = useParams()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch(`/api/reports/${params.id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch report")
        }
        const data = await response.json()
        setReport(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error: {error || "Report not found"}</div>
      </div>
    )
  }

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
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Report</h1>
          <p className="text-muted-foreground">Target: {report.target}</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="mr-2 h-4 w-4" />
            View Raw Output
          </Button>
        </div>
      </div>

      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="raw">Raw Output</TabsTrigger>
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-red-500">Critical</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{report.critical}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-orange-500">High</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{report.high}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-yellow-500">Medium</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{report.medium}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-500">Low</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{report.low}</p>
              </CardContent>
            </Card>
          </div>
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

        <TabsContent value="raw" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Raw Output</CardTitle>
              <CardDescription>Complete JSON output from the security scan</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-auto">
                {JSON.stringify(report.rawOutput, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 