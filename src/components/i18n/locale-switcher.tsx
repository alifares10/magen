"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";

type LocaleSwitcherProps = {
  className?: string;
  compact?: boolean;
};

function getLocaleValue(locale: string): AppLocale {
  const matchingLocale = routing.locales.find((value) => value === locale);

  if (matchingLocale) {
    return matchingLocale;
  }

  return routing.defaultLocale;
}

const localeShortLabels: Record<AppLocale, string> = {
  en: "EN",
  he: "\u05E2\u05D1",
};

export function LocaleSwitcher({ className, compact }: LocaleSwitcherProps) {
  const t = useTranslations("localeSwitcher");
  const locale = getLocaleValue(useLocale());
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = useMemo(() => {
    return Object.fromEntries(searchParams.entries());
  }, [searchParams]);

  function switchTo(nextLocale: AppLocale) {
    router.replace(
      {
        pathname,
        query,
      },
      {
        locale: nextLocale,
      },
    );
  }

  if (compact) {
    return (
      <div className={`flex items-center rounded-lg bg-md3-surface-container p-1 ${className ?? ""}`}>
        {routing.locales.map((supportedLocale) => (
          <button
            key={supportedLocale}
            type="button"
            aria-label={t(`locales.${supportedLocale}`)}
            onClick={() => switchTo(supportedLocale)}
            className={`flex min-h-11 min-w-11 items-center justify-center rounded-md px-3 font-[family-name:var(--font-label)] text-[10px] uppercase transition-colors ${
              locale === supportedLocale
                ? "bg-md3-primary-container/10 text-md3-primary"
                : "text-md3-outline hover:bg-md3-surface-container-high hover:text-md3-on-surface"
            }`}
          >
            {localeShortLabels[supportedLocale]}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      <label
        htmlFor="locale-switcher"
        className="block text-xs font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300"
      >
        {t("label")}
      </label>
      <select
        id="locale-switcher"
        value={locale}
        onChange={(event) => {
          switchTo(getLocaleValue(event.target.value));
        }}
        className="mt-1 h-9 rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-900 dark:border-md3-outline-variant dark:bg-md3-surface-container dark:text-md3-on-surface"
      >
        {routing.locales.map((supportedLocale) => (
          <option key={supportedLocale} value={supportedLocale}>
            {t(`locales.${supportedLocale}`)}
          </option>
        ))}
      </select>
    </div>
  );
}
