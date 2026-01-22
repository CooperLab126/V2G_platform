import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Transaction {
  id: string;
  user_id: string;
  session_id: string | null;
  type: "v2g_earning" | "charging_cost";
  amount: number;
  energy_kwh: number | null;
  duration: string | null;
  status: "pending" | "completed" | "failed";
  created_at: string;
}

export function useTransactions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await (supabase as any)
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!user,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (
      transaction: Omit<Transaction, "id" | "user_id" | "created_at">
    ) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await (supabase as any)
        .from("transactions")
        .insert({
          ...transaction,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useTodayEarnings() {
  const { data: transactions } = useTransactions();
  
  const today = new Date().toISOString().split("T")[0];
  
  return transactions
    ?.filter((t) => t.type === "v2g_earning" && t.created_at.startsWith(today))
    .reduce((sum, t) => sum + t.amount, 0) || 0;
}

export function useTotalBalance() {
  const { data: transactions } = useTransactions();
  
  return transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
}
