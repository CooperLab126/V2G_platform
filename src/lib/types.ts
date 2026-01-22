export interface User {
  id: string;
  name: string;
  email: string;
  language: "en" | "zh";
  avatar?: string;
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  batteryCapacity: number;
  licensePlate: string;
  connectorType: "CCS2" | "CHAdeMO" | "GB/T";
  isPrimary: boolean;
}

export interface Station {
  id: string;
  name: string;
  status: "available" | "in_use" | "offline";
  maxPowerAc: number;
  maxPowerDc?: number;
  connectors: string[];
  v2gCapable: boolean;
  distance?: number;
}

export interface Session {
  id: string;
  stationId: string;
  mode: "charging" | "v2g";
  status: "active" | "completed" | "cancelled";
  startTime: string;
  endTime?: string;
  currentSoc: number;
  startSoc: number;
  targetSoc?: number;
  minSoc?: number;
  powerKw: number;
  energyKwh: number;
  currentAmount: number;
}

export interface Transaction {
  id: string;
  type: "v2g_earning" | "charging_cost" | "withdrawal" | "topup";
  amount: number;
  date: string;
  sessionId?: string;
  energyKwh?: number;
  duration?: string;
  status: "completed" | "pending" | "failed";
}

export interface Schedule {
  id: string;
  name: string;
  type: "one_time" | "recurring";
  days: number[];
  startTime: string;
  endTime: string;
  mode: "charging" | "v2g";
  targetSoc?: number;
  minSoc?: number;
  isActive: boolean;
}

export interface Pricing {
  buyRate: number;
  sellRate: number;
  currency: string;
  unit: string;
}
