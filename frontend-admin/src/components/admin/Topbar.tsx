import { LogOut, Menu } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface TopbarProps {
  onMobileMenuClick?: () => void;
}

export function Topbar({ onMobileMenuClick }: TopbarProps) {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-[#E5E0D8] bg-white/90 backdrop-blur flex items-center justify-between px-4 md:px-6 shadow-sm">
      {/* Left Side */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuClick}
          className="md:hidden p-2 -ml-2 rounded-xl hover:bg-[#F8F5F0] transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div>
          <h2 className="text-xs uppercase tracking-wider text-[#9F1239] font-medium">
            Royal Admin Panel
          </h2>
          <p className="font-semibold text-sm text-[#1F2937]">
            {user?.name || user?.email || "Admin"}
          </p>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#9F1239] flex items-center justify-center shadow-md overflow-hidden">
          <img src="/profile.png" alt="Profile" className="w-full h-full object-cover" />
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-[#9F1239]/10 text-[#9F1239] border border-[#9F1239]/20 hover:bg-[#9F1239]/15 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}