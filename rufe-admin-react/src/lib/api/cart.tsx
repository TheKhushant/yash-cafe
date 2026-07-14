import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
type Product = {
  _id: string;
  name: string;
  price: number;
};

type CartContextType = {
  items: Product[];
  count: number;
  add: (product: Product) => void;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Product[]>([]);

  const add = (product: Product) => {
    setItems((prev) => [...prev, product]);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        count: items.length,
        add,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}