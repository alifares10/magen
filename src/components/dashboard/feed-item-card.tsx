"use client";

import { motion, useReducedMotion } from "framer-motion";
import { formatDateTime, getAlertLocation } from "@/lib/feed/client";
import type { AlertFeedItem, NewsFeedItem, OfficialUpdateFeedItem } from "@/lib/schemas/feed";
import type { FeedTabKey } from "@/lib/feed/client";
import { stripHtml } from "@/lib/strip-html";

type FeedItemCardProps = {
  item: AlertFeedItem | NewsFeedItem | OfficialUpdateFeedItem;
  type: FeedTabKey;
  typeLabels: {
    alerts: string;
    official: string;
    news: string;
  };
  locationLabel: string;
  sourceLabel: string;
  publishedLabel: string;
  index: number;
  variant?: "compact" | "full";
};

function getSeverityClasses(type: FeedTabKey): string {
  switch (type) {
    case "alerts":
      return "text-md3-error";
    case "official":
      return "text-emerald-400";
    case "news":
      return "text-md3-secondary";
  }
}

function getSeverityLabel(
  type: FeedTabKey,
  typeLabels: FeedItemCardProps["typeLabels"],
): string {
  switch (type) {
    case "alerts":
      return typeLabels.alerts;
    case "official":
      return typeLabels.official;
    case "news":
      return typeLabels.news;
  }
}

function getBadgeClasses(type: FeedTabKey): string {
  switch (type) {
    case "alerts":
      return "bg-md3-error-container text-md3-error";
    case "official":
      return "bg-emerald-500/10 text-emerald-400";
    case "news":
      return "bg-md3-secondary/10 text-md3-secondary";
  }
}

function getItemDescription(
  item: AlertFeedItem | NewsFeedItem | OfficialUpdateFeedItem,
  type: FeedTabKey,
): string | null {
  if (type === "alerts" && "message" in item) {
    return (item as AlertFeedItem).message;
  }
  if (type === "news" && "summary" in item) {
    return (item as NewsFeedItem).summary;
  }
  if (type === "official" && "body" in item) {
    return stripHtml((item as OfficialUpdateFeedItem).body);
  }
  return null;
}

export function FeedItemCard({
  item,
  type,
  typeLabels,
  locationLabel,
  sourceLabel,
  publishedLabel,
  index,
  variant = "compact",
}: FeedItemCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const isFull = variant === "full";

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0, x: -12 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      className={`group cursor-pointer ${isFull ? "rounded-lg bg-md3-surface-container-low p-4" : ""}`}
    >
      <div className="mb-1 flex items-center justify-between">
        <span className="font-mono text-[10px] text-md3-outline">
          {formatDateTime(item.publishedAt)}
        </span>
        {isFull ? (
          <span className={`rounded px-2 py-0.5 font-[family-name:var(--font-label)] text-[10px] font-bold uppercase tracking-widest ${getBadgeClasses(type)}`}>
            {getSeverityLabel(type, typeLabels)}
          </span>
        ) : (
          <span className={`font-[family-name:var(--font-label)] text-[10px] font-bold uppercase ${getSeverityClasses(type)}`}>
            {getSeverityLabel(type, typeLabels)}
          </span>
        )}
      </div>

      {type === "news" && "url" in item ? (
        <a
          href={(item as NewsFeedItem).url}
          target="_blank"
          rel="noreferrer"
          className={`mb-1 font-bold text-md3-on-surface underline-offset-2 transition-colors group-hover:text-md3-primary hover:underline ${isFull ? "text-sm" : "text-xs"}`}
        >
          {item.title}
        </a>
      ) : (
        <p className={`mb-1 font-bold text-md3-on-surface transition-colors group-hover:text-md3-primary ${isFull ? "text-sm" : "text-xs"}`}>
          {item.title}
        </p>
      )}

      {isFull && (() => {
        const description = getItemDescription(item, type);
        return description ? (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-md3-on-surface-variant">
            {description}
          </p>
        ) : null;
      })()}

      <p className={`font-[family-name:var(--font-label)] text-[10px] uppercase text-md3-on-surface-variant ${isFull ? "mt-3" : ""}`}>
        {type === "alerts" && "locationName" in item
          ? `${(item as AlertFeedItem).sourceName ?? sourceLabel} • ${locationLabel}: ${getAlertLocation(item as AlertFeedItem)}`
          : `${"sourceName" in item && item.sourceName ? item.sourceName : sourceLabel} • ${publishedLabel}: ${formatDateTime(item.publishedAt)}`}
      </p>

      {!isFull && <div className="mt-4 h-px bg-md3-outline-variant/10" />}
    </motion.div>
  );
}
