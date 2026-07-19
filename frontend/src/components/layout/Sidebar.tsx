// src/components/layout/Sidebar.tsx
import { Link, useLocation } from "react-router-dom";
import { PanelLeftClose, PanelLeft, Trophy, X } from "lucide-react";

import { sectionsForRole } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggle = useUiStore((s) => s.toggleSidebar);
  const mobileOpen = useUiStore((s) => s.mobileOpen);
  const setMobileOpen = useUiStore((s) => s.setMobileOpen);
  const theme = useUiStore((s) => s.theme);

  const { pathname } = useLocation();

  if (!user) return null;

  const sections = sectionsForRole(user.role);

  const content = (isMobile: boolean) => {
    const isCollapsed = collapsed && !isMobile;

    return (
      <div className="flex h-full flex-col bg-background text-foreground border-r border-border">
        {/* Header */}
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Trophy className="size-5" />
          </span>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Sports Bar</p>
              <p className="truncate text-xs text-muted-foreground">Admin Console</p>
            </div>
          )}
          {isMobile && (
            <button
              onClick={() => setMobileOpen(false)}
              className="ml-auto grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="no-scrollbar flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {sections.map((section) => (
            <div key={section.title}>
              {!isCollapsed && (
                <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = pathname === item.to || pathname.startsWith(item.to + "/");
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      title={isCollapsed ? item.label : undefined}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "hover:bg-accent hover:text-accent-foreground text-muted-foreground",
                        isCollapsed && "justify-center px-0"
                      )}
                    >
                      <item.icon className="size-[18px] shrink-0" />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse Button */}
        <div className="border-t border-border p-3">
          <button
            onClick={toggle}
            className={cn(
              "hidden w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent lg:flex",
              isCollapsed && "justify-center px-0"
            )}
          >
            {isCollapsed ? (
              <PanelLeft className="size-[18px]" />
            ) : (
              <>
                <PanelLeftClose className="size-[18px]" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <aside
        className={cn(
          "hidden shrink-0 border-r border-border transition-all duration-200 lg:block",
          collapsed ? "w-[76px]" : "w-64"
        )}
      >
        <div className="sticky top-0 h-screen">{content(false)}</div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64">{content(true)}</div>
        </div>
      )}
    </>
  );
}