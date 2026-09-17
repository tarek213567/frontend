"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Product } from "@/data/products";

export type CartItem = { product: Product; quantity: number };

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  increaseQuantity: (productId: string) => void;
  decreaseQuantity: (productId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const storageKey = "nexobd-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const loadedRef = useRef(false);

  useEffect(() => {
    const savedCart = window.localStorage.getItem(storageKey);
    const restoreTimer = window.setTimeout(() => {
      if (savedCart) {
        try {
          setItems(JSON.parse(savedCart) as CartItem[]);
        } catch {
          window.localStorage.removeItem(storageKey);
        }
      }
      loadedRef.current = true;
    }, 0);
    return () => window.clearTimeout(restoreTimer);
  }, []);

  useEffect(() => {
    if (loadedRef.current) window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: items.reduce((total, item) => total + item.product.price * item.quantity, 0),
    addToCart: (product) => setItems((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (existing) return current.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...current, { product, quantity: 1 }];
    }),
    removeFromCart: (productId) => setItems((current) => current.filter((item) => item.product.id !== productId)),
    increaseQuantity: (productId) => setItems((current) => current.map((item) => item.product.id === productId ? { ...item, quantity: item.quantity + 1 } : item)),
    decreaseQuantity: (productId) => setItems((current) => current.flatMap((item) => item.product.id !== productId ? [item] : item.quantity > 1 ? [{ ...item, quantity: item.quantity - 1 }] : [])),
    clearCart: () => setItems([]),
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}