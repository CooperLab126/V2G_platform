import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEffect } from "react";

export interface ChargingSession {
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
}

export function useSessions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["sessions", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await (supabase as any)
        .from("sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ChargingSession[];
    },
    enabled: !!user,
  });
}

export function useActiveSession() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["activeSession", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await (supabase as any)
        .from("sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as ChargingSession | null;
    },
    enabled: !!user,
    refetchInterval: (query) => (query.state.data ? 1000 : false), // Refetch every second if active session
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("sessions-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sessions",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["activeSession", user.id] });
          queryClient.invalidateQueries({ queryKey: ["sessions", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return query;
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (
      session: Omit<ChargingSession, "id" | "user_id" | "created_at" | "updated_at">
    ) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await (supabase as any)
        .from("sessions")
        .insert({
          ...session,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["activeSession"] });
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ChargingSession> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from("sessions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["activeSession"] });
    },
  });
}
