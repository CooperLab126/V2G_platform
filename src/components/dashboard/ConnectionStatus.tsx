import { MapPin, Plug, Car } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/appStore";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function ConnectionStatus() {
  const { currentSession } = useAppStore();
  const isConnected = !!currentSession;

  return (
    <Card
      className={cn(
        "border-2 transition-colors",
        isConnected
          ? "border-secondary bg-secondary/5"
          : "border-dashed border-muted bg-muted/20"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl",
                isConnected ? "bg-secondary/20" : "bg-muted/50"
              )}
            >
              {isConnected ? (
                <Plug className="h-6 w-6 text-secondary" />
              ) : (
                <Car className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <p
                className={cn(
                  "font-semibold",
                  isConnected ? "text-secondary" : "text-muted-foreground"
                )}
              >
                {isConnected ? "Connected" : "Not Connected"}
              </p>
              {isConnected ? (
                <p className="text-sm text-muted-foreground">
                  Station {currentSession.stationId}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Find a station to connect
                </p>
              )}
            </div>
          </div>
          {!isConnected && (
            <Button variant="outline" size="sm" asChild>
              <Link to="/stations">
                <MapPin className="h-4 w-4 mr-2" />
                Find Station
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
