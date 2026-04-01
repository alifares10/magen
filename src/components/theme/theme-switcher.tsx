"use client";

import { useTheme } from "@/components/providers/theme-provider";
import { SkyToggle } from "@/components/ui/sky-toggle";
import { cn } from "@/lib/utils";

type ThemeSwitcherContent = {
  label: string;
  dark: string;
  light: string;
};

type ThemeSwitcherProps = {
  content: ThemeSwitcherContent;
  className?: string;
  toggleSize?: number;
  compact?: boolean;
};

export function ThemeSwitcher({ content, className, toggleSize, compact }: ThemeSwitcherProps) {
  const { theme, toggleTheme, isHydrated } = useTheme();
  const isDarkTheme = theme === "dark";
  const currentThemeLabel = isDarkTheme ? content.dark : content.light;

  return (
    <div className={cn(className)}>
      {!compact && (
        <p className="block text-xs font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
          {content.label}
        </p>
      )}

      <SkyToggle
        className={compact ? undefined : "mt-1"}
        checked={isDarkTheme}
        onCheckedChange={() => {
          toggleTheme();
        }}
        label={content.label}
        disabled={!isHydrated}
        size={toggleSize}
        touchTarget={compact}
      />

      {!compact && (
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{currentThemeLabel}</p>
      )}
    </div>
  );
}

export type { ThemeSwitcherContent };
