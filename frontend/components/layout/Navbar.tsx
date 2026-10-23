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
  { href: "/recommendations", label: "Next Trips" },
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

  // Desktop bubbles: white with a border so the dashed line passes "behind" them.
  function bubbleClass(href: string) {
    const base = "relative whitespace-nowrap rounded-full border-2 px-2 py-2 text-center text-[15px] font-medium shadow-sm transition";
    if (isActive(href)) {
      return `${base} border-purple-700 bg-purple-700 text-white`;
    }
    return `${base} border-purple-200 bg-white text-purple-900 hover:border-purple-400 hover:bg-purple-50`;
  }

  return (
    <nav className="relative z-20 border-b border-purple-100 bg-white text-purple-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-2xl font-bold text-purple-950">
          ✈️ Travel Wrapped
        </Link>

        {/* Desktop links (hidden on small screens): bubbles spread across the bar,
            joined by a dashed "flight path". The current page gets a plane. */}
        <div className="relative ml-10 hidden flex-1 grid-cols-6 items-center gap-3 lg:grid">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-4 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-purple-200"
          />
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={bubbleClass(link.href)}
              // Tells screen readers which link is the current page.
              aria-current={isActive(link.href) ? "page" : undefined}
            >
              {isActive(link.href) && (
                <span aria-hidden="true" className="mr-1.5">
                  ✈️
                </span>
              )}
              {link.label}
            </Link>
          ))}
          <Link
            href="/dashboard"
            className="relative whitespace-nowrap rounded-full border-2 border-pink-300 bg-pink-300 px-2 py-2 text-center text-[15px] font-semibold text-purple-950 shadow-sm transition hover:bg-pink-200"
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
