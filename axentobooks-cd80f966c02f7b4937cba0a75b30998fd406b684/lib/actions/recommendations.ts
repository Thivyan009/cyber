import type { FinancialMetrics } from "@/lib/types"
import type { Transaction } from "@/lib/types"
import { prisma } from "@/lib/prisma"

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

async function getBusinessData(businessId: string) {
  const [
    assets,
    liabilities,
    financialGoals,
    invoices,
    customers,
    financialPosition,
    equityDetails
  ] = await Promise.all([
    prisma.asset.findMany({ where: { businessId } }),
    prisma.liability.findMany({ where: { businessId } }),
    prisma.financialGoal.findMany({ where: { businessId } }),
    prisma.invoice.findMany({ 
      where: { businessId },
      include: { customer: true, items: true }
    }),
    prisma.customer.findMany({ where: { businessId } }),
    prisma.financialPosition.findUnique({ where: { businessId } }),
    prisma.equityDetail.findMany({ where: { businessId } })
  ])

  return {
    assets,
    liabilities,
    financialGoals,
    invoices,
    customers,
    financialPosition,
    equityDetails
  }
}

function analyzeRisks(
  metrics: FinancialMetrics,
  transactions: Transaction[],
  businessData: Awaited<ReturnType<typeof getBusinessData>>
) {
  const risks = {
    currentRisks: [] as string[],
    potentialRisks: [] as string[],
    mitigationStrategies: [] as string[],
    riskLevel: "low" as "critical" | "high" | "medium" | "low"
  }

  // Cash Flow Risk Analysis
  if (metrics.cashFlow < 0) {
    risks.currentRisks.push("Negative cash flow indicating potential liquidity issues")
    risks.mitigationStrategies.push(
      "Implement strict cash flow management",
      "Review and optimize payment terms",
      "Establish emergency fund"
    )
    risks.riskLevel = "critical"
  }

  // Asset-Liability Risk Analysis
  const totalAssets = businessData.assets.reduce((sum, asset) => sum + asset.value, 0)
  const totalLiabilities = businessData.liabilities.reduce((sum, liability) => sum + liability.amount, 0)
  const assetLiabilityRatio = totalAssets / totalLiabilities

  if (assetLiabilityRatio < 1.5) {
    risks.currentRisks.push("Low asset-to-liability ratio")
    risks.potentialRisks.push("Limited capacity to take on additional debt")
    risks.mitigationStrategies.push(
      "Increase asset base",
      "Reduce liabilities",
      "Improve asset utilization"
    )
    risks.riskLevel = risks.riskLevel === "low" ? "high" : risks.riskLevel
  }

  // Invoice Risk Analysis
  const overdueInvoices = businessData.invoices.filter(inv => 
    inv.status === "DUE" && new Date(inv.dueDate) < new Date()
  )
  const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.total, 0)

  if (totalOverdue > 0) {
    risks.currentRisks.push(`Overdue invoices totaling ${totalOverdue}`)
    risks.mitigationStrategies.push(
      "Implement stricter payment terms",
      "Automate invoice reminders",
      "Offer early payment discounts"
    )
    risks.riskLevel = risks.riskLevel === "low" ? "high" : risks.riskLevel
  }

  // Customer Concentration Risk
  const customerRevenue = businessData.invoices.reduce((acc, inv) => {
    acc[inv.customerId] = (acc[inv.customerId] || 0) + inv.total
    return acc
  }, {} as Record<string, number>)

  const topCustomer = Object.entries(customerRevenue)
    .sort((a, b) => b[1] - a[1])[0]

  if (topCustomer) {
    const totalRevenue = Object.values(customerRevenue).reduce((sum, val) => sum + val, 0)
    const concentration = (topCustomer[1] / totalRevenue) * 100

    if (concentration > 30) {
      risks.currentRisks.push("High customer concentration risk")
      risks.potentialRisks.push("Revenue vulnerability to customer loss")
      risks.mitigationStrategies.push(
        "Diversify customer base",
        "Develop new customer segments",
        "Strengthen customer relationships"
      )
      risks.riskLevel = risks.riskLevel === "low" ? "high" : risks.riskLevel
    }
  }

  // Financial Goals Risk
  const atRiskGoals = businessData.financialGoals.filter(goal => {
    const deadline = new Date(goal.deadline)
    const today = new Date()
    const monthsToDeadline = (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30)
    const progress = (goal.currentAmount / goal.targetAmount) * 100
    return monthsToDeadline < 3 && progress < 70
  })

  if (atRiskGoals.length > 0) {
    risks.currentRisks.push(`${atRiskGoals.length} financial goals at risk of not being met`)
    risks.mitigationStrategies.push(
      "Review and adjust goal timelines",
      "Implement additional revenue streams",
      "Optimize resource allocation"
    )
    risks.riskLevel = risks.riskLevel === "low" ? "medium" : risks.riskLevel
  }

  // Equity Risk Analysis
  if (businessData.financialPosition) {
    const equityRatio = businessData.financialPosition.totalEquity / businessData.financialPosition.totalAssets
    if (equityRatio < 0.3) {
      risks.currentRisks.push("Low equity ratio")
      risks.potentialRisks.push("Limited financial flexibility")
      risks.mitigationStrategies.push(
        "Increase retained earnings",
        "Optimize capital structure",
        "Review dividend policy"
      )
      risks.riskLevel = risks.riskLevel === "low" ? "medium" : risks.riskLevel
    }
  }

  return risks
}

export async function generateAIRecommendations(
  metrics: FinancialMetrics,
  transactions: Transaction[],
  businessId: string
): Promise<AIRecommendation[]> {
  // Get all business data
  const businessData = await getBusinessData(businessId)
  
  // Use the fallback recommendations system
  return generateFallbackRecommendations(metrics, transactions, businessData)
}

function generateFallbackRecommendations(
  metrics: FinancialMetrics,
  transactions: Transaction[],
  businessData: Awaited<ReturnType<typeof getBusinessData>>
): AIRecommendation[] {
  const recommendations: AIRecommendation[] = []
  const riskAnalysis = analyzeRisks(metrics, transactions, businessData)

  // Add risk-based recommendations
  if (riskAnalysis.currentRisks.length > 0) {
    recommendations.push({
      id: "risk-mitigation",
      title: "Risk Mitigation Strategy",
      description: `Current risks identified: ${riskAnalysis.currentRisks.join(", ")}. Implement the following strategies to mitigate these risks.`,
      priority: riskAnalysis.riskLevel === "critical" ? "high" : "medium",
      category: "risk",
      confidence: 0.9,
      actionItems: riskAnalysis.mitigationStrategies,
      impact: {
        shortTerm: "Immediate risk reduction and improved financial stability",
        longTerm: "Enhanced business resilience and sustainable growth"
      },
      riskAnalysis: riskAnalysis
    })
  }

  // Add potential risk recommendations
  if (riskAnalysis.potentialRisks.length > 0) {
    recommendations.push({
      id: "future-risk-prevention",
      title: "Future Risk Prevention",
      description: `Potential risks identified: ${riskAnalysis.potentialRisks.join(", ")}. Take proactive measures to prevent these risks.`,
      priority: "medium",
      category: "risk",
      confidence: 0.8,
      actionItems: [
        "Develop risk monitoring system",
        "Create contingency plans",
        "Regular risk assessment reviews"
      ],
      impact: {
        shortTerm: "Better risk awareness and preparedness",
        longTerm: "Reduced vulnerability to market changes"
      },
      riskAnalysis: {
        ...riskAnalysis,
        riskLevel: "medium"
      }
    })
  }

  // Add asset optimization recommendations
  const totalAssets = businessData.assets.reduce((sum, asset) => sum + asset.value, 0)
  const totalLiabilities = businessData.liabilities.reduce((sum, liability) => sum + liability.amount, 0)
  const assetLiabilityRatio = totalAssets / totalLiabilities

  if (assetLiabilityRatio < 1.5) {
    recommendations.push({
      id: "asset-optimization",
      title: "Asset Optimization Strategy",
      description: "Your asset-to-liability ratio is below the recommended threshold. Consider optimizing your asset base and managing liabilities more effectively.",
      priority: "high",
      category: "optimization",
      confidence: 0.85,
      actionItems: [
        "Review and optimize asset utilization",
        "Identify underperforming assets",
        "Develop asset acquisition strategy"
      ],
      impact: {
        shortTerm: "Improved asset efficiency",
        longTerm: "Better financial stability and growth potential"
      },
      metrics: {
        current: assetLiabilityRatio,
        target: 1.5,
        trend: assetLiabilityRatio > 1 ? "up" : "down"
      }
    })
  }

  // Add financial goals recommendations
  const atRiskGoals = businessData.financialGoals.filter(goal => {
    const deadline = new Date(goal.deadline)
    const today = new Date()
    const monthsToDeadline = (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30)
    const progress = (goal.currentAmount / goal.targetAmount) * 100
    return monthsToDeadline < 3 && progress < 70
  })

  if (atRiskGoals.length > 0) {
    recommendations.push({
      id: "goals-achievement",
      title: "Financial Goals Achievement Strategy",
      description: `${atRiskGoals.length} financial goals are at risk of not being met. Take immediate action to ensure goal achievement.`,
      priority: "high",
      category: "optimization",
      confidence: 0.9,
      actionItems: [
        "Review and adjust goal timelines",
        "Implement additional revenue streams",
        "Optimize resource allocation"
      ],
      impact: {
        shortTerm: "Improved goal progress",
        longTerm: "Better financial planning and achievement"
      }
    })
  }

  // Add customer relationship recommendations
  const customerRevenue = businessData.invoices.reduce((acc, inv) => {
    acc[inv.customerId] = (acc[inv.customerId] || 0) + inv.total
    return acc
  }, {} as Record<string, number>)

  const topCustomer = Object.entries(customerRevenue)
    .sort((a, b) => b[1] - a[1])[0]

  if (topCustomer) {
    const totalRevenue = Object.values(customerRevenue).reduce((sum, val) => sum + val, 0)
    const concentration = (topCustomer[1] / totalRevenue) * 100

    if (concentration > 30) {
      recommendations.push({
        id: "customer-diversification",
        title: "Customer Base Diversification",
        description: "High revenue concentration in a single customer. Develop strategies to diversify your customer base.",
        priority: "high",
        category: "risk",
        confidence: 0.85,
        actionItems: [
          "Develop new customer segments",
          "Strengthen existing customer relationships",
          "Implement customer acquisition strategy"
        ],
        impact: {
          shortTerm: "Begin customer base expansion",
          longTerm: "Reduced customer concentration risk"
        },
        metrics: {
          current: concentration,
          target: 30,
          trend: concentration < 40 ? "up" : "down"
        }
      })
    }
  }

  // Add revenue growth recommendations
  if (metrics.revenueGrowth !== undefined && metrics.revenueGrowth < 10) {
    recommendations.push({
      id: "revenue-growth",
      title: "Revenue Growth Strategy",
      description: "Your revenue growth is below the target of 10%. Consider implementing pricing optimization, expanding marketing channels, or launching promotional campaigns to accelerate growth.",
      priority: "high",
      category: "growth",
      confidence: 0.85,
      actionItems: [
        "Review current pricing strategy and market positioning",
        "Analyze successful marketing channels and increase investment",
        "Develop targeted promotional campaigns for key customer segments"
      ],
      impact: {
        shortTerm: "Potential 5-10% increase in revenue within 3 months",
        longTerm: "Sustainable revenue growth of 15-20% annually"
      },
      metrics: {
        current: metrics.revenueGrowth || 0,
        target: 10,
        trend: metrics.revenueGrowth > 0 ? "up" : "down"
      }
    })
  }

  // Add profit margin recommendations
  if (metrics.totalRevenue !== undefined && metrics.totalExpenses !== undefined) {
    const profitMargin = ((metrics.totalRevenue - metrics.totalExpenses) / metrics.totalRevenue) * 100
    if (profitMargin < 15) {
      recommendations.push({
        id: "profit-margin",
        title: "Profit Margin Improvement",
        description: "Your profit margin is below the industry standard of 15%. Review your pricing strategy and identify cost reduction opportunities to improve profitability.",
        priority: "high",
        category: "optimization",
        confidence: 0.8,
        actionItems: [
          "Conduct a detailed cost analysis across all departments",
          "Review supplier contracts and negotiate better terms",
          "Implement cost control measures and monitor expenses"
        ],
        impact: {
          shortTerm: "2-3% improvement in profit margin within 3 months",
          longTerm: "Achieve and maintain 15-20% profit margin"
        },
        metrics: {
          current: profitMargin,
          target: 15,
          trend: profitMargin > 10 ? "up" : "down"
        }
      })
    }
  }

  // Add expense optimization recommendations
  if (metrics.operationalExpenses !== undefined && metrics.totalRevenue !== undefined) {
    const expenseRatio = (metrics.operationalExpenses / metrics.totalRevenue) * 100
    if (expenseRatio > 70) {
      recommendations.push({
        id: "expense-optimization",
        title: "Expense Optimization",
        description: "Operating expenses are high relative to revenue. Review major expense categories and identify potential areas for cost reduction.",
        priority: "medium",
        category: "optimization",
        confidence: 0.75,
        actionItems: [
          "Analyze expense categories and identify outliers",
          "Review recurring expenses and subscription services",
          "Implement expense approval workflows"
        ],
        impact: {
          shortTerm: "5-10% reduction in operating expenses",
          longTerm: "Maintain expense ratio below 70% of revenue"
        },
        metrics: {
          current: expenseRatio,
          target: 70,
          trend: expenseRatio < 80 ? "up" : "down"
        }
      })
    }
  }

  // Add revenue diversification recommendations
  if (transactions.length > 0 && metrics.totalRevenue !== undefined) {
    const categories = transactions.reduce((acc, t) => {
      if (t.type === 'income') {
        acc[t.category] = (acc[t.category] || 0) + t.amount
      }
      return acc
    }, {} as Record<string, number>)
    
    const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0]
    if (topCategory) {
      const concentration = (topCategory[1] / metrics.totalRevenue) * 100
      if (concentration > 50) {
        recommendations.push({
          id: "diversification",
          title: "Revenue Diversification",
          description: "High revenue concentration in a single category. Consider expanding into new markets or product lines to reduce dependency risk.",
          priority: "medium",
          category: "risk",
          confidence: 0.7,
          actionItems: [
            "Research and identify new market opportunities",
            "Develop new product or service offerings",
            "Create a diversification strategy and timeline"
          ],
          impact: {
            shortTerm: "Begin market research and planning",
            longTerm: "Reduce top category concentration below 50%"
          },
          metrics: {
            current: concentration,
            target: 50,
            trend: concentration < 60 ? "up" : "down"
          }
        })
      }
    }
  }

  // If no specific recommendations, add general ones
  if (recommendations.length === 0) {
    recommendations.push({
      id: "general-1",
      title: "Start Adding Financial Data",
      description: "Add your financial data to receive personalized insights and recommendations tailored to your business.",
      priority: "medium",
      category: "opportunity",
      confidence: 0.7,
      actionItems: [
        "Record all business transactions",
        "Add assets and liabilities",
        "Set financial goals",
        "Track customer relationships"
      ],
      impact: {
        shortTerm: "Better visibility into business finances",
        longTerm: "Data-driven decision making and improved financial health"
      }
    })
  }

  return recommendations
} 