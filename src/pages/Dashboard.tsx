import { Bell, Zap } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useActiveSession } from "@/hooks/useSessions";
import { useCurrentSoc } from "@/hooks/useCurrentSoc";
import { usePrimaryVehicle } from "@/hooks/useVehicles";
import { BatteryRing } from "@/components/dashboard/BatteryRing";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { ConnectionStatus } from "@/components/dashboard/ConnectionStatus";

const Dashboard = () => {
  const { profile } = useAuth();
  const { data: activeSession } = useActiveSession();
  const { currentSoc } = useCurrentSoc();
  const primaryVehicle = usePrimaryVehicle();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const status = activeSession
    ? activeSession.mode === "charging"
      ? "charging"
      : "v2g"
    : "idle";

  const userName = profile?.name || "User";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 py-4 lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">
                {getGreeting()}, {userName}
              </h1>
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
          
          <div className="hidden lg:block">
            <h1 className="font-bold text-2xl text-foreground">
              {getGreeting()}, {userName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-card hover:bg-muted transition-colors">
              <Bell className="h-5 w-5 text-foreground" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive" />
            </button>
            <Avatar className="h-10 w-10 lg:hidden">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {userName.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-6 lg:px-8 space-y-6">
        {/* Connection Status */}
        <ConnectionStatus />

        {/* Battery Status */}
        <div className="flex justify-center py-4">
          <BatteryRing
            soc={currentSoc}
            status={status}
            powerKw={activeSession?.power_kw || 0}
            energyKwh={activeSession?.energy_kwh || 0}
            batteryCapacity={primaryVehicle?.battery_capacity || 60}
          />
        </div>

        {/* Quick Stats */}
        <QuickStats />

        {/* Quick Actions */}
        <QuickActions />

        {/* Recent Activity */}
        <RecentActivity />
      </div>
    </div>
  );
};

export default Dashboard;
