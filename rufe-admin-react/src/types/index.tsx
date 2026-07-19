export type Role = "user" | "admin" | "super_admin";
/**
 * Lifecycle status of an Offer once it has been assigned to a specific user.
 * Assigned  -> newly granted, not usable until `validFrom`
 * Used      -> redeemed via QR scan
 * Expired   -> past `expiryDate` without being used
 * Cancelled -> revoked by an admin before use
 */
export type AssignedOfferStatus = "Assigned" | "Used" | "Expired" | "Cancelled";


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

export type OfferType =
  | "Coupon Code"
  | "Starter"
  | "Main Course"
  | "Dessert"
  | "Drinks"
  | "Combo"
  | "Flat Discount"
  | "Percentage Discount"
  | "Buy One Get One"
  | "Free Item"
  | "Cashback"
  | "Custom";

export type OfferActivationType = "Immediate" | "OnQrScan" | "Manual";

export type OfferStatus = "Active" | "Disabled" | "Expired";

export interface Offer {
  id: string;
  name: string;
  code?: string;
  description?: string;
  type: OfferType;
  /** Used for Flat Discount (amount), Percentage Discount (%), Cashback (amount) */
  discountValue?: number;
  /** Used for Free Item */
  freeItemName?: string;
  /** Used for Combo, Buy One Get One and category types (Starter/Main Course/Dessert/Drinks/Custom) */
  benefitDetails?: string;
  activationType: OfferActivationType;
  startDate: string;
  endDate: string;
  expiryDurationMinutes: number;
  maxAssignments: number | null;
  perCustomerLimit: number | null;
  maxRedemptions: number | null;
  enabled: boolean;
  assignedCount: number;
  redeemedCount: number;
  createdAt: string;
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
  image?: string;
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

export type NotificationType =
  | "Announcement"
  | "Match Reminder"
  | "Order Ready"
  | "Offer Assigned";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  audience: string;
  sentAt: string;
  venueId: string;
  /** Present when this notification targets a single customer (e.g. offer assignment). */
  userId?: string;
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

/**
 * The relationship record connecting a User to an Offer.
 * The underlying Offer is never mutated — this row tracks the
 * per-user lifecycle (validity window, redemption, cancellation).
 */
export interface AssignedOffer {
  id: string;
  userId: string;
  offerId: string;
  /** Denormalized snapshot of the offer at assignment time, for display without a join. */
  name: string;
  type: string;
  code?: string;
  discountSummary?: string;
  description?: string;
  assignedAt: string;
  /** First moment the offer becomes usable — always the day after `assignedAt`. */
  validFrom: string;
  expiryDate: string;
  status: AssignedOfferStatus;
  usedAt: string | null;
  venueId: string;
}

/** AssignedOffer joined with the customer it belongs to, for the Offer Details "Assigned Users" view. */
export interface AssignedOfferWithUser extends AssignedOffer {
  userName: string;
  userEmail: string;
}

/** Payload encoded into the QR code shown to a customer for a specific assigned offer. */
export interface AssignedOfferQrPayload {
  assignedOfferId: string;
  userId: string;
  offerId: string;
  expiryDate: string;
  /** Lightweight integrity token; a real backend would issue a signed JWT/HMAC here instead. */
  token: string;
}

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
  /** Offers assigned to this user. Optional/absent for platform admin accounts. */
  assignedOffers?: AssignedOffer[];
}

/* ------------------------------------------------------------------ */
/* Quiz Panel                                                          */
/* ------------------------------------------------------------------ */

export type QuizDifficulty = "Easy" | "Medium" | "Hard";
export type QuizVisibility = "Public" | "Private";
export type QuizEntryMethod = "QR Code" | "PIN Code" | "Invite Only";
export type QuizStatus = "Draft" | "Published" | "Live" | "Archived";
export type QuizRewardType =
  | "Coupon"
  | "Offer"
  | "Free Drink"
  | "Free Food"
  | "Loyalty Points"
  | "Gift Voucher";

export interface Quiz {
  id: string;
  name: string;
  description?: string;
  category: string;
  difficulty: QuizDifficulty;
  visibility: QuizVisibility;
  entryMethod: QuizEntryMethod;
  maxPlayers: number;
  rewardType: QuizRewardType;
  startDate: string;
  endDate: string;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  allowLateJoin: boolean;
  showLeaderboard: boolean;
  enableTimer: boolean;
  autoNextQuestion: boolean;
  questionIds: string[];
  playersCount: number;
  status: QuizStatus;
  pinCode: string;
  createdAt: string;
  venueId: string;
}

export type QuestionType =
  | "MCQ"
  | "True/False"
  | "Multiple Correct"
  | "Image Question"
  | "Logo Quiz"
  | "Poll"
  | "Survey";

export interface QuestionOption {
  id: string;
  label: string;
}

export interface Question {
  id: string;
  text: string;
  imageUrl?: string;
  type: QuestionType;
  options: QuestionOption[];
  /** Empty for Poll/Survey question types, which have no single correct answer. */
  correctOptionIds: string[];
  timeLimitSeconds: number;
  points: number;
  explanation?: string;
  category: string;
  difficulty: QuizDifficulty;
  tags: string[];
  usageCount: number;
  enabled: boolean;
  createdAt: string;
  venueId: string;
}

export type QuizSessionStatus = "Waiting" | "Live" | "Paused" | "Ended";

export interface QuizSession {
  id: string;
  quizId: string;
  quizName: string;
  status: QuizSessionStatus;
  pinCode: string;
  /** -1 before the host presses Start. */
  currentQuestionIndex: number;
  startedAt: string | null;
  endedAt: string | null;
  playerIds: string[];
  venueId: string;
}

export type PlayerStatus = "Active" | "Banned";
export type PlayerConnectionStatus = "Connected" | "Disconnected";

export interface Player {
  id: string;
  name: string;
  tableNumber: string;
  avatarColor: string;
  totalScore: number;
  quizzesPlayed: number;
  wins: number;
  joinedAt: string;
  status: PlayerStatus;
  connectionStatus: PlayerConnectionStatus;
  venueId: string;
}

export interface PlayerAnswer {
  id: string;
  sessionId: string;
  playerId: string;
  questionId: string;
  selectedOptionIds: string[];
  correct: boolean;
  responseTimeMs: number;
  pointsAwarded: number;
  answeredAt: string;
}

export type RewardStatus = "Pending" | "Delivered";

export interface Reward {
  id: string;
  playerId: string;
  playerName: string;
  sessionId: string;
  quizName: string;
  type: QuizRewardType;
  description: string;
  rank: number;
  assignedAt: string;
  status: RewardStatus;
  venueId: string;
}

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  score: number;
  correctAnswers: number;
  fastestResponseMs: number;
  rank: number;
  /** Positive = moved up since last check, negative = moved down, 0 = unchanged. */
  rankChange: number;
}

export interface QuizSettings {
  defaultTimerSeconds: number;
  defaultPoints: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showCorrectAnswer: boolean;
  enableSounds: boolean;
  enableCountdown: boolean;
  maxPlayers: number;
  allowRejoin: boolean;
  enableQrJoin: boolean;
  autoLeaderboard: boolean;
  venueId: string;
}

export interface QuizReportSummary {
  totalParticipation: number;
  accuracyRate: number;
  avgResponseTimeMs: number;
  mostMissedQuestions: { questionId: string; text: string; missRate: number }[];
  topPlayers: { playerId: string; name: string; score: number }[];
  topCategories: { category: string; plays: number }[];
  dailyQuizzes: { label: string; count: number }[];
  monthlyQuizzes: { label: string; count: number }[];
  participationSeries: { label: string; players: number }[];
  accuracySeries: { label: string; accuracy: number }[];
}