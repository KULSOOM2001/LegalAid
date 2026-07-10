import { create } from 'zustand';
import type { AppNotification } from '../types';

interface NotificationState {
  items: AppNotification[];
  push: (n: AppNotification) => void;
  setAll: (items: AppNotification[]) => void;
  markRead: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  items: [],
  push: (n) => set((s) => ({ items: [n, ...s.items] })),
  setAll: (items) => set({ items }),
  markRead: (id) => set((s) => ({ items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
}));
