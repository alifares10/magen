"use client";

import { LayoutGrid, Map, Database, Bell } from "lucide-react";
import { Link } from "@/i18n/navigation";

type MobileBottomNavContent = {
  dashboard: string;
  map: string;
  intel: string;
  alerts: string;
};

type MobileBottomNavProps = {
  content: MobileBottomNavContent;
  activeHref: string;
};

const navItems = [
  { label: "dashboard" as const, icon: LayoutGrid, href: "/dashboard" },
  { label: "map" as const, icon: Map, href: "/map" },
  { label: "intel" as const, icon: Database, href: "/feed" },
  { label: "alerts" as const, icon: Bell, href: "/dashboard" },
] as const;

export function MobileBottomNav({ content, activeHref }: MobileBottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 z-50 flex h-16 w-full items-center justify-around border-t border-md3-outline-variant/10 bg-md3-surface-container-low md:hidden">
      {navItems.map((item) => {
        const isActive = item.href === activeHref;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center gap-1 px-3 py-2 transition-colors ${
              isActive ? "text-md3-primary" : "text-md3-outline"
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span className="font-[family-name:var(--font-label)] text-[10px] font-bold uppercase tracking-widest">
              {content[item.label]}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export type { MobileBottomNavContent };
