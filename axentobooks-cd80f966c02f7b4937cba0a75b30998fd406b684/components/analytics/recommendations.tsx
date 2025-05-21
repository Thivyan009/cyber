"use client"

import { useQuery } from "@tanstack/react-query"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getFinancialMetrics, getTransactions } from "@/lib/actions/transactions"
import { generateAIRecommendations } from "@/lib/actions/recommendations"
import { Lightbulb, TrendingUp, AlertCircle, DollarSign, Target, ShieldCheck, ArrowUpRight, BarChart3, CheckCircle2 } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { useCurrencyStore } from "@/lib/store/currency-store"
import { formatCurrency } from "@/lib/types/currency"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useSession } from "next-auth/react"
import { useBusiness } from "@/hooks/use-business"

interface RecommendationsProps {
  dateRange?: DateRange
}

interface AIRecommendation {
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
  riskAnalysis?: {
    currentRisks: string[]
    potentialRisks: string[]
    mitigationStrategies: string[]
    riskLevel: "critical" | "high" | "medium" | "low"
  }
}

export function Recommendations({ dateRange }: RecommendationsProps) {
  const { selectedCurrency } = useCurrencyStore()
  const { data: session } = useSession()
  const { currentBusinessId } = useBusiness()

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["financial-metrics", currentBusinessId, dateRange?.from, dateRange?.to],
    queryFn: async () => {
      if (!currentBusinessId) throw new Error("No business ID available")
      const result = await getFinancialMetrics(currentBusinessId)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.metrics
    },
    enabled: !!currentBusinessId,
  })

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["transactions", currentBusinessId, dateRange?.from, dateRange?.to],
    queryFn: async () => {
      if (!currentBusinessId) throw new Error("No business ID available")
      const result = await getTransactions(currentBusinessId)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.transactions || []
    },
    enabled: !!currentBusinessId,
  })

  const { data: recommendations, isLoading: recommendationsLoading } = useQuery({
    queryKey: ["ai-recommendations", currentBusinessId, metrics, transactions],
    queryFn: async () => {
      if (!currentBusinessId || !metrics || !transactions) {
        throw new Error("Missing required data")
      }
      return generateAIRecommendations(metrics, transactions, currentBusinessId)
    },
    enabled: !!currentBusinessId && !!metrics && !!transactions,
    refetchInterval: 30000,
    keepPreviousData: true,
    staleTime: 15000,
  })

  if (!session?.user) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-sm text-muted-foreground">Please sign in to view recommendations</div>
      </div>
    )
  }

  if (!currentBusinessId) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-sm text-muted-foreground">No business found. Please create a business first.</div>
      </div>
    )
  }

  if (metricsLoading || transactionsLoading || recommendationsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-sm text-muted-foreground">Analyzing your financial data...</div>
      </div>
    )
  }

  if (!metrics || !transactions || !recommendations) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-sm text-muted-foreground">No data available. Start adding your financial data to receive recommendations.</div>
      </div>
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

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "critical":
        return "bg-red-100 text-red-700"
      case "high":
        return "bg-orange-100 text-orange-700"
      case "medium":
        return "bg-yellow-100 text-yellow-700"
      case "low":
        return "bg-green-100 text-green-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  return (
    <ScrollArea className="h-[350px] pr-4">
      <div className="space-y-4">
        {recommendations.map((recommendation) => (
          <Accordion key={recommendation.id} type="single" collapsible>
            <AccordionItem value={recommendation.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(recommendation.category)}
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{recommendation.title}</h4>
                      <Badge variant="secondary" className={getPriorityColor(recommendation.priority)}>
                        {recommendation.priority}
                      </Badge>
                      {recommendation.riskAnalysis && (
                        <Badge variant="secondary" className={getRiskLevelColor(recommendation.riskAnalysis.riskLevel)}>
                          {recommendation.riskAnalysis.riskLevel} risk
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Confidence: {Math.round(recommendation.confidence * 100)}%
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pl-6">
                  <p className="text-sm text-muted-foreground">
                    {recommendation.description}
                  </p>
                  
                  {recommendation.riskAnalysis && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Risk Analysis:</h5>
                      {recommendation.riskAnalysis.currentRisks.length > 0 && (
                        <div className="space-y-1">
                          <h6 className="text-sm font-medium text-red-600">Current Risks:</h6>
                          <ul className="space-y-1">
                            {recommendation.riskAnalysis.currentRisks.map((risk) => (
                              <li key={`current-${risk}`} className="flex items-start gap-2 text-sm">
                                <AlertCircle className="h-4 w-4 mt-0.5 text-red-500" />
                                <span>{risk}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {recommendation.riskAnalysis.potentialRisks.length > 0 && (
                        <div className="space-y-1">
                          <h6 className="text-sm font-medium text-orange-600">Potential Risks:</h6>
                          <ul className="space-y-1">
                            {recommendation.riskAnalysis.potentialRisks.map((risk) => (
                              <li key={`potential-${risk}`} className="flex items-start gap-2 text-sm">
                                <AlertCircle className="h-4 w-4 mt-0.5 text-orange-500" />
                                <span>{risk}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Action Items:</h5>
                    <ul className="space-y-2">
                      {recommendation.actionItems.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm">
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
                        {recommendation.impact.shortTerm}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Long-term (6-12 months):</span>{" "}
                        {recommendation.impact.longTerm}
                      </p>
                    </div>
                  </div>

                  {recommendation.metrics && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Metrics:</h5>
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">Current:</span>{" "}
                          {recommendation.metrics.current}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Target:</span>{" "}
                          {recommendation.metrics.target}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Trend:</span>{" "}
                          {recommendation.metrics.trend}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ))}
      </div>
    </ScrollArea>
  )
} 