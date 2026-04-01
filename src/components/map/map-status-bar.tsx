import { AlertTriangle, MapPin } from "lucide-react";

type MapStatusBarContent = {
  activeAlertsLabel: string;
  watchedAreasAffectedLabel: string;
};

type MapStatusBarProps = {
  content: MapStatusBarContent;
  alertCount: number;
  affectedWatchlistCount: number;
};

export function MapStatusBar({
  content,
  alertCount,
  affectedWatchlistCount,
}: MapStatusBarProps) {
  return (
    <div className="flex max-w-full flex-wrap items-center gap-3 rounded-lg bg-md3-surface-container-low/90 px-4 py-2 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-md3-error" />
        <span className="font-[family-name:var(--font-label)] text-xs font-bold text-md3-on-surface">
          {alertCount}
        </span>
        <span className="font-[family-name:var(--font-label)] text-[10px] uppercase tracking-widest text-md3-on-surface-variant">
          {content.activeAlertsLabel}
        </span>
      </div>

      <div className="hidden h-4 w-px bg-md3-outline-variant/20 sm:block" />

      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-md3-secondary" />
        <span className="font-[family-name:var(--font-label)] text-xs font-bold text-md3-on-surface">
          {affectedWatchlistCount}
        </span>
        <span className="font-[family-name:var(--font-label)] text-[10px] uppercase tracking-widest text-md3-on-surface-variant">
          {content.watchedAreasAffectedLabel}
        </span>
      </div>
    </div>
  );
}

export type { MapStatusBarContent };
