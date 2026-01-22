import { useState, useEffect, useCallback, useRef } from "react";
import { useActiveSession, useUpdateSession, ChargingSession } from "./useSessions";
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

  // Use refs to avoid stale closures
  const sessionRef = useRef(activeSession);
  const rateRef = useRef(rate);
  
  useEffect(() => {
    sessionRef.current = activeSession;
    rateRef.current = rate;
  }, [activeSession, rate]);

  // Persist SOC to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, currentSoc.toString());
  }, [currentSoc]);

  const completeSession = useCallback(
    async (
      sessionId: string,
      endSoc: number,
      session: ChargingSession
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

  // Simulate charging/V2G when there's an active session
  useEffect(() => {
    if (!activeSession || activeSession.status !== "active") return;

    const interval = setInterval(() => {
      const session = sessionRef.current;
      const currentRate = rateRef.current;
      
      if (!session || session.status !== "active") {
        return;
      }

      setCurrentSoc((prevSoc) => {
        if (session.mode === "charging") {
          // Charging: increase SOC
          const targetSoc = session.target_soc || 100;
          
          if (prevSoc >= targetSoc) {
            // Session complete
            completeSession(session.id, prevSoc, session);
            return prevSoc;
          }

          // Increase SOC by ~1% per second (simulated fast charging)
          const newSoc = Math.min(prevSoc + 1, targetSoc);
          const energyAdded = (1 / 100) * 60; // 1% of 60kWh battery
          
          // Update session energy and amount
          updateSession.mutate({
            id: session.id,
            energy_kwh: session.energy_kwh + energyAdded,
            amount: session.amount - energyAdded * currentRate.buy_rate,
          });

          return newSoc;
        } else if (session.mode === "v2g") {
          // V2G: decrease SOC
          const minSoc = session.min_soc || 20;
          
          if (prevSoc <= minSoc) {
            // Session complete
            completeSession(session.id, prevSoc, session);
            return prevSoc;
          }

          // Decrease SOC by ~1% per second (simulated V2G)
          const newSoc = Math.max(prevSoc - 1, minSoc);
          const energySold = (1 / 100) * 60; // 1% of 60kWh battery
          
          // Update session energy and amount
          updateSession.mutate({
            id: session.id,
            energy_kwh: session.energy_kwh + energySold,
            amount: session.amount + energySold * currentRate.sell_rate,
          });

          return newSoc;
        }
        return prevSoc;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession?.id, activeSession?.status, completeSession, updateSession]);

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
