"use client";

import { motion, useReducedMotion } from "framer-motion";
import { formatDateTime, type AsyncState } from "@/lib/feed/client";
import type { LiveStreamOverviewItem } from "@/lib/schemas/feed";

type StreamPanelContent = {
  title: string;
  liveTitlePrefix: string;
  subtitle: string;
  contextLabel: string;
  empty: string;
  sourceFallbackLabel: string;
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
    <motion.section
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.36 }}
      className="shrink-0 rounded-xl bg-md3-surface-container-lowest p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-2 w-2 rounded-full bg-md3-error animate-pulse" />
          <h3 className="font-[family-name:var(--font-label)] text-xs font-bold uppercase tracking-widest">
            {primaryStream
              ? `${content.liveTitlePrefix}: ${primaryStream.title}`
              : content.title}
          </h3>
        </div>
        <span className="font-[family-name:var(--font-label)] text-[10px] uppercase tracking-widest text-md3-outline">
          {content.contextLabel}
        </span>
      </div>

      {streamsState.isLoading && !primaryStream ? (
        <p className="text-xs text-md3-outline">{content.statusLoading}</p>
      ) : null}

      {!streamsState.isLoading && !primaryStream ? (
        <p className="text-xs text-md3-on-surface-variant">{content.empty}</p>
      ) : null}

      {primaryStream ? (
        <div className="group relative aspect-video overflow-hidden rounded-lg bg-md3-surface-container-highest">
          <iframe
            className="h-full w-full"
            src={primaryStream.embedUrl}
            title={primaryStream.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
          {/* Signal strength indicator */}
          <div className="absolute bottom-4 start-4 flex gap-4">
            <div className="rounded bg-md3-surface-container/80 p-2 backdrop-blur">
              <p className="font-[family-name:var(--font-label)] text-[10px] uppercase text-md3-outline">
                {content.sourceLabel}
              </p>
              <p className="text-xs font-bold text-emerald-400">
                {primaryStream.sourceName ?? content.sourceFallbackLabel}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {primaryStream?.watchUrl ? (
        <a
          href={primaryStream.watchUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex min-h-11 items-center rounded-md px-2 text-xs font-semibold text-md3-primary underline-offset-2 hover:bg-md3-primary/10 hover:underline"
        >
          {content.watchLabel}
        </a>
      ) : null}

      {streamsState.errorMessage ? (
        <p className="mt-3 text-xs text-md3-error">
          {streamsState.errorMessage}
        </p>
      ) : null}

      {streamsState.lastUpdated ? (
        <p className="mt-3 text-[10px] text-md3-outline">
          {content.updatedLabel}: {formatDateTime(streamsState.lastUpdated)}
        </p>
      ) : null}
    </motion.section>
  );
}

export type { StreamPanelContent };
