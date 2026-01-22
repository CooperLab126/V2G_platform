import { create } from "zustand";
import type { User, Vehicle, Station, Session, Transaction, Schedule, Pricing } from "@/lib/types";

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  vehicles: Vehicle[];
  stations: Station[];
  currentSession: Session | null;
  transactions: Transaction[];
  schedules: Schedule[];
  pricing: Pricing;
  currentSoc: number;
  
  // Actions
  login: (user: User) => void;
  logout: () => void;
  setCurrentSession: (session: Session | null) => void;
  updateSoc: (soc: number) => void;
  addTransaction: (transaction: Transaction) => void;
  addSchedule: (schedule: Schedule) => void;
  removeSchedule: (id: string) => void;
  toggleSchedule: (id: string) => void;
}

const mockUser: User = {
  id: "1",
  name: "Cooper",
  email: "cooper@example.com",
  language: "en",
};

const mockVehicles: Vehicle[] = [
  {
    id: "1",
    brand: "Tesla",
    model: "Model Y",
    batteryCapacity: 60,
    licensePlate: "ABC-1234",
    connectorType: "CCS2",
    isPrimary: true,
  },
];

const mockStations: Station[] = [
  {
    id: "A-01",
    name: "Engineering Building",
    status: "available",
    maxPowerAc: 22,
    maxPowerDc: 50,
    connectors: ["CCS2", "CHAdeMO"],
    v2gCapable: true,
    distance: 0.2,
  },
  {
    id: "A-02",
    name: "Engineering Building",
    status: "in_use",
    maxPowerAc: 22,
    maxPowerDc: 50,
    connectors: ["CCS2"],
    v2gCapable: true,
    distance: 0.25,
  },
  {
    id: "B-01",
    name: "Library",
    status: "available",
    maxPowerAc: 22,
    connectors: ["CCS2"],
    v2gCapable: false,
    distance: 0.5,
  },
];

const mockTransactions: Transaction[] = [
  {
    id: "TXN-001",
    type: "v2g_earning",
    amount: 42.15,
    date: "2026-01-22T11:45:00",
    sessionId: "SES-1247",
    energyKwh: 10.24,
    duration: "2h 30m",
    status: "completed",
  },
  {
    id: "TXN-002",
    type: "charging_cost",
    amount: -28.0,
    date: "2026-01-22T08:30:00",
    sessionId: "SES-1246",
    energyKwh: 10.0,
    duration: "1h 15m",
    status: "completed",
  },
  {
    id: "TXN-003",
    type: "v2g_earning",
    amount: 67.2,
    date: "2026-01-21T16:00:00",
    sessionId: "SES-1245",
    energyKwh: 16.1,
    duration: "3h 45m",
    status: "completed",
  },
  {
    id: "TXN-004",
    type: "v2g_earning",
    amount: 52.8,
    date: "2026-01-20T14:00:00",
    sessionId: "SES-1244",
    energyKwh: 12.6,
    duration: "2h 50m",
    status: "completed",
  },
  {
    id: "TXN-005",
    type: "charging_cost",
    amount: -35.0,
    date: "2026-01-19T09:00:00",
    sessionId: "SES-1243",
    energyKwh: 12.5,
    duration: "1h 40m",
    status: "completed",
  },
];

const mockPricing: Pricing = {
  buyRate: 2.8,
  sellRate: 4.2,
  currency: "NT$",
  unit: "kWh",
};

export const useAppStore = create<AppState>((set) => ({
  user: mockUser,
  isAuthenticated: true,
  vehicles: mockVehicles,
  stations: mockStations,
  currentSession: null,
  transactions: mockTransactions,
  schedules: [],
  pricing: mockPricing,
  currentSoc: 72,

  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
  setCurrentSession: (session) => set({ currentSession: session }),
  updateSoc: (soc) => set({ currentSoc: soc }),
  addTransaction: (transaction) =>
    set((state) => ({ transactions: [transaction, ...state.transactions] })),
  addSchedule: (schedule) =>
    set((state) => ({ schedules: [...state.schedules, schedule] })),
  removeSchedule: (id) =>
    set((state) => ({ schedules: state.schedules.filter((s) => s.id !== id) })),
  toggleSchedule: (id) =>
    set((state) => ({
      schedules: state.schedules.map((s) =>
        s.id === id ? { ...s, isActive: !s.isActive } : s
      ),
    })),
}));
