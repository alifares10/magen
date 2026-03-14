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
};

export function ThemeSwitcher({ content, className }: ThemeSwitcherProps) {
  const { theme, toggleTheme, isHydrated } = useTheme();
  const isDarkTheme = theme === "dark";
  const currentThemeLabel = isDarkTheme ? content.dark : content.light;

  return (
    <div className={cn(className)}>
      <p className="block text-xs font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
        {content.label}
      </p>

      <SkyToggle
        className="mt-1"
        checked={isDarkTheme}
        onCheckedChange={() => {
          toggleTheme();
        }}
        label={content.label}
        disabled={!isHydrated}
      />

      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{currentThemeLabel}</p>
    </div>
  );
}

export type { ThemeSwitcherContent };
