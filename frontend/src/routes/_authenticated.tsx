import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { useAuthStore } from "@/stores/auth-store";
import { setUnauthorizedHandler } from "@/lib/api/client";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const logout = useAuthStore((s) => s.logout);

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
    return <Navigate to="/login" />;
  }

  return <AppShell />;
}
