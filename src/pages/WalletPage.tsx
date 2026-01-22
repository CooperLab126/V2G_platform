import { ArrowUp, ArrowDown, CreditCard, Banknote, Leaf, Zap, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTransactions, useTotalBalance } from "@/hooks/useTransactions";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

const WalletPage = () => {
  const { data: transactions = [], isLoading } = useTransactions();
  const totalBalance = useTotalBalance();

  // Calculate balance from all transactions
  const monthlyEarnings = transactions
    .filter((t) => t.type === "v2g_earning")
    .reduce((sum, t) => sum + t.amount, 0);
  const monthlyCosts = transactions
    .filter((t) => t.type === "charging_cost")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const netEarnings = monthlyEarnings - monthlyCosts;

  const totalSessions = transactions.filter(
    (t) => t.type === "v2g_earning" || t.type === "charging_cost"
  ).length;
  const totalEnergySold = transactions
    .filter((t) => t.type === "v2g_earning")
    .reduce((sum, t) => sum + (t.energy_kwh || 0), 0);
  const co2Saved = totalEnergySold * 0.5;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filterTransactions = (type: string) => {
    if (type === "all") return transactions;
    if (type === "earnings") return transactions.filter((t) => t.type === "v2g_earning");
    if (type === "costs") return transactions.filter((t) => t.type === "charging_cost");
    return transactions;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="px-4 py-4 lg:px-8">
            <h1 className="font-bold text-2xl">Wallet</h1>
          </div>
        </header>
        <div className="px-4 py-6 lg:px-8 space-y-6 max-w-2xl mx-auto">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-4 lg:px-8">
          <h1 className="font-bold text-2xl">Wallet</h1>
        </div>
      </header>

      <div className="px-4 py-6 lg:px-8 space-y-6 max-w-2xl mx-auto">
        {/* Balance Card */}
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/20 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/20 rounded-full translate-y-1/2 -translate-x-1/2" />
          <CardContent className="p-6 relative">
            <p className="text-sm text-primary-foreground/80">Available Balance</p>
            <p className="text-4xl font-bold mt-2">NT$ {totalBalance.toLocaleString()}</p>
            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0"
              >
                <Banknote className="h-4 w-4 mr-2" />
                Withdraw
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Top Up
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">This Month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">V2G Earnings</span>
              <span className="font-semibold text-secondary">
                +NT$ {monthlyEarnings.toFixed(0)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Charging Costs</span>
              <span className="font-semibold text-destructive">
                -NT$ {monthlyCosts.toFixed(0)}
              </span>
            </div>
            <div className="border-t border-border pt-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Net</span>
                <span
                  className={cn(
                    "font-bold text-lg",
                    netEarnings >= 0 ? "text-secondary" : "text-destructive"
                  )}
                >
                  {netEarnings >= 0 ? "+" : ""}NT$ {netEarnings.toFixed(0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <History className="h-5 w-5 mx-auto text-primary mb-2" />
              <p className="text-xl font-bold">{totalSessions}</p>
              <p className="text-xs text-muted-foreground">Sessions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Zap className="h-5 w-5 mx-auto text-accent mb-2" />
              <p className="text-xl font-bold">{totalEnergySold.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">kWh Sold</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Leaf className="h-5 w-5 mx-auto text-secondary mb-2" />
              <p className="text-xl font-bold">{co2Saved.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">kg CO₂</p>
            </CardContent>
          </Card>
        </div>

        {/* Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No transactions yet</p>
                <p className="text-sm">Start a charging or V2G session to see your history</p>
              </div>
            ) : (
              <Tabs defaultValue="all">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="earnings">Earnings</TabsTrigger>
                  <TabsTrigger value="costs">Costs</TabsTrigger>
                </TabsList>
                {["all", "earnings", "costs"].map((tab) => (
                  <TabsContent key={tab} value={tab} className="space-y-4 mt-4">
                    {Object.entries(
                      filterTransactions(tab).reduce((groups, t) => {
                        const dateKey = formatDate(t.created_at);
                        if (!groups[dateKey]) groups[dateKey] = [];
                        groups[dateKey].push(t);
                        return groups;
                      }, {} as Record<string, typeof transactions>)
                    ).map(([date, txns]) => (
                      <div key={date}>
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          {date}
                        </p>
                        {txns.map((transaction) => (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between py-3 border-b border-border last:border-0"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "flex h-10 w-10 items-center justify-center rounded-full",
                                  transaction.type === "v2g_earning"
                                    ? "bg-secondary/20"
                                    : "bg-destructive/20"
                                )}
                              >
                                {transaction.type === "v2g_earning" ? (
                                  <ArrowUp className="h-5 w-5 text-secondary" />
                                ) : (
                                  <ArrowDown className="h-5 w-5 text-destructive" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">
                                  {transaction.type === "v2g_earning"
                                    ? "V2G Earning"
                                    : "Charging"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {formatTime(transaction.created_at)} •{" "}
                                  {transaction.energy_kwh?.toFixed(1) || 0} kWh
                                </p>
                              </div>
                            </div>
                            <p
                              className={cn(
                                "font-semibold",
                                transaction.amount > 0
                                  ? "text-secondary"
                                  : "text-destructive"
                              )}
                            >
                              {transaction.amount > 0 ? "+" : ""}NT${" "}
                              {Math.abs(transaction.amount).toFixed(0)}
                            </p>
                          </div>
                        ))}
                      </div>
                    ))}
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WalletPage;
