"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";
import { Shield, LayoutGrid, Map, Database } from "lucide-react";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { BrowserNotificationOptIn } from "@/components/notifications/browser-notification-opt-in";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import type { SourceHealthStatus } from "@/lib/schemas/feed";
import { Link } from "@/i18n/navigation";

type CommandBarContent = {
  title: string;
  navigation: {
    dashboard: string;
    map: string;
    intel: string;
  };
  themeSwitcher: {
    label: string;
    dark: string;
    light: string;
  };
  sourceHealthOverallLabel: string;
  sourceHealthStatuses: {
    healthy: string;
    degraded: string;
    down: string;
    unknown: string;
  };
};

type CommandBarProps = {
  content: CommandBarContent;
  overallSourceHealthStatus: SourceHealthStatus;
  activeHref?: string;
};

const healthDotColor: Record<SourceHealthStatus, string> = {
  healthy: "bg-emerald-500",
  degraded: "bg-amber-400",
  down: "bg-rose-500",
  unknown: "bg-slate-500",
};

const navTabs = [
  { label: "dashboard", icon: LayoutGrid, href: "/dashboard" },
  { label: "map", icon: Map, href: "/map" },
  { label: "intel", icon: Database, href: "/feed" },
] as const;

function LocaleSwitcherFallback() {
  return <div className="h-[52px] w-[98px] shrink-0 rounded-lg bg-md3-surface-container" aria-hidden="true" />;
}

export function CommandBar({ content, overallSourceHealthStatus, activeHref = "/dashboard" }: CommandBarProps) {
  return (
    <header className="fixed top-0 left-0 z-50 flex h-14 w-full items-center justify-between border-b border-md3-outline-variant/10 bg-md3-surface px-2 sm:px-6">
      <div className="flex min-w-0 items-center gap-3 sm:gap-8">
        {/* Logo */}
        <Link href="/dashboard" aria-label={content.title} className="flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-1 py-1 sm:px-2">
          <Shield className="h-6 w-6 text-md3-primary" />
          <span className="hidden font-[family-name:var(--font-sans)] text-sm font-black tracking-tighter text-md3-primary min-[360px]:inline sm:text-xl">
            {content.title}
          </span>
        </Link>

        {/* Nav Tabs */}
        <nav className="hidden items-center gap-1 md:flex">
          {navTabs.map((tab) => (
            <Link
              key={tab.label}
              href={tab.href}
              aria-current={tab.href === activeHref ? "page" : undefined}
              className={`flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 transition-all lg:px-4 ${
                tab.href === activeHref
                  ? "bg-md3-primary-container/10 text-md3-primary"
                  : "text-md3-outline hover:bg-md3-surface-container hover:text-md3-on-surface"
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span className="font-[family-name:var(--font-label)] text-[11px] font-bold uppercase tracking-widest">
                {content.navigation[tab.label]}
              </span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Status Indicator */}
        <div className="hidden items-center gap-4 lg:flex ltr:mr-4 rtl:ml-4">
          <div className="flex items-center gap-2 rounded-lg bg-md3-surface-container px-3 py-1">
            <motion.span
              className={`inline-block h-2 w-2 rounded-full ${healthDotColor[overallSourceHealthStatus]}`}
              animate={
                overallSourceHealthStatus === "healthy"
                  ? { scale: [1, 1.3, 1] }
                  : undefined
              }
              transition={
                overallSourceHealthStatus === "healthy"
                  ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                  : undefined
              }
              title={`${content.sourceHealthOverallLabel}: ${content.sourceHealthStatuses[overallSourceHealthStatus]}`}
            />
            <span className="font-[family-name:var(--font-label)] text-[10px] uppercase tracking-widest text-md3-on-surface-variant">
              {content.sourceHealthStatuses[overallSourceHealthStatus]}
            </span>
          </div>
        </div>

        {/* Language Toggle */}
        <Suspense fallback={<LocaleSwitcherFallback />}>
          <LocaleSwitcher className="shrink-0 text-xs" compact />
        </Suspense>

        {/* Action Icons */}
        <div className="flex items-center gap-1">
          <ThemeSwitcher content={content.themeSwitcher} className="text-xs" toggleSize={14} compact />
          <BrowserNotificationOptIn className="text-xs" compact />
        </div>
      </div>
    </header>
  );
}

export type { CommandBarContent };
