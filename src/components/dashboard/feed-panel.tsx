"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { FeedTabKey } from "@/lib/feed/client";
import { formatDateTime } from "@/lib/feed/client";
import type { AlertFeedItem, NewsFeedItem, OfficialUpdateFeedItem } from "@/lib/schemas/feed";
import { FeedTabButton } from "@/components/dashboard/feed-tab-button";
import { FeedItemCard } from "@/components/dashboard/feed-item-card";

type FeedPanelContent = {
  feedTitle: string;
  feedTabs: {
    alerts: string;
    news: string;
    official: string;
  };
  statusLoading: string;
  statusError: string;
  noFeedItems: string;
  filterNoMatches: string;
  locationLabel: string;
  sourceLabel: string;
  publishedLabel: string;
  updatedLabel: string;
};

type FeedPanelProps = {
  content: FeedPanelContent;
  activeTab: FeedTabKey;
  setActiveTab: (tab: FeedTabKey) => void;
  filteredAlerts: AlertFeedItem[];
  filteredNews: NewsFeedItem[];
  filteredOfficial: OfficialUpdateFeedItem[];
  activeTabFilteredCount: number;
  shouldShowFeedLoading: boolean;
  shouldShowFeedError: boolean;
  hasActiveFilters: boolean;
  lastUpdated: number | null;
};

export function FeedPanel({
  content,
  activeTab,
  setActiveTab,
  filteredAlerts,
  filteredNews,
  filteredOfficial,
  activeTabFilteredCount,
  shouldShowFeedLoading,
  shouldShowFeedError,
  hasActiveFilters,
  lastUpdated,
}: FeedPanelProps) {
  const prefersReducedMotion = useReducedMotion();

  const activeItems =
    activeTab === "alerts"
      ? filteredAlerts
      : activeTab === "news"
        ? filteredNews
        : filteredOfficial;

  return (
    <motion.aside
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.3 }}
      className="flex flex-col overflow-hidden bg-[var(--surface-raised)]"
    >
      <div className="flex items-center justify-between border-b border-[var(--border-panel)] px-4 pt-4 pb-0">
        <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold text-slate-200">
          {content.feedTitle}
        </h2>
      </div>

      <div className="flex border-b border-[var(--border-panel)]" role="tablist" aria-label={content.feedTitle}>
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

        {!shouldShowFeedLoading && !shouldShowFeedError && activeTabFilteredCount === 0 ? (
          <p className="p-4 text-sm text-slate-500">
            {hasActiveFilters ? content.filterNoMatches : content.noFeedItems}
          </p>
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

      {lastUpdated ? (
        <p className="border-t border-[var(--border-panel)] px-4 py-2 text-[10px] text-slate-600">
          {content.updatedLabel}: {formatDateTime(lastUpdated)}
        </p>
      ) : null}
    </motion.aside>
  );
}

export type { FeedPanelContent };
