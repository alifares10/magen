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
    <div className="inline-flex w-fit flex-wrap items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 dark:border-slate-700/80 dark:bg-slate-950/75 dark:text-slate-300">
      <span className="font-semibold text-slate-900 dark:text-slate-100">{title}</span>
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-rose-900 dark:bg-rose-950/55 dark:text-rose-100">
        <AlertTriangle className="size-3" />
        {alertsLabel}
      </span>
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-amber-900 dark:bg-amber-950/55 dark:text-amber-100">
        <MapPin className="size-3" />
        {watchlistLabel}
      </span>
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-sky-900 dark:bg-sky-950/55 dark:text-sky-100">
        <House className="size-3" />
        {sheltersLabel}
      </span>
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-slate-900 dark:bg-slate-800/85 dark:text-slate-200">
        <Minus className="size-3" />
        {roadClosuresLabel}
      </span>
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-900 dark:bg-emerald-950/55 dark:text-emerald-100">
        <Hospital className="size-3" />
        {hospitalsLabel}
      </span>
    </div>
  );
}
