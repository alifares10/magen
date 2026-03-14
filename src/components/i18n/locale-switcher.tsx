"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";

type LocaleSwitcherProps = {
  className?: string;
};

function getLocaleValue(locale: string): AppLocale {
  const matchingLocale = routing.locales.find((value) => value === locale);

  if (matchingLocale) {
    return matchingLocale;
  }

  return routing.defaultLocale;
}

export function LocaleSwitcher({ className }: LocaleSwitcherProps) {
  const t = useTranslations("localeSwitcher");
  const locale = getLocaleValue(useLocale());
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = useMemo(() => {
    return Object.fromEntries(searchParams.entries());
  }, [searchParams]);

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
          const nextLocale = getLocaleValue(event.target.value);

          router.replace(
            {
              pathname,
              query,
            },
            {
              locale: nextLocale,
            },
          );
        }}
        className="mt-1 h-9 rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-900 dark:border-slate-700 dark:bg-slate-950/85 dark:text-slate-100"
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
