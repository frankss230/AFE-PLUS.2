import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';


interface User {
  id: number;
  username?: string;
  firstName: string;
  lastName: string;
  lineId?: string;
  statusId: number;
}

interface Caregiver {
  id: number;
  firstName: string;
  lastName: string;
  userId: number;
}


interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isAuthenticated: false,
        setUser: (user) => set({ user, isAuthenticated: !!user }),
        logout: () => set({ user: null, isAuthenticated: false }),
      }),
      { name: 'auth-storage' }
    )
  )
);


interface ModalState {
  isOpen: boolean;
  type: 'alert' | 'confirm' | 'form' | null;
  title: string;
  content: string;
  data?: any;
  onConfirm?: () => void;
  onCancel?: () => void;
  openModal: (config: {
    type: 'alert' | 'confirm' | 'form';
    title: string;
    content: string;
    data?: any;
    onConfirm?: () => void;
    onCancel?: () => void;
  }) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalState>()(
  devtools((set) => ({
    isOpen: false,
    type: null,
    title: '',
    content: '',
    data: undefined,
    onConfirm: undefined,
    onCancel: undefined,
    openModal: (config) =>
      set({
        isOpen: true,
        type: config.type,
        title: config.title,
        content: config.content,
        data: config.data,
        onConfirm: config.onConfirm,
        onCancel: config.onCancel,
      }),
    closeModal: () =>
      set({
        isOpen: false,
        type: null,
        title: '',
        content: '',
        data: undefined,
        onConfirm: undefined,
        onCancel: undefined,
      }),
  }))
);


interface AlertItem {
  id: string;
  type: 'safezone' | 'heartrate' | 'temperature' | 'fall' | 'battery' | 'sos';
  caregiverId: number;
  message: string;
  timestamp: Date;
  isRead: boolean;
}

interface AlertState {
  alerts: AlertItem[];
  unreadCount: number;
  addAlert: (alert: AlertItem) => void;
  markAsRead: (alertId: string) => void;
  markAllAsRead: () => void;
  clearAlerts: () => void;
}

export const useAlertStore = create<AlertState>()(
  devtools((set) => ({
    alerts: [],
    unreadCount: 0,
    addAlert: (alert) =>
      set((state) => ({
        alerts: [alert, ...state.alerts],
        unreadCount: state.unreadCount + 1,
      })),
    markAsRead: (alertId) =>
      set((state) => ({
        alerts: state.alerts.map((a) =>
          a.id === alertId ? { ...a, isRead: true } : a
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      })),
    markAllAsRead: () =>
      set((state) => ({
        alerts: state.alerts.map((a) => ({ ...a, isRead: true })),
        unreadCount: 0,
      })),
    clearAlerts: () => set({ alerts: [], unreadCount: 0 }),
  }))
);


interface CaregiverState {
  activeCaregiver: Caregiver | null;
  caregivers: Caregiver[];
  setActiveCaregiver: (caregiver: Caregiver | null) => void;
  setCaregivers: (caregivers: Caregiver[]) => void;
}

export const useCaregiverStore = create<CaregiverState>()(
  devtools((set) => ({
    activeCaregiver: null,
    caregivers: [],
    setActiveCaregiver: (caregiver) => set({ activeCaregiver: caregiver }),
    setCaregivers: (caregivers) => set({ caregivers }),
  }))
);


interface UIState {
  isSidebarOpen: boolean;
  isLoading: boolean;
  toggleSidebar: () => void;
  setLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>()(
  devtools((set) => ({
    isSidebarOpen: true,
    isLoading: false,
    toggleSidebar: () =>
      set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    setLoading: (loading) => set({ isLoading: loading }),
  }))
);