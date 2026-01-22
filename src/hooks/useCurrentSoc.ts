import { useState, useEffect, useCallback } from "react";
import { useActiveSession, useUpdateSession } from "./useSessions";
import { useCreateTransaction } from "./useTransactions";
import { usePricing, defaultPricing } from "./usePricing";

const STORAGE_KEY = "current_soc";

export function useCurrentSoc() {
  // Load initial SOC from localStorage or default to 72
  const [currentSoc, setCurrentSoc] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? parseInt(stored, 10) : 72;
  });

  const { data: activeSession } = useActiveSession();
  const { data: pricing } = usePricing();
  const updateSession = useUpdateSession();
  const createTransaction = useCreateTransaction();

  const rate = pricing || defaultPricing;

  // Persist SOC to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, currentSoc.toString());
  }, [currentSoc]);

  // Simulate charging/V2G when there's an active session
  useEffect(() => {
    if (!activeSession || activeSession.status !== "active") return;

    const interval = setInterval(() => {
      if (activeSession.mode === "charging") {
        // Charging: increase SOC
        const targetSoc = activeSession.target_soc || 100;
        
        if (currentSoc >= targetSoc) {
          // Session complete
          completeSession(activeSession.id, currentSoc, activeSession);
          return;
        }

        // Increase SOC by ~1% per second (simulated fast charging)
        const newSoc = Math.min(currentSoc + 1, targetSoc);
        const energyAdded = (1 / 100) * 60; // 1% of 60kWh battery
        
        setCurrentSoc(newSoc);
        
        // Update session energy and amount
        updateSession.mutate({
          id: activeSession.id,
          energy_kwh: activeSession.energy_kwh + energyAdded,
          amount: activeSession.amount - energyAdded * rate.buy_rate,
        });
      } else if (activeSession.mode === "v2g") {
        // V2G: decrease SOC
        const minSoc = activeSession.min_soc || 20;
        
        if (currentSoc <= minSoc) {
          // Session complete
          completeSession(activeSession.id, currentSoc, activeSession);
          return;
        }

        // Decrease SOC by ~0.5% per second (simulated V2G)
        const newSoc = Math.max(currentSoc - 0.5, minSoc);
        const energySold = (0.5 / 100) * 60; // 0.5% of 60kWh battery
        
        setCurrentSoc(Math.round(newSoc));
        
        // Update session energy and amount
        updateSession.mutate({
          id: activeSession.id,
          energy_kwh: activeSession.energy_kwh + energySold,
          amount: activeSession.amount + energySold * rate.sell_rate,
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession, currentSoc, rate]);

  const completeSession = useCallback(
    async (
      sessionId: string,
      endSoc: number,
      session: NonNullable<typeof activeSession>
    ) => {
      const duration = getSessionDuration(session.start_time);
      
      // Update session to completed
      await updateSession.mutateAsync({
        id: sessionId,
        status: "completed",
        end_time: new Date().toISOString(),
        end_soc: endSoc,
      });

      // Create transaction
      await createTransaction.mutateAsync({
        session_id: sessionId,
        type: session.mode === "charging" ? "charging_cost" : "v2g_earning",
        amount: session.amount,
        energy_kwh: session.energy_kwh,
        duration,
        status: "completed",
      });
    },
    [updateSession, createTransaction]
  );

  const setSoc = useCallback((soc: number) => {
    setCurrentSoc(Math.max(0, Math.min(100, soc)));
  }, []);

  return { currentSoc, setSoc };
}

function getSessionDuration(startTime: string): string {
  const start = new Date(startTime);
  const now = new Date();
  const diff = now.getTime() - start.getTime();
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
