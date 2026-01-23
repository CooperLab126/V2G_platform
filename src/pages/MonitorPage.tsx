import { useState, useEffect } from "react";
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
  X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStations } from "@/hooks/useStations";
import { useSessions } from "@/hooks/useSessions";
import { cn } from "@/lib/utils";

interface ChargerSession {
  id: string;
  user: string;
  vehicle: string;
  mode: "charging" | "v2g";
  powerKw: number;
  startSoc: number;
  currentSoc: number;
  targetSoc?: number;
  minSoc?: number;
  energyKwh: number;
  earnings?: number;
  duration: string;
  estimatedComplete?: string;
  startTime: string;
}

interface Charger {
  id: string;
  name: string;
  location: string;
  status: "charging" | "v2g" | "idle" | "fault" | "offline";
  online: boolean;
  maxPowerAc: number;
  maxPowerDc: number;
  connectors: string[];
  v2gCapable: boolean;
  session?: ChargerSession;
  lastSession?: string;
  totalSessions?: number;
  faultMessage?: string;
}

// Mock data for prototype - will be replaced with real data
const mockChargers: Charger[] = [
  {
    id: "CP-01",
    name: "Slot A",
    location: "Engineering Building",
    status: "charging",
    online: true,
    maxPowerAc: 22,
    maxPowerDc: 50,
    connectors: ["CCS2", "CHAdeMO"],
    v2gCapable: true,
    session: {
      id: "session-1",
      user: "Cooper L.",
      vehicle: "Tesla Model Y",
      mode: "charging",
      powerKw: 7.2,
      startSoc: 45,
      currentSoc: 58,
      targetSoc: 80,
      energyKwh: 8.4,
      duration: "32 min",
      estimatedComplete: "14:30",
      startTime: new Date().toISOString(),
    },
  },
  {
    id: "CP-02",
    name: "Slot B",
    location: "Engineering Building",
    status: "v2g",
    online: true,
    maxPowerAc: 22,
    maxPowerDc: 50,
    connectors: ["CCS2"],
    v2gCapable: true,
    session: {
      id: "session-2",
      user: "Dr. Chen",
      vehicle: "BYD Atto 3",
      mode: "v2g",
      powerKw: 11.5,
      startSoc: 85,
      currentSoc: 75,
      minSoc: 30,
      energyKwh: 14.2,
      earnings: 59.64,
      duration: "1h 15m",
      startTime: new Date().toISOString(),
    },
  },
  {
    id: "CP-03",
    name: "Slot C",
    location: "Engineering Building",
    status: "idle",
    online: true,
    maxPowerAc: 22,
    maxPowerDc: 50,
    connectors: ["CCS2", "CHAdeMO"],
    v2gCapable: true,
    lastSession: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    totalSessions: 24,
  },
];

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

function StationOverviewCard({ chargers }: { chargers: Charger[] }) {
  const stats = {
    total: chargers.length,
    charging: chargers.filter(c => c.status === "charging").length,
    v2g: chargers.filter(c => c.status === "v2g").length,
    idle: chargers.filter(c => c.status === "idle").length,
    fault: chargers.filter(c => c.status === "fault" || c.status === "offline").length,
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

function PowerFlowCard({ chargers }: { chargers: Charger[] }) {
  const gridImport = chargers
    .filter(c => c.status === "charging" && c.session)
    .reduce((sum, c) => sum + (c.session?.powerKw || 0), 0);
  
  const gridExport = chargers
    .filter(c => c.status === "v2g" && c.session)
    .reduce((sum, c) => sum + (c.session?.powerKw || 0), 0);
  
  const netPower = gridExport - gridImport;
  const isExporting = netPower > 0;
  const maxPower = 50; // max capacity for progress bar

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Total Power Flow</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Grid Import */}
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
          
          {/* Grid Export */}
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
        
        {/* Net Power */}
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
  charger: Charger; 
  onViewDetails: (charger: Charger) => void;
  onStopSession: (chargerId: string) => void;
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
          badgeVariant: "default" as const,
        };
      case "v2g":
        return {
          label: "V2G ACTIVE",
          icon: ArrowUp,
          color: "text-accent",
          bgColor: "bg-accent/10",
          borderColor: "border-accent/30",
          badgeVariant: "secondary" as const,
        };
      case "fault":
        return {
          label: "FAULT",
          icon: AlertTriangle,
          color: "text-destructive",
          bgColor: "bg-destructive/10",
          borderColor: "border-destructive/30",
          badgeVariant: "destructive" as const,
        };
      case "offline":
        return {
          label: "OFFLINE",
          icon: Circle,
          color: "text-muted-foreground",
          bgColor: "bg-muted",
          borderColor: "border-muted",
          badgeVariant: "outline" as const,
        };
      default:
        return {
          label: "IDLE",
          icon: Circle,
          color: "text-muted-foreground",
          bgColor: "bg-muted/50",
          borderColor: "border-border",
          badgeVariant: "outline" as const,
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  return (
    <Card className={cn("overflow-hidden border-2 transition-all hover:shadow-lg", config.borderColor)}>
      {/* Header */}
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{charger.id}</CardTitle>
            <p className="text-sm text-muted-foreground">{charger.location} - {charger.name}</p>
          </div>
          <Badge variant={charger.online ? "default" : "destructive"} className="gap-1">
            <span className={cn(
              "h-2 w-2 rounded-full",
              charger.online ? "bg-secondary animate-pulse" : "bg-destructive"
            )} />
            {charger.online ? "Online" : "Offline"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Display */}
        <div className={cn("flex flex-col items-center justify-center p-6 rounded-xl", config.bgColor)}>
          <StatusIcon className={cn("h-10 w-10 mb-2", config.color)} />
          <span className={cn("text-lg font-bold", config.color)}>
            {charger.session?.powerKw ? `${charger.session.powerKw} kW` : config.label}
          </span>
          {!charger.session && charger.status === "idle" && (
            <span className="text-sm text-muted-foreground">Available</span>
          )}
        </div>

        {/* Session Info */}
        {charger.session && (
          <>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{charger.session.user}</span>
              </div>
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-muted-foreground" />
                <span>{charger.session.vehicle}</span>
              </div>
            </div>

            {/* SOC Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Battery SOC</span>
                <span className="font-medium">{charger.session.currentSoc}%</span>
              </div>
              <div className="relative">
                <Progress 
                  value={charger.session.currentSoc} 
                  className="h-3"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{charger.session.startSoc}%</span>
                  <span>
                    {charger.session.mode === "charging" 
                      ? `→ ${charger.session.targetSoc}%` 
                      : `→ ${charger.session.minSoc}%`
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Session Stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-muted/50">
                <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Session</span>
                <p className="text-sm font-medium">{charger.session.duration}</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <Zap className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Energy</span>
                <p className="text-sm font-medium">{charger.session.energyKwh} kWh</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                {charger.session.mode === "v2g" ? (
                  <>
                    <Coins className="h-4 w-4 mx-auto mb-1 text-accent" />
                    <span className="text-xs text-muted-foreground">Earned</span>
                    <p className="text-sm font-medium text-accent">+฿{charger.session.earnings?.toFixed(0)}</p>
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Est. Done</span>
                    <p className="text-sm font-medium">{charger.session.estimatedComplete}</p>
                  </>
                )}
              </div>
            </div>

            <Button 
              variant="destructive" 
              className="w-full"
              onClick={() => onStopSession(charger.id)}
            >
              Stop Session
            </Button>
          </>
        )}

        {/* Idle State Info */}
        {charger.status === "idle" && !charger.session && (
          <>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max Power</span>
                <span>{charger.maxPowerAc} kW AC / {charger.maxPowerDc} kW DC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Connectors</span>
                <span>{charger.connectors.join(", ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">V2G</span>
                <span>{charger.v2gCapable ? "✓ Supported" : "✗ Not supported"}</span>
              </div>
            </div>
            
            {charger.lastSession && (
              <div className="text-sm text-muted-foreground">
                <p>Last Session: {new Date(charger.lastSession).toLocaleString()}</p>
                <p>Total Sessions: {charger.totalSessions}</p>
              </div>
            )}
            
            <Button variant="outline" className="w-full" onClick={() => onViewDetails(charger)}>
              View History
            </Button>
          </>
        )}

        {/* Fault State */}
        {charger.status === "fault" && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <p className="font-medium">Error: {charger.faultMessage || "Communication lost"}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">Retry</Button>
              <Button variant="destructive" className="flex-1">Report Issue</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SessionDetailModal({ 
  charger, 
  open, 
  onOpenChange 
}: { 
  charger: Charger | null; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  if (!charger?.session) return null;

  const session = charger.session;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Session Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Charger</span>
            <span className="font-medium">{charger.id} ({charger.name})</span>
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
              <span>{session.user}</span>
              <span className="text-muted-foreground">Vehicle</span>
              <span>{session.vehicle}</span>
            </div>
          </div>

          <hr className="border-border" />

          <div className="space-y-2">
            <h4 className="font-semibold">Session Information</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Mode</span>
              <span className="capitalize">{session.mode}</span>
              <span className="text-muted-foreground">Duration</span>
              <span>{session.duration}</span>
              <span className="text-muted-foreground">Current Power</span>
              <span>{session.powerKw} kW</span>
              <span className="text-muted-foreground">Energy Transferred</span>
              <span>{session.energyKwh} kWh</span>
            </div>
          </div>

          <hr className="border-border" />

          <div className="space-y-2">
            <h4 className="font-semibold">Battery Progress</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Start: {session.startSoc}%</span>
                <span>Current: {session.currentSoc}%</span>
                <span>Target: {session.mode === "charging" ? session.targetSoc : session.minSoc}%</span>
              </div>
              <Progress value={session.currentSoc} className="h-3" />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button variant="destructive" className="flex-1">
              Stop Session
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function MonitorPage() {
  const [chargers, setChargers] = useState<Charger[]>(mockChargers);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [selectedCharger, setSelectedCharger] = useState<Charger | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setChargers(prev => prev.map(charger => {
        if (charger.session) {
          // Simulate power fluctuation
          const powerFluctuation = (Math.random() - 0.5) * 0.6;
          const newPower = Math.max(0.1, (charger.session.powerKw || 0) + powerFluctuation);
          
          // Simulate SOC change
          let newSoc = charger.session.currentSoc;
          if (charger.session.mode === "charging") {
            newSoc = Math.min(charger.session.targetSoc || 100, newSoc + 0.5);
          } else {
            newSoc = Math.max(charger.session.minSoc || 20, newSoc - 0.5);
          }

          return {
            ...charger,
            session: {
              ...charger.session,
              powerKw: Math.round(newPower * 10) / 10,
              currentSoc: Math.round(newSoc),
              energyKwh: Math.round((charger.session.energyKwh + 0.02) * 100) / 100,
              earnings: charger.session.earnings ? charger.session.earnings + 0.1 : undefined,
            },
          };
        }
        return charger;
      }));
      setLastUpdated(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleViewDetails = (charger: Charger) => {
    setSelectedCharger(charger);
    setDetailModalOpen(true);
  };

  const handleStopSession = (chargerId: string) => {
    setChargers(prev => prev.map(charger => {
      if (charger.id === chargerId) {
        return {
          ...charger,
          status: "idle" as const,
          session: undefined,
          lastSession: new Date().toISOString(),
          totalSessions: (charger.totalSessions || 0) + 1,
        };
      }
      return charger;
    }));
  };

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chargers.map(charger => (
            <ChargerCard
              key={charger.id}
              charger={charger}
              onViewDetails={handleViewDetails}
              onStopSession={handleStopSession}
            />
          ))}
        </div>
      </div>

      {/* Session Detail Modal */}
      <SessionDetailModal
        charger={selectedCharger}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
      />
    </div>
  );
}
