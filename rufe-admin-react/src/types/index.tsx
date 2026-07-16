export type Role = "user" | "admin" | "super_admin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  venueId: string | null;
  venueName: string | null;
  avatarUrl?: string | null;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export type OrderStatus =
  | "Order Recived"
  | "Paid"
  | "Cancelled";

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerName: string;
  table: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  venueId: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  outOfStock: boolean;
  enabled: boolean;
  description?: string;
  image?: string;
  isFavourite?: boolean;
  isMostOrdered?: boolean;
  venueId: string;
}

export type EventStatus = "Draft" | "Published";

export interface VenueEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  ticketPrice: number;
  capacity: number;
  attendance: number;
  bannerUrl?: string;
  status: EventStatus;
  venueId: string;
}

export interface Game {
  id: string;
  title: string;
  league: string;
  schedule: string;
  enabled: boolean;
  iconUrl?: string;
  venueId: string;
}

export type UserStatus = "Active" | "Blocked";

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  joinedAt: string;
  totalBookings: number;
  totalOrders: number;
  venueId: string | null;
  role: "user" | "admin" | "super_admin";
}

export type BookingStatus =
  | "Confirmed"
  | "Cancelled"
  | "CheckedIn"
  | "Expired"
  | "PaymentPending";

export interface Booking {
  id: string;
  userId: string;
  customerName: string;
  eventId: string;
  eventTitle: string;
  tableNumber: string;
  status: BookingStatus;
  paymentStatus: "Paid" | "Pending";
  checkedInAt: string | null;
  checkedInBy: string | null;
  expiresAt: string;
  venueId: string;
}

export interface QrPayload {
  bookingId: string;
  userId: string;
  eventId: string;
  tableNumber: string;
  status: string;
}

export interface ScanLogEntry {
  id: string;
  bookingId: string;
  customerName: string;
  result: "approved" | "rejected";
  reason: string;
  scannedBy: string;
  scannedAt: string;
}

export type NotificationType = "Announcement" | "Match Reminder" | "Order Ready";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  audience: string;
  sentAt: string;
  venueId: string;
}

export interface DashboardStats {
  revenue: number;
  revenueChange: number;
  orders: number;
  ordersChange: number;
  activeEvents: number;
  users: number;
  usersChange: number;
  inventoryAlerts: number;
}

export interface ActivityEntry {
  id: string;
  icon: string;
  text: string;
  time: string;
}

export interface TimeSeriesPoint {
  label: string;
  revenue: number;
  orders: number;
}

export interface AttendancePoint {
  event: string;
  attendance: number;
  capacity: number;
}

export interface PopularItem {
  name: string;
  sold: number;
  revenue: number;
}

export interface AnalyticsData {
  series: TimeSeriesPoint[];
  attendance: AttendancePoint[];
  popularItems: PopularItem[];
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  totalAttendance: number;
}

export interface Venue {
  id: string;
  name: string;
  city: string;
  owner: string;
  status: "Active" | "Suspended";
  revenue: number;
  createdAt: string;
}

export interface Paginated<T> {
  rows: T[];
  total: number;
}
