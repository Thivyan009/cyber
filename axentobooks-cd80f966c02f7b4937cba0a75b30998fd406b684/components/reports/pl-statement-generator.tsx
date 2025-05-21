"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { getMonthlyTransactions, generatePLStatement, savePLStatement } from "@/lib/actions/reports"
import { Loader2, CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PLStatement {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  revenueBreakdown: Record<string, number>
  expenseBreakdown: Record<string, number>
  summary: string
}

export function PLStatementGenerator() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isGenerating, setIsGenerating] = useState(false)
  const [statement, setStatement] = useState<PLStatement | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleGenerate = async () => {
    try {
      setIsGenerating(true)
      setError(null)
      
      console.log("Starting PL statement generation for date:", selectedDate.toISOString())
      
      // Fetch transactions for the selected month
      const transactions = await getMonthlyTransactions(selectedDate)
      
      console.log("Retrieved transactions:", {
        count: transactions.length,
        sample: transactions.slice(0, 3),
        date: selectedDate.toISOString()
      })
      
      if (!transactions || transactions.length === 0) {
        const errorMsg = "No transactions found for the selected month. Please add some transactions first."
        setError(errorMsg)
        toast({
          title: "No transactions found",
          description: errorMsg,
          variant: "destructive",
        })
        return
      }

      // Generate P&L statement using Gemini AI
      console.log("Generating PL statement with transactions...")
      const plData = await generatePLStatement(transactions)
      
      if (!plData) {
        throw new Error("Failed to generate PL statement data")
      }
      
      console.log("PL statement generated successfully:", {
        revenue: plData.summary.totalRevenue,
        expenses: plData.summary.totalExpenses,
        profit: plData.summary.netProfitLoss
      })
      
      // Save the statement
      await savePLStatement(plData, selectedDate)
      
      setStatement({
        totalRevenue: plData.summary.totalRevenue,
        totalExpenses: plData.summary.totalExpenses,
        netProfit: plData.summary.netProfitLoss,
        revenueBreakdown: plData.revenue.reduce((acc, rev) => {
          acc[rev.category] = rev.amount
          return acc
        }, {} as Record<string, number>),
        expenseBreakdown: plData.expenses.reduce((acc, exp) => {
          acc[exp.category] = exp.amount
          return acc
        }, {} as Record<string, number>),
        summary: plData.analysis.insights.join("\n")
      })
      
      toast({
        title: "P&L Statement Generated",
        description: "Your profit and loss statement has been generated successfully.",
      })
    } catch (error) {
      console.error("Error generating P&L statement:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to generate P&L statement. Please try again."
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate P&L Statement</CardTitle>
          <CardDescription>
            Select a month to generate a profit and loss statement from your transactions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "MMMM yyyy") : "Select month"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                  disabled={(date) => date > new Date()}
                />
              </PopoverContent>
            </Popover>
            <Button onClick={handleGenerate} disabled={isGenerating || !selectedDate}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Statement"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {statement && (
        <Card>
          <CardHeader>
            <CardTitle>
              P&L Statement - {format(selectedDate, "MMMM yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    ${statement.totalRevenue.toFixed(2)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    ${statement.totalExpenses.toFixed(2)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${statement.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                    ${statement.netProfit.toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(statement.revenueBreakdown).map(([category, amount]) => (
                      <div key={category} className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{category}</span>
                        <span className="font-medium text-green-600">${amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Expense Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(statement.expenseBreakdown).map(([category, amount]) => (
                      <div key={category} className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{category}</span>
                        <span className="font-medium text-red-600">${amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{statement.summary}</p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 