import { ArrowDown, ArrowUp, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/appStore";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function RecentActivity() {
  const { transactions } = useAppStore();
  const recentTransactions = transactions.slice(0, 3);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/wallet" className="text-primary">
            View all
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {recentTransactions.map((transaction) => (
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
                <p className="font-medium text-foreground">
                  {transaction.type === "v2g_earning" ? "V2G Earning" : "Charging"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(transaction.date)} • {transaction.energyKwh} kWh
                </p>
              </div>
            </div>
            <p
              className={cn(
                "font-semibold",
                transaction.amount > 0 ? "text-secondary" : "text-destructive"
              )}
            >
              {transaction.amount > 0 ? "+" : ""}NT$ {Math.abs(transaction.amount).toFixed(0)}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
