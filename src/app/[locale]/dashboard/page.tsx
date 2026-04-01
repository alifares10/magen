import type { AppLocale } from "@/i18n/routing";
import { LocalizedDashboardShell } from "@/components/layout/localized-dashboard-shell";

export const dynamic = "force-dynamic";

type LocalizedDashboardPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LocalizedDashboardPage({ params }: LocalizedDashboardPageProps) {
  const { locale } = await params;

  return <LocalizedDashboardShell locale={locale as AppLocale} />;
}
