"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  BarChart3,
  BrainCircuit,
  Building2,
  Home,
  LineChart,
  Menu,
  PieChart,
  Plus,
  Receipt,
  Settings,
  Upload,
  FileText,
  RefreshCw,
  PlusCircle,
  MinusCircle,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { notify } from "@/lib/toast";
import Link from "next/link";

// Define transaction type
type Transaction = {
  id: string;
  date: string | Date;
  description: string;
  category: string;
  amount: number;
  type: string;
};

// Define metrics type
type Metrics = {
  revenue: number;
  expenses: number;
  cashFlow: number;
};

// Define recommendation type
type Recommendation = {
  title: string;
  description: string;
};

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    revenue: 0,
    expenses: 0,
    cashFlow: 0,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
  });
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // Use a key to force re-fetch
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  // Format date for display
  const formatDate = (date: string | Date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  };

  // Format amount for display
  const formatAmount = (amount: number, type: string) => {
    const prefix = type === "expense" ? "-" : "";
    return `${prefix}$${Math.abs(amount).toFixed(2)}`;
  };

  // Generate AI recommendations based on financial data
  const generateRecommendations = useCallback(
    (transactionData: Transaction[], currentMetrics: Metrics) => {
      const newRecommendations: Recommendation[] = [];

      // Only generate recommendations if we have meaningful data
      if (transactionData.length === 0) {
        return [
          {
            title: "Start Adding Transactions",
            description:
              "Add your first transaction to receive AI-powered financial insights tailored to your business.",
          },
        ];
      }

      // Cash Flow recommendation
      if (currentMetrics.cashFlow < 0) {
        newRecommendations.push({
          title: "Cash Flow Alert",
          description: `Your current cash flow is negative (${formatAmount(
            currentMetrics.cashFlow,
            "expense"
          )}). Consider reducing non-essential expenses or finding additional revenue streams.`,
        });
      } else if (
        currentMetrics.cashFlow > 0 &&
        currentMetrics.cashFlow < currentMetrics.expenses * 0.2
      ) {
        newRecommendations.push({
          title: "Cash Flow Caution",
          description: `Your cash flow is positive but thin (${formatAmount(
            currentMetrics.cashFlow,
            "income"
          )}). Build a buffer of at least 20-30% of your monthly expenses.`,
        });
      } else if (currentMetrics.cashFlow > currentMetrics.expenses * 0.5) {
        newRecommendations.push({
          title: "Excess Cash Opportunity",
          description: `You have significant positive cash flow (${formatAmount(
            currentMetrics.cashFlow,
            "income"
          )}). Consider investing in growth opportunities or higher-yield accounts.`,
        });
      }

      // Expense recommendations
      const expenseCategories: Record<string, number> = {};
      transactionData
        .filter((t) => t.type === "expense")
        .forEach((t) => {
          expenseCategories[t.category] =
            (expenseCategories[t.category] || 0) + t.amount;
        });

      const topExpenseCategory = Object.entries(expenseCategories).sort(
        (a, b) => (b[1] as number) - (a[1] as number)
      )[0];

      if (
        topExpenseCategory &&
        (topExpenseCategory[1] as number) > currentMetrics.expenses * 0.4
      ) {
        newRecommendations.push({
          title: "Expense Concentration Risk",
          description: `${topExpenseCategory[0]} represents ${Math.round(
            ((topExpenseCategory[1] as number) / currentMetrics.expenses) * 100
          )}% of your total expenses. Consider diversifying or negotiating better terms.`,
        });
      }

      // Revenue recommendations
      if (currentMetrics.revenue > 0 && currentMetrics.expenses > 0) {
        const profitMargin =
          ((currentMetrics.revenue - currentMetrics.expenses) /
            currentMetrics.revenue) *
          100;

        if (profitMargin < 15) {
          newRecommendations.push({
            title: "Profit Margin Alert",
            description: `Your current profit margin is ${profitMargin.toFixed(
              1
            )}%. Industry average is typically 15-20%. Review pricing strategy or look for cost efficiencies.`,
          });
        } else if (profitMargin > 30) {
          newRecommendations.push({
            title: "Growth Opportunity",
            description: `Your profit margin of ${profitMargin.toFixed(
              1
            )}% is excellent. Consider reinvesting in marketing or expansion to increase market share.`,
          });
        }
      }

      // Add general recommendations if we don't have enough specific ones
      if (newRecommendations.length < 3) {
        newRecommendations.push({
          title: "Transaction Tracking",
          description:
            "Regularly categorize your transactions for more accurate financial insights and better tax preparation.",
        });

        if (newRecommendations.length < 3) {
          newRecommendations.push({
            title: "Financial Planning",
            description:
              "Set up monthly financial goals and track your progress to improve business performance.",
          });
        }
      }

      // Limit to 3 recommendations
      return newRecommendations.slice(0, 3);
    },
    []
  );

  // Update recommendations whenever metrics change
  useEffect(() => {
    const newRecommendations = generateRecommendations(transactions, metrics);
    setRecommendations(newRecommendations);
  }, [metrics, transactions, generateRecommendations]);

  // Calculate metrics from transactions
  const calculateMetrics = useCallback(
    (transactionData: Transaction[]) => {
      console.log(
        "Calculating metrics from:",
        transactionData.length,
        "transactions"
      );

      // Use a try-catch to handle any potential issues in the calculation
      try {
        const revenue = transactionData
          .filter((t) => t.type === "income")
          .reduce(
            (sum, t) => sum + (typeof t.amount === "number" ? t.amount : 0),
            0
          );

        const expenses = transactionData
          .filter((t) => t.type === "expense")
          .reduce(
            (sum, t) => sum + (typeof t.amount === "number" ? t.amount : 0),
            0
          );

        const cashFlow = revenue - expenses;

        console.log("Calculated metrics:", { revenue, expenses, cashFlow });

        const newMetrics = {
          revenue,
          expenses,
          cashFlow,
        };

        setMetrics(newMetrics);

        // Generate new recommendations based on updated metrics
        const newRecommendations = generateRecommendations(
          transactionData,
          newMetrics
        );
        setRecommendations(newRecommendations);
      } catch (error) {
        console.error(
          "Error calculating metrics:",
          error instanceof Error ? error.message : "Unknown error"
        );
        setMetrics({
          revenue: 0,
          expenses: 0,
          cashFlow: 0,
        });
      }
    },
    [generateRecommendations]
  );

  // Fetch transactions and calculate metrics
  const fetchTransactions = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setLoading(true);

      try {
        // Use a cache-busting query parameter to avoid browser caching
        const response = await fetch(`/api/transactions?_=${Date.now()}`);

        if (response.ok) {
          const data = await response.json();
          console.log("Fetched transactions:", data);

          // Handle different response formats
          let transactionsList = [];

          if (data && data.transactions && Array.isArray(data.transactions)) {
            transactionsList = data.transactions;
          } else if (data && Array.isArray(data)) {
            transactionsList = data;
          }

          console.log(
            "Processed transactions list:",
            transactionsList.length,
            "items"
          );

          // Set transactions in state
          setTransactions(transactionsList);

          // Calculate metrics from transactions
          calculateMetrics(transactionsList);
        } else {
          console.error("Failed to fetch transactions:", await response.text());
          notify.error("Failed to load transactions");

          // Set example data for demo if no transactions
          const exampleTransactions = [
            {
              id: "1",
              date: "2024-02-22",
              description: "Office Supplies",
              category: "Expenses",
              amount: 234.5,
              type: "expense",
            },
            {
              id: "2",
              date: "2024-02-21",
              description: "Client Payment",
              category: "Income",
              amount: 1500.0,
              type: "income",
            },
            {
              id: "3",
              date: "2024-02-20",
              description: "Software Subscription",
              category: "Expenses",
              amount: 49.99,
              type: "expense",
            },
          ];

          setTransactions(exampleTransactions);

          // Calculate metrics from default transactions
          calculateMetrics(exampleTransactions);
        }
      } catch (error) {
        console.error(
          "Error fetching transactions:",
          error instanceof Error ? error.message : "Unknown error"
        );
        if (!isSilent) {
          notify.error("Failed to load transactions");
        }

        // Set default values
        setTransactions([]);
        setMetrics({
          revenue: 0,
          expenses: 0,
          cashFlow: 0,
        });
      } finally {
        if (!isSilent) setLoading(false);
      }
    },
    [calculateMetrics]
  );

  // Handle manual transaction submission
  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || !formData.description) {
      notify.error("Please fill in all required fields");
      return;
    }

    setRefreshing(true);

    try {
      const amount = parseFloat(formData.amount);
      const type = amount >= 0 ? "income" : "expense";

      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.abs(amount),
          description: formData.description,
          date: new Date().toISOString().split("T")[0],
          type,
          category: type === "income" ? "Income" : "Expenses",
        }),
      });

      if (response.ok) {
        notify.success("Transaction added successfully");

        // Reset form and close dialog
        setFormData({ amount: "", description: "" });
        setIsDialogOpen(false);

        // Increment refresh key to force a refresh
        setRefreshKey((prev) => prev + 1);

        // Refresh transactions
        await fetchTransactions();
      } else {
        const errorText = await response.text();
        console.error("Error adding transaction:", errorText);

        notify.error("Failed to add transaction");
      }
    } catch (error) {
      console.error(
        "Error adding transaction:",
        error instanceof Error ? error.message : "Unknown error"
      );
      notify.error("Failed to add transaction");
    } finally {
      setRefreshing(false);
    }
  };

  // Handle CSV file upload
  const handleUploadCSV = async () => {
    if (!csvFile) {
      notify.error("Please select a file to upload");
      return;
    }

    const formData = new FormData();
    formData.append("file", csvFile);

    setRefreshing(true);

    try {
      const response = await fetch("/api/upload-statement", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Upload result:", result);

        notify.success(
          `Bank statement uploaded successfully. Created ${result.transactionsCreated} transactions.`
        );

        // Reset file input and close dialog
        setCsvFile(null);
        setIsDialogOpen(false);

        // Increment refresh key to force a refresh of data
        setRefreshKey((prev) => prev + 1);

        // Wait a moment to ensure database updates are complete
        setTimeout(async () => {
          // Force a complete refresh of transactions
          await fetchTransactions();
          setRefreshing(false);
        }, 1000);
      } else {
        const errorText = await response.text();
        console.error("Upload error:", errorText);

        notify.error("Failed to upload bank statement");
        setRefreshing(false);
      }
    } catch (error) {
      console.error("Error uploading bank statement:", error);
      notify.error("Failed to upload bank statement");
      setRefreshing(false);
    }
  };

  // Handle input changes for form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCsvFile(e.target.files[0]);
    } else {
      setCsvFile(null);
    }
  };

  // Manual refresh trigger
  const handleRefresh = () => {
    setRefreshing(true);
    // Increment refresh key to force a refresh
    setRefreshKey((prev) => prev + 1);
    fetchTransactions().finally(() => setRefreshing(false));
  };

  // Set up polling for updates
  useEffect(() => {
    // Initial fetch
    fetchTransactions();

    // Set up polling interval (every 30 seconds)
    const interval = setInterval(() => {
      fetchTransactions(true); // Silent fetch to avoid notifications
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchTransactions, refreshKey]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar for larger screens */}
      <aside className="hidden w-64 border-r bg-muted/40 lg:block">
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center border-b px-4">
            <span className="flex items-center gap-2 font-semibold">
              <BrainCircuit className="h-6 w-6" />
              Axento Books
            </span>
          </div>
          <nav className="flex-1 space-y-1 p-2">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Home className="h-4 w-4" />
              Dashboard
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Receipt className="h-4 w-4" />
              Transactions
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <LineChart className="h-4 w-4" />
              Reports
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <FileText className="h-4 w-4" />
              Invoices
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Building2 className="h-4 w-4" />
              Company
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </nav>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-full flex-col">
            <div className="flex h-14 items-center border-b px-4">
              <span className="flex items-center gap-2 font-semibold">
                <BrainCircuit className="h-6 w-6" />
                Axento Books
              </span>
            </div>
            <nav className="flex-1 space-y-1 p-2">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => setSidebarOpen(false)}
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => setSidebarOpen(false)}
              >
                <Receipt className="h-4 w-4" />
                Transactions
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => setSidebarOpen(false)}
              >
                <LineChart className="h-4 w-4" />
                Reports
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => setSidebarOpen(false)}
              >
                <FileText className="h-4 w-4" />
                Invoices
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => setSidebarOpen(false)}
              >
                <Building2 className="h-4 w-4" />
                Company
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => setSidebarOpen(false)}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex-1">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold">Dashboard</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="ghost" size="sm" className="gap-2" asChild>
            <Link href="/invoices">
              <FileText className="h-4 w-4" />
              Invoices
            </Link>
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Transaction</DialogTitle>
                <DialogDescription>
                  Manually add a transaction or upload a bank statement for
                  AI-powered categorization.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitTransaction}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      placeholder="Enter amount (negative for expenses)"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="Transaction description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={refreshing}>
                    {refreshing ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Transaction"
                    )}
                  </Button>
                </div>
              </form>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>
              <div className="grid gap-4">
                <Label htmlFor="file">Upload Bank Statement (CSV)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    disabled={refreshing}
                  />
                  <Button
                    size="icon"
                    onClick={handleUploadCSV}
                    disabled={!csvFile || refreshing}
                    className={refreshing ? "opacity-50" : ""}
                  >
                    <Upload
                      className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                    />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  CSV must contain columns for date, description, and amount.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </header>
        <main className="flex-1 space-y-4 p-4 md:p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <LineChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${metrics.revenue.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  +20.1% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expenses</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${metrics.expenses.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  +4.5% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cash Flow</CardTitle>
                <PieChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${metrics.cashFlow.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  +12.3% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  AI Insights
                </CardTitle>
                <BrainCircuit className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">
                  New recommendations
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>
                    AI-categorized transactions from your accounts.
                  </CardDescription>
                </div>
                {(loading || refreshing) && (
                  <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.length === 0 && !loading ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-6 text-muted-foreground"
                        >
                          No transactions found. Add a transaction or upload a
                          CSV.
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{formatDate(transaction.date)}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>{transaction.category}</TableCell>
                          <TableCell
                            className={`text-right ${
                              transaction.type === "expense"
                                ? "text-red-500"
                                : "text-green-500"
                            }`}
                          >
                            {formatAmount(transaction.amount, transaction.type)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>AI Financial Insights</CardTitle>
                <CardDescription>
                  Smart suggestions based on your financial data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[350px] pr-4">
                  <div className="space-y-4">
                    {recommendations.length === 0 ? (
                      <div className="rounded-lg border bg-muted/40 p-4">
                        <h4 className="mb-2 font-medium">
                          Loading Insights...
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Please wait while we analyze your financial data.
                        </p>
                      </div>
                    ) : (
                      recommendations.map((recommendation, index) => (
                        <div
                          key={index}
                          className="rounded-lg border bg-muted/40 p-4"
                        >
                          <h4 className="mb-2 font-medium">
                            {recommendation.title}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {recommendation.description}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

("use client");

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  BarChart3,
  BrainCircuit,
  Building2,
  Home,
  LineChart,
  Menu,
  PieChart,
  Plus,
  Receipt,
  Settings,
  Upload,
  FileText,
  RefreshCw,
  PlusCircle,
  MinusCircle,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { notify } from "@/lib/notifications";
import Link from "next/link";

// Define transaction type
type Transaction = {
  id: string;
  date: string | Date;
  description: string;
  category: string;
  amount: number;
  type: string;
};

// Define metrics type
type Metrics = {
  revenue: number;
  expenses: number;
  cashFlow: number;
};

// Define recommendation type
type Recommendation = {
  title: string;
  description: string;
};

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    revenue: 0,
    expenses: 0,
    cashFlow: 0,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
  });
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // Use a key to force re-fetch
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  // Format date for display
  const formatDate = (date: string | Date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  };

  // Format amount for display
  const formatAmount = (amount: number, type: string) => {
    const prefix = type === "expense" ? "-" : "";
    return `${prefix}$${Math.abs(amount).toFixed(2)}`;
  };

  // Generate AI recommendations based on financial data
  const generateRecommendations = useCallback(
    (transactionData: Transaction[], currentMetrics: Metrics) => {
      const newRecommendations: Recommendation[] = [];

      // Only generate recommendations if we have meaningful data
      if (transactionData.length === 0) {
        return [
          {
            title: "Start Adding Transactions",
            description:
              "Add your first transaction to receive AI-powered financial insights tailored to your business.",
          },
        ];
      }

      // Cash Flow recommendation
      if (currentMetrics.cashFlow < 0) {
        newRecommendations.push({
          title: "Cash Flow Alert",
          description: `Your current cash flow is negative (${formatAmount(
            currentMetrics.cashFlow,
            "expense"
          )}). Consider reducing non-essential expenses or finding additional revenue streams.`,
        });
      } else if (
        currentMetrics.cashFlow > 0 &&
        currentMetrics.cashFlow < currentMetrics.expenses * 0.2
      ) {
        newRecommendations.push({
          title: "Cash Flow Caution",
          description: `Your cash flow is positive but thin (${formatAmount(
            currentMetrics.cashFlow,
            "income"
          )}). Build a buffer of at least 20-30% of your monthly expenses.`,
        });
      } else if (currentMetrics.cashFlow > currentMetrics.expenses * 0.5) {
        newRecommendations.push({
          title: "Excess Cash Opportunity",
          description: `You have significant positive cash flow (${formatAmount(
            currentMetrics.cashFlow,
            "income"
          )}). Consider investing in growth opportunities or higher-yield accounts.`,
        });
      }

      // Expense recommendations
      const expenseCategories = {};
      transactionData
        .filter((t) => t.type === "expense")
        .forEach((t) => {
          expenseCategories[t.category] =
            (expenseCategories[t.category] || 0) + t.amount;
        });

      const topExpenseCategory = Object.entries(expenseCategories).sort(
        (a, b) => (b[1] as number) - (a[1] as number)
      )[0];

      if (
        topExpenseCategory &&
        (topExpenseCategory[1] as number) > currentMetrics.expenses * 0.4
      ) {
        newRecommendations.push({
          title: "Expense Concentration Risk",
          description: `${topExpenseCategory[0]} represents ${Math.round(
            ((topExpenseCategory[1] as number) / currentMetrics.expenses) * 100
          )}% of your total expenses. Consider diversifying or negotiating better terms.`,
        });
      }

      // Revenue recommendations
      if (currentMetrics.revenue > 0 && currentMetrics.expenses > 0) {
        const profitMargin =
          ((currentMetrics.revenue - currentMetrics.expenses) /
            currentMetrics.revenue) *
          100;

        if (profitMargin < 15) {
          newRecommendations.push({
            title: "Profit Margin Alert",
            description: `Your current profit margin is ${profitMargin.toFixed(
              1
            )}%. Industry average is typically 15-20%. Review pricing strategy or look for cost efficiencies.`,
          });
        } else if (profitMargin > 30) {
          newRecommendations.push({
            title: "Growth Opportunity",
            description: `Your profit margin of ${profitMargin.toFixed(
              1
            )}% is excellent. Consider reinvesting in marketing or expansion to increase market share.`,
          });
        }
      }

      // Add general recommendations if we don't have enough specific ones
      if (newRecommendations.length < 3) {
        newRecommendations.push({
          title: "Transaction Tracking",
          description:
            "Regularly categorize your transactions for more accurate financial insights and better tax preparation.",
        });

        if (newRecommendations.length < 3) {
          newRecommendations.push({
            title: "Financial Planning",
            description:
              "Set up monthly financial goals and track your progress to improve business performance.",
          });
        }
      }

      // Limit to 3 recommendations
      return newRecommendations.slice(0, 3);
    },
    []
  );

  // Update recommendations whenever metrics change
  useEffect(() => {
    const newRecommendations = generateRecommendations(transactions, metrics);
    setRecommendations(newRecommendations);
  }, [metrics, transactions, generateRecommendations]);

  // Calculate metrics from transactions
  const calculateMetrics = useCallback(
    (transactionData: Transaction[]) => {
      console.log(
        "Calculating metrics from:",
        transactionData.length,
        "transactions"
      );

      // Use a try-catch to handle any potential issues in the calculation
      try {
        const revenue = transactionData
          .filter((t) => t.type === "income")
          .reduce(
            (sum, t) => sum + (typeof t.amount === "number" ? t.amount : 0),
            0
          );

        const expenses = transactionData
          .filter((t) => t.type === "expense")
          .reduce(
            (sum, t) => sum + (typeof t.amount === "number" ? t.amount : 0),
            0
          );

        const cashFlow = revenue - expenses;

        console.log("Calculated metrics:", { revenue, expenses, cashFlow });

        const newMetrics = {
          revenue,
          expenses,
          cashFlow,
        };

        setMetrics(newMetrics);

        // Generate new recommendations based on updated metrics
        const newRecommendations = generateRecommendations(
          transactionData,
          newMetrics
        );
        setRecommendations(newRecommendations);
      } catch (error) {
        console.error("Error calculating metrics:", error);
        setMetrics({
          revenue: 0,
          expenses: 0,
          cashFlow: 0,
        });
      }
    },
    [generateRecommendations]
  );

  // Fetch transactions and calculate metrics
  const fetchTransactions = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setLoading(true);

      try {
        // Use a cache-busting query parameter to avoid browser caching
        const response = await fetch(`/api/transactions?_=${Date.now()}`);

        if (response.ok) {
          const data = await response.json();
          console.log("Fetched transactions:", data);

          // Handle different response formats
          let transactionsList = [];

          if (data && data.transactions && Array.isArray(data.transactions)) {
            transactionsList = data.transactions;
          } else if (data && Array.isArray(data)) {
            transactionsList = data;
          }

          console.log(
            "Processed transactions list:",
            transactionsList.length,
            "items"
          );

          // Set transactions in state
          setTransactions(transactionsList);

          // Calculate metrics from transactions
          calculateMetrics(transactionsList);
        } else {
          console.error("Failed to fetch transactions:", await response.text());
          notify({
            title: "Error",
            description: "Failed to load transactions",
            type: "error",
          });

          // Set example data for demo if no transactions
          const exampleTransactions = [
            {
              id: "1",
              date: "2024-02-22",
              description: "Office Supplies",
              category: "Expenses",
              amount: 234.5,
              type: "expense",
            },
            {
              id: "2",
              date: "2024-02-21",
              description: "Client Payment",
              category: "Income",
              amount: 1500.0,
              type: "income",
            },
            {
              id: "3",
              date: "2024-02-20",
              description: "Software Subscription",
              category: "Expenses",
              amount: 49.99,
              type: "expense",
            },
          ];

          setTransactions(exampleTransactions);

          // Calculate metrics from default transactions
          calculateMetrics(exampleTransactions);
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
        if (!isSilent) {
          notify({
            title: "Error",
            description: "Failed to load transactions",
            type: "error",
          });
        }

        // Set default values
        setTransactions([]);
        setMetrics({
          revenue: 0,
          expenses: 0,
          cashFlow: 0,
        });
      } finally {
        if (!isSilent) setLoading(false);
      }
    },
    [calculateMetrics]
  );

  // Handle manual transaction submission
  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || !formData.description) {
      notify({
        title: "Validation Error",
        description: "Please fill in all required fields",
        type: "error",
      });
      return;
    }

    setRefreshing(true);

    try {
      const amount = parseFloat(formData.amount);
      const type = amount >= 0 ? "income" : "expense";

      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.abs(amount),
          description: formData.description,
          date: new Date().toISOString().split("T")[0],
          type,
          category: type === "income" ? "Income" : "Expenses",
        }),
      });

      if (response.ok) {
        notify({
          title: "Success",
          description: "Transaction added successfully",
          type: "success",
        });

        // Reset form and close dialog
        setFormData({ amount: "", description: "" });
        setIsDialogOpen(false);

        // Increment refresh key to force a refresh
        setRefreshKey((prev) => prev + 1);

        // Refresh transactions
        await fetchTransactions();
      } else {
        const errorText = await response.text();
        console.error("Error adding transaction:", errorText);

        notify({
          title: "Error",
          description: "Failed to add transaction",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
      notify({
        title: "Error",
        description: "Failed to add transaction",
        type: "error",
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Handle CSV file upload
  const handleUploadCSV = async () => {
    if (!csvFile) {
      notify({
        title: "Error",
        description: "Please select a file to upload",
        type: "error",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", csvFile);

    setRefreshing(true);

    try {
      const response = await fetch("/api/upload-statement", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Upload result:", result);

        notify({
          title: "Success",
          description: `Bank statement uploaded successfully. Created ${result.transactionsCreated} transactions.`,
          type: "success",
        });

        // Reset file input and close dialog
        setCsvFile(null);
        setIsDialogOpen(false);

        // Increment refresh key to force a refresh of data
        setRefreshKey((prev) => prev + 1);

        // Wait a moment to ensure database updates are complete
        setTimeout(async () => {
          // Force a complete refresh of transactions
          await fetchTransactions();
          setRefreshing(false);
        }, 1000);
      } else {
        const errorText = await response.text();
        console.error("Upload error:", errorText);

        notify({
          title: "Error",
          description: "Failed to upload bank statement",
          type: "error",
        });
        setRefreshing(false);
      }
    } catch (error) {
      console.error("Error uploading bank statement:", error);
      notify({
        title: "Error",
        description: "Failed to upload bank statement",
        type: "error",
      });
      setRefreshing(false);
    }
  };

  // Handle input changes for form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCsvFile(e.target.files[0]);
    } else {
      setCsvFile(null);
    }
  };

  // Manual refresh trigger
  const handleRefresh = () => {
    setRefreshing(true);
    // Increment refresh key to force a refresh
    setRefreshKey((prev) => prev + 1);
    fetchTransactions().finally(() => setRefreshing(false));
  };

  // Set up polling for updates
  useEffect(() => {
    // Initial fetch
    fetchTransactions();

    // Set up polling interval (every 30 seconds)
    const interval = setInterval(() => {
      fetchTransactions(true); // Silent fetch to avoid notifications
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchTransactions, refreshKey]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar for larger screens */}
      <aside className="hidden w-64 border-r bg-muted/40 lg:block">
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center border-b px-4">
            <span className="flex items-center gap-2 font-semibold">
              <BrainCircuit className="h-6 w-6" />
              Axento Books
            </span>
          </div>
          <nav className="flex-1 space-y-1 p-2">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Home className="h-4 w-4" />
              Dashboard
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Receipt className="h-4 w-4" />
              Transactions
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <LineChart className="h-4 w-4" />
              Reports
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <FileText className="h-4 w-4" />
              Invoices
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Building2 className="h-4 w-4" />
              Company
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </nav>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-full flex-col">
            <div className="flex h-14 items-center border-b px-4">
              <span className="flex items-center gap-2 font-semibold">
                <BrainCircuit className="h-6 w-6" />
                Axento Books
              </span>
            </div>
            <nav className="flex-1 space-y-1 p-2">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => setSidebarOpen(false)}
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => setSidebarOpen(false)}
              >
                <Receipt className="h-4 w-4" />
                Transactions
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => setSidebarOpen(false)}
              >
                <LineChart className="h-4 w-4" />
                Reports
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => setSidebarOpen(false)}
              >
                <FileText className="h-4 w-4" />
                Invoices
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => setSidebarOpen(false)}
              >
                <Building2 className="h-4 w-4" />
                Company
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => setSidebarOpen(false)}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex-1">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold">Dashboard</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="ghost" size="sm" className="gap-2" asChild>
            <Link href="/invoices">
              <FileText className="h-4 w-4" />
              Invoices
            </Link>
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Transaction</DialogTitle>
                <DialogDescription>
                  Manually add a transaction or upload a bank statement for
                  AI-powered categorization.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitTransaction}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      placeholder="Enter amount (negative for expenses)"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="Transaction description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={refreshing}>
                    {refreshing ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Transaction"
                    )}
                  </Button>
                </div>
              </form>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>
              <div className="grid gap-4">
                <Label htmlFor="file">Upload Bank Statement (CSV)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    disabled={refreshing}
                  />
                  <Button
                    size="icon"
                    onClick={handleUploadCSV}
                    disabled={!csvFile || refreshing}
                    className={refreshing ? "opacity-50" : ""}
                  >
                    <Upload
                      className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                    />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  CSV must contain columns for date, description, and amount.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </header>
        <main className="flex-1 space-y-4 p-4 md:p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <LineChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${metrics.revenue.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  +20.1% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expenses</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${metrics.expenses.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  +4.5% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cash Flow</CardTitle>
                <PieChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${metrics.cashFlow.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  +12.3% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  AI Insights
                </CardTitle>
                <BrainCircuit className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">
                  New recommendations
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>
                    AI-categorized transactions from your accounts.
                  </CardDescription>
                </div>
                {(loading || refreshing) && (
                  <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.length === 0 && !loading ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-6 text-muted-foreground"
                        >
                          No transactions found. Add a transaction or upload a
                          CSV.
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{formatDate(transaction.date)}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>{transaction.category}</TableCell>
                          <TableCell
                            className={`text-right ${
                              transaction.type === "expense"
                                ? "text-red-500"
                                : "text-green-500"
                            }`}
                          >
                            {formatAmount(transaction.amount, transaction.type)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>AI Financial Insights</CardTitle>
                <CardDescription>
                  Smart suggestions based on your financial data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[350px] pr-4">
                  <div className="space-y-4">
                    {recommendations.length === 0 ? (
                      <div className="rounded-lg border bg-muted/40 p-4">
                        <h4 className="mb-2 font-medium">
                          Loading Insights...
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Please wait while we analyze your financial data.
                        </p>
                      </div>
                    ) : (
                      recommendations.map((recommendation, index) => (
                        <div
                          key={index}
                          className="rounded-lg border bg-muted/40 p-4"
                        >
                          <h4 className="mb-2 font-medium">
                            {recommendation.title}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {recommendation.description}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
