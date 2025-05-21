"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "next-auth/react";
import { getFinancialData, type FinancialData } from "@/lib/actions/financial";
import { Progress } from "@/components/ui/progress";
import { useCurrencyStore } from "@/lib/store/currency-store";
import { formatCurrency } from "@/lib/types/currency";
import { useBusiness } from "@/hooks/use-business";

export function FinancialInfo() {
  const { data: session } = useSession();
  const { selectedCurrency } = useCurrencyStore();
  const { currentBusinessId } = useBusiness();
  const [financialData, setFinancialData] = useState<FinancialData | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFinancialData() {
      if (!session?.user?.id || !currentBusinessId) return;

      try {
        const data = await getFinancialData(currentBusinessId);
        setFinancialData(data);
      } catch (error) {
        console.error("Failed to load financial data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadFinancialData();
  }, [session?.user?.id, currentBusinessId]);

  if (!currentBusinessId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Information</CardTitle>
          <CardDescription>No business selected</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Please select a business to view financial information.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Information</CardTitle>
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
          <CardTitle>Financial Information</CardTitle>
          <CardDescription>No financial data available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Complete the onboarding process to see your financial information.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Information</CardTitle>
        <CardDescription>
          View and manage your business financial data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="assets" className="space-y-4">
          <TabsList>
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="liabilities">Liabilities</TabsTrigger>
            <TabsTrigger value="equity">Equity</TabsTrigger>
          </TabsList>

          <TabsContent value="assets">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Assets</h3>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(
                    financialData.assets.total,
                    selectedCurrency.code
                  )}
                </p>
              </div>
              <div className="space-y-2">
                {financialData.assets.items.map((asset) => (
                  <Card key={asset.id}>
                    <CardHeader className="py-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-sm font-medium">
                            {asset.description}
                          </CardTitle>
                          <CardDescription>{asset.type}</CardDescription>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(asset.value, selectedCurrency.code)}
                          </p>
                          {asset.purchaseDate && (
                            <p className="text-xs text-muted-foreground">
                              Purchased:{" "}
                              {new Date(
                                asset.purchaseDate
                              ).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="liabilities">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Liabilities</h3>
                <p className="text-lg font-bold text-red-600">
                  {formatCurrency(
                    financialData.liabilities.total,
                    selectedCurrency.code
                  )}
                </p>
              </div>
              <div className="space-y-2">
                {financialData.liabilities.items.map((liability) => (
                  <Card key={liability.id}>
                    <CardHeader className="py-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-sm font-medium">
                            {liability.name}
                          </CardTitle>
                          <CardDescription>{liability.type}</CardDescription>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(
                              liability.amount,
                              selectedCurrency.code
                            )}
                          </p>
                          {liability.dueDate && (
                            <p className="text-xs text-muted-foreground">
                              Due:{" "}
                              {new Date(liability.dueDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="equity">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Equity</h3>
                <p className="text-lg font-bold text-blue-600">
                  {formatCurrency(
                    financialData.equity.total,
                    selectedCurrency.code
                  )}
                </p>
              </div>
              <div className="space-y-2">
                {financialData.equity.items.map((item) => (
                  <Card key={item.id}>
                    <CardHeader className="py-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-sm font-medium">
                            {item.type}
                          </CardTitle>
                          {item.description && (
                            <CardDescription>
                              {item.description}
                            </CardDescription>
                          )}
                        </div>
                        <p className="font-medium">
                          {formatCurrency(item.amount, selectedCurrency.code)}
                        </p>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 