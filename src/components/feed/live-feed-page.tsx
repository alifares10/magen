"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useLiveFeedTabs } from "@/components/feed/use-live-feed-tabs";
import { FeedTabButton } from "@/components/dashboard/feed-tab-button";
import { FeedItemCard } from "@/components/dashboard/feed-item-card";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { BrowserNotificationOptIn } from "@/components/notifications/browser-notification-opt-in";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import {
  formatDateTime,
  getAlertLocation,
  getAlertsData,
  TAB_FETCH_INTERVALS,
  type AsyncState,
} from "@/lib/feed/client";
import type { AlertFeedItem } from "@/lib/schemas/feed";

type LiveFeedPageContent = {
  title: string;
  description: string;
  latestAlertTitle: string;
  latestAlertEmpty: string;
  feedTabs: {
    alerts: string;
    news: string;
    official: string;
  };
  statusLoading: string;
  statusError: string;
  noFeedItems: string;
  sourceLabel: string;
  publishedLabel: string;
  severityLabel: string;
  locationLabel: string;
  updatedLabel: string;
  themeSwitcher: {
    label: string;
    dark: string;
    light: string;
  };
};

type LiveFeedPageProps = {
  content: LiveFeedPageContent;
};

export function LiveFeedPage({ content }: LiveFeedPageProps) {
  const prefersReducedMotion = useReducedMotion();

  const [latestAlertState, setLatestAlertState] = useState<
    AsyncState<AlertFeedItem | null>
  >({
    data: null,
    isLoading: true,
    errorMessage: null,
    lastUpdated: null,
  });
  const {
    activeTab,
    setActiveTab,
    alertsState,
    newsState,
    officialState,
    activeFeedState,
    shouldShowFeedLoading,
    shouldShowFeedError,
  } = useLiveFeedTabs({
    statusErrorMessage: content.statusError,
    initialAlertsLoading: true,
  });

  const activeItems =
    activeTab === "alerts"
      ? alertsState.data
      : activeTab === "news"
        ? newsState.data
        : officialState.data;

  useEffect(() => {
    let isActive = true;

    const loadLatestAlert = async () => {
      setLatestAlertState((prevState) => ({
        ...prevState,
        isLoading: true,
        errorMessage: null,
      }));

      try {
        const data = await getAlertsData(1);

        if (!isActive) {
          return;
        }

        setLatestAlertState({
          data: data[0] ?? null,
          isLoading: false,
          errorMessage: null,
          lastUpdated: Date.now(),
        });
      } catch (error) {
        if (!isActive) {
          return;
        }

        void error;

        setLatestAlertState((prevState) => ({
          ...prevState,
          isLoading: false,
          errorMessage: content.statusError,
        }));
      }
    };

    void loadLatestAlert();

    const intervalId = window.setInterval(() => {
      void loadLatestAlert();
    }, TAB_FETCH_INTERVALS.alerts);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [content.statusError]);

  const hasAlert = Boolean(latestAlertState.data);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] text-slate-900 dark:text-slate-100">
      {/* Command Bar */}
      <motion.header
        initial={prefersReducedMotion ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="sticky top-0 z-50 flex h-12 items-center justify-between border-b border-[var(--border-panel)] bg-[var(--surface-raised)] px-4 backdrop-blur"
      >
        <div className="flex items-center gap-3">
          <h1 className="font-[family-name:var(--font-display)] text-xs font-bold uppercase tracking-[0.25em] text-slate-400 dark:text-slate-200">
            <span className="text-amber-500 dark:text-amber-400">{content.title}</span>
          </h1>
          <span className="hidden text-xs text-slate-500 md:inline">{content.description}</span>
        </div>

        <div className="flex items-center gap-2">
          <ThemeSwitcher content={content.themeSwitcher} className="text-xs" toggleSize={12} compact />
          <BrowserNotificationOptIn className="text-xs" compact />
          <LocaleSwitcher className="text-xs" compact />
        </div>
      </motion.header>

      {/* Scrollable content */}
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Latest Alert — AlertHero style */}
        <motion.article
          initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.06 }}
          className={`relative overflow-hidden px-5 pb-5 pt-4 ${
            hasAlert
              ? "border-s-4 border-rose-500 bg-rose-50 dark:bg-gradient-to-br dark:from-[oklch(0.18_0.06_15)] dark:to-[oklch(0.12_0.04_20)]"
              : "bg-[var(--surface-raised)]"
          }`}
          style={
            hasAlert && !prefersReducedMotion
              ? {
                  boxShadow: "inset 0 0 30px oklch(0.55 0.22 15 / 8%), 0 0 20px oklch(0.55 0.22 15 / 5%)",
                }
              : undefined
          }
        >
          <h2 className="font-[family-name:var(--font-display)] text-base font-semibold text-rose-900 dark:text-rose-100">
            {content.latestAlertTitle}
          </h2>

          {latestAlertState.isLoading && !latestAlertState.data ? (
            <p className="mt-2 text-sm text-rose-800/80 dark:text-rose-200/80">{content.statusLoading}</p>
          ) : latestAlertState.data ? (
            <div className="mt-3 space-y-3 text-sm">
              <p className="font-[family-name:var(--font-display)] text-lg font-bold text-rose-950 dark:text-rose-50">
                {latestAlertState.data.title}
              </p>
              {latestAlertState.data.message ? (
                <p className="text-rose-900/90 dark:text-rose-100/90">{latestAlertState.data.message}</p>
              ) : null}
              <div className="grid gap-1 rounded-sm border border-rose-300/50 bg-rose-100/50 px-3 py-2 text-xs text-rose-900 sm:grid-cols-2 dark:border-rose-800/40 dark:bg-black/20 dark:text-rose-200">
                <p>
                  {content.locationLabel}: {getAlertLocation(latestAlertState.data)}
                </p>
                <p>
                  {content.sourceLabel}: {latestAlertState.data.sourceName}
                </p>
                <p>
                  {content.severityLabel}: {latestAlertState.data.severity}
                </p>
                <p>
                  {content.publishedLabel}: {formatDateTime(latestAlertState.data.publishedAt)}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3.5 7L6 9.5L10.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <p className="text-sm text-slate-600 dark:text-slate-300">{content.latestAlertEmpty}</p>
            </div>
          )}

          {latestAlertState.errorMessage ? (
            <p className="mt-3 text-xs text-rose-700 dark:text-rose-300">{content.statusError}</p>
          ) : null}
        </motion.article>

        {/* Feed Panel */}
        <motion.section
          initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12 }}
          className="flex flex-1 flex-col overflow-hidden bg-[var(--surface-raised)]"
        >
          <div className="flex border-b border-[var(--border-panel)]" role="tablist" aria-label={content.title}>
            <FeedTabButton
              label={content.feedTabs.alerts}
              isActive={activeTab === "alerts"}
              onClick={() => setActiveTab("alerts")}
            />
            <FeedTabButton
              label={content.feedTabs.news}
              isActive={activeTab === "news"}
              onClick={() => setActiveTab("news")}
            />
            <FeedTabButton
              label={content.feedTabs.official}
              isActive={activeTab === "official"}
              onClick={() => setActiveTab("official")}
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto" role="tabpanel">
            {shouldShowFeedLoading ? (
              <p className="p-4 text-sm text-slate-500">{content.statusLoading}</p>
            ) : null}

            {shouldShowFeedError ? (
              <p className="p-4 text-sm text-rose-400">{content.statusError}</p>
            ) : null}

            {!shouldShowFeedLoading && !shouldShowFeedError && activeItems.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">{content.noFeedItems}</p>
            ) : null}

            {!shouldShowFeedLoading && !shouldShowFeedError ? (
              <AnimatePresence mode="popLayout">
                <ul>
                  {activeItems.map((item, index) => (
                    <FeedItemCard
                      key={item.id}
                      item={item}
                      type={activeTab}
                      locationLabel={content.locationLabel}
                      sourceLabel={content.sourceLabel}
                      publishedLabel={content.publishedLabel}
                      index={index}
                    />
                  ))}
                </ul>
              </AnimatePresence>
            ) : null}
          </div>

          {activeFeedState.lastUpdated ? (
            <p className="border-t border-[var(--border-panel)] px-4 py-2 text-[10px] text-slate-600">
              {content.updatedLabel}: {formatDateTime(activeFeedState.lastUpdated)}
            </p>
          ) : null}
        </motion.section>
      </div>
    </div>
  );
}

export type { LiveFeedPageContent };
