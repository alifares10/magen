"use client";

import { AnimatePresence } from "framer-motion";
import { useLiveFeedTabs } from "@/components/feed/use-live-feed-tabs";
import { useFeedPageFilters } from "@/components/feed/hooks/use-feed-page-filters";
import { useSourceHealth } from "@/components/dashboard/hooks/use-source-health";
import { useStreams } from "@/components/dashboard/hooks/use-streams";
import { CommandBar, type CommandBarContent } from "@/components/dashboard/command-bar";
import { FilterBar, type FilterBarContent } from "@/components/dashboard/filter-bar";
import { AlertHero, type AlertHeroContent } from "@/components/dashboard/alert-hero";
import { FeedTabButton } from "@/components/dashboard/feed-tab-button";
import { FeedItemCard } from "@/components/dashboard/feed-item-card";
import { StreamPanel, type StreamPanelContent } from "@/components/streams/stream-panel";
import { MobileBottomNav, type MobileBottomNavContent } from "@/components/navigation/mobile-bottom-nav";
import { formatDateTime } from "@/lib/feed/client";
import type { AlertFeedItem, NewsFeedItem, OfficialUpdateFeedItem } from "@/lib/schemas/feed";

type LiveFeedPageContent = {
  commandBar: CommandBarContent;
  filterBar: FilterBarContent;
  alertHero: AlertHeroContent;
  stream: StreamPanelContent;
  bottomNav: MobileBottomNavContent;
  chronologicalFeedTitle: string;
  liveCoverageTitle: string;
  viewFullHistoryLabel: string;
  feedTabs: {
    alerts: string;
    news: string;
    official: string;
  };
  feedItemTypeLabels: {
    alerts: string;
    official: string;
    news: string;
  };
  statusLoading: string;
  statusError: string;
  noFeedItems: string;
  locationLabel: string;
  sourceLabel: string;
  publishedLabel: string;
  updatedLabel: string;
};

type LiveFeedPageProps = {
  content: LiveFeedPageContent;
  initialFeedData?: {
    alerts: AlertFeedItem[];
    news: NewsFeedItem[];
    official: OfficialUpdateFeedItem[];
    loadedAt: number;
  };
};

export function LiveFeedPage({ content, initialFeedData }: LiveFeedPageProps) {
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
    initialAlertsLoading: !initialFeedData,
    initialAlertsData: initialFeedData?.alerts,
    initialNewsData: initialFeedData?.news,
    initialOfficialData: initialFeedData?.official,
    initialDataLoadedAt: initialFeedData?.loadedAt ?? null,
  });

  const {
    selectedRegion,
    setSelectedRegion,
    locationSearchQuery,
    setLocationSearchQuery,
    hasActiveFilters,
    availableRegions,
    filteredLatestAlert,
    rawLatestAlert,
    filteredAlerts,
    filteredNews,
    filteredOfficial,
  } = useFeedPageFilters({
    alertsData: alertsState.data,
    newsData: newsState.data,
    officialData: officialState.data,
    activeTab,
  });

  const { overallSourceHealthStatus } = useSourceHealth({
    statusErrorMessage: content.statusError,
  });

  const { streamsState } = useStreams({
    statusErrorMessage: content.statusError,
  });

  const activeItems =
    activeTab === "alerts"
      ? filteredAlerts
      : activeTab === "news"
        ? filteredNews
        : filteredOfficial;

  return (
    <div className="flex min-h-screen flex-col bg-md3-surface pt-14 pb-16 text-md3-on-surface md:pb-0">
      <CommandBar
        content={content.commandBar}
        overallSourceHealthStatus={overallSourceHealthStatus}
        activeHref="/feed"
      />

      <FilterBar
        content={content.filterBar}
        selectedRegion={selectedRegion}
        onRegionChange={setSelectedRegion}
        locationSearchQuery={locationSearchQuery}
        onLocationSearchChange={setLocationSearchQuery}
        availableRegions={availableRegions}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-4 md:px-6">
          {/* Alert Hero */}
          <AlertHero
            content={content.alertHero}
            filteredLatestAlert={filteredLatestAlert}
            rawLatestAlert={rawLatestAlert}
            isLoading={alertsState.isLoading}
            errorMessage={alertsState.errorMessage}
            lastUpdated={alertsState.lastUpdated}
            hasActiveFilters={hasActiveFilters}
          />

          {/* Chronological Feed */}
          <section>
            <h2 className="mb-4 font-[family-name:var(--font-label)] text-xs font-bold uppercase tracking-[0.2em] text-md3-on-surface-variant">
              {content.chronologicalFeedTitle}
            </h2>

            <div className="mb-4 flex border-b border-md3-outline-variant/10" role="tablist" aria-label={content.chronologicalFeedTitle}>
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

            <div role="tabpanel">
              {shouldShowFeedLoading ? (
                <p className="py-8 text-center text-sm text-md3-on-surface-variant">{content.statusLoading}</p>
              ) : null}

              {shouldShowFeedError ? (
                <p className="py-8 text-center text-sm text-md3-error">{content.statusError}</p>
              ) : null}

              {!shouldShowFeedLoading && !shouldShowFeedError && activeItems.length === 0 ? (
                <p className="py-8 text-center text-sm text-md3-on-surface-variant">{content.noFeedItems}</p>
              ) : null}

              {!shouldShowFeedLoading && !shouldShowFeedError ? (
                <AnimatePresence mode="popLayout">
                  <div className="space-y-3">
                    {activeItems.map((item, index) => (
                      <FeedItemCard
                        key={item.id}
                        item={item}
                        type={activeTab}
                        typeLabels={content.feedItemTypeLabels}
                        locationLabel={content.locationLabel}
                        sourceLabel={content.sourceLabel}
                        publishedLabel={content.publishedLabel}
                        index={index}
                        variant="full"
                      />
                    ))}
                  </div>
                </AnimatePresence>
              ) : null}
            </div>

            {activeFeedState.lastUpdated ? (
              <p className="mt-4 text-[10px] text-md3-outline">
                {content.updatedLabel}: {formatDateTime(activeFeedState.lastUpdated)}
              </p>
            ) : null}
          </section>

          {/* Live Media Coverage */}
          <section>
            <h2 className="mb-4 font-[family-name:var(--font-label)] text-xs font-bold uppercase tracking-[0.2em] text-md3-on-surface-variant">
              {content.liveCoverageTitle}
            </h2>
            <StreamPanel content={content.stream} streamsState={streamsState} />
          </section>
        </div>
      </main>

      <MobileBottomNav content={content.bottomNav} activeHref="/feed" />
    </div>
  );
}

export type { LiveFeedPageContent };
