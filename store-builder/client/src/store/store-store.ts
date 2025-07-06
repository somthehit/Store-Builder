import { create } from "zustand";
import { type Store } from "@shared/schema";

interface StoreState {
  stores: Store[];
  selectedStore: Store | null;
  isLoading: boolean;
  setStores: (stores: Store[]) => void;
  setSelectedStore: (store: Store | null) => void;
  addStore: (store: Store) => void;
  updateStore: (id: number, updates: Partial<Store>) => void;
  removeStore: (id: number) => void;
  setLoading: (loading: boolean) => void;
}

export const useStoreStore = create<StoreState>((set) => ({
  stores: [],
  selectedStore: null,
  isLoading: false,
  setStores: (stores) => set({ stores }),
  setSelectedStore: (store) => set({ selectedStore: store }),
  addStore: (store) => set((state) => ({ stores: [...state.stores, store] })),
  updateStore: (id, updates) => set((state) => ({
    stores: state.stores.map((store) =>
      store.id === id ? { ...store, ...updates } : store
    ),
  })),
  removeStore: (id) => set((state) => ({
    stores: state.stores.filter((store) => store.id !== id),
  })),
  setLoading: (loading) => set({ isLoading: loading }),
}));
