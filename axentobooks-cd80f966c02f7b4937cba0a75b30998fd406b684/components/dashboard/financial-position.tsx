"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Scale, Wallet, Building, Info } from "lucide-react";
import { useCurrencyStore } from "@/lib/store/currency-store";
import { formatCurrency } from "@/lib/types/currency";
import { useSession } from "next-auth/react";
import { getFinancialData, type FinancialData } from "@/lib/actions/financial";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { useBusiness } from "@/hooks/use-business";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function FinancialPosition() {
  const { data: session } = useSession();
  const { selectedCurrency } = useCurrencyStore();
  const { currentBusinessId } = useBusiness();
  const [isDebugMode, setIsDebugMode] = useState(false);

  // Use React Query for financial data
  const {
    data: financialData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["financial-position", currentBusinessId],
    queryFn: async () => {
      if (!currentBusinessId) throw new Error("No business ID");
      console.log("Fetching financial data for:", currentBusinessId);
      const data = await getFinancialData(currentBusinessId);
      console.log("Financial data response:", data);
      return data;
    },
    enabled: !!currentBusinessId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  useEffect(() => {
    // Force refetch when businessId changes
    if (currentBusinessId) {
      refetch();
    }
  }, [currentBusinessId, refetch]);

  // Toggle debug mode
  const toggleDebugMode = () => {
    setIsDebugMode(!isDebugMode);
  };

  if (!currentBusinessId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Position</CardTitle>
          <CardDescription>No business selected</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Select a business from the switcher to view financial position.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Position</CardTitle>
          <CardDescription>Loading financial data...</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={50} className="w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!financialData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Position</CardTitle>
          <CardDescription>No financial data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Complete the onboarding process to see your financial position.
          </p>
            <Button variant="outline" size="sm" onClick={toggleDebugMode}>
              {isDebugMode ? "Hide Diagnostics" : "Show Diagnostics"}
            </Button>

            {isDebugMode && (
              <Alert variant="destructive">
                <Info className="h-4 w-4" />
                <AlertTitle>Debugging Information</AlertTitle>
                <AlertDescription>
                  <div className="mt-2 space-y-2 text-xs">
                    <p>
                      <strong>Business ID:</strong> {currentBusinessId}
                    </p>
                    <p>
                      <strong>Data Response:</strong>{" "}
                      {JSON.stringify(financialData)}
                    </p>
                    <p>
                      Try refreshing the page or completing the onboarding
                      process again.
                    </p>
                    <Button size="sm" onClick={() => refetch()}>
                      Retry Loading Data
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const data = [
    {
      name: "Assets",
      value: financialData.assets.total,
      color: "hsl(142, 76%, 36%)",
    }, // Green
    {
      name: "Liabilities",
      value: financialData.liabilities.total,
      color: "hsl(346, 87%, 43%)",
    }, // Red
    {
      name: "Equity",
      value: financialData.equity.total,
      color: "hsl(201, 96%, 32%)",
    }, // Blue
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
        <CardTitle>Financial Position</CardTitle>
        <CardDescription>
          Your business's assets, liabilities, and equity
        </CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={toggleDebugMode}>
          {isDebugMode ? "Hide Debug" : "Debug"}
        </Button>
      </CardHeader>
      <CardContent>
        {isDebugMode && (
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Debug Information</AlertTitle>
            <AlertDescription>
              <div className="mt-2 space-y-1 text-xs overflow-auto max-h-24">
                <p>
                  <strong>Business ID:</strong> {currentBusinessId}
                </p>
                <p>
                  <strong>Assets Total:</strong> {financialData.assets.total}
                </p>
                <p>
                  <strong>Liabilities Total:</strong>{" "}
                  {financialData.liabilities.total}
                </p>
                <p>
                  <strong>Equity Total:</strong> {financialData.equity.total}
                </p>
                <p>
                  <strong>Asset Items:</strong>{" "}
                  {financialData.assets.items.length}
                </p>
                <p>
                  <strong>Liability Items:</strong>{" "}
                  {financialData.liabilities.items.length}
                </p>
                <p>
                  <strong>Equity Items:</strong>{" "}
                  {financialData.equity.items.length}
                </p>
                <Button size="sm" onClick={() => refetch()} className="mt-2">
                  Refresh Data
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Assets
              </CardTitle>
              <Building className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 break-words">
                <span className="text-clip overflow-hidden">
                  {formatCurrency(
                    financialData.assets.total,
                    selectedCurrency.code
                  )}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                What your business owns
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Liabilities
              </CardTitle>
              <Wallet className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 break-words">
                <span className="text-clip overflow-hidden">
                  {formatCurrency(
                    financialData.liabilities.total,
                    selectedCurrency.code
                  )}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                What your business owes
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Equity
              </CardTitle>
              <Scale className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 break-words">
                <span className="text-clip overflow-hidden">
                  {formatCurrency(
                    financialData.equity.total,
                    selectedCurrency.code
                  )}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Net worth (Assets - Liabilities)
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) =>
                  formatCurrency(value, selectedCurrency.code)
                }
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              {payload[0].payload.name}
                            </span>
                            <span className="font-bold">
                              {formatCurrency(
                                payload[0].value,
                                selectedCurrency.code
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="value"
                radius={[4, 4, 0, 0]}
                fill="currentColor"
                className="fill-primary"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
