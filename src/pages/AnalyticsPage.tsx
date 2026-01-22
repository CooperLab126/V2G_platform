import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/store/appStore";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from "recharts";
import { Leaf, Share2, BatteryCharging, Zap, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

const AnalyticsPage = () => {
  const [period, setPeriod] = useState<"week" | "month" | "year">("week");
  const { transactions } = useAppStore();

  // Mock data for charts
  const weeklyData = [
    { name: "Mon", charged: 12, sold: 8 },
    { name: "Tue", charged: 8, sold: 15 },
    { name: "Wed", charged: 5, sold: 12 },
    { name: "Thu", charged: 10, sold: 18 },
    { name: "Fri", charged: 6, sold: 14 },
    { name: "Sat", charged: 15, sold: 5 },
    { name: "Sun", charged: 18, sold: 3 },
  ];

  const earningsData = [
    { name: "Mon", earnings: 34 },
    { name: "Tue", earnings: 63 },
    { name: "Wed", earnings: 50 },
    { name: "Thu", earnings: 76 },
    { name: "Fri", earnings: 59 },
    { name: "Sat", earnings: 21 },
    { name: "Sun", earnings: 13 },
  ];

  const totalCharged = weeklyData.reduce((sum, d) => sum + d.charged, 0);
  const totalSold = weeklyData.reduce((sum, d) => sum + d.sold, 0);
  const co2Offset = totalSold * 0.5;
  const treesEquivalent = (co2Offset / 20).toFixed(1);

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
                <BarChart data={weeklyData} barGap={4}>
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
              <p className="text-xl font-bold">2h 15m</p>
              <p className="text-xs text-muted-foreground">Avg Session</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
              <p className="text-xl font-bold">Thursday</p>
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
