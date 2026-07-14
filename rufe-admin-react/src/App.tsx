// src/App.tsx
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import AnalyticsPage from "@/pages/analytics";
import BarsPage from "@/pages/bars";
import EventsPage from "@/pages/events";
import GamesPage from "@/pages/games";
import MenuPage from "@/pages/menu";
import NotificationsPage from "@/pages/notifications";
import OrdersPage from "@/pages/orders";
import PlatformAnalyticsPage from "@/pages/platform-analytics";
import PlatformRevenuePage from "@/pages/platform-revenue";
import PlatformUsersPage from "@/pages/platform-users";
import ScannerPage from "@/pages/scanner";
import SettingsPage from "@/pages/settings";
import SystemSettingsPage from "@/pages/system-settings";
import UsersPage from "@/pages/users";
import IndexPage from "@/pages/index";

import { AppShell } from "./components/layout/AppShell";
import { useAuthStore } from "./stores/auth-store";

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hydrated, hydrate } = useAuthStore();

  useEffect(() => {
    if (!hydrated) {
      hydrate();
    }
  }, [hydrated, hydrate]);

  if (!hydrated) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<IndexPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="menu" element={<MenuPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="scanner" element={<ScannerPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="games" element={<GamesPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="bars" element={<BarsPage />} />
            <Route path="platform-users" element={<PlatformUsersPage />} />
            <Route path="platform-revenue" element={<PlatformRevenuePage />} />
            <Route path="platform-analytics" element={<PlatformAnalyticsPage />} />
            <Route path="system-settings" element={<SystemSettingsPage />} />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}