"use client";

import { useEffect, useState } from "react";
import { useLiveFeedTabs } from "@/components/feed/use-live-feed-tabs";
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

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6">
      <header className="mb-4 rounded-2xl border border-amber-200/70 bg-white/85 px-5 py-4 shadow-[0_12px_30px_-22px_rgba(15,23,42,0.45)] backdrop-blur dark:border-amber-800/45 dark:bg-transparent dark:shadow-[0_12px_30px_-22px_rgba(2,6,23,0.9)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl dark:text-slate-50">
              {content.title}
            </h1>
            <p className="mt-1 text-sm text-slate-700 md:text-base dark:text-slate-300">
              {content.description}
            </p>
          </div>

          <div className="flex flex-wrap items-start gap-3">
            <ThemeSwitcher content={content.themeSwitcher} className="min-w-[144px]" />
            <BrowserNotificationOptIn className="min-w-[190px]" />
            <LocaleSwitcher className="min-w-[130px]" />
          </div>
        </div>
      </header>

      <article className="mb-4 rounded-2xl border border-rose-300/70 bg-rose-50 p-5 dark:border-rose-800/65 dark:bg-transparent">
        <h2 className="text-base font-semibold text-rose-900 dark:text-rose-100">
          {content.latestAlertTitle}
        </h2>

        {latestAlertState.isLoading && !latestAlertState.data ? (
          <p className="mt-2 text-sm text-rose-900/80 dark:text-rose-200">{content.statusLoading}</p>
        ) : latestAlertState.data ? (
          <div className="mt-2 space-y-2 text-sm text-rose-950 dark:text-rose-100">
            <p className="font-semibold">{latestAlertState.data.title}</p>
            {latestAlertState.data.message ? (
              <p>{latestAlertState.data.message}</p>
            ) : null}
            <p className="text-xs text-rose-950/90 dark:text-rose-200">
              {content.locationLabel}: {getAlertLocation(latestAlertState.data)}
            </p>
            <p className="text-xs text-rose-950/90 dark:text-rose-200">
              {content.sourceLabel}: {latestAlertState.data.sourceName}
            </p>
            <p className="text-xs text-rose-950/90 dark:text-rose-200">
              {content.severityLabel}: {latestAlertState.data.severity}
            </p>
            <p className="text-xs text-rose-950/90 dark:text-rose-200">
              {content.publishedLabel}: {formatDateTime(latestAlertState.data.publishedAt)}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-rose-950 dark:text-rose-100">{content.latestAlertEmpty}</p>
        )}

        {latestAlertState.errorMessage ? (
          <p className="mt-3 text-xs text-rose-800 dark:text-rose-200">{content.statusError}</p>
        ) : null}
      </article>

      <div className="rounded-2xl border border-zinc-300/80 bg-white/85 p-5 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.45)] dark:border-slate-700/80 dark:bg-transparent dark:shadow-[0_14px_30px_-24px_rgba(2,6,23,0.9)]">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label={content.title}>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "alerts"}
            onClick={() => {
              setActiveTab("alerts");
            }}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              activeTab === "alerts"
                ? "border-rose-300 bg-rose-100 text-rose-900 dark:border-rose-800/70 dark:bg-rose-950/55 dark:text-rose-100"
                : "border-zinc-300 bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800/85"
            }`}
          >
            {content.feedTabs.alerts}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "news"}
            onClick={() => {
              setActiveTab("news");
            }}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              activeTab === "news"
                ? "border-zinc-300 bg-zinc-200 text-zinc-950 dark:border-slate-600 dark:bg-slate-700/85 dark:text-slate-100"
                : "border-zinc-300 bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800/85"
            }`}
          >
            {content.feedTabs.news}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "official"}
            onClick={() => {
              setActiveTab("official");
            }}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              activeTab === "official"
                ? "border-sky-300 bg-sky-100 text-sky-900 dark:border-sky-800/70 dark:bg-sky-950/55 dark:text-sky-100"
                : "border-zinc-300 bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800/85"
            }`}
          >
            {content.feedTabs.official}
          </button>
        </div>

        <div className="mt-4 space-y-2" role="tabpanel">
          {shouldShowFeedLoading ? (
            <p className="text-sm text-slate-700 dark:text-slate-300">{content.statusLoading}</p>
          ) : null}

          {shouldShowFeedError ? (
            <p className="text-sm text-rose-700 dark:text-rose-300">{content.statusError}</p>
          ) : null}

          {!shouldShowFeedLoading &&
          !shouldShowFeedError &&
          activeTab === "alerts" &&
          alertsState.data.length === 0 ? (
            <p className="text-sm text-slate-700 dark:text-slate-300">{content.noFeedItems}</p>
          ) : null}

          {!shouldShowFeedLoading &&
          !shouldShowFeedError &&
          activeTab === "news" &&
          newsState.data.length === 0 ? (
            <p className="text-sm text-slate-700 dark:text-slate-300">{content.noFeedItems}</p>
          ) : null}

          {!shouldShowFeedLoading &&
          !shouldShowFeedError &&
          activeTab === "official" &&
          officialState.data.length === 0 ? (
            <p className="text-sm text-slate-700 dark:text-slate-300">{content.noFeedItems}</p>
          ) : null}

          {!shouldShowFeedLoading && !shouldShowFeedError && activeTab === "alerts" ? (
            <ul className="space-y-2">
              {alertsState.data.map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 dark:border-rose-800/55 dark:bg-slate-900/78"
                >
                  <p className="text-sm font-semibold text-rose-950 dark:text-rose-100">{item.title}</p>
                  <p className="mt-1 text-xs text-rose-900/90 dark:text-rose-200">
                    {content.locationLabel}: {getAlertLocation(item)}
                  </p>
                  <p className="text-xs text-rose-900/90 dark:text-rose-200">
                    {content.publishedLabel}: {formatDateTime(item.publishedAt)}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}

          {!shouldShowFeedLoading && !shouldShowFeedError && activeTab === "news" ? (
            <ul className="space-y-2">
              {newsState.data.map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-slate-700/80 dark:bg-slate-900/78"
                >
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-zinc-950 underline-offset-2 hover:underline dark:text-zinc-100"
                  >
                    {item.title}
                  </a>
                  <p className="mt-1 text-xs text-zinc-700 dark:text-zinc-300">
                    {content.sourceLabel}: {item.sourceName}
                  </p>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300">
                    {content.publishedLabel}: {formatDateTime(item.publishedAt)}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}

          {!shouldShowFeedLoading && !shouldShowFeedError && activeTab === "official" ? (
            <ul className="space-y-2">
              {officialState.data.map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 dark:border-sky-800/55 dark:bg-slate-900/78"
                >
                  <p className="text-sm font-semibold text-sky-950 dark:text-sky-100">{item.title}</p>
                  <p className="mt-1 text-xs text-sky-900/90 dark:text-sky-200">{item.body}</p>
                  <p className="mt-1 text-xs text-sky-900/90 dark:text-sky-200">
                    {content.publishedLabel}: {formatDateTime(item.publishedAt)}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}

          {activeFeedState.lastUpdated ? (
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              {content.updatedLabel}: {formatDateTime(activeFeedState.lastUpdated)}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export type { LiveFeedPageContent };
