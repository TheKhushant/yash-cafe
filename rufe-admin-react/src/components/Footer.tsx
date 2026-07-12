import { Link } from "react-router-dom";
import { MapPin, Phone } from "lucide-react";
import { FaInstagram, FaFacebook, FaYoutube } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-border bg-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand Column */}
        <div className="space-y-3">
          <div>
            <div className="font-display text-2xl tracking-tight bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
              Royal Mobile Accessories
            </div>
            <p className="text-xs text-muted-foreground mt-2 leading-snug max-w-xs">
              Nagpur's trusted destination for premium mobile accessories, gadgets, toys & gifts.
            </p>
          </div>

          {/* Social Icons */}
          <div className="flex gap-2">
            {[FaFacebook, FaInstagram, FaYoutube].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="group p-2 rounded-xl bg-zinc-100 text-zinc-600 hover:bg-gradient-to-br hover:from-amber-500 hover:to-yellow-600 hover:text-white transition-all duration-300"
                aria-label={`our ${Icon.name}`}
              >
                <Icon size={15} />
              </a>
            ))}
          </div>
        </div>

        {/* Shop Links + Visit Us */}
        <div className="grid grid-cols-[2fr_3fr] gap-6">
          {/* Shop Links */}
          <div>
            <h4 className="text-[11px] font-semibold tracking-[1px] text-rose-600 uppercase mb-3">
              Shop
            </h4>

            <ul className="space-y-2 text-xs">
              {[
                { to: "/shop", label: "All Products" },
                { to: "/categories", label: "Categories" },
                { to: "/custom-order", label: "Custom Order" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="text-muted-foreground hover:text-rose-600 transition-colors inline-flex items-center gap-1 group"
                  >
                    {item.label}
                    <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-all">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Visit Us */}
          <div>
            <h4 className="text-[11px] font-semibold tracking-[1px] text-rose-600 uppercase mb-3">
              Visit Us
            </h4>

            <div className="space-y-3 text-xs">
              <div className="flex gap-2 text-muted-foreground">
                <MapPin size={15} className="text-rose-600 mt-0.5 shrink-0" />
                <p className="leading-snug">
                  Gurudev Nagar, Opposite Petrol Pump,<br />
                  Nagpur, Maharashtra
                </p>
              </div>

              <div className="flex gap-2 text-muted-foreground">
                <Phone size={15} className="text-rose-600 shrink-0" />
                <a
                  href="tel:+919172891633"
                  className="hover:text-rose-600 transition-colors"
                >
                  +91 91728 91633
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-zinc-100 bg-zinc-50 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} Royal Mobile Accessories, Nagpur. All rights reserved.
        </div>
      </div>
    </footer>
  );
}