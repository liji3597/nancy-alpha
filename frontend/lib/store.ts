import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Notification {
  id: string
  type: 'trader' | 'whale' | 'market' | 'warning'
  message: string
  timestamp: Date
  read: boolean
  link: string
}

interface AppState {
  followedTraders: string[]
  subscribedMarkets: string[]
  notifications: Notification[]
  followTrader: (address: string) => void
  unfollowTrader: (address: string) => void
  subscribeMarket: (slug: string) => void
  unsubscribeMarket: (slug: string) => void
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markNotificationRead: (id: string) => void
  clearNotifications: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      followedTraders: [],
      subscribedMarkets: [],
      notifications: [],
      followTrader: (address) =>
        set((state) => ({
          followedTraders: [...new Set([...state.followedTraders, address])],
        })),
      unfollowTrader: (address) =>
        set((state) => ({
          followedTraders: state.followedTraders.filter((a) => a !== address),
        })),
      subscribeMarket: (slug) =>
        set((state) => ({
          subscribedMarkets: [...new Set([...state.subscribedMarkets, slug])],
        })),
      unsubscribeMarket: (slug) =>
        set((state) => ({
          subscribedMarkets: state.subscribedMarkets.filter((s) => s !== slug),
        })),
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            {
              ...notification,
              id: Math.random().toString(36).slice(2),
              timestamp: new Date(),
              read: false,
            },
            ...state.notifications,
          ].slice(0, 50), // Keep only last 50 notifications
        })),
      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: 'polymarket-insider-storage',
    }
  )
)
