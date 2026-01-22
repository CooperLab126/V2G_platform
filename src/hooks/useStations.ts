import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Station {
  id: string;
  name: string;
  status: "available" | "in_use" | "offline" | "maintenance";
  max_power_ac: number | null;
  max_power_dc: number | null;
  connectors: string[];
  v2g_capable: boolean;
  distance: number | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

export function useStations() {
  return useQuery({
    queryKey: ["stations"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("stations")
        .select("*")
        .order("distance", { ascending: true });

      if (error) throw error;
      return data as Station[];
    },
  });
}

export function useAvailableStations() {
  const { data: stations } = useStations();
  return stations?.filter((s) => s.status === "available") || [];
}

export function useV2GStations() {
  const { data: stations } = useStations();
  return stations?.filter((s) => s.v2g_capable && s.status === "available") || [];
}
