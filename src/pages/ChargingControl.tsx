import { useState } from "react";
import { ArrowLeft, BatteryCharging, Zap, Sparkles, Info } from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAppStore } from "@/store/appStore";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Mode = "charging" | "v2g" | "auto";

const ChargingControl = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentSoc, currentSession, pricing, setCurrentSession, vehicles } = useAppStore();
  
  const initialMode = (searchParams.get("mode") as Mode) || "charging";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [targetSoc, setTargetSoc] = useState(80);
  const [minSoc, setMinSoc] = useState(30);

  const primaryVehicle = vehicles.find((v) => v.isPrimary);
  const batteryCapacity = primaryVehicle?.batteryCapacity || 60;
  const isActive = !!currentSession;

  const estimatedRange = Math.round((currentSoc / 100) * 400);

  // Calculations
  const chargeNeeded = targetSoc - currentSoc;
  const chargeKwh = (chargeNeeded / 100) * batteryCapacity;
  const chargeTime = chargeKwh > 0 ? Math.ceil(chargeKwh / 22 * 60) : 0;
  const chargeCost = chargeKwh * pricing.buyRate;

  const sellableEnergy = currentSoc - minSoc;
  const sellKwh = (sellableEnergy / 100) * batteryCapacity;
  const sellTime = sellKwh > 0 ? Math.ceil(sellKwh / 7.2 * 60) : 0;
  const sellEarnings = sellKwh * pricing.sellRate;

  const handleStartSession = () => {
    if (mode === "auto") return;

    const session = {
      id: `SES-${Date.now()}`,
      stationId: "A-01",
      mode,
      status: "active" as const,
      startTime: new Date().toISOString(),
      currentSoc,
      startSoc: currentSoc,
      targetSoc: mode === "charging" ? targetSoc : undefined,
      minSoc: mode === "v2g" ? minSoc : undefined,
      powerKw: mode === "charging" ? 22 : 7.2,
      energyKwh: 0,
      currentAmount: 0,
    };

    setCurrentSession(session);
    toast.success(
      mode === "charging" ? "Charging session started!" : "V2G session started!"
    );
    navigate("/");
  };

  const handleStopSession = () => {
    setCurrentSession(null);
    toast.success("Session stopped successfully");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-4 px-4 py-4 lg:px-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="font-bold text-lg">Charging Control</h1>
        </div>
      </header>

      <div className="px-4 py-6 lg:px-8 space-y-6 max-w-2xl mx-auto">
        {/* Mode Selector */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setMode("charging")}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl p-4 border-2 transition-all",
              mode === "charging"
                ? "border-secondary bg-secondary/10"
                : "border-border bg-card hover:border-secondary/50"
            )}
          >
            <BatteryCharging
              className={cn(
                "h-6 w-6",
                mode === "charging" ? "text-secondary" : "text-muted-foreground"
              )}
            />
            <span
              className={cn(
                "font-medium text-sm",
                mode === "charging" ? "text-secondary" : "text-muted-foreground"
              )}
            >
              Charge
            </span>
          </button>

          <button
            onClick={() => setMode("v2g")}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl p-4 border-2 transition-all",
              mode === "v2g"
                ? "border-accent bg-accent/10"
                : "border-border bg-card hover:border-accent/50"
            )}
          >
            <Zap
              className={cn(
                "h-6 w-6",
                mode === "v2g" ? "text-accent" : "text-muted-foreground"
              )}
            />
            <span
              className={cn(
                "font-medium text-sm",
                mode === "v2g" ? "text-accent" : "text-muted-foreground"
              )}
            >
              V2G
            </span>
          </button>

          <button
            disabled
            className="flex flex-col items-center gap-2 rounded-xl p-4 border-2 border-border bg-muted/50 opacity-50"
          >
            <Sparkles className="h-6 w-6 text-muted-foreground" />
            <span className="font-medium text-sm text-muted-foreground">Auto</span>
            <span className="text-xs text-muted-foreground">Soon</span>
          </button>
        </div>

        {/* Current Status */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current SOC</p>
                <p className="text-2xl font-bold text-foreground">{currentSoc}%</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Est. Range</p>
                <p className="text-2xl font-bold text-foreground">{estimatedRange} km</p>
              </div>
            </div>
            <div className="mt-4 h-3 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${currentSoc}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {mode === "charging" ? "Target SOC" : "Minimum SOC"}
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  {mode === "charging"
                    ? "Charging will stop when battery reaches this level"
                    : "V2G will stop when battery reaches this level"}
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {mode === "charging" ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-bold text-secondary">{targetSoc}%</span>
                  <span className="text-sm text-muted-foreground">
                    +{chargeNeeded > 0 ? chargeNeeded : 0}% from current
                  </span>
                </div>
                <Slider
                  value={[targetSoc]}
                  onValueChange={(v) => setTargetSoc(v[0])}
                  min={currentSoc}
                  max={100}
                  step={5}
                  className="py-4"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{currentSoc}%</span>
                  <span>100%</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-bold text-accent">{minSoc}%</span>
                  <span className="text-sm text-muted-foreground">
                    {sellableEnergy > 0 ? sellableEnergy : 0}% available to sell
                  </span>
                </div>
                <Slider
                  value={[minSoc]}
                  onValueChange={(v) => setMinSoc(v[0])}
                  min={20}
                  max={Math.min(currentSoc, 80)}
                  step={5}
                  className="py-4"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>20%</span>
                  <span>{Math.min(currentSoc, 80)}%</span>
                </div>
                {currentSoc <= minSoc && (
                  <p className="text-sm text-destructive">
                    ⚠️ Current SOC is at or below minimum level
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Session Preview */}
        <Card
          className={cn(
            "border-2",
            mode === "charging" ? "border-secondary/50" : "border-accent/50"
          )}
        >
          <CardHeader>
            <CardTitle className="text-base">Session Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="text-lg font-semibold text-foreground">
                  ~{mode === "charging" ? chargeTime : sellTime} min
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Energy</p>
                <p className="text-lg font-semibold text-foreground">
                  {(mode === "charging" ? chargeKwh : sellKwh).toFixed(1)} kWh
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {mode === "charging" ? "Cost" : "Earnings"}
                </p>
                <p
                  className={cn(
                    "text-lg font-semibold",
                    mode === "charging" ? "text-destructive" : "text-secondary"
                  )}
                >
                  {mode === "charging" ? "-" : "+"}NT${" "}
                  {(mode === "charging" ? chargeCost : sellEarnings).toFixed(0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        {isActive ? (
          <Button
            size="lg"
            variant="outline"
            className="w-full h-14 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={handleStopSession}
          >
            Stop Session
          </Button>
        ) : (
          <Button
            size="lg"
            className={cn(
              "w-full h-14",
              mode === "charging"
                ? "bg-secondary hover:bg-secondary/90"
                : "bg-accent hover:bg-accent/90"
            )}
            onClick={handleStartSession}
            disabled={
              (mode === "charging" && chargeNeeded <= 0) ||
              (mode === "v2g" && sellableEnergy <= 0)
            }
          >
            {mode === "charging" ? (
              <>
                <BatteryCharging className="h-5 w-5 mr-2" />
                Start Charging
              </>
            ) : (
              <>
                <Zap className="h-5 w-5 mr-2" />
                Start V2G
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ChargingControl;
