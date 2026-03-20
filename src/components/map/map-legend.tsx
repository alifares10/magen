import { AlertTriangle, Hospital, House, MapPin, Minus } from "lucide-react";

type MapLegendProps = {
  title: string;
  alertsLabel: string;
  watchlistLabel: string;
  sheltersLabel: string;
  roadClosuresLabel: string;
  hospitalsLabel: string;
};

export function MapLegend({
  title,
  alertsLabel,
  watchlistLabel,
  sheltersLabel,
  roadClosuresLabel,
  hospitalsLabel,
}: MapLegendProps) {
  return (
    <div className="inline-flex w-fit flex-wrap items-center gap-2 rounded-sm border border-[var(--border-panel)] bg-[var(--surface-raised)] px-3 py-1.5 text-[10px]">
      <span className="font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">{title}</span>
      <span className="inline-flex items-center gap-1 rounded-sm bg-rose-100 px-1.5 py-0.5 text-rose-900 dark:bg-rose-950/55 dark:text-rose-100">
        <AlertTriangle className="size-2.5" />
        {alertsLabel}
      </span>
      <span className="inline-flex items-center gap-1 rounded-sm bg-amber-100 px-1.5 py-0.5 text-amber-900 dark:bg-amber-950/55 dark:text-amber-100">
        <MapPin className="size-2.5" />
        {watchlistLabel}
      </span>
      <span className="inline-flex items-center gap-1 rounded-sm bg-sky-100 px-1.5 py-0.5 text-sky-900 dark:bg-sky-950/55 dark:text-sky-100">
        <House className="size-2.5" />
        {sheltersLabel}
      </span>
      <span className="inline-flex items-center gap-1 rounded-sm bg-slate-100 px-1.5 py-0.5 text-slate-700 dark:bg-slate-800/85 dark:text-slate-200">
        <Minus className="size-2.5" />
        {roadClosuresLabel}
      </span>
      <span className="inline-flex items-center gap-1 rounded-sm bg-emerald-100 px-1.5 py-0.5 text-emerald-900 dark:bg-emerald-950/55 dark:text-emerald-100">
        <Hospital className="size-2.5" />
        {hospitalsLabel}
      </span>
    </div>
  );
}
