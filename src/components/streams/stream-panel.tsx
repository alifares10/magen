"use client";

import { formatDateTime, type AsyncState } from "@/lib/feed/client";
import type { LiveStreamOverviewItem } from "@/lib/schemas/feed";

type StreamPanelContent = {
  title: string;
  subtitle: string;
  contextLabel: string;
  empty: string;
  watchLabel: string;
  sourceLabel: string;
  updatedLabel: string;
  statusLoading: string;
};

type StreamPanelProps = {
  content: StreamPanelContent;
  streamsState: AsyncState<LiveStreamOverviewItem[]>;
};

export function StreamPanel({ content, streamsState }: StreamPanelProps) {
  const primaryStream = streamsState.data[0] ?? null;

  return (
    <article className="rounded-2xl border border-slate-300/80 bg-slate-50/70 p-5 dark:border-slate-700/80 dark:bg-transparent">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">{content.title}</h2>
          <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{content.subtitle}</p>
        </div>
        <span className="inline-flex rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900 dark:border-amber-800/70 dark:bg-amber-950/55 dark:text-amber-100">
          {content.contextLabel}
        </span>
      </div>

      {streamsState.isLoading && !primaryStream ? (
        <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">{content.statusLoading}</p>
      ) : null}

      {!streamsState.isLoading && !primaryStream ? (
        <p className="mt-3 text-sm text-slate-800 dark:text-slate-200">{content.empty}</p>
      ) : null}

      {primaryStream ? (
        <div className="mt-4 space-y-3">
          <iframe
            className="h-64 w-full rounded-xl border border-slate-200 bg-black md:h-72 dark:border-slate-700"
            src={primaryStream.embedUrl}
            title={primaryStream.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />

          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">{primaryStream.title}</p>

            {primaryStream.sourceName ? (
              <p className="text-xs text-slate-700 dark:text-slate-300">
                {content.sourceLabel}: {primaryStream.sourceName}
              </p>
            ) : null}

            {primaryStream.watchUrl ? (
              <a
                href={primaryStream.watchUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex text-xs font-semibold text-slate-900 underline-offset-2 hover:underline dark:text-slate-100"
              >
                {content.watchLabel}
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      {streamsState.errorMessage ? (
        <p className="mt-3 text-xs text-rose-700 dark:text-rose-300">{streamsState.errorMessage}</p>
      ) : null}

      {streamsState.lastUpdated ? (
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          {content.updatedLabel}: {formatDateTime(streamsState.lastUpdated)}
        </p>
      ) : null}
    </article>
  );
}

export type { StreamPanelContent };
