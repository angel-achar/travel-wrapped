"use client";

// "use client" because we use usePathname (to highlight the current page)
// and useState (to open/close the menu on phones).

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/been", label: "Been" },
  { href: "/trips", label: "Trips" },
  { href: "/wrapped", label: "Wrapped" },
  { href: "/recommendations", label: "Recommendations" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // "/trips/12" should still highlight "Trips".
  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  function linkClass(href: string) {
    const base = "rounded-full px-4 py-2 font-medium transition";
    if (isActive(href)) {
      return `${base} bg-purple-700 text-white`;
    }
    return `${base} text-purple-900 hover:bg-purple-100`;
  }

  return (
    <nav className="relative z-20 border-b border-purple-100 bg-white text-purple-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-2xl font-bold text-purple-950">
          ✈️ Travel Wrapped
        </Link>

        {/* Desktop links (hidden on small screens) */}
        <div className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={linkClass(link.href)}
              // Tells screen readers which link is the current page.
              aria-current={isActive(link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/dashboard"
            className="ml-2 rounded-full bg-pink-300 px-5 py-2 font-semibold text-purple-950 transition hover:bg-pink-200"
          >
            Get Started
          </Link>
        </div>

        {/* Menu button (only on small screens) */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          className="rounded-full border border-purple-200 px-4 py-2 font-semibold text-purple-900 lg:hidden"
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
      </div>

      {/* Mobile menu: a simple list that appears under the bar */}
      {menuOpen && (
        <div id="mobile-menu" className="flex flex-col gap-1 border-t border-purple-100 px-6 py-3 lg:hidden">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={linkClass(link.href)}
              aria-current={isActive(link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
