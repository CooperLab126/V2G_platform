import { useState, useMemo } from "react";
import { MapPin, Plug, Wifi, WifiOff, Zap, Check, ChevronDown, BatteryCharging, ArrowUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useStations, Station } from "@/hooks/useStations";
import { useAllActiveSessions } from "@/hooks/useAllSessions";
import { cn } from "@/lib/utils";

interface StationSelectorProps {
  selectedStation: Station | null;
  onSelectStation: (station: Station) => void;
}

type StationStatus = "available" | "charging" | "v2g" | "offline" | "maintenance";

interface EnrichedStation extends Station {
  computedStatus: StationStatus;
}

function StationCard({
  station,
  isSelected,
  onSelect,
}: {
  station: EnrichedStation;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const isAvailable = station.computedStatus === "available";
  const isCharging = station.computedStatus === "charging";
  const isV2G = station.computedStatus === "v2g";
  const isInUse = isCharging || isV2G;
  const isOffline = station.computedStatus === "offline" || station.computedStatus === "maintenance";

  const getStatusBadge = () => {
    if (isAvailable) {
      return (
        <Badge className="bg-secondary text-secondary-foreground">
          <Wifi className="h-3 w-3 mr-1" />
          Available
        </Badge>
      );
    }
    if (isCharging) {
      return (
        <Badge className="bg-secondary/80 text-secondary-foreground">
          <BatteryCharging className="h-3 w-3 mr-1" />
          Charging
        </Badge>
      );
    }
    if (isV2G) {
      return (
        <Badge className="bg-accent text-accent-foreground">
          <ArrowUp className="h-3 w-3 mr-1" />
          V2G Active
        </Badge>
      );
    }
    if (station.computedStatus === "maintenance") {
      return <Badge variant="outline">Maintenance</Badge>;
    }
    return (
      <Badge variant="destructive">
        <WifiOff className="h-3 w-3 mr-1" />
        Offline
      </Badge>
    );
  };

  return (
    <button
      onClick={onSelect}
      disabled={isOffline}
      className={cn(
        "w-full p-4 rounded-xl border-2 text-left transition-all",
        isSelected
          ? "border-secondary bg-secondary/10"
          : isAvailable || isInUse
          ? "border-border bg-card hover:border-secondary/50"
          : "border-border bg-muted/50 opacity-50 cursor-not-allowed"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl",
              isSelected
                ? "bg-secondary/20"
                : isAvailable
                ? "bg-primary/10"
                : isCharging
                ? "bg-secondary/10"
                : isV2G
                ? "bg-accent/10"
                : "bg-muted"
            )}
          >
            <Plug
              className={cn(
                "h-6 w-6",
                isSelected
                  ? "text-secondary"
                  : isAvailable
                  ? "text-primary"
                  : isCharging
                  ? "text-secondary"
                  : isV2G
                  ? "text-accent"
                  : "text-muted-foreground"
              )}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{station.id}</span>
              {isSelected && <Check className="h-4 w-4 text-secondary" />}
            </div>
            <p className="text-sm text-muted-foreground">{station.name}</p>
            {station.distance !== null && (
              <p className="text-xs text-muted-foreground mt-1">
                <MapPin className="inline h-3 w-3 mr-1" />
                {station.distance} km away
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {getStatusBadge()}
          {station.v2g_capable && (
            <Badge variant="outline" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              V2G
            </Badge>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span>AC: {station.max_power_ac || 0} kW</span>
        {station.max_power_dc && <span>DC: {station.max_power_dc} kW</span>}
        <span className="text-primary">
          {station.connectors?.join(", ") || "CCS2"}
        </span>
      </div>
    </button>
  );
}

export function StationSelector({
  selectedStation,
  onSelectStation,
}: StationSelectorProps) {
  const [open, setOpen] = useState(false);
  const { data: stations, isLoading } = useStations();
  const { data: activeSessions } = useAllActiveSessions();

  // Compute station status based on active sessions
  const enrichedStations = useMemo<EnrichedStation[]>(() => {
    if (!stations) return [];
    
    return stations.map(station => {
      // Check if station is offline/maintenance in DB
      if (station.status === "offline") {
        return { ...station, computedStatus: "offline" as StationStatus };
      }
      if (station.status === "maintenance") {
        return { ...station, computedStatus: "maintenance" as StationStatus };
      }

      // Check for active session at this station
      const activeSession = activeSessions?.find(s => s.station_id === station.id);
      if (activeSession) {
        const sessionMode = activeSession.mode === "v2g" ? "v2g" : "charging";
        return { ...station, computedStatus: sessionMode as StationStatus };
      }

      // Otherwise it's available
      return { ...station, computedStatus: "available" as StationStatus };
    });
  }, [stations, activeSessions]);

  const handleSelect = (station: EnrichedStation) => {
    onSelectStation(station);
    setOpen(false);
  };

  const selectableStations = enrichedStations.filter(
    (s) => s.computedStatus !== "offline" && s.computedStatus !== "maintenance"
  );

  return (
    <Card className="border-2 border-dashed border-muted">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Charging Point
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between h-auto py-3"
            >
              {selectedStation ? (
                <div className="flex items-center gap-3 text-left">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/20">
                    <Plug className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedStation.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedStation.name}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Plug className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <span className="text-muted-foreground">
                    Select a charging point
                  </span>
                </div>
              )}
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Select Charging Point</DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : selectableStations.length > 0 ? (
                selectableStations.map((station) => (
                  <StationCard
                    key={station.id}
                    station={station}
                    isSelected={selectedStation?.id === station.id}
                    onSelect={() => handleSelect(station)}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Plug className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No available stations</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {selectedStation && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline">
              AC: {selectedStation.max_power_ac || 0} kW
            </Badge>
            {selectedStation.max_power_dc && (
              <Badge variant="outline">DC: {selectedStation.max_power_dc} kW</Badge>
            )}
            {selectedStation.v2g_capable && (
              <Badge
                variant="secondary"
                className="bg-accent/10 text-accent border-accent/30"
              >
                <Zap className="h-3 w-3 mr-1" />
                V2G Ready
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
