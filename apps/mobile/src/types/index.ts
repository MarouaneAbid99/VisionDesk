export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SUPERADMIN' | 'OWNER' | 'ADMIN' | 'OPTICIAN' | 'TECHNICIAN';
  shopId: string;
  createdAt: string;
}

export interface Shop {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo: string | null;
}

export interface Client {
  id: string;
  shopId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
  prescriptions?: Prescription[];
  orders?: Order[];
}

export interface Prescription {
  id: string;
  clientId: string;
  odSph: number | null;
  odCyl: number | null;
  odAxis: number | null;
  odAdd: number | null;
  osSph: number | null;
  osCyl: number | null;
  osAxis: number | null;
  osAdd: number | null;
  pdFar: number | null;
  pdNear: number | null;
  doctorName: string | null;
  notes: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface FrameBrand {
  id: string;
  name: string;
}

export interface Frame {
  id: string;
  shopId: string;
  supplierId: string | null;
  brandId: string | null;
  brand?: FrameBrand;
  reference: string;
  model: string | null;
  color: string | null;
  size: string | null;
  material: string | null;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  reorderLevel: number;
  supplier?: Supplier;
}

export type LensType = 'SINGLE_VISION' | 'BIFOCAL' | 'PROGRESSIVE' | 'READING' | 'SUNGLASSES';
export type LensCoating = 'NONE' | 'ANTI_REFLECTIVE' | 'BLUE_LIGHT' | 'PHOTOCHROMIC' | 'POLARIZED' | 'SCRATCH_RESISTANT';

export interface Lens {
  id: string;
  shopId: string;
  supplierId: string | null;
  name: string;
  lensType: LensType;
  index: string | null;
  coating: LensCoating;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  reorderLevel: number;
  supplier?: Supplier;
}

export interface Supplier {
  id: string;
  shopId: string;
  name: string;
  contact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes?: string | null;
}

// READY_FOR_PICKUP is a legacy alias returned by older data; UI treats it as READY.
export type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'IN_ATELIER' | 'READY' | 'READY_FOR_PICKUP' | 'PICKED_UP' | 'DELIVERED' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID';

export interface Order {
  id: string;
  shopId: string;
  clientId: string;
  prescriptionId: string | null;
  frameId: string | null;
  lensId: string | null;
  createdById: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  framePrice: number;
  lensPrice: number;
  servicePrice: number;
  discount: number;
  deposit: number;
  totalPrice: number;
  remainingAmount?: number;
  dueDate: string | null;
  readyAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
  client?: Client;
  frame?: Frame;
  lens?: Lens;
  prescription?: Prescription;
  atelierJob?: AtelierJob;
}

export type AtelierStatus = 'PENDING' | 'IN_PROGRESS' | 'READY';

export interface AtelierJob {
  id: string;
  shopId: string;
  orderId: string;
  technicianId: string | null;
  status: AtelierStatus;
  priority: number;
  notes: string | null;
  technicianNotes: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  order?: Order;
  technician?: User;
}

export interface PanoramaScene {
  id: string;
  shopId: string;
  name: string;
  imageUrl: string;
  isActive: boolean;
  hotspots?: PanoramaHotspot[];
}

export interface PanoramaHotspot {
  id: string;
  shopId: string;
  sceneId: string;
  moduleKey: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
}

/**
 * Dashboard Summary - matches API response from desk.service.ts
 * Uses unified business logic for all counts
 */
export interface DeskSummary {
  // Informational
  ordersToday: number;
  // KEY METRICS - using correct business logic
  activeOrders: number;       // "En cours" - total active orders (CONFIRMED, IN_ATELIER, READY)
  ordersReady: number;        // "Prêtes" - READY only
  ordersInAtelier: number;    // "En atelier" - currently being worked on (IN_ATELIER only)
  ordersPending: number;      // "En attente" - confirmed, waiting for atelier (CONFIRMED only)
  atelierWorkload: number;    // Total atelier queue (CONFIRMED + IN_ATELIER)
  overdueOrders: number;      // Overdue orders needing attention
  urgentAtelierJobs: number;  // Blocked jobs
  // Stock
  lowStockItems: number;
  lowStockFrames: number;
  lowStockLenses: number;
  // Appointments
  appointmentsToday: number;
}

export type AppointmentType = 'EYE_EXAM' | 'CONTACT_LENS' | 'PICKUP' | 'REPAIR' | 'OTHER';
export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface Appointment {
  id: string;
  shopId: string;
  clientId: string;
  createdById: string;
  appointmentType: AppointmentType;
  status: AppointmentStatus;
  scheduledAt: string;
  durationMinutes: number;
  notes: string | null;
  createdAt: string;
  client?: Client;
  createdBy?: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  shop: Shop | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
