import { products as localProducts, type Product } from "@/data/products";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export type ProductInput = Omit<Product, "id" | "collection" | "reviews" | "specifications"> & {
  slug?: string;
  old_price?: number;
  image_url?: string;
};

type DatabaseProduct = {
  id: string;
  name: string;
  slug?: string;
  category: string;
  brand: string;
  description: string;
  price: number;
  old_price?: number;
  discount: number;
  image_url?: string;
  stock: number;
  rating: number;
  reviews?: number;
  created_at?: string;
};

function toProduct(row: DatabaseProduct): Product {
  return { ...row, image: row.image_url ?? "", oldPrice: row.old_price ?? row.price, reviews: row.reviews ?? 0, specifications: [], collection: "recommended" };
}

export async function getProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured || !supabase) return localProducts;
  const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as DatabaseProduct[]).map(toProduct);
}

export async function getProductById(id: string): Promise<Product | null> {
  if (!isSupabaseConfigured || !supabase) return localProducts.find((product) => product.id === id) ?? null;
  const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toProduct(data as DatabaseProduct) : null;
}

export async function addProduct(input: ProductInput) {
  if (!supabase) throw new Error("Supabase is not configured");
  const { oldPrice, old_price, image, image_url, ...productInput } = input;
  const { data, error } = await supabase.from("products").insert({ ...productInput, old_price: old_price ?? oldPrice, image_url: image_url ?? image }).select().single();
  if (error) throw new Error(error.message);
  return toProduct(data as DatabaseProduct);
}

export async function updateProduct(id: string, input: Partial<ProductInput>) {
  if (!supabase) throw new Error("Supabase is not configured");
  const { oldPrice, old_price, image, image_url, ...productInput } = input;
  const { data, error } = await supabase.from("products").update({ ...productInput, ...(oldPrice !== undefined || old_price !== undefined ? { old_price: old_price ?? oldPrice } : {}), ...(image !== undefined || image_url !== undefined ? { image_url: image_url ?? image } : {}) }).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return toProduct(data as DatabaseProduct);
}

export async function deleteProduct(id: string) {
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function uploadProductImage(file: File) {
  if (!supabase) throw new Error("Supabase is not configured");
  const extension = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}