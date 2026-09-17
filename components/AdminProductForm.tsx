"use client";

import { Save } from "lucide-react";
import { useState } from "react";
import type { Product } from "@/data/products";
import { addProduct, updateProduct, uploadProductImage } from "@/services/productService";

const inputClass = "mt-2 w-full rounded-lg border border-[#dce8dc] bg-white px-3 py-3 text-sm outline-none focus:border-[#00843d]";

type AdminProductFormProps = { product?: Product };

export default function AdminProductForm({ product }: AdminProductFormProps) {
  const [status, setStatus] = useState("");
  async function handleSubmit(formData: FormData) {
    setStatus("Saving product...");
    const imageFile = formData.get("imageFile");
    const uploadedImage = imageFile instanceof File && imageFile.size > 0 ? await uploadProductImage(imageFile) : "";
    const input = { name: String(formData.get("name")), category: String(formData.get("category")), brand: String(formData.get("brand")), description: String(formData.get("description")), price: Number(formData.get("price")), oldPrice: Number(formData.get("oldPrice")), old_price: Number(formData.get("oldPrice")), discount: Number(formData.get("discount")), image: uploadedImage || String(formData.get("image")), stock: Number(formData.get("stock")), rating: product?.rating ?? 0 };
    try {
      if (product) await updateProduct(product.id, input);
      else await addProduct(input);
      setStatus(product ? "Product updated successfully." : "Product added successfully.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save product.");
    }
  }
  return <form action={handleSubmit} className="mt-8 grid gap-5 sm:grid-cols-2"><label className="text-sm font-bold">Product name<input name="name" required defaultValue={product?.name} className={inputClass} placeholder="Product name" /></label><label className="text-sm font-bold">Brand<input name="brand" required defaultValue={product?.brand} className={inputClass} placeholder="Brand name" /></label><label className="text-sm font-bold">Category<input name="category" required defaultValue={product?.category} className={inputClass} placeholder="Electronics" /></label><label className="text-sm font-bold">Image URL<input name="image" required={!(product?.image)} defaultValue={product?.image} className={inputClass} placeholder="/products/electronics.svg" /></label><label className="text-sm font-bold">Upload image<input name="imageFile" type="file" accept="image/*" className={inputClass} /></label><label className="text-sm font-bold">Price<input name="price" type="number" min="0" required defaultValue={product?.price} className={inputClass} placeholder="1990" /></label><label className="text-sm font-bold">Old price<input name="oldPrice" type="number" min="0" required defaultValue={product?.oldPrice} className={inputClass} placeholder="2490" /></label><label className="text-sm font-bold">Discount (%)<input name="discount" type="number" min="0" max="100" required defaultValue={product?.discount} className={inputClass} placeholder="20" /></label><label className="text-sm font-bold">Stock quantity<input name="stock" type="number" min="0" required defaultValue={product?.stock} className={inputClass} placeholder="25" /></label><label className="text-sm font-bold sm:col-span-2">Description<textarea name="description" required defaultValue={product?.description} className={`${inputClass} min-h-28`} placeholder="Describe the product" /></label><div className="sm:col-span-2"><button className="inline-flex items-center gap-2 rounded-lg bg-[#00843d] px-5 py-3 text-sm font-bold text-white hover:bg-[#006f33]"><Save className="h-4 w-4" /> {product ? "Update product" : "Add product"}</button>{status && <p role="status" className="mt-3 text-sm font-semibold text-[#52715a]">{status}</p>}</div></form>;
}
