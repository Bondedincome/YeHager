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
  id: number;
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
  paymentMethod: "stripe" | "card" | "apple_pay" | "cash_on_delivery" | "manual_boutique";
  paymentIntentId?: string;
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

export const INITIAL_USERS: AppUser[] = [
  {
    id: "usr_admin_1",
    name: "YeHageré Atelier Director",
    email: "admin@yehagere.com",
    role: "admin",
    // Salted PBKDF2 hash of "admin123" (100,000 rounds)
    passwordSalt: "a1b2c3d4e5f60718293a4b5c6d7e8f90",
    passwordHash: "db3ef93c37169e5239c3959a8a624eecbd5968432e32299f71551e75b5060036f8e8749f7d45f2159b582b37b169984bba0e49dcae93398b3e95e07afe2dada2",
    memberSince: "2024-01-10",
    status: "active",
    totalOrders: 4,
    totalSpentUSD: 1420,
    phone: "+251 91 123 4567",
    shippingAddress: {
      street: "Bole Medhanialem St., Suite 400",
      city: "Addis Ababa",
      state: "Addis Ababa",
      zip: "1000",
      country: "Ethiopia",
    },
  },
  {
    id: "usr_cust_1",
    name: "Daniot Mihrete",
    email: "daniot.mihrete-ug@aau.edu.et",
    role: "vip",
    // Salted PBKDF2 hash of "password123" (100,000 rounds)
    passwordSalt: "b2c3d4e5f60718293a4b5c6d7e8f90a1",
    passwordHash: "b78dd5d51f1a243bc86c9f37606bcdb6a552ba059bd2ecd5f9623dcf857b4084c883164031b8310f42edc7a869170bd4def8dbcd54d141e2e586583e2c5bc398",
    memberSince: "2024-03-15",
    status: "active",
    totalOrders: 5,
    totalSpentUSD: 1890,
    phone: "+251 92 987 6543",
    shippingAddress: {
      street: "Kazanchis Heritage Quarter, No. 12",
      city: "Addis Ababa",
      state: "Addis Ababa",
      zip: "1000",
      country: "Ethiopia",
    },
  },
  {
    id: "usr_cust_2",
    name: "Elena Vance",
    email: "elena.vance@studio-atelier.com",
    role: "customer",
    passwordSalt: "b2c3d4e5f60718293a4b5c6d7e8f90a1",
    passwordHash: "b78dd5d51f1a243bc86c9f37606bcdb6a552ba059bd2ecd5f9623dcf857b4084c883164031b8310f42edc7a869170bd4def8dbcd54d141e2e586583e2c5bc398",
    memberSince: "2024-06-20",
    status: "active",
    totalOrders: 2,
    totalSpentUSD: 680,
    phone: "+1 (415) 555-0199",
    shippingAddress: {
      street: "742 Evergreen Terrace",
      city: "San Francisco",
      state: "CA",
      zip: "94107",
      country: "United States",
    },
  },
  {
    id: "usr_cust_3",
    name: "Marcus Thorne",
    email: "marcus.thorne@arch-collective.org",
    role: "customer",
    passwordSalt: "b2c3d4e5f60718293a4b5c6d7e8f90a1",
    passwordHash: "b78dd5d51f1a243bc86c9f37606bcdb6a552ba059bd2ecd5f9623dcf857b4084c883164031b8310f42edc7a869170bd4def8dbcd54d141e2e586583e2c5bc398",
    memberSince: "2024-08-01",
    status: "active",
    totalOrders: 1,
    totalSpentUSD: 340,
    phone: "+44 20 7946 0912",
    shippingAddress: {
      street: "18 Kensington Church St",
      city: "London",
      state: "Greater London",
      zip: "W8 4EP",
      country: "United Kingdom",
    },
  },
];
