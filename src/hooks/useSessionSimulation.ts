import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/appStore";

export function useSessionSimulation() {
  const { currentSession, currentSoc, updateSoc, setCurrentSession, addTransaction } = useAppStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (currentSession && currentSession.status === "active") {
      intervalRef.current = setInterval(() => {
        const store = useAppStore.getState();
        const session = store.currentSession;
        const soc = store.currentSoc;

        if (!session) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return;
        }

        if (session.mode === "charging") {
          // Charging: increase SOC
          const targetSoc = session.targetSoc || 100;
          if (soc < targetSoc) {
            const newSoc = Math.min(soc + 1, targetSoc);
            store.updateSoc(newSoc);
            
            // Update session energy
            const energyAdded = 0.6; // ~0.6 kWh per 1% for 60kWh battery
            store.setCurrentSession({
              ...session,
              currentSoc: newSoc,
              energyKwh: session.energyKwh + energyAdded,
              currentAmount: session.currentAmount + (energyAdded * 2.8), // buy rate
            });

            // Auto-stop when target reached
            if (newSoc >= targetSoc) {
              store.setCurrentSession(null);
              store.addTransaction({
                id: `TXN-${Date.now()}`,
                type: "charging_cost",
                amount: -(session.energyKwh + energyAdded) * 2.8,
                date: new Date().toISOString(),
                sessionId: session.id,
                energyKwh: session.energyKwh + energyAdded,
                duration: getSessionDuration(session.startTime),
                status: "completed",
              });
            }
          }
        } else if (session.mode === "v2g") {
          // V2G: decrease SOC
          const minSoc = session.minSoc || 20;
          if (soc > minSoc) {
            const newSoc = Math.max(soc - 1, minSoc);
            store.updateSoc(newSoc);
            
            // Update session energy
            const energySold = 0.6; // ~0.6 kWh per 1% for 60kWh battery
            store.setCurrentSession({
              ...session,
              currentSoc: newSoc,
              energyKwh: session.energyKwh + energySold,
              currentAmount: session.currentAmount + (energySold * 4.2), // sell rate
            });

            // Auto-stop when minimum reached
            if (newSoc <= minSoc) {
              store.setCurrentSession(null);
              store.addTransaction({
                id: `TXN-${Date.now()}`,
                type: "v2g_earning",
                amount: (session.energyKwh + energySold) * 4.2,
                date: new Date().toISOString(),
                sessionId: session.id,
                energyKwh: session.energyKwh + energySold,
                duration: getSessionDuration(session.startTime),
                status: "completed",
              });
            }
          }
        }
      }, 1000); // Update every second for demo purposes
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentSession?.id, currentSession?.status]);
}

function getSessionDuration(startTime: string): string {
  const start = new Date(startTime);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}
