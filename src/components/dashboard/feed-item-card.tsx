"use client";

import { motion, useReducedMotion } from "framer-motion";
import { formatDateTime, getAlertLocation } from "@/lib/feed/client";
import type { AlertFeedItem, NewsFeedItem, OfficialUpdateFeedItem } from "@/lib/schemas/feed";
import type { FeedTabKey } from "@/lib/feed/client";

type FeedItemCardProps = {
  item: AlertFeedItem | NewsFeedItem | OfficialUpdateFeedItem;
  type: FeedTabKey;
  locationLabel: string;
  sourceLabel: string;
  publishedLabel: string;
  index: number;
};

export function FeedItemCard({
  item,
  type,
  locationLabel,
  sourceLabel,
  publishedLabel,
  index,
}: FeedItemCardProps) {
  const prefersReducedMotion = useReducedMotion();

  const borderColor =
    type === "alerts"
      ? "border-rose-800/30"
      : type === "official"
        ? "border-sky-800/30"
        : "border-slate-700/30";

  return (
    <motion.li
      initial={prefersReducedMotion ? false : { opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0, x: -12 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      className={`border-b ${borderColor} px-3 py-2.5`}
    >
      {type === "news" && "url" in item ? (
        <a
          href={(item as NewsFeedItem).url}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-semibold text-slate-100 underline-offset-2 hover:underline"
        >
          {item.title}
        </a>
      ) : (
        <p className="text-sm font-semibold text-slate-100">{item.title}</p>
      )}

      <div className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-slate-400">
        {type === "alerts" && "locationName" in item ? (
          <span>
            {locationLabel}: {getAlertLocation(item as AlertFeedItem)}
          </span>
        ) : null}
        {type === "official" && "body" in item ? (
          <span className="line-clamp-1 text-slate-500">
            {(item as OfficialUpdateFeedItem).body}
          </span>
        ) : null}
        {"sourceName" in item && item.sourceName ? (
          <span>
            {sourceLabel}: {item.sourceName}
          </span>
        ) : null}
        <span>{publishedLabel}: {formatDateTime(item.publishedAt)}</span>
      </div>
    </motion.li>
  );
}
