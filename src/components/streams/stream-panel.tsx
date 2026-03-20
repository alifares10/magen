"use client";

import { motion, useReducedMotion } from "framer-motion";
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
  const prefersReducedMotion = useReducedMotion();
  const primaryStream = streamsState.data[0] ?? null;

  return (
    <motion.article
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.36 }}
      className="border-t border-[var(--border-panel)] bg-[var(--surface-raised)] p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold text-slate-200 dark:text-slate-200">
            {content.title}
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">{content.subtitle}</p>
        </div>
        <span className="inline-flex rounded-sm border border-amber-700/50 bg-amber-950/40 px-2 py-0.5 text-[10px] font-medium text-amber-300">
          {content.contextLabel}
        </span>
      </div>

      {streamsState.isLoading && !primaryStream ? (
        <p className="mt-3 text-xs text-slate-500">{content.statusLoading}</p>
      ) : null}

      {!streamsState.isLoading && !primaryStream ? (
        <p className="mt-3 text-xs text-slate-400">{content.empty}</p>
      ) : null}

      {primaryStream ? (
        <div className="mt-3 flex flex-col gap-3 lg:flex-row">
          <iframe
            className="h-48 w-full border border-slate-700/40 bg-black lg:h-56 lg:w-96"
            src={primaryStream.embedUrl}
            title={primaryStream.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />

          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-100">{primaryStream.title}</p>

            {primaryStream.sourceName ? (
              <p className="text-xs text-slate-400">
                {content.sourceLabel}: {primaryStream.sourceName}
              </p>
            ) : null}

            {primaryStream.watchUrl ? (
              <a
                href={primaryStream.watchUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex text-xs font-semibold text-amber-400 underline-offset-2 hover:underline"
              >
                {content.watchLabel}
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      {streamsState.errorMessage ? (
        <p className="mt-3 text-xs text-rose-400">{streamsState.errorMessage}</p>
      ) : null}

      {streamsState.lastUpdated ? (
        <p className="mt-3 text-[10px] text-slate-600">
          {content.updatedLabel}: {formatDateTime(streamsState.lastUpdated)}
        </p>
      ) : null}
    </motion.article>
  );
}

export type { StreamPanelContent };
