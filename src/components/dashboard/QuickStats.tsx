import { TrendingUp, Zap, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore } from "@/store/appStore";

export function QuickStats() {
  const { pricing } = useAppStore();

  return (
    <div className="grid grid-cols-3 gap-3">
      <Card className="bg-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">Today</span>
          </div>
          <p className="text-xl font-bold text-foreground">NT$ 156</p>
          <div className="flex items-center gap-1 text-secondary text-xs mt-1">
            <TrendingUp className="h-3 w-3" />
            +23%
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
          <p className="text-xl font-bold text-foreground">NT$ 2,456</p>
          <p className="text-xs text-muted-foreground mt-1">Total earnings</p>
        </CardContent>
      </Card>
    </div>
  );
}
