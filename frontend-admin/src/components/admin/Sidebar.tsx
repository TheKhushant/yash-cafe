import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  FolderTree, 
  Image as ImageIcon, 
  MessageSquare, 
  ChevronLeft, 
  Zap, 
  X 
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/products", label: "Products", icon: Package },
  { to: "/categories", label: "Categories", icon: FolderTree },
  { to: "/banners", label: "Banners", icon: ImageIcon },
  { to: "/reviews", label: "Reviews", icon: MessageSquare },
];

interface SidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isMobileOpen = false, onClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`${
          collapsed ? "w-16" : "w-64"
        } hidden md:flex flex-col bg-white border-r border-[#E5E0D8] transition-all duration-200 shadow-sm`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#E5E0D8]">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#9F1239] flex items-center justify-center shadow-md">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm text-[#1F2937]">Royal Mobile</span>
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-xl hover:bg-[#F8F5F0] text-[#374151]"
            aria-label="Toggle sidebar"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.to);
            const Icon = item.icon;

            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 shadow-sm"
                    : "text-[#374151] hover:bg-[#F8F5F0] hover:text-[#9F1239]"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Sidebar (Drawer) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />

          {/* Sliding Panel */}
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white border-r border-[#E5E0D8] shadow-2xl">
            <div className="h-16 flex items-center justify-between px-4 border-b border-[#E5E0D8]">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full overflow-hidden">
                  <img src="/logoGoldNoBG.png" alt="Logo" className="w-full h-full object-cover" />
                </div>
                <span className="font-bold text-sm">Royal Mobile</span>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-[#F8F5F0]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.to);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20"
                        : "text-[#374151] hover:bg-[#F8F5F0] hover:text-[#9F1239]"
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}