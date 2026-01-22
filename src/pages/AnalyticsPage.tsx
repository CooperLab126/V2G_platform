import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTransactions } from "@/hooks/useTransactions";
import { useSessions } from "@/hooks/useSessions";
import { usePricing, defaultPricing } from "@/hooks/usePricing";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from "recharts";
import { Leaf, Share2, BatteryCharging, Zap, Clock, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startOfWeek, startOfMonth, startOfYear, format, differenceInMinutes, parseISO } from "date-fns";

const AnalyticsPage = () => {
  const [period, setPeriod] = useState<"week" | "month" | "year">("week");
  const { data: transactions, isLoading: transactionsLoading } = useTransactions();
  const { data: sessions, isLoading: sessionsLoading } = useSessions();
  const { data: pricing } = usePricing();
  const currentPricing = pricing || defaultPricing;

  const isLoading = transactionsLoading || sessionsLoading;

  // Helper to get period start date
  const getPeriodStart = (date: Date, periodType: "week" | "month" | "year") => {
    switch (periodType) {
      case "week":
        return startOfWeek(date, { weekStartsOn: 1 });
      case "month":
        return startOfMonth(date);
      case "year":
        return startOfYear(date);
    }
  };

  // Process real data
  const { chartData, earningsData, totalCharged, totalSold, avgSessionMinutes, mostActiveDay } = useMemo(() => {
    if (!sessions || !transactions) {
      return {
        chartData: [],
        earningsData: [],
        totalCharged: 0,
        totalSold: 0,
        avgSessionMinutes: 0,
        mostActiveDay: "N/A",
      };
    }

    const now = new Date();
    const periodStart = getPeriodStart(now, period);

    // Filter sessions by period
    const filteredSessions = sessions.filter(
      (s) => new Date(s.start_time) >= periodStart
    );

    // Filter transactions by period
    const filteredTransactions = transactions.filter(
      (t) => new Date(t.created_at) >= periodStart
    );

    // Group by day for charts
    const dayNames = period === "week" 
      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      : period === "month"
      ? Array.from({ length: 31 }, (_, i) => `${i + 1}`)
      : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const energyByDay: Record<string, { charged: number; sold: number }> = {};
    const earningsByDay: Record<string, number> = {};

    dayNames.forEach((name) => {
      energyByDay[name] = { charged: 0, sold: 0 };
      earningsByDay[name] = 0;
    });

    // Process sessions for energy data
    filteredSessions.forEach((session) => {
      const date = new Date(session.start_time);
      let dayKey: string;

      if (period === "week") {
        dayKey = format(date, "EEE");
      } else if (period === "month") {
        dayKey = format(date, "d");
      } else {
        dayKey = format(date, "MMM");
      }

      if (energyByDay[dayKey]) {
        if (session.mode === "charging") {
          energyByDay[dayKey].charged += Number(session.energy_kwh) || 0;
        } else if (session.mode === "v2g") {
          energyByDay[dayKey].sold += Number(session.energy_kwh) || 0;
        }
      }
    });

    // Process transactions for earnings data
    filteredTransactions.forEach((t) => {
      if (t.type === "v2g_earning" && t.amount > 0) {
        const date = new Date(t.created_at);
        let dayKey: string;

        if (period === "week") {
          dayKey = format(date, "EEE");
        } else if (period === "month") {
          dayKey = format(date, "d");
        } else {
          dayKey = format(date, "MMM");
        }

        if (earningsByDay[dayKey] !== undefined) {
          earningsByDay[dayKey] += t.amount;
        }
      }
    });

    // Convert to chart format
    const chartData = dayNames.map((name) => ({
      name,
      charged: Math.round(energyByDay[name]?.charged || 0),
      sold: Math.round(energyByDay[name]?.sold || 0),
    }));

    const earningsData = dayNames.map((name) => ({
      name,
      earnings: Math.round(earningsByDay[name] || 0),
    }));

    // Calculate totals
    const totalCharged = filteredSessions
      .filter((s) => s.mode === "charging")
      .reduce((sum, s) => sum + (Number(s.energy_kwh) || 0), 0);

    const totalSold = filteredSessions
      .filter((s) => s.mode === "v2g")
      .reduce((sum, s) => sum + (Number(s.energy_kwh) || 0), 0);

    // Calculate average session duration
    const completedSessions = filteredSessions.filter((s) => s.end_time);
    const avgSessionMinutes = completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => {
          const duration = differenceInMinutes(
            parseISO(s.end_time!),
            parseISO(s.start_time)
          );
          return sum + duration;
        }, 0) / completedSessions.length
      : 0;

    // Find most active day
    const sessionsByDay: Record<string, number> = {};
    filteredSessions.forEach((s) => {
      const dayKey = format(new Date(s.start_time), "EEEE");
      sessionsByDay[dayKey] = (sessionsByDay[dayKey] || 0) + 1;
    });

    const mostActiveDay = Object.entries(sessionsByDay).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    return { chartData, earningsData, totalCharged, totalSold, avgSessionMinutes, mostActiveDay };
  }, [sessions, transactions, period]);

  const co2Offset = totalSold * 0.5;
  const treesEquivalent = (co2Offset / 20).toFixed(1);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-4 lg:px-8">
          <h1 className="font-bold text-2xl">Analytics</h1>
        </div>
      </header>

      <div className="px-4 py-6 lg:px-8 space-y-6 max-w-4xl mx-auto">
        {/* Period Selector */}
        <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="year">Year</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Energy Summary */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                  <BatteryCharging className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Charged</p>
                  <p className="text-2xl font-bold">{totalCharged} kWh</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/20">
                  <Zap className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sold (V2G)</p>
                  <p className="text-2xl font-bold">{totalSold} kWh</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Energy Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Energy Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="charged" name="Charged" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="sold" name="Sold" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Earnings Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Earnings Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={earningsData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [`NT$ ${value}`, 'Earnings']}
                  />
                  <Area
                    type="monotone"
                    dataKey="earnings"
                    stroke="hsl(var(--secondary))"
                    fill="hsl(var(--secondary) / 0.2)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
              <p className="text-xl font-bold">{formatDuration(avgSessionMinutes)}</p>
              <p className="text-xs text-muted-foreground">Avg Session</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
              <p className="text-xl font-bold">{mostActiveDay}</p>
              <p className="text-xs text-muted-foreground">Most Active</p>
            </CardContent>
          </Card>
        </div>

        {/* Environmental Impact */}
        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/20">
                  <Leaf className="h-8 w-8 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CO₂ Offset</p>
                  <p className="text-3xl font-bold text-foreground">{co2Offset.toFixed(1)} kg</p>
                  <p className="text-sm text-secondary">
                    Equivalent to {treesEquivalent} trees planted
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="shrink-0">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;
