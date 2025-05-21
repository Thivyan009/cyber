"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getFinancialMetrics, getTransactions } from "@/lib/actions/transactions"
import { generateAIRecommendations } from "@/lib/actions/recommendations"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, TrendingUp, AlertCircle, DollarSign, Target, ShieldCheck, ArrowUpRight, BarChart3, Lightbulb, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useCurrencyStore } from "@/lib/store/currency-store"
import { formatCurrency } from "@/lib/types/currency"

interface FinancialInsight {
  id: string
  title: string
  description: string
  priority: "high" | "medium" | "low"
  category: "growth" | "risk" | "optimization" | "opportunity"
  confidence: number
  actionItems: string[]
  impact: {
    shortTerm: string
    longTerm: string
  }
  metrics?: {
    current: number
    target: number
    trend: "up" | "down" | "stable"
  }
}

export function FinancialInsights() {
  const { selectedCurrency } = useCurrencyStore()

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["financial-metrics"],
    queryFn: async () => {
      const result = await getFinancialMetrics()
      if (result.error) {
        throw new Error(result.error)
      }
      return result.metrics
    },
  })

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const result = await getTransactions()
      if (result.error) {
        throw new Error(result.error)
      }
      return result.transactions || []
    },
  })

  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ["financial-insights", metrics, transactions],
    queryFn: async () => {
      if (!metrics || !transactions) {
        throw new Error("Missing metrics or transactions data")
      }
      return generateAIRecommendations(metrics, transactions)
    },
    enabled: !!metrics && !!transactions,
  })

  if (metricsLoading || transactionsLoading || insightsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Insights</CardTitle>
          <CardDescription>Analyzing your financial data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!metrics || !transactions || !insights) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Insights</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            Add transactions to receive AI-powered financial insights
          </div>
        </CardContent>
      </Card>
    )
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700"
      case "medium":
        return "bg-yellow-100 text-yellow-700"
      case "low":
        return "bg-blue-100 text-blue-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "growth":
        return <TrendingUp className="h-4 w-4" />
      case "risk":
        return <AlertCircle className="h-4 w-4" />
      case "optimization":
        return <BarChart3 className="h-4 w-4" />
      case "opportunity":
        return <Lightbulb className="h-4 w-4" />
      default:
        return <Lightbulb className="h-4 w-4" />
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <ArrowUpRight className="h-4 w-4 text-green-500" />
      case "down":
        return <ArrowUpRight className="h-4 w-4 rotate-180 text-red-500" />
      default:
        return <ArrowUpRight className="h-4 w-4 rotate-90 text-gray-500" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Insights</CardTitle>
        <CardDescription>
          AI-powered analysis of your business finances
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {insights.map((insight) => (
              <Accordion key={insight.id} type="single" collapsible>
                <AccordionItem value={insight.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(insight.category)}
                      <div className="flex flex-col items-start">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{insight.title}</h4>
                          <Badge variant="secondary" className={getPriorityColor(insight.priority)}>
                            {insight.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Confidence: {Math.round(insight.confidence * 100)}%
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pl-6">
                      <p className="text-sm text-muted-foreground">
                        {insight.description}
                      </p>
                      
                      {insight.metrics && (
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium">Current Status:</h5>
                          <div className="flex items-center gap-2 text-sm">
                            <span>Current: {formatCurrency(insight.metrics.current, selectedCurrency)}</span>
                            <span>Target: {formatCurrency(insight.metrics.target, selectedCurrency)}</span>
                            {getTrendIcon(insight.metrics.trend)}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Action Items:</h5>
                        <ul className="space-y-2">
                          {insight.actionItems.map((item, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Expected Impact:</h5>
                        <div className="space-y-1">
                          <p className="text-sm">
                            <span className="font-medium">Short-term (1-3 months):</span>{" "}
                            {insight.impact.shortTerm}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Long-term (6-12 months):</span>{" "}
                            {insight.impact.longTerm}
                          </p>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

