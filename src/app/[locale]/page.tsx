import type { AppLocale } from "@/i18n/routing";
import { LocalizedDashboardShell } from "@/components/layout/localized-dashboard-shell";

export const dynamic = "force-dynamic";

type LocaleHomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LocaleHomePage({ params }: LocaleHomePageProps) {
  const { locale } = await params;

  return <LocalizedDashboardShell locale={locale as AppLocale} />;
}
