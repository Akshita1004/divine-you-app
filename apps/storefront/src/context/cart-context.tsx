"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CartItem {
  id: string;
  name: string;
  size: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  isCartOpen: boolean;
  addToCart: (product: any, quantityToAdd?: number, openDrawer?: boolean) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  subtotal: number;
  totalCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Restore persistent cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("divine_cart");
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (err) {
      console.error("Error restoring cart from localStorage:", err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Listen for clear cart event from AuthContext during logout
  useEffect(() => {
    const handleClear = () => {
      setCart([]);
      localStorage.removeItem("divine_cart");
    };

    window.addEventListener("clear-cart-event", handleClear);
    return () => window.removeEventListener("clear-cart-event", handleClear);
  }, []);

  // Save cart changes to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("divine_cart", JSON.stringify(cart));
    }
  }, [cart, isLoaded]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  // Global addToCart - supports custom quantity and optional openDrawer control
  const addToCart = (
    product: any,
    quantityToAdd: number = 1,
    openDrawer: boolean = true
  ) => {
    const productId = String(product.id || Date.now());

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === productId);
      if (existing) {
        return prevCart.map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity + quantityToAdd }
            : item
        );
      }
      return [
        ...prevCart,
        {
          id: productId,
          name: product.title || product.name || "Ayurvedic Herbal Product",
          size: product.weight || product.size || "100 g",
          price:
            typeof product.price === "number"
              ? product.price
              : parseFloat(String(product.price).replace(/[^0-9.]/g, "")) || 999,
          image: product.image || "/images/products/placeholder.jpg",
          quantity: quantityToAdd,
        },
      ];
    });

    // Sirf tabhi drawer khulega agar openDrawer true ho
    if (openDrawer) {
      setIsCartOpen(true);
    }
  };

  const removeFromCart = (id: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setCart([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("divine_cart");
    }
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        openCart,
        closeCart,
        subtotal,
        totalCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}