"use client"

import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import type { ProfitLossStatement } from "@/lib/types/ai"

interface StatementViewProps {
  statement: ProfitLossStatement
}

export function StatementView({ statement }: StatementViewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "percent",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100)
  }

  return (
    <ScrollArea className="h-[600px] rounded-md border p-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold">Profit & Loss Statement</h2>
          <p className="text-muted-foreground">
            {format(new Date(statement.period.startDate), "MMMM d, yyyy")} -{" "}
            {format(new Date(statement.period.endDate), "MMMM d, yyyy")}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(statement.summary.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                {statement.summary.revenueGrowth > 0 ? "+" : ""}
                {formatPercentage(statement.summary.revenueGrowth)} from previous period
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(statement.summary.totalExpenses)}</div>
              <p className="text-xs text-muted-foreground">
                {statement.summary.expenseGrowth > 0 ? "+" : ""}
                {formatPercentage(statement.summary.expenseGrowth)} from previous period
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              {statement.summary.netProfit > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(statement.summary.netProfit)}</div>
              <p className="text-xs text-muted-foreground">
                {statement.summary.profitMargin > 0 ? "+" : ""}
                {formatPercentage(statement.summary.profitMargin)} profit margin
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statement.revenue.breakdown.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.category}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(item.amount)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatPercentage(item.percentage)} of total
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statement.expenses.breakdown.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.category}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(item.amount)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatPercentage(item.percentage)} of total
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Key Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statement.insights.map((insight, index) => (
                <Alert key={index}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{insight.title}</AlertTitle>
                  <AlertDescription>{insight.description}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statement.recommendations.map((recommendation, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{recommendation.title}</h4>
                    <Badge variant={recommendation.priority === "high" ? "destructive" : "default"}>
                      {recommendation.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{recommendation.description}</p>
                  <ul className="list-inside list-disc text-sm text-muted-foreground">
                    {recommendation.actionItems.map((item, itemIndex) => (
                      <li key={itemIndex}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}

