import { BatteryCharging, Zap, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/appStore";
import { Link } from "react-router-dom";

export function QuickActions() {
  const { currentSession, setCurrentSession } = useAppStore();
  const isActive = !!currentSession;

  const handleStopSession = () => {
    setCurrentSession(null);
  };

  if (isActive) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          size="lg"
          className="h-14 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={handleStopSession}
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

  return (
    <div className="grid grid-cols-2 gap-3">
      <Button
        size="lg"
        className="h-14 bg-secondary text-secondary-foreground hover:bg-secondary/90"
        asChild
      >
        <Link to="/control?mode=charging">
          <BatteryCharging className="h-5 w-5 mr-2" />
          Start Charging
        </Link>
      </Button>
      <Button
        size="lg"
        className="h-14 bg-accent text-accent-foreground hover:bg-accent/90"
        asChild
      >
        <Link to="/control?mode=v2g">
          <Zap className="h-5 w-5 mr-2" />
          Start V2G
        </Link>
      </Button>
    </div>
  );
}
