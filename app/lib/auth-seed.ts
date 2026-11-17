export type UserRole = "admin" | "customer" | "vip";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  passwordHash?: string;
  passwordSalt?: string;
  avatarUrl?: string;
  memberSince: string;
  status: "active" | "suspended";
  totalOrders: number;
  totalSpentUSD: number;
  requiresPasswordChange?: boolean;
  phone?: string;
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
};

export type OrderItem = {
  id: number | string;
  title: string;
  price: number;
  priceETB?: number;
  quantity: number;
  size?: string;
  color?: string;
  imageUrl?: string;
};

export type OrderStatus = "confirmed" | "preparing" | "shipped" | "delivered" | "cancelled";

export type CustomerOrder = {
  id: string;
  orderNumber: string;
  userId?: string;
  customerEmail: string;
  customerName: string;
  items: OrderItem[];
  totalUSD: number;
  totalETB: number;
  status: OrderStatus;
  paymentMethod: "chapa" | "cash_on_delivery" | "manual_boutique" | "stripe" | "card";
  last4?: string;
  createdAt: string;
  shippingAddress: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  trackingNumber?: string;
  carrier?: string;
  internalNotes?: string;
};
