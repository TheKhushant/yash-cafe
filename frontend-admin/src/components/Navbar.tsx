import { NavLink } from "react-router-dom";
import { ShoppingCart, Menu, X, Search } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useCart } from "@/lib/cart";

const links = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/categories", label: "Categories" },
  { to: "/custom-order", label: "Custom Order" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEsc);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-2xl bg-white/55 supports-[backdrop-filter]:bg-white/45 border-b border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent" />

      <nav className="max-w-7xl mx-auto px-3 sm:px-6 h-[52px] sm:h-16 flex items-center justify-between">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-1 sm:gap-2.5 group shrink-0">
          <img
            src="/logoGoldNoBG.png"
            alt="Royal Mobile Accessories"
            width={30}
            height={30}
            className="drop-shadow-md transition-transform group-hover:scale-105"
          />
          <div className="leading-none">
            <div className="font-display text-lg sm:text-2xl tracking-tight bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 bg-clip-text text-transparent font-semibold">
              Royal
            </div>
            <div className="text-[7px] sm:text-[10px] tracking-[1.5px] uppercase text-zinc-500 -mt-0.5">
              MOBILE ACCESSORIES
            </div>
          </div>
        </NavLink>

        {/* Desktop Navigation */}
        <ul className="hidden lg:flex items-center gap-8 text-sm font-medium">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                className={({ isActive }) =>
                  `text-zinc-600 hover:text-rose-600 transition-colors relative after:absolute after:bottom-[-2px] after:left-0 after:h-0.5 after:w-0 after:bg-rose-600 hover:after:w-full after:transition-all ${
                    isActive ? "text-rose-600" : ""
                  }`
                }
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Right Side Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          <NavLink
            to="/shop"
            className="hidden sm:flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/40 hover:bg-white/60 backdrop-blur-md border border-white/20 text-zinc-600 hover:text-rose-600 transition-all"
          >
            <Search size={16} className="sm:w-[19px] sm:h-[19px]" />
          </NavLink>

          <NavLink
            to="/cart"
            className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/40 hover:bg-white/60 backdrop-blur-md border border-white/20 text-zinc-700 hover:text-rose-600 transition-all"
          >
            <ShoppingCart size={17} className="sm:w-5 sm:h-5" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[8px] sm:text-[10px] font-semibold min-w-[15px] h-[15px] sm:min-w-[18px] sm:h-[18px] rounded-full grid place-items-center shadow">
                {count}
              </span>
            )}
          </NavLink>

          <button
            onClick={() => setOpen((o) => !o)}
            className="lg:hidden p-1.5 sm:p-2 rounded-xl bg-white/40 hover:bg-white/60 backdrop-blur-md border border-white/20 transition-all"
          >
            {open ? <X size={20} className="sm:w-6 sm:h-6" /> : <Menu size={20} className="sm:w-6 sm:h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {open && (
        <div
          ref={menuRef}
          className="lg:hidden border-t border-white/20 bg-white/70 backdrop-blur-2xl"
        >
          <ul className="px-3 py-3 space-y-1">
            {links.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 text-xs sm:text-sm text-zinc-700 hover:bg-zinc-50 rounded-xl transition-colors"
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}