import { useState } from "react";
import { MapPin, Plug, Wifi, WifiOff, Zap, Check, ChevronDown } from "lucide-react";
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
import { cn } from "@/lib/utils";

interface StationSelectorProps {
  selectedStation: Station | null;
  onSelectStation: (station: Station) => void;
}

function StationCard({
  station,
  isSelected,
  onSelect,
}: {
  station: Station;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const isAvailable = station.status === "available";
  const isInUse = station.status === "in_use";

  return (
    <button
      onClick={onSelect}
      disabled={!isAvailable && !isInUse}
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
                : isInUse
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
                  : isInUse
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
          <Badge
            variant={
              isAvailable ? "default" : isInUse ? "secondary" : "outline"
            }
            className={cn(
              isAvailable && "bg-secondary text-secondary-foreground",
              isInUse && "bg-accent text-accent-foreground"
            )}
          >
            {isAvailable ? (
              <>
                <Wifi className="h-3 w-3 mr-1" />
                Available
              </>
            ) : isInUse ? (
              "In Use"
            ) : station.status === "maintenance" ? (
              "Maintenance"
            ) : (
              <>
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </>
            )}
          </Badge>
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

  const handleSelect = (station: Station) => {
    onSelectStation(station);
    setOpen(false);
  };

  const availableStations =
    stations?.filter((s) => s.status === "available" || s.status === "in_use") ||
    [];

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
              ) : availableStations.length > 0 ? (
                availableStations.map((station) => (
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
