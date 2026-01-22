import { Battery, Zap, ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface BatteryRingProps {
  soc: number;
  status: "idle" | "charging" | "v2g";
  powerKw?: number;
  energyKwh?: number;
  batteryCapacity?: number;
}

export function BatteryRing({
  soc,
  status,
  powerKw = 0,
  energyKwh = 0,
  batteryCapacity = 60,
}: BatteryRingProps) {
  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (soc / 100) * circumference;
  const availableKwh = (soc / 100) * batteryCapacity;

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Ring */}
      <div className="relative">
        <svg
          width="220"
          height="220"
          viewBox="0 0 220 220"
          className="transform -rotate-90"
        >
          {/* Background ring */}
          <circle
            cx="110"
            cy="110"
            r="90"
            stroke="currentColor"
            strokeWidth="12"
            fill="none"
            className="text-muted/50"
          />
          {/* Progress ring */}
          <circle
            cx="110"
            cy="110"
            r="90"
            stroke="currentColor"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={cn(
              "transition-all duration-1000 ease-out",
              status === "charging" && "text-secondary",
              status === "v2g" && "text-accent",
              status === "idle" && "text-primary"
            )}
          />
        </svg>

        {/* Inner content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Battery
            className={cn(
              "h-8 w-8 mb-1",
              status === "charging" && "text-secondary",
              status === "v2g" && "text-accent",
              status === "idle" && "text-primary"
            )}
          />
          <span className="text-5xl font-bold text-foreground">{soc}%</span>
          <span className="text-sm text-muted-foreground mt-1">
            {availableKwh.toFixed(1)} kWh available
          </span>
        </div>
      </div>

      {/* Status Badge */}
      <div
        className={cn(
          "mt-4 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium",
          status === "idle" && "bg-muted text-muted-foreground",
          status === "charging" && "bg-secondary/20 text-secondary animate-pulse",
          status === "v2g" && "bg-accent/20 text-accent animate-pulse"
        )}
      >
        {status === "idle" && "Idle"}
        {status === "charging" && (
          <>
            <ArrowDown className="h-4 w-4" />
            Charging
          </>
        )}
        {status === "v2g" && (
          <>
            <ArrowUp className="h-4 w-4" />
            V2G Active
          </>
        )}
      </div>

      {/* Power Flow (when active) */}
      {status !== "idle" && (
        <div className="mt-4 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-1">
            {status === "charging" ? (
              <ArrowDown className="h-4 w-4 text-secondary" />
            ) : (
              <ArrowUp className="h-4 w-4 text-accent" />
            )}
            <span className="font-semibold">{powerKw.toFixed(1)} kW</span>
          </div>
          <div className="text-muted-foreground">
            <Zap className="h-4 w-4 inline mr-1" />
            {energyKwh.toFixed(1)} kWh
          </div>
        </div>
      )}
    </div>
  );
}
