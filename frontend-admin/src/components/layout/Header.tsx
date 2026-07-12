// src/components/layout/Header.tsx
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, Menu, Search } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { NAV_SECTIONS } from "@/lib/nav";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  super_admin: "Super Admin",
  user: "User",
};

function titleFor(pathname: string): string {
  const all = NAV_SECTIONS.flatMap((s) => s.items);
  const match = all.find((i) => pathname === i.to || pathname.startsWith(i.to + "/"));
  return match?.label ?? "Dashboard";
}

export function Header() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const setMobileOpen = useUiStore((s) => s.setMobileOpen);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const initials = (user?.name ?? "A")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <button
        onClick={() => setMobileOpen(true)}
        className="grid size-9 place-items-center rounded-lg border text-muted-foreground hover:bg-accent lg:hidden"
      >
        <Menu className="size-5" />
      </button>

      <h2 className="truncate text-lg font-semibold text-foreground">{titleFor(pathname)}</h2>

      <div className="relative ml-auto hidden w-full max-w-xs md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search…" className="pl-9" />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="ml-auto flex items-center gap-2.5 rounded-full p-1 pr-3 transition-colors hover:bg-accent md:ml-0">
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium leading-tight text-foreground">{user?.name}</p>
            <p className="text-xs leading-tight text-muted-foreground">
              {ROLE_LABEL[user?.role ?? "user"]}
            </p>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs font-normal text-muted-foreground">{user?.email}</p>
            {user?.venueName && (
              <p className="mt-1 text-xs font-normal text-muted-foreground">{user.venueName}</p>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
            <LogOut className="size-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}