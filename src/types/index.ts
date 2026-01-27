// Copied from server/types/index.ts to ensure consistency

export interface Product {
  id: string;
  name: string;
  price: number;
  compare_at_price?: number;
  transfer_price?: number;
  images: string[];
  video?: string;
  stock: number;
  colors: {
    name: string;
    hex: string;
  }[];
  isActive: boolean;
}

export interface CartItem {
  product: Product;
  color: string;
  quantity: number;
}

export interface Customer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  order_count?: number;
  total_spent?: number;
  createdAt?: Date;
}

export interface CustomerOrder {
  id: string;
  items: CartItem[];
  total: number;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  createdAt: Date;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerDocNumber?: string;
  items: CartItem[];
  total: number;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled" | "awaiting_confirmation";
  shippingStreetName?: string;
  shippingStreetNumber?: string;
  shippingApartment?: string;
  shippingDescription?: string;
  shippingCity?: string;
  shippingPostalCode?: string;
  shippingProvince?: string;
  shippingCost?: number;
  shippingName?: string; 
  shippingDetails: string | null;
  paymentMethod: string;
  createdAt: Date;
  eventId?: string;
}

export interface Testimonial {
  id: string;
  customerName: string;
  content: string;
  rating: number;
  productName: string;
}

export interface AdminUser {
  id: number;
  username: string;
  password: string;
  email?: string;
  role: string;
  created_at: Date;
}

export interface SiteSettings {
  [key: string]: {
    value: string;
    type: string;
  };
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  is_active: boolean;
  sort_order: number;
}

export interface Coupon {
  id: number;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  min_amount: number;
  max_uses?: number;
  current_uses: number;
  expires_at?: Date;
  is_active: boolean;
  created_at: Date;
}

export interface AnalyticsEvent {
  id: number;
  event_type: string;
  event_data?: any;
  user_agent?: string;
  created_at: Date;
}

export interface Review {
  id: number;
  product_id: number;
  title: string;
  rating: number;
  comment: string;
  user_name: string;
  user_email: string;
  is_approved: boolean;
  created_at: Date;
}