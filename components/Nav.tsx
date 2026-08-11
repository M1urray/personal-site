"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinks } from "@/lib/site";

export function Nav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href.startsWith("/#")) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="nav" aria-label="Primary">
      <div className="nav-in">
        <Link href="/" className="nav-id" aria-label="Home — Robert Njonjo">
          R.<b>NJONJO</b>
        </Link>

        <ul className="nav-links">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <details className="nav-menu">
          <summary aria-label="Open navigation menu">menu</summary>
          <div className="nav-menu-panel">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </details>
      </div>
    </nav>
  );
}
