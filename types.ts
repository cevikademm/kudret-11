
export enum OrderStatus {
  RECEIVED = 'RECEIVED',
  PREPARING = 'PREPARING',
  SERVED = 'SERVED',
  COMPLETED = 'COMPLETED',
  CLOSED = 'CLOSED'
}

export type Language = 'TR' | 'EN' | 'DE' | 'RU' | 'AR' | 'IT' | 'FR';

export interface SubscriptionInfo {
  isActive: boolean;
  expiryDate: string;
  plan: 'MONTHLY' | 'YEARLY' | 'NONE';
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  password?: string; // Giriş şifresi
  role: 'Yönetici' | 'Mutfak' | 'Garson';
  status: string;
}

export interface Allergen {
  id: string;
  name: string;
  icon: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  allergens: string[];
  spiceLevel: number; // 0-3
  upsellItems?: string[]; // IDs of suggested products
  available: boolean; // Ürün o gün var mı?
  stock?: number; // Stok adedi
}

export interface CartItem extends Product {
  quantity: number;
  note?: string;
}

export interface Order {
  id: string;
  tableNumber: string;
  customerName: string;
  items: CartItem[];
  totalPrice: number;
  status: OrderStatus;
  timestamp: Date;
  note?: string;
  feedback?: string; // Mutfaktan gelen geri bildirim
  customerLanguage?: Language; // Müşterinin seçtiği dil
  completedBy?: string; // Siparişi tamamlayan personel
  stockDeducted?: boolean; // Stoktan düşüldü mü?
}

export interface WaiterCall {
  id: string;
  tableNumber: string;
  type: 'WAITER' | 'CHECK';
  timestamp: Date;
  status: 'ACTIVE' | 'COMPLETED';
  completedBy?: string;
  completedAt?: Date;
}

export interface HeroSlide {
  id: string;
  type: 'IMAGE' | 'VIDEO';
  url: string;
  title: string;
  subtitle: string;
}

export interface Category {
  id: string;
  icon: string;
}

export interface Log {
  id: string;
  action: string;
  details: string;
  user_name: string;
  user_role: string;
  timestamp: Date;
}

export interface OrderHistoryEntry {
  order_id: string;
  date: string;
  total: number;
  items: { name: string; quantity: number; price: number }[];
}

export interface LoyaltyCustomer {
  id: string;
  phone: string;
  name: string;
  total_points: number;
  total_orders: number;
  last_visit: string;
  order_history?: OrderHistoryEntry[];
}

export interface Reservation {
  id: string;
  name: string;
  phone: string;
  table_number?: string;
  date_time: string;
  party_size: number;
  status: 'PENDING' | 'CONFIRMED' | 'SEATED' | 'CANCELLED';
  note?: string;
  created_at: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
}
