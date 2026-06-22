import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const CART_KEY = 'farm2home_cart';

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.qty, 0),
    [cart]
  );

  const addToCart = (productId, maxQty) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === productId);
      const currentQty = existing?.qty || 0;
      if (maxQty != null && currentQty >= maxQty) return prev;
      if (existing) {
        return prev.map((item) =>
          item.id === productId ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { id: productId, qty: 1 }];
    });
  };

  const updateQty = (productId, delta, maxQty) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id !== productId) return item;
          const nextQty = item.qty + delta;
          if (maxQty != null && nextQty > maxQty) return item;
          return { ...item, qty: nextQty };
        })
        .filter((item) => item.qty > 0)
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const clearCart = () => setCart([]);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const value = {
    cart,
    cartCount,
    isOpen,
    addToCart,
    updateQty,
    removeFromCart,
    clearCart,
    openCart,
    closeCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
