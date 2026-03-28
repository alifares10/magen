"use client";

import { useDashboardOverview } from "@/components/dashboard/hooks/use-dashboard-overview";
import { useSourceHealth } from "@/components/dashboard/hooks/use-source-health";
import { useStreams } from "@/components/dashboard/hooks/use-streams";
import { useDashboardFilters } from "@/components/dashboard/hooks/use-dashboard-filters";
import { CommandBar } from "@/components/dashboard/command-bar";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { NewsTicker } from "@/components/dashboard/news-ticker";
import { AlertHero } from "@/components/dashboard/alert-hero";
import { OfficialGuidanceCard } from "@/components/dashboard/official-guidance-card";
import { SourceHealthBar } from "@/components/dashboard/source-health-bar";
import { WatchlistPanel } from "@/components/dashboard/watchlist-panel";
import { FeedPanel } from "@/components/dashboard/feed-panel";
import { StreamPanel } from "@/components/streams/stream-panel";
import { MobileBottomNav, type MobileBottomNavContent } from "@/components/navigation/mobile-bottom-nav";
type DashboardShellContent = {
  title: string;
  subtitle: string;
  regionFilterLabel: string;
  regionFilterAll: string;
  locationSearchLabel: string;
  locationSearchPlaceholder: string;
  filterNoMatches: string;
  tickerLabel: string;
  tickerFallback: string;
  tickerTypes: {
    alert: string;
    official: string;
    news: string;
  };
  tickerBreakingTag: string;
  latestAlertTitle: string;
  latestAlertEmpty: string;
  alertMessageFallback: string;
  officialTitle: string;
  officialEmpty: string;
  watchlistTitle: string;
  watchlistEmpty: string;
  watchlistMatchSuffix: string;
  feedTitle: string;
  feedTabs: {
    alerts: string;
    news: string;
    official: string;
  };
  statusLoading: string;
  statusError: string;
  noFeedItems: string;
  updatedLabel: string;
  sourceLabel: string;
  publishedLabel: string;
  severityLabel: string;
  locationLabel: string;
  streamTitle: string;
  streamSubtitle: string;
  streamContextLabel: string;
  streamEmpty: string;
  streamWatchLabel: string;
  sourceHealthTitle: string;
  sourceHealthOverallLabel: string;
  sourceHealthTypes: {
    officialAlerts: string;
    officialGuidance: string;
    rssNews: string;
  };
  sourceHealthStatuses: {
    healthy: string;
    degraded: string;
    down: string;
    unknown: string;
  };
  themeSwitcher: {
    label: string;
    dark: string;
    light: string;
  };
  bottomNav: MobileBottomNavContent;
};

type DashboardShellProps = {
  content: DashboardShellContent;
};

export function DashboardShell({ content }: DashboardShellProps) {
  const {
    overviewState,
    latestAlert,
    latestOfficialUpdate,
    watchedLocationMatches,
    tickerItems,
    feedTabs,
  } = useDashboardOverview({ statusErrorMessage: content.statusError });

  const {
    sourceHealthState,
    sourceHealthCategoriesByType,
    overallSourceHealthStatus,
  } = useSourceHealth({ statusErrorMessage: content.statusError });

  const { streamsState } = useStreams({
    statusErrorMessage: content.statusError,
  });

  const {
    selectedRegion,
    setSelectedRegion,
    locationSearchQuery,
    setLocationSearchQuery,
    hasActiveFilters,
    availableRegions,
    filteredLatestAlert,
    filteredLatestOfficialUpdate,
    filteredTickerItems,
    filteredWatchedLocationMatches,
    filteredAlerts,
    filteredNews,
    filteredOfficial,
    activeTabFilteredCount,
  } = useDashboardFilters({
    alertsData: feedTabs.alertsState.data,
    newsData: feedTabs.newsState.data,
    officialData: feedTabs.officialState.data,
    latestAlert,
    latestOfficialUpdate,
    watchedLocationMatches,
    tickerItems,
    topNews: overviewState.data?.topNews ?? [],
    activeTab: feedTabs.activeTab,
  });

  return (
    <div className="flex h-screen flex-col bg-md3-surface pt-14 pb-16 text-md3-on-surface md:pb-0">
      <CommandBar
        content={{
          title: "Magen",
          themeSwitcher: content.themeSwitcher,
          sourceHealthOverallLabel: content.sourceHealthOverallLabel,
          sourceHealthStatuses: content.sourceHealthStatuses,
        }}
        overallSourceHealthStatus={overallSourceHealthStatus}
      />

      <FilterBar
        content={{
          regionFilterLabel: content.regionFilterLabel,
          regionFilterAll: content.regionFilterAll,
          locationSearchLabel: content.locationSearchLabel,
          locationSearchPlaceholder: content.locationSearchPlaceholder,
        }}
        selectedRegion={selectedRegion}
        onRegionChange={setSelectedRegion}
        locationSearchQuery={locationSearchQuery}
        onLocationSearchChange={setLocationSearchQuery}
        availableRegions={availableRegions}
      />

      <NewsTicker
        content={{
          tickerLabel: content.tickerLabel,
          tickerFallback: content.tickerFallback,
          tickerTypes: content.tickerTypes,
          tickerBreakingTag: content.tickerBreakingTag,
          severityLabel: content.severityLabel,
          sourceLabel: content.sourceLabel,
          filterNoMatches: content.filterNoMatches,
        }}
        items={filteredTickerItems}
        hasActiveFilters={hasActiveFilters}
        allItemsCount={tickerItems.length}
      />

      {/* Command Center Grid */}
      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[1fr] gap-2 overflow-hidden p-2 lg:grid-cols-[240px_1fr_380px]">
        {/* Left sidebar: Intelligence Sources + Watchlist */}
        <div className="hidden min-h-0 flex-col gap-2 overflow-y-auto lg:flex">
          <SourceHealthBar
            content={{
              sourceHealthTitle: content.sourceHealthTitle,
              sourceHealthOverallLabel: content.sourceHealthOverallLabel,
              sourceHealthTypes: content.sourceHealthTypes,
              sourceHealthStatuses: content.sourceHealthStatuses,
              statusError: content.statusError,
              updatedLabel: content.updatedLabel,
            }}
            sourceHealthCategoriesByType={sourceHealthCategoriesByType}
            overallSourceHealthStatus={overallSourceHealthStatus}
            errorMessage={sourceHealthState.errorMessage}
            lastUpdated={sourceHealthState.lastUpdated}
          />
          <WatchlistPanel
            content={{
              watchlistTitle: content.watchlistTitle,
              watchlistEmpty: content.watchlistEmpty,
              watchlistMatchSuffix: content.watchlistMatchSuffix,
              filterNoMatches: content.filterNoMatches,
              statusLoading: content.statusLoading,
              updatedLabel: content.updatedLabel,
            }}
            filteredWatchedLocationMatches={filteredWatchedLocationMatches}
            rawWatchedLocationMatches={watchedLocationMatches}
            isLoading={overviewState.isLoading}
            hasActiveFilters={hasActiveFilters}
          />
          {/* Deploy Response — decorative CTA */}
          <button
            type="button"
            className="w-full rounded-lg bg-gradient-to-r from-md3-primary to-md3-primary-container py-3 font-[family-name:var(--font-label)] text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-md3-primary/10"
          >
            Deploy Response
          </button>
        </div>

        {/* Center: Alert Hero + Official Guidance + Live Stream */}
        <div className="flex min-h-0 flex-col gap-2 overflow-y-auto">
          <AlertHero
            content={{
              latestAlertTitle: content.latestAlertTitle,
              latestAlertEmpty: content.latestAlertEmpty,
              alertMessageFallback: content.alertMessageFallback,
              filterNoMatches: content.filterNoMatches,
              locationLabel: content.locationLabel,
              sourceLabel: content.sourceLabel,
              severityLabel: content.severityLabel,
              publishedLabel: content.publishedLabel,
              statusLoading: content.statusLoading,
              updatedLabel: content.updatedLabel,
            }}
            filteredLatestAlert={filteredLatestAlert}
            rawLatestAlert={latestAlert}
            isLoading={overviewState.isLoading}
            errorMessage={overviewState.errorMessage}
            lastUpdated={overviewState.lastUpdated}
            hasActiveFilters={hasActiveFilters}
          />
          <OfficialGuidanceCard
            content={{
              officialTitle: content.officialTitle,
              officialEmpty: content.officialEmpty,
              filterNoMatches: content.filterNoMatches,
              sourceLabel: content.sourceLabel,
              publishedLabel: content.publishedLabel,
              statusLoading: content.statusLoading,
              updatedLabel: content.updatedLabel,
              statusError: content.statusError,
            }}
            filteredLatestOfficialUpdate={filteredLatestOfficialUpdate}
            rawLatestOfficialUpdate={latestOfficialUpdate}
            isLoading={overviewState.isLoading}
            errorMessage={overviewState.errorMessage}
            lastUpdated={overviewState.lastUpdated}
            hasActiveFilters={hasActiveFilters}
          />

          {/* Live Stream — moved to center column */}
          <StreamPanel
            content={{
              title: content.streamTitle,
              subtitle: content.streamSubtitle,
              contextLabel: content.streamContextLabel,
              empty: content.streamEmpty,
              watchLabel: content.streamWatchLabel,
              sourceLabel: content.sourceLabel,
              updatedLabel: content.updatedLabel,
              statusLoading: content.statusLoading,
            }}
            streamsState={streamsState}
          />

          {/* Mobile-only: Source Health + Watchlist */}
          <div className="flex flex-col gap-2 lg:hidden">
            <SourceHealthBar
              content={{
                sourceHealthTitle: content.sourceHealthTitle,
                sourceHealthOverallLabel: content.sourceHealthOverallLabel,
                sourceHealthTypes: content.sourceHealthTypes,
                sourceHealthStatuses: content.sourceHealthStatuses,
                statusError: content.statusError,
                updatedLabel: content.updatedLabel,
              }}
              sourceHealthCategoriesByType={sourceHealthCategoriesByType}
              overallSourceHealthStatus={overallSourceHealthStatus}
              errorMessage={sourceHealthState.errorMessage}
              lastUpdated={sourceHealthState.lastUpdated}
            />
            <WatchlistPanel
              content={{
                watchlistTitle: content.watchlistTitle,
                watchlistEmpty: content.watchlistEmpty,
                watchlistMatchSuffix: content.watchlistMatchSuffix,
                filterNoMatches: content.filterNoMatches,
                statusLoading: content.statusLoading,
                updatedLabel: content.updatedLabel,
              }}
              filteredWatchedLocationMatches={filteredWatchedLocationMatches}
              rawWatchedLocationMatches={watchedLocationMatches}
              isLoading={overviewState.isLoading}
              hasActiveFilters={hasActiveFilters}
            />
          </div>
        </div>

        {/* Right sidebar: Live Feed */}
        <FeedPanel
          content={{
            feedTitle: content.feedTitle,
            feedTabs: content.feedTabs,
            statusLoading: content.statusLoading,
            statusError: content.statusError,
            noFeedItems: content.noFeedItems,
            filterNoMatches: content.filterNoMatches,
            locationLabel: content.locationLabel,
            sourceLabel: content.sourceLabel,
            publishedLabel: content.publishedLabel,
            updatedLabel: content.updatedLabel,
          }}
          activeTab={feedTabs.activeTab}
          setActiveTab={feedTabs.setActiveTab}
          filteredAlerts={filteredAlerts}
          filteredNews={filteredNews}
          filteredOfficial={filteredOfficial}
          activeTabFilteredCount={activeTabFilteredCount}
          shouldShowFeedLoading={feedTabs.shouldShowFeedLoading}
          shouldShowFeedError={feedTabs.shouldShowFeedError}
          hasActiveFilters={hasActiveFilters}
          lastUpdated={feedTabs.activeFeedState.lastUpdated}
        />
      </div>

      <MobileBottomNav content={content.bottomNav} activeHref="/dashboard" />
    </div>
  );
}

export type { DashboardShellContent };
