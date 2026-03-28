import { AlertTriangle, Hospital, House } from "lucide-react";

type MapLegendProps = {
  alertsLabel: string;
  sheltersLabel: string;
  hospitalsLabel: string;
};

export function MapLegend({
  alertsLabel,
  sheltersLabel,
  hospitalsLabel,
}: MapLegendProps) {
  return (
    <div className="flex items-center gap-5 rounded-lg bg-md3-surface-container-low/90 px-4 py-2 backdrop-blur-sm">
      <span className="inline-flex items-center gap-1.5">
        <AlertTriangle className="h-3.5 w-3.5 text-md3-error" />
        <span className="font-[family-name:var(--font-label)] text-[11px] uppercase tracking-wider text-md3-on-surface-variant">
          {alertsLabel}
        </span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <House className="h-3.5 w-3.5 text-sky-400" />
        <span className="font-[family-name:var(--font-label)] text-[11px] uppercase tracking-wider text-md3-on-surface-variant">
          {sheltersLabel}
        </span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Hospital className="h-3.5 w-3.5 text-emerald-400" />
        <span className="font-[family-name:var(--font-label)] text-[11px] uppercase tracking-wider text-md3-on-surface-variant">
          {hospitalsLabel}
        </span>
      </span>
    </div>
  );
}
