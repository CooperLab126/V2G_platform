import { TrendingUp, Zap, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore } from "@/store/appStore";

export function QuickStats() {
  const { pricing, transactions } = useAppStore();

  // Calculate today's earnings
  const today = new Date().toDateString();
  const todayEarnings = transactions
    .filter((t) => new Date(t.date).toDateString() === today && t.type === "v2g_earning")
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate this month's total earnings
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const monthlyTotal = transactions
    .filter((t) => {
      const txDate = new Date(t.date);
      return txDate.getMonth() === thisMonth && txDate.getFullYear() === thisYear;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="grid grid-cols-3 gap-3">
      <Card className="bg-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">Today</span>
          </div>
          <p className="text-xl font-bold text-foreground">
            NT$ {todayEarnings.toFixed(0)}
          </p>
          <div className="flex items-center gap-1 text-secondary text-xs mt-1">
            <TrendingUp className="h-3 w-3" />
            V2G
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Zap className="h-4 w-4" />
            <span className="text-xs">Rate</span>
          </div>
          <p className="text-sm font-semibold text-secondary">
            Sell: {pricing.currency} {pricing.sellRate}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Buy: {pricing.currency} {pricing.buyRate}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Calendar className="h-4 w-4" />
            <span className="text-xs">Month</span>
          </div>
          <p className="text-xl font-bold text-foreground">
            NT$ {monthlyTotal.toFixed(0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Net earnings</p>
        </CardContent>
      </Card>
    </div>
  );
}
