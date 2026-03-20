"use client";

import { motion } from "framer-motion";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { BrowserNotificationOptIn } from "@/components/notifications/browser-notification-opt-in";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import type { SourceHealthStatus } from "@/lib/schemas/feed";

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
};

const healthDotColor: Record<SourceHealthStatus, string> = {
  healthy: "bg-emerald-400 shadow-[0_0_6px_theme(colors.emerald.400/60%)]",
  degraded: "bg-amber-400 shadow-[0_0_6px_theme(colors.amber.400/60%)]",
  down: "bg-rose-500 shadow-[0_0_6px_theme(colors.rose.500/60%)]",
  unknown: "bg-slate-500",
};

export function CommandBar({ content, overallSourceHealthStatus }: CommandBarProps) {
  return (
    <header className="sticky top-0 z-50 flex h-12 items-center justify-between border-b border-[var(--border-panel)] bg-[var(--surface-raised)] px-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <h1 className="font-[family-name:var(--font-display)] text-xs font-bold uppercase tracking-[0.25em] text-slate-200 dark:text-slate-200">
          <span className="text-amber-400">Magen</span>
          <span className="mx-1.5 text-slate-600">|</span>
          <span className="text-slate-400">Crisis Monitor</span>
        </h1>
      </div>

      <div className="flex items-center gap-1">
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
      </div>

      <div className="flex items-center gap-2">
        <ThemeSwitcher content={content.themeSwitcher} className="text-xs" toggleSize={12} compact />
        <BrowserNotificationOptIn className="text-xs" compact />
        <LocaleSwitcher className="text-xs" compact />
      </div>
    </header>
  );
}

export type { CommandBarContent };
