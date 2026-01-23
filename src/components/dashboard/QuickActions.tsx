import { BatteryCharging, Zap, Square, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActiveSession, useUpdateSession } from "@/hooks/useSessions";
import { Link } from "react-router-dom";
import { Station } from "@/hooks/useStations";
import { toast } from "sonner";

interface QuickActionsProps {
  selectedStation?: Station | null;
}

export function QuickActions({ selectedStation }: QuickActionsProps) {
  const { data: activeSession } = useActiveSession();
  const updateSession = useUpdateSession();

  const isActive = !!activeSession;

  const handleStopSession = async () => {
    if (!activeSession) return;
    
    try {
      await updateSession.mutateAsync({
        id: activeSession.id,
        status: "cancelled",
        end_time: new Date().toISOString(),
      });
      toast.success("Session stopped successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to stop session");
    }
  };

  if (isActive) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          size="lg"
          className="h-14 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={handleStopSession}
          disabled={updateSession.isPending}
        >
          <Square className="h-5 w-5 mr-2" />
          Stop Session
        </Button>
        <Button variant="secondary" size="lg" className="h-14" asChild>
          <Link to="/control">
            <Zap className="h-5 w-5 mr-2" />
            View Details
          </Link>
        </Button>
      </div>
    );
  }

  // No station selected warning
  if (!selectedStation) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/10 border border-accent/30">
          <AlertCircle className="h-5 w-5 text-accent" />
          <p className="text-sm text-accent">Please select a charging point first</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button
            size="lg"
            className="h-14 bg-secondary text-secondary-foreground"
            disabled
          >
            <BatteryCharging className="h-5 w-5 mr-2" />
            Start Charging
          </Button>
          <Button
            size="lg"
            className="h-14 bg-accent text-accent-foreground"
            disabled
          >
            <Zap className="h-5 w-5 mr-2" />
            Start V2G
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <Button
        size="lg"
        className="h-14 bg-secondary text-secondary-foreground hover:bg-secondary/90"
        asChild
      >
        <Link to={`/control?mode=charging&station=${selectedStation.id}`}>
          <BatteryCharging className="h-5 w-5 mr-2" />
          Start Charging
        </Link>
      </Button>
      <Button
        size="lg"
        className="h-14 bg-accent text-accent-foreground hover:bg-accent/90"
        disabled={!selectedStation.v2g_capable}
        asChild={selectedStation.v2g_capable}
      >
        {selectedStation.v2g_capable ? (
          <Link to={`/control?mode=v2g&station=${selectedStation.id}`}>
            <Zap className="h-5 w-5 mr-2" />
            Start V2G
          </Link>
        ) : (
          <>
            <Zap className="h-5 w-5 mr-2" />
            V2G Not Available
          </>
        )}
      </Button>
    </div>
  );
}
