import { useState, useEffect, useMemo } from "react";
import { 
  Monitor, 
  Plug, 
  BatteryCharging, 
  Zap, 
  Circle, 
  ArrowDown, 
  ArrowUp,
  User,
  Car,
  Clock,
  Coins,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStations, Station } from "@/hooks/useStations";
import { useAllActiveSessions, AllSession } from "@/hooks/useAllSessions";
import { useUpdateSession } from "@/hooks/useSessions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface ChargerData {
  station: Station;
  session: AllSession | null;
  status: "charging" | "v2g" | "idle" | "offline" | "maintenance";
}

function LiveIndicator() {
  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
      </span>
      <span className="text-sm font-medium text-secondary">Live</span>
    </div>
  );
}

function StationOverviewCard({ chargers }: { chargers: ChargerData[] }) {
  const stats = {
    total: chargers.length,
    charging: chargers.filter(c => c.status === "charging").length,
    v2g: chargers.filter(c => c.status === "v2g").length,
    idle: chargers.filter(c => c.status === "idle").length,
    offline: chargers.filter(c => c.status === "offline" || c.status === "maintenance").length,
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Station Overview</CardTitle>
        <Badge variant="outline" className="gap-1">
          <Plug className="h-3 w-3" />
          MCUT Campus
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col items-center p-4 rounded-xl bg-primary/10">
            <Plug className="h-6 w-6 text-primary mb-2" />
            <span className="text-2xl font-bold">{stats.total}</span>
            <span className="text-xs text-muted-foreground">Total Chargers</span>
          </div>
          <div className="flex flex-col items-center p-4 rounded-xl bg-secondary/10">
            <BatteryCharging className="h-6 w-6 text-secondary mb-2" />
            <span className="text-2xl font-bold text-secondary">{stats.charging}</span>
            <span className="text-xs text-muted-foreground">Charging</span>
          </div>
          <div className="flex flex-col items-center p-4 rounded-xl bg-accent/10">
            <Zap className="h-6 w-6 text-accent mb-2" />
            <span className="text-2xl font-bold text-accent">{stats.v2g}</span>
            <span className="text-xs text-muted-foreground">V2G Active</span>
          </div>
          <div className="flex flex-col items-center p-4 rounded-xl bg-muted">
            <Circle className="h-6 w-6 text-muted-foreground mb-2" />
            <span className="text-2xl font-bold text-muted-foreground">{stats.idle}</span>
            <span className="text-xs text-muted-foreground">Idle</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PowerFlowCard({ chargers }: { chargers: ChargerData[] }) {
  const gridImport = chargers
    .filter(c => c.status === "charging" && c.session)
    .reduce((sum, c) => sum + (c.session?.power_kw || 0), 0);
  
  const gridExport = chargers
    .filter(c => c.status === "v2g" && c.session)
    .reduce((sum, c) => sum + (c.session?.power_kw || 0), 0);
  
  const netPower = gridExport - gridImport;
  const isExporting = netPower > 0;
  const maxPower = 50;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Total Power Flow</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowDown className="h-5 w-5 text-primary animate-bounce" />
                <span className="text-sm font-medium">Grid Import</span>
              </div>
              <span className="text-xl font-bold">{gridImport.toFixed(1)} kW</span>
            </div>
            <Progress value={(gridImport / maxPower) * 100} className="h-3 bg-primary/20" />
            <p className="text-xs text-muted-foreground">Charging power consumption</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowUp className="h-5 w-5 text-secondary animate-bounce" />
                <span className="text-sm font-medium">Grid Export</span>
              </div>
              <span className="text-xl font-bold text-secondary">{gridExport.toFixed(1)} kW</span>
            </div>
            <Progress value={(gridExport / maxPower) * 100} className="h-3 bg-secondary/20 [&>div]:bg-secondary" />
            <p className="text-xs text-muted-foreground">V2G power to grid</p>
          </div>
        </div>
        
        <div className={cn(
          "flex items-center justify-center gap-3 p-4 rounded-xl",
          isExporting ? "bg-secondary/10" : "bg-primary/10"
        )}>
          {isExporting ? (
            <ArrowUp className="h-6 w-6 text-secondary" />
          ) : (
            <ArrowDown className="h-6 w-6 text-primary" />
          )}
          <div className="text-center">
            <span className="text-2xl font-bold">
              {Math.abs(netPower).toFixed(1)} kW
            </span>
            <span className={cn(
              "ml-2 text-sm font-medium",
              isExporting ? "text-secondary" : "text-primary"
            )}>
              {isExporting ? "→ Exporting to Grid" : "← Importing from Grid"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChargerCard({ 
  charger, 
  onViewDetails, 
  onStopSession 
}: { 
  charger: ChargerData; 
  onViewDetails: (charger: ChargerData) => void;
  onStopSession: (sessionId: string) => void;
}) {
  const getStatusConfig = () => {
    switch (charger.status) {
      case "charging":
        return {
          label: "CHARGING",
          icon: ArrowDown,
          color: "text-secondary",
          bgColor: "bg-secondary/10",
          borderColor: "border-secondary/30",
        };
      case "v2g":
        return {
          label: "V2G ACTIVE",
          icon: ArrowUp,
          color: "text-accent",
          bgColor: "bg-accent/10",
          borderColor: "border-accent/30",
        };
      case "offline":
        return {
          label: "OFFLINE",
          icon: AlertTriangle,
          color: "text-destructive",
          bgColor: "bg-destructive/10",
          borderColor: "border-destructive/30",
        };
      case "maintenance":
        return {
          label: "MAINTENANCE",
          icon: AlertTriangle,
          color: "text-accent",
          bgColor: "bg-accent/10",
          borderColor: "border-accent/30",
        };
      default:
        return {
          label: "IDLE",
          icon: Circle,
          color: "text-muted-foreground",
          bgColor: "bg-muted/50",
          borderColor: "border-border",
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;
  const session = charger.session;
  const station = charger.station;

  // Calculate current SOC based on session progress (simulation)
  const currentSoc = session 
    ? session.mode === "charging"
      ? Math.min(session.target_soc || 100, session.start_soc + Math.round(session.energy_kwh * 100 / 60))
      : Math.max(session.min_soc || 20, session.start_soc - Math.round(session.energy_kwh * 100 / 60))
    : 0;

  const duration = session 
    ? formatDistanceToNow(new Date(session.start_time), { addSuffix: false })
    : "";

  return (
    <Card className={cn("overflow-hidden border-2 transition-all hover:shadow-lg", config.borderColor)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{station.id}</CardTitle>
            <p className="text-sm text-muted-foreground">{station.name}</p>
          </div>
          <Badge variant={station.status !== "offline" ? "default" : "destructive"} className="gap-1">
            <span className={cn(
              "h-2 w-2 rounded-full",
              station.status !== "offline" ? "bg-secondary animate-pulse" : "bg-destructive"
            )} />
            {station.status !== "offline" ? "Online" : "Offline"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Display */}
        <div className={cn("flex flex-col items-center justify-center p-6 rounded-xl", config.bgColor)}>
          <StatusIcon className={cn("h-10 w-10 mb-2", config.color)} />
          <span className={cn("text-lg font-bold", config.color)}>
            {session?.power_kw ? `${session.power_kw} kW` : config.label}
          </span>
          {!session && charger.status === "idle" && (
            <span className="text-sm text-muted-foreground">Available</span>
          )}
        </div>

        {/* Session Info */}
        {session && (
          <>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{session.profiles?.name || "Unknown"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-muted-foreground" />
                <span>{session.vehicles ? `${session.vehicles.brand} ${session.vehicles.model}` : "Vehicle"}</span>
              </div>
            </div>

            {/* SOC Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Battery SOC</span>
                <span className="font-medium">{currentSoc}%</span>
              </div>
              <Progress value={currentSoc} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{session.start_soc}%</span>
                <span>
                  {session.mode === "charging" 
                    ? `→ ${session.target_soc || 80}%` 
                    : `→ ${session.min_soc || 20}%`
                  }
                </span>
              </div>
            </div>

            {/* Session Stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-muted/50">
                <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Session</span>
                <p className="text-sm font-medium">{duration}</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <Zap className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Energy</span>
                <p className="text-sm font-medium">{session.energy_kwh.toFixed(1)} kWh</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <Coins className="h-4 w-4 mx-auto mb-1 text-accent" />
                <span className="text-xs text-muted-foreground">
                  {session.mode === "v2g" ? "Earned" : "Cost"}
                </span>
                <p className={cn("text-sm font-medium", session.mode === "v2g" ? "text-accent" : "text-destructive")}>
                  {session.mode === "v2g" ? "+" : "-"}฿{Math.abs(session.amount).toFixed(0)}
                </p>
              </div>
            </div>

            <Button 
              variant="destructive" 
              className="w-full"
              onClick={() => onStopSession(session.id)}
            >
              Stop Session
            </Button>
          </>
        )}

        {/* Idle State Info */}
        {charger.status === "idle" && !session && (
          <>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max Power</span>
                <span>{station.max_power_ac} kW AC {station.max_power_dc ? `/ ${station.max_power_dc} kW DC` : ""}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Connectors</span>
                <span>{station.connectors?.join(", ") || "CCS2"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">V2G</span>
                <span>{station.v2g_capable ? "✓ Supported" : "✗ Not supported"}</span>
              </div>
            </div>
            
            <Button variant="outline" className="w-full" onClick={() => onViewDetails(charger)}>
              View Details
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function SessionDetailModal({ 
  charger, 
  open, 
  onOpenChange,
  onStopSession,
}: { 
  charger: ChargerData | null; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onStopSession: (sessionId: string) => void;
}) {
  const session = charger?.session;

  if (!session) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Station Details</DialogTitle>
          </DialogHeader>
          {charger && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Station ID</span>
                <span className="font-medium">{charger.station.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Location</span>
                <span className="font-medium">{charger.station.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline">Available</Badge>
              </div>
              <hr />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Power AC</span>
                  <span>{charger.station.max_power_ac} kW</span>
                </div>
                {charger.station.max_power_dc && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Power DC</span>
                    <span>{charger.station.max_power_dc} kW</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Connectors</span>
                  <span>{charger.station.connectors?.join(", ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">V2G Capable</span>
                  <span>{charger.station.v2g_capable ? "Yes" : "No"}</span>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Session Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Charger</span>
            <span className="font-medium">{charger.station.id}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={session.mode === "charging" ? "default" : "secondary"}>
              {session.mode === "charging" ? "⚡ Charging" : "↑ V2G Active"}
            </Badge>
          </div>

          <hr className="border-border" />
          
          <div className="space-y-2">
            <h4 className="font-semibold">User Information</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Name</span>
              <span>{session.profiles?.name}</span>
              <span className="text-muted-foreground">Vehicle</span>
              <span>{session.vehicles ? `${session.vehicles.brand} ${session.vehicles.model}` : "Unknown"}</span>
            </div>
          </div>

          <hr className="border-border" />

          <div className="space-y-2">
            <h4 className="font-semibold">Session Information</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Mode</span>
              <span className="capitalize">{session.mode}</span>
              <span className="text-muted-foreground">Duration</span>
              <span>{formatDistanceToNow(new Date(session.start_time))}</span>
              <span className="text-muted-foreground">Current Power</span>
              <span>{session.power_kw} kW</span>
              <span className="text-muted-foreground">Energy Transferred</span>
              <span>{session.energy_kwh.toFixed(2)} kWh</span>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button variant="destructive" className="flex-1" onClick={() => {
              onStopSession(session.id);
              onOpenChange(false);
            }}>
              Stop Session
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function MonitorPage() {
  const { data: stations, isLoading: stationsLoading } = useStations();
  const { data: activeSessions, isLoading: sessionsLoading } = useAllActiveSessions();
  const updateSession = useUpdateSession();

  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [selectedCharger, setSelectedCharger] = useState<ChargerData | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Update last updated timestamp
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Combine stations with active sessions
  const chargers: ChargerData[] = useMemo(() => {
    if (!stations) return [];

    return stations.map((station) => {
      // Find active session for this station
      const session = activeSessions?.find((s) => s.station_id === station.id) || null;
      
      let status: ChargerData["status"] = "idle";
      if (station.status === "offline") {
        status = "offline";
      } else if (station.status === "maintenance") {
        status = "maintenance";
      } else if (session) {
        status = session.mode === "charging" ? "charging" : "v2g";
      }

      return {
        station,
        session,
        status,
      };
    });
  }, [stations, activeSessions]);

  const handleViewDetails = (charger: ChargerData) => {
    setSelectedCharger(charger);
    setDetailModalOpen(true);
  };

  const handleStopSession = async (sessionId: string) => {
    try {
      await updateSession.mutateAsync({
        id: sessionId,
        status: "cancelled",
        end_time: new Date().toISOString(),
      });
      toast.success("Session stopped successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to stop session");
    }
  };

  const isLoading = stationsLoading || sessionsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Monitor className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Station Monitoring</h1>
          </div>
          <p className="text-muted-foreground mt-1">Real-time overview of all charging points</p>
        </div>
        <div className="flex items-center gap-4">
          <LiveIndicator />
          <span className="text-sm text-muted-foreground">
            Last: {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Station Overview */}
      <StationOverviewCard chargers={chargers} />

      {/* Power Flow */}
      <PowerFlowCard chargers={chargers} />

      {/* Charging Points */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Charging Points</h2>
        {chargers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chargers.map((charger) => (
              <ChargerCard
                key={charger.station.id}
                charger={charger}
                onViewDetails={handleViewDetails}
                onStopSession={handleStopSession}
              />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <Plug className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No charging stations found</p>
          </Card>
        )}
      </div>

      {/* Session Detail Modal */}
      <SessionDetailModal
        charger={selectedCharger}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onStopSession={handleStopSession}
      />
    </div>
  );
}
