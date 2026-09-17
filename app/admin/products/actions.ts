"use server";

import { revalidatePath } from "next/cache";
import { deleteProduct } from "@/services/productService";

export async function removeProduct(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;
  await deleteProduct(id);
  revalidatePath("/admin/products");
  revalidatePath("/");
}