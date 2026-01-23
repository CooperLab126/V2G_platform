import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface AllSession {
  id: string;
  user_id: string;
  vehicle_id: string | null;
  station_id: string | null;
  mode: "charging" | "v2g";
  status: "active" | "completed" | "cancelled";
  start_time: string;
  end_time: string | null;
  start_soc: number;
  end_soc: number | null;
  target_soc: number | null;
  min_soc: number | null;
  energy_kwh: number;
  amount: number;
  power_kw: number | null;
  created_at: string;
  updated_at: string;
  // Joined data
  profiles?: {
    name: string;
    email: string | null;
  };
  vehicles?: {
    brand: string;
    model: string;
    battery_capacity: number;
  };
}

// Hook to get all active sessions (for monitor page)
export function useAllActiveSessions() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["allActiveSessions"],
    queryFn: async () => {
      // First get active sessions
      const { data: sessions, error } = await (supabase as any)
        .from("sessions")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // For each session, try to get user profile and vehicle info
      const enrichedSessions = await Promise.all(
        (sessions || []).map(async (session: AllSession) => {
          // Get profile
          const { data: profile } = await (supabase as any)
            .from("profiles")
            .select("name, email")
            .eq("user_id", session.user_id)
            .maybeSingle();

          // Get vehicle if available
          let vehicle = null;
          if (session.vehicle_id) {
            const { data: vehicleData } = await (supabase as any)
              .from("vehicles")
              .select("brand, model, battery_capacity")
              .eq("id", session.vehicle_id)
              .maybeSingle();
            vehicle = vehicleData;
          }

          return {
            ...session,
            profiles: profile || { name: "Unknown User", email: null },
            vehicles: vehicle || { brand: "Unknown", model: "Vehicle", battery_capacity: 60 },
          };
        })
      );

      return enrichedSessions as AllSession[];
    },
    refetchInterval: 5000, // Refresh every 5 seconds for real-time feel
  });

  // Subscribe to realtime updates for all sessions
  useEffect(() => {
    const channel = supabase
      .channel("all-sessions-monitor")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sessions",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["allActiveSessions"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

// Get session count by station
export function useSessionCountByStation() {
  const { data: sessions } = useAllActiveSessions();
  
  const countByStation: Record<string, { charging: number; v2g: number }> = {};
  
  sessions?.forEach((session) => {
    const stationId = session.station_id || "unknown";
    if (!countByStation[stationId]) {
      countByStation[stationId] = { charging: 0, v2g: 0 };
    }
    if (session.mode === "charging") {
      countByStation[stationId].charging++;
    } else {
      countByStation[stationId].v2g++;
    }
  });

  return countByStation;
}
