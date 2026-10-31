"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Sparkles, SlidersHorizontal } from "lucide-react";
export default function Navigation() {
  const path = usePathname();
  return (
    <header className="app-header">
      <Link href="/" className="brand" aria-label="AURA home">
        <span className="brand-symbol">A</span>AURA
      </Link>
      <nav className="nav" aria-label="Main navigation">
        {[
          ["/dashboard", "Overview", LayoutDashboard],
          ["/coach", "AI coach", Sparkles],
          ["/settings", "Settings", SlidersHorizontal],
        ].map(([url, label, Icon]) => {
          const I = Icon as typeof LayoutDashboard;
          return (
            <Link
              key={String(url)}
              href={String(url)}
              className={path === url ? "active" : ""}
            >
              <I size={15} />
              {String(label)}
            </Link>
          );
        })}
      </nav>
      <span className="badge">
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "currentColor",
          }}
        />{" "}
        PERSONAL WORKSPACE
      </span>
    </header>
  );
}
