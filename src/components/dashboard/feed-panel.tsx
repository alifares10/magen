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
      className="flex h-full flex-col overflow-hidden rounded-xl bg-md3-surface-container-low"
    >
      {/* Tabs */}
      <nav className="flex border-b border-md3-outline-variant/10" role="tablist" aria-label={content.feedTitle}>
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
      </nav>

      {/* Scrollable Feed */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4" role="tabpanel">
        {shouldShowFeedLoading ? (
          <p className="text-sm text-md3-outline">{content.statusLoading}</p>
        ) : null}

        {shouldShowFeedError ? (
          <p className="text-sm text-md3-error">{content.statusError}</p>
        ) : null}

        {!shouldShowFeedLoading && !shouldShowFeedError && activeTabFilteredCount === 0 ? (
          <p className="text-sm text-md3-outline">
            {hasActiveFilters ? content.filterNoMatches : content.noFeedItems}
          </p>
        ) : null}

        {!shouldShowFeedLoading && !shouldShowFeedError ? (
          <AnimatePresence mode="popLayout">
            <div className="space-y-4">
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
            </div>
          </AnimatePresence>
        ) : null}
      </div>

      {/* Feed Control */}
      <div className="bg-md3-surface-container p-4">
        {lastUpdated ? (
          <p className="mb-2 text-[10px] text-md3-outline">
            {content.updatedLabel}: {formatDateTime(lastUpdated)}
          </p>
        ) : null}
        <button
          type="button"
          className="w-full rounded border border-md3-outline-variant/20 bg-md3-surface-container-highest py-2 font-[family-name:var(--font-label)] text-xs font-bold uppercase transition-colors hover:bg-md3-surface-container-high"
        >
          View Full History
        </button>
      </div>
    </motion.aside>
  );
}

export type { FeedPanelContent };
