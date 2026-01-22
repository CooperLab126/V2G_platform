import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Pricing {
  id: string;
  buy_rate: number;
  sell_rate: number;
  currency: string;
  unit: string;
  effective_from: string;
  effective_until: string | null;
  created_at: string;
}

export function usePricing() {
  return useQuery({
    queryKey: ["pricing"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("pricing")
        .select("*")
        .order("effective_from", { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data as Pricing;
    },
  });
}

// Default pricing for fallback
export const defaultPricing: Omit<Pricing, "id" | "created_at" | "effective_from" | "effective_until"> = {
  buy_rate: 2.8,
  sell_rate: 4.2,
  currency: "NT$",
  unit: "kWh",
};
