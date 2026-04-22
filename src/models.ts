export interface User {
  id: string;
  email: string;
  role: 'admin' | 'technician' | 'user';
}

export interface Device {
  id: string;
  name: string;
  type: string;
  manufacturer?: string; // Výrobca zariadenia
  location: string;
  status: 'operational' | 'maintenance' | 'offline';
  imageUrl?: string; // URL fotky zariadenia
  manualUrl?: string;
  lastMaintenance: string;
  nextMaintenance: string;
  maintenancePeriod?: 'monthly' | 'quarterly' | 'semi-annually' | 'annually'; // Perioda pravidelnej údržby
  specifications?: Record<string, string | number>; // Špecifikácie zariadenia (rozmery, váha, pripojenia, atď.)
  downtime: number; // Total downtime in hours
  lastStatusChange: string; // ISO string for the last status change
  electricalInspectionDate?: string; // Dátum elektrickej revízie
  electricalInspectionPeriod?: 1 | 2 | 3 | 4 | 5 | 10; // Perioda platnosti v rokoch
  electricalInspectionExpiry?: string; // Automaticky vypočítaný dátum expirácie
}

export interface SparePart {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  minQuantity: number; // Minimálne požadované množstvo
  location: string;
  deviceId?: string; // Optional: ID zariadenia ku ktorému patrí
  deviceName?: string; // Optional: Názov zariadenia
  deviceType?: string; // Optional: Typ zariadenia
  lastChange?: {
    date: string;
    changedBy: string;
    notes?: string;
    changeType: 'increase' | 'decrease' | 'set';
    quantityBefore: number;
    quantityAfter: number;
  };
  // Rozšírené riadenie náhradných dielov
  supplierId?: string; // ID dodávateľa
  supplierName?: string; // Názov dodávateľa
  currentPrice?: number; // Aktuálna cena
  currency?: string; // Mena (EUR, USD, atď.)
  serialNumber?: string; // Sériové číslo (pre unikátne diely)
  batchNumber?: string; // Číslo batchu/šarže
  expiryDate?: string; // Dátum expirácie (pre diely s obmedzenou životnosťou)
  manufacturingDate?: string; // Dátum výroby
  warrantyMonths?: number; // Záruka v mesiacoch
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PartPriceHistory {
  id: string;
  partId: string;
  partName: string;
  partSku: string;
  price: number;
  currency: string;
  supplierId?: string;
  supplierName?: string;
  effectiveDate: string;
  notes?: string;
  changedBy: string;
  createdAt: string;
}

export interface MaintenanceLog {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceType?: string;
  date: string;
  technician: string;
  notes: string;
  type: 'scheduled' | 'emergency';
  durationMinutes: number; // Dĺžka trvania údržby v minútach (minimálne 15)
}

export interface SparePartHistory {
  id: string;
  partId: string;
  partName: string;
  quantityBefore: number;
  quantityAfter: number;
  changeType: 'increase' | 'decrease' | 'set';
  notes?: string;
  changedBy: string;
  createdAt: string;
}

// Maintenance Checklist Models
export interface MaintenanceChecklist {
  id: string;
  deviceType: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  items?: ChecklistItem[]; // Populated when fetched with items
}

export interface ChecklistItem {
  id: string;
  checklistId: string;
  orderIndex: number;
  taskDescription: string;
  isMandatory: boolean;
  estimatedMinutes?: number;
  safetyNote?: string;
  createdAt: string;
}

export interface MaintenanceLogChecklist {
  id: string;
  maintenanceLogId: string;
  checklistId: string;
  startedAt: string;
  completedAt?: string;
  technician?: string;
  notes?: string;
  checklist?: MaintenanceChecklist; // Populated when needed
  itemCompletions?: ChecklistItemCompletion[]; // Populated when needed
}

export interface ChecklistItemCompletion {
  id: string;
  maintenanceLogChecklistId: string;
  itemId: string;
  completed: boolean;
  completedAt?: string;
  notes?: string;
  completedBy?: string;
  item?: ChecklistItem; // Populated when needed
}
