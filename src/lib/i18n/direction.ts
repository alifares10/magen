import type { AppLocale } from "@/i18n/routing";

const RTL_LOCALES: AppLocale[] = ["he"];

export function getDirectionForLocale(locale: AppLocale): "ltr" | "rtl" {
  return RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
}
