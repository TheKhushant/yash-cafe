import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";

import { AppShell } from "@/components/layout/AppShell";
import { setUnauthorizedHandler } from "@/lib/api/client";
import AnalyticsPage from "@/pages/analytics";
import BarsPage from "@/pages/bars";
import DashboardPage from "@/pages/dashboard";
import EventsPage from "@/pages/events";
import GamesPage from "@/pages/games";
import LoginPage from "@/pages/login";
import MenuPage from "@/pages/menu";
import OrdersPage from "@/pages/orders";
import PlatformAnalyticsPage from "@/pages/platform-analytics";
import PlatformRevenuePage from "@/pages/platform-revenue";
import PlatformUsersPage from "@/pages/platform-users";
import ScannerPage from "@/pages/scanner";
import SettingsPage from "@/pages/settings";
import SystemSettingsPage from "@/pages/system-settings";
import UsersPage from "@/pages/users";
import { useAuthStore } from "@/stores/auth-store";
import NotificationsPage from "@/pages/notifications";
import OffersPage from "@/pages/offers";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function AuthenticatedLayout() {
  const hydrated = useAuthStore((state) => state.hydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hydrate = useAuthStore((state) => state.hydrate);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    hydrate();
    setUnauthorizedHandler(() => logout());
  }, [hydrate, logout]);

  if (!hydrated) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export function AppRouter() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<AuthenticatedLayout />}>
            <Route element={<AppShell />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/scanner" element={<ScannerPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/games" element={<GamesPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/bars" element={<BarsPage />} />
              <Route path="/platform-users" element={<PlatformUsersPage />} />
              <Route path="/platform-revenue" element={<PlatformRevenuePage />} />
              <Route path="/platform-analytics" element={<PlatformAnalyticsPage />} />
              <Route path="/system-settings" element={<SystemSettingsPage />} />
              <Route path="/offers" element={<OffersPage />} />

            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

