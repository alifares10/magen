"use client";

import { motion } from "framer-motion";
import { Shield, Map, Database, Crosshair, Terminal, Radar, Bell, Settings } from "lucide-react";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { BrowserNotificationOptIn } from "@/components/notifications/browser-notification-opt-in";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import type { SourceHealthStatus } from "@/lib/schemas/feed";
import { Link } from "@/i18n/navigation";

type CommandBarContent = {
  title: string;
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
  { label: "Map", icon: Map, href: "/map" },
  { label: "Intel", icon: Database, href: "/feed" },
  { label: "Assets", icon: Crosshair, href: "#" },
  { label: "Logs", icon: Terminal, href: "#" },
] as const;

export function CommandBar({ content, overallSourceHealthStatus, activeHref = "/map" }: CommandBarProps) {
  return (
    <header className="fixed top-0 left-0 z-50 flex h-14 w-full items-center justify-between border-b border-md3-outline-variant/10 bg-md3-surface px-3 sm:px-6">
      <div className="flex items-center gap-4 sm:gap-8">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-md3-primary" />
          <span className="font-[family-name:var(--font-sans)] text-base font-black tracking-tighter text-md3-primary sm:text-xl">
            {content.title}
          </span>
        </Link>

        {/* Nav Tabs */}
        <nav className="hidden items-center gap-1 md:flex">
          {navTabs.map((tab) => (
            <a
              key={tab.label}
              href={tab.href}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-all ${
                tab.href === activeHref
                  ? "bg-md3-primary-container/10 text-md3-primary"
                  : "text-md3-outline hover:bg-md3-surface-container hover:text-md3-on-surface"
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span className="font-[family-name:var(--font-label)] text-[11px] font-bold uppercase tracking-widest">
                {tab.label}
              </span>
            </a>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
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
        <LocaleSwitcher className="text-xs" compact />

        {/* Action Icons */}
        <div className="flex items-center gap-1">
          <ThemeSwitcher content={content.themeSwitcher} className="text-xs" toggleSize={12} compact />
          <BrowserNotificationOptIn className="text-xs" compact />
          <button
            type="button"
            className="hidden h-10 w-10 items-center justify-center rounded-lg text-md3-on-surface-variant transition-colors hover:bg-md3-surface-container-high sm:flex"
          >
            <Radar className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-lg text-md3-on-surface-variant transition-colors hover:bg-md3-surface-container-high"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-md3-error" />
          </button>
          <button
            type="button"
            className="hidden h-10 w-10 items-center justify-center rounded-lg text-md3-on-surface-variant transition-colors hover:bg-md3-surface-container-high sm:flex"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>

        {/* Duty Officer */}
        <div className="hidden items-center gap-3 border-md3-outline-variant sm:flex ltr:ml-4 ltr:border-r ltr:pr-4 rtl:mr-4 rtl:border-l rtl:pl-4">
          <div className="text-start">
            <p className="font-[family-name:var(--font-label)] text-[10px] uppercase tracking-tighter text-md3-outline">
              Duty Officer
            </p>
            <p className="text-xs font-bold">ISR-OPS-04</p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded border border-md3-outline-variant/20 bg-md3-primary-container">
            <span className="text-xs font-bold text-white">OP</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export type { CommandBarContent };
