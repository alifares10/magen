import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import "@fontsource-variable/noto-sans-hebrew";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-plex-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Magen",
  description: "Real-time crisis monitoring dashboard for Israel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className={`${plexSans.variable} antialiased`}>{children}</body>
    </html>
  );
}
