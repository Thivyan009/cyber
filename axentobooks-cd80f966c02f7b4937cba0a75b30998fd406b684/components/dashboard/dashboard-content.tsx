"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  BarChart3,
  ArrowUpDown,
  Wallet,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Calendar,
  Plus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FinancialPosition } from "@/components/dashboard/financial-position";
import { TransactionForm } from "@/components/dashboard/transaction-form";
import { TransactionList } from "@/components/dashboard/transaction-list";
import { UploadStatement } from "@/components/upload-statement";
import { BankStatementsList } from "@/components/bank-statements-list";
import { Recommendations } from "@/components/analytics/recommendations";
import type { FinancialMetrics } from "@/lib/actions/financial";
import type { Transaction } from "@/lib/types";
import { useSession } from "next-auth/react";
import { useCurrencyStore } from "@/lib/store/currency-store";
import { formatCurrency } from "@/lib/types/currency";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DashboardLoading } from "@/components/dashboard/dashboard-loading";
import { useBusiness } from "@/hooks/use-business";
import { useBusinessTransactions } from "@/hooks/use-business-transactions";
import { useFinancialMetrics } from "@/hooks/use-financial-metrics";

export function DashboardContent() {
  const { data: session } = useSession();
  const { selectedCurrency } = useCurrencyStore();
  const { currentBusinessId } = useBusiness();

  // Use our custom hooks for transactions and metrics
  const {
    transactions: transactionsData,
    isLoading: transactionsLoading,
    mutate: refreshTransactions,
  } = useBusinessTransactions();

  const {
    metrics: metricsData,
    isLoading: metricsLoading,
    mutate: refreshMetrics,
  } = useFinancialMetrics();

  // Function to refresh all dashboard data
  const refreshDashboard = async () => {
    console.log("Refreshing dashboard data for business:", currentBusinessId);

    try {
      // First refresh transactions
      console.log("Step 1: Refreshing transactions data");
      await refreshTransactions();

      // Then refresh metrics
      console.log("Step 2: Refreshing financial metrics");
      await refreshMetrics();

      console.log("Dashboard data successfully refreshed");
    } catch (error) {
      console.error("Error refreshing dashboard data:", error);
    }
  };

  // Debug logging for transactions data
  console.log(
    "Dashboard transactions data:",
    transactionsData?.length,
    "transactions for business:",
    currentBusinessId
  );

  // Debug logging for metrics data
  console.log(
    "Dashboard metrics data:",
    metricsData,
    "for business:",
    currentBusinessId
  );

  if (!currentBusinessId) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>No Business Selected</CardTitle>
            <CardDescription>
              Please select a business from the business switcher to view your
              dashboard.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (transactionsLoading || metricsLoading) {
    return <DashboardLoading />;
  }

  return (
    <div className="flex-1 p-8">
      <div className="space-y-8">
        {/* Quick Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  metricsData?.totalRevenue || 0,
                  selectedCurrency.code
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {metricsData?.revenueGrowth ? (
                  <>
                    {metricsData.revenueGrowth > 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />
                    )}
                    <span>
                      {Math.abs(metricsData.revenueGrowth).toFixed(1)}% from
                      last month
                    </span>
                  </>
                ) : (
                  <span>No previous data</span>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Expenses
              </CardTitle>
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  metricsData?.totalExpenses || 0,
                  selectedCurrency.code
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {metricsData?.expenseGrowth ? (
                  <>
                    {metricsData.expenseGrowth > 0 ? (
                      <AlertCircle className="h-3 w-3 text-red-500" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-green-500" />
                    )}
                    <span>
                      {Math.abs(metricsData.expenseGrowth).toFixed(1)}% from
                      last month
                    </span>
                  </>
                ) : (
                  <span>No previous data</span>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cash Flow</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  metricsData?.cashFlow || 0,
                  selectedCurrency.code
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {metricsData?.cashFlow ? (
                  <>
                    {metricsData.cashFlow > 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />
                    )}
                    <span>
                      {metricsData.cashFlow > 0 ? "Positive" : "Negative"} cash
                      flow
                    </span>
                  </>
                ) : (
                  <span>No data available</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Position and Recommendations */}
        <div className="grid gap-6 md:grid-cols-2">
          <FinancialPosition />

          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>
                Actionable insights based on your financial data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Recommendations />
            </CardContent>
          </Card>
        </div>

        {/* Add Transaction and Recent Transactions */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Add Transaction</CardTitle>
              <CardDescription>Record a new transaction</CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionForm onTransactionCreated={refreshDashboard} />
            </CardContent>
          </Card>
          <div className="col-span-1 space-y-4">
            <TransactionList transactions={transactionsData || []} />

            {/* Bank Statement Upload */}
            <UploadStatement onImportSuccess={refreshDashboard} />
          </div>
        </div>

        {/* Bank Statements List - Full Width */}
        <div>
          <BankStatementsList />
        </div>
      </div>
    </div>
  );
}
