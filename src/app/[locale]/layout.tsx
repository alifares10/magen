import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { DirectionProvider } from "@/components/providers/direction-provider";
import { routing, type AppLocale } from "@/i18n/routing";
import { getDirectionForLocale } from "@/lib/i18n/direction";

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();
  const appLocale = locale as AppLocale;
  const direction = getDirectionForLocale(appLocale);

  return (
    <NextIntlClientProvider locale={appLocale} messages={messages}>
      <DirectionProvider locale={appLocale} direction={direction}>
        <NotificationCenter />
        {children}
      </DirectionProvider>
    </NextIntlClientProvider>
  );
}
