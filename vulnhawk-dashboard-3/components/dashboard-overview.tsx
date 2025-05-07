"use client"

import { useState } from "react"
import Link from "next/link"
import { AlertTriangle, CheckCircle, Clock, Shield, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AttackDialog } from "@/components/attack-dialog"

export function DashboardOverview() {
  const [recentReports] = useState([
    {
      id: "rep-001",
      target: "api.example.com",
      date: "2025-05-01",
      status: "completed",
      vulnerabilities: 7,
      critical: 2,
      high: 3,
      medium: 2,
      low: 0,
    },
    {
      id: "rep-002",
      target: "dashboard.acmecorp.io",
      date: "2025-04-28",
      status: "completed",
      vulnerabilities: 3,
      critical: 0,
      high: 1,
      medium: 1,
      low: 1,
    },
    {
      id: "rep-003",
      target: "checkout.example.com",
      date: "2025-04-15",
      status: "in-progress",
      progress: 65,
    },
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to VulnHawk X, your AI-powered offensive security platform.</p>
        </div>
        <AttackDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attacks</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vulnerabilities Found</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">48</div>
            <p className="text-xs text-muted-foreground">+8 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">-2 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">76%</div>
            <p className="text-xs text-muted-foreground">+4% from last month</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recent">Recent Reports</TabsTrigger>
          <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
        </TabsList>
        <TabsContent value="recent" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentReports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{report.target}</span>
                    {report.status === "completed" ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Clock className="h-5 w-5 text-amber-500" />
                    )}
                  </CardTitle>
                  <CardDescription>
                    {report.status === "completed" ? `Completed on ${report.date}` : "Attack in progress"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {report.status === "completed" ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total vulnerabilities:</span>
                        <span className="font-medium">{report.vulnerabilities}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div className="flex flex-col items-center rounded-md bg-red-500/10 p-2">
                          <span className="font-bold text-red-500">{report.critical}</span>
                          <span>Critical</span>
                        </div>
                        <div className="flex flex-col items-center rounded-md bg-orange-500/10 p-2">
                          <span className="font-bold text-orange-500">{report.high}</span>
                          <span>High</span>
                        </div>
                        <div className="flex flex-col items-center rounded-md bg-yellow-500/10 p-2">
                          <span className="font-bold text-yellow-500">{report.medium}</span>
                          <span>Medium</span>
                        </div>
                        <div className="flex flex-col items-center rounded-md bg-green-500/10 p-2">
                          <span className="font-bold text-green-500">{report.low}</span>
                          <span>Low</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress:</span>
                        <span className="font-medium">{report.progress}%</span>
                      </div>
                      <Progress value={report.progress} className="h-2" />
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/reports/${report.id}`}>View Full Report</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          <div className="flex justify-center">
            <Button variant="outline" asChild>
              <Link href="/reports">View All Reports</Link>
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="vulnerabilities">
          <Card>
            <CardHeader>
              <CardTitle>Vulnerability Summary</CardTitle>
              <CardDescription>Overview of vulnerabilities found across all targets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <div className="mr-2 h-3 w-3 rounded-full bg-red-500"></div>
                      <span>Critical Vulnerabilities</span>
                    </div>
                    <span className="font-medium">7</span>
                  </div>
                  <Progress value={28} className="h-2 bg-muted" indicatorClassName="bg-red-500" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <div className="mr-2 h-3 w-3 rounded-full bg-orange-500"></div>
                      <span>High Vulnerabilities</span>
                    </div>
                    <span className="font-medium">12</span>
                  </div>
                  <Progress value={48} className="h-2 bg-muted" indicatorClassName="bg-orange-500" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <div className="mr-2 h-3 w-3 rounded-full bg-yellow-500"></div>
                      <span>Medium Vulnerabilities</span>
                    </div>
                    <span className="font-medium">18</span>
                  </div>
                  <Progress value={72} className="h-2 bg-muted" indicatorClassName="bg-yellow-500" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <div className="mr-2 h-3 w-3 rounded-full bg-green-500"></div>
                      <span>Low Vulnerabilities</span>
                    </div>
                    <span className="font-medium">11</span>
                  </div>
                  <Progress value={44} className="h-2 bg-muted" indicatorClassName="bg-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
