import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  Gamepad2,
  Gift,
  HelpCircle,
  LayoutDashboard,
  QrCode,
  Radio,
  Receipt,
  Settings,
  ShieldCheck,
  Trophy,
  TrendingUp,
  Users2,
  UsersRound,
  UtensilsCrossed,
  Wallet,
  Tag,
  ListChecks,
  SlidersHorizontal,
} from "lucide-react";


import type { Role } from "@/types";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  roles: Role[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

const ALL: Role[] = ["admin", "super_admin"];
const SUPER: Role[] = ["super_admin"];

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Venue",
    items: [
      { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, roles: ALL },
      { label: "Orders", to: "/orders", icon: Receipt, roles: ALL },
      { label: "Menu & Inventory", to: "/menu", icon: UtensilsCrossed, roles: ALL },
      { label: "Events", to: "/events", icon: CalendarDays, roles: ALL },
      { label: "Games", to: "/games", icon: Gamepad2, roles: ALL },
      { label: "Offers", to: "/offers", icon: Tag, roles: ALL },
      { label: "Users", to: "/users", icon: UsersRound, roles: ALL },
      { label: "QR Scanner", to: "/scanner", icon: QrCode, roles: ALL },
      { label: "Notifications", to: "/notifications", icon: Bell, roles: ALL },
      { label: "Analytics", to: "/analytics", icon: BarChart3, roles: ALL },
      { label: "Settings", to: "/settings", icon: Settings, roles: ALL },
    ],
  },
  {
    title: "Quiz Panel",
    items: [
      { label: "Quiz Dashboard", to: "/quiz", icon: Trophy, roles: ALL },
      { label: "Live Quiz", to: "/quiz/live", icon: Radio, roles: ALL },
      { label: "Quiz Library", to: "/quiz/library", icon: Gamepad2, roles: ALL },
      { label: "Question Bank", to: "/quiz/questions", icon: HelpCircle, roles: ALL },
      { label: "Players", to: "/quiz/players", icon: Users2, roles: ALL },
      { label: "Leaderboard", to: "/quiz/leaderboard", icon: ListChecks, roles: ALL },
      { label: "Rewards", to: "/quiz/rewards", icon: Gift, roles: ALL },
      { label: "Reports", to: "/quiz/reports", icon: BarChart3, roles: ALL },
      { label: "Quiz Settings", to: "/quiz/settings", icon: SlidersHorizontal, roles: ALL },
    ],
  },
  {
    title: "Platform",
    items: [
      { label: "Bars", to: "/bars", icon: Building2, roles: SUPER },
      { label: "Platform Users", to: "/platform-users", icon: UsersRound, roles: SUPER },
      { label: "Platform Revenue", to: "/platform-revenue", icon: Wallet, roles: SUPER },
      { label: "Platform Analytics", to: "/platform-analytics", icon: TrendingUp, roles: SUPER },
      { label: "System Settings", to: "/system-settings", icon: ShieldCheck, roles: SUPER },
    ],
  },
];

export function sectionsForRole(role: Role): NavSection[] {
  return NAV_SECTIONS.map((s) => ({
    ...s,
    items: s.items.filter((i) => i.roles.includes(role)),
  })).filter((s) => s.items.length > 0);
}