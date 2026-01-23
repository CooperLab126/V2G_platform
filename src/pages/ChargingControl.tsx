import { useState } from "react";
import { ArrowLeft, BatteryCharging, Zap, Sparkles, Info, MapPin, Plug } from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCurrentSoc } from "@/hooks/useCurrentSoc";
import { useActiveSession, useCreateSession, useUpdateSession } from "@/hooks/useSessions";
import { usePrimaryVehicle } from "@/hooks/useVehicles";
import { useStations } from "@/hooks/useStations";
import { usePricing, defaultPricing } from "@/hooks/usePricing";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Mode = "charging" | "v2g" | "auto";

const ChargingControl = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentSoc } = useCurrentSoc();
  const { data: activeSession } = useActiveSession();
  const { data: pricing } = usePricing();
  const { data: stations } = useStations();
  const primaryVehicle = usePrimaryVehicle();
  const createSession = useCreateSession();
  const updateSession = useUpdateSession();
  
  const rate = pricing || defaultPricing;
  const initialMode = (searchParams.get("mode") as Mode) || "charging";
  const stationId = searchParams.get("station");
  
  // Find the selected station
  const selectedStation = stations?.find(s => s.id === stationId) || null;
  
  const [mode, setMode] = useState<Mode>(initialMode);
  const [targetSoc, setTargetSoc] = useState(() => Math.max(80, currentSoc));
  const [minSoc, setMinSoc] = useState(() => Math.min(30, currentSoc - 10));

  const batteryCapacity = primaryVehicle?.battery_capacity || 60;
  const isActive = !!activeSession;

  const estimatedRange = Math.round((currentSoc / 100) * 400);

  // Calculations
  const chargeNeeded = targetSoc - currentSoc;
  const chargeKwh = (chargeNeeded / 100) * batteryCapacity;
  const chargePower = selectedStation?.max_power_ac || 22;
  const chargeTime = chargeKwh > 0 ? Math.ceil(chargeKwh / chargePower * 60) : 0;
  const chargeCost = chargeKwh * rate.buy_rate;

  const sellableEnergy = currentSoc - minSoc;
  const sellKwh = (sellableEnergy / 100) * batteryCapacity;
  const v2gPower = 7.2; // V2G typically lower power
  const sellTime = sellKwh > 0 ? Math.ceil(sellKwh / v2gPower * 60) : 0;
  const sellEarnings = sellKwh * rate.sell_rate;

  const handleStartSession = async () => {
    if (mode === "auto") return;

    try {
      await createSession.mutateAsync({
        station_id: stationId || "A-01",
        vehicle_id: primaryVehicle?.id || null,
        mode,
        status: "active",
        start_time: new Date().toISOString(),
        end_time: null,
        start_soc: currentSoc,
        end_soc: null,
        target_soc: mode === "charging" ? targetSoc : null,
        min_soc: mode === "v2g" ? minSoc : null,
        power_kw: mode === "charging" ? chargePower : v2gPower,
        energy_kwh: 0,
        amount: 0,
      });

      toast.success(
        mode === "charging" ? "Charging session started!" : "V2G session started!"
      );
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to start session");
    }
  };

  const handleStopSession = async () => {
    if (!activeSession) return;
    
    try {
      await updateSession.mutateAsync({
        id: activeSession.id,
        status: "cancelled",
        end_time: new Date().toISOString(),
        end_soc: currentSoc,
      });
      toast.success("Session stopped successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to stop session");
    }
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
        {/* Selected Station Display */}
        {selectedStation ? (
          <Card className="border-secondary/50 bg-secondary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/20">
                  <Plug className="h-6 w-6 text-secondary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{selectedStation.id}</span>
                    <Badge variant="secondary" className="text-xs">Connected</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedStation.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{selectedStation.max_power_ac} kW AC</p>
                  {selectedStation.max_power_dc && (
                    <p className="text-xs text-muted-foreground">{selectedStation.max_power_dc} kW DC</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed border-accent">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 text-accent">
                <MapPin className="h-5 w-5" />
                <p className="text-sm">No station selected. Please select from Dashboard.</p>
                <Button variant="outline" size="sm" asChild className="ml-auto">
                  <Link to="/">Select Station</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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
            <BatteryCharging className={cn("h-6 w-6", mode === "charging" ? "text-secondary" : "text-muted-foreground")} />
            <span className={cn("font-medium text-sm", mode === "charging" ? "text-secondary" : "text-muted-foreground")}>Charge</span>
          </button>

          <button
            onClick={() => setMode("v2g")}
            disabled={selectedStation && !selectedStation.v2g_capable}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl p-4 border-2 transition-all",
              mode === "v2g"
                ? "border-accent bg-accent/10"
                : "border-border bg-card hover:border-accent/50",
              selectedStation && !selectedStation.v2g_capable && "opacity-50 cursor-not-allowed"
            )}
          >
            <Zap className={cn("h-6 w-6", mode === "v2g" ? "text-accent" : "text-muted-foreground")} />
            <span className={cn("font-medium text-sm", mode === "v2g" ? "text-accent" : "text-muted-foreground")}>V2G</span>
            {selectedStation && !selectedStation.v2g_capable && (
              <span className="text-xs text-muted-foreground">Not supported</span>
            )}
          </button>

          <button disabled className="flex flex-col items-center gap-2 rounded-xl p-4 border-2 border-border bg-muted/50 opacity-50">
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
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${currentSoc}%` }} />
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {mode === "charging" ? "Target SOC" : "Minimum SOC"}
              <Tooltip>
                <TooltipTrigger><Info className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                <TooltipContent>
                  {mode === "charging" ? "Charging will stop when battery reaches this level" : "V2G will stop when battery reaches this level"}
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {mode === "charging" ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-bold text-secondary">{targetSoc}%</span>
                  <span className="text-sm text-muted-foreground">+{chargeNeeded > 0 ? chargeNeeded : 0}% from current</span>
                </div>
                <Slider value={[targetSoc]} onValueChange={(v) => setTargetSoc(v[0])} min={currentSoc} max={100} step={5} className="py-4" />
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-bold text-accent">{minSoc}%</span>
                  <span className="text-sm text-muted-foreground">{sellableEnergy > 0 ? sellableEnergy : 0}% available to sell</span>
                </div>
                <Slider value={[minSoc]} onValueChange={(v) => setMinSoc(v[0])} min={20} max={Math.min(currentSoc, 80)} step={5} className="py-4" />
              </>
            )}
          </CardContent>
        </Card>

        {/* Session Preview */}
        <Card className={cn("border-2", mode === "charging" ? "border-secondary/50" : "border-accent/50")}>
          <CardHeader><CardTitle className="text-base">Session Preview</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="text-lg font-semibold text-foreground">~{mode === "charging" ? chargeTime : sellTime} min</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Energy</p>
                <p className="text-lg font-semibold text-foreground">{(mode === "charging" ? chargeKwh : sellKwh).toFixed(1)} kWh</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{mode === "charging" ? "Cost" : "Earnings"}</p>
                <p className={cn("text-lg font-semibold", mode === "charging" ? "text-destructive" : "text-secondary")}>
                  {mode === "charging" ? "-" : "+"}NT$ {(mode === "charging" ? chargeCost : sellEarnings).toFixed(0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        {isActive ? (
          <Button size="lg" variant="outline" className="w-full h-14 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={handleStopSession}>
            Stop Session
          </Button>
        ) : (
          <Button
            size="lg"
            className={cn("w-full h-14", mode === "charging" ? "bg-secondary hover:bg-secondary/90" : "bg-accent hover:bg-accent/90")}
            onClick={handleStartSession}
            disabled={
              !selectedStation ||
              (mode === "charging" && chargeNeeded <= 0) ||
              (mode === "v2g" && sellableEnergy <= 0) ||
              (mode === "v2g" && !selectedStation?.v2g_capable) ||
              createSession.isPending
            }
          >
            {mode === "charging" ? <><BatteryCharging className="h-5 w-5 mr-2" />Start Charging</> : <><Zap className="h-5 w-5 mr-2" />Start V2G</>}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ChargingControl;
