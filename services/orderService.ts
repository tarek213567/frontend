import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export type OrderInput = { customer_name: string; phone: string; address: string; products: { id: string; name: string; quantity: number; price: number }[]; total_amount: number; payment_method: "cod" | "bkash" | "nagad" };
export type Order = OrderInput & { id: string; status: "Pending" | "Confirmed" | "Shipped" | "Delivered" | "Cancelled"; created_at: string };

export async function createOrder(input: OrderInput) {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase.from("orders").insert({ ...input, status: "Pending" }).select().single();
  if (error) throw new Error(error.message);
  return data as Order;
}

export async function getOrders(): Promise<Order[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as Order[];
}