import { create } from 'zustand';

export type CartOption = { id: string; name: string; priceDelta: number };

export type CartItem = {
  key: string;
  productId: string;
  name: string;
  unitPrice: number; // precio base + opciones elegidas
  quantity: number;
  options: CartOption[];
};

type CartState = {
  businessId: string | null;
  businessName: string | null;
  items: CartItem[];
  addItem: (business: { id: string; name: string }, item: Omit<CartItem, 'key'>) => void;
  changeQuantity: (key: string, delta: number) => void;
  clear: () => void;
};

export const useCart = create<CartState>((set) => ({
  businessId: null,
  businessName: null,
  items: [],

  addItem: (business, item) =>
    set((state) => {
      // Si el carrito era de otro negocio, se empieza uno nuevo
      const current = state.businessId === business.id ? state.items : [];
      const key = `${item.productId}|${item.options.map((o) => o.name).sort().join(',')}`;
      const existing = current.find((i) => i.key === key);
      const items = existing
        ? current.map((i) => (i.key === key ? { ...i, quantity: i.quantity + item.quantity } : i))
        : [...current, { ...item, key }];
      return { businessId: business.id, businessName: business.name, items };
    }),

  changeQuantity: (key, delta) =>
    set((state) => {
      const items = state.items
        .map((i) => (i.key === key ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0);
      return items.length === 0
        ? { items, businessId: null, businessName: null }
        : { items };
    }),

  clear: () => set({ businessId: null, businessName: null, items: [] }),
}));

export const cartTotal = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

export const cartCount = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.quantity, 0);
