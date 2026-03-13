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
    <div className="inline-flex w-fit flex-wrap items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700">
      <span className="font-semibold text-slate-900">{title}</span>
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-rose-900">
        <AlertTriangle className="size-3" />
        {alertsLabel}
      </span>
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-amber-900">
        <MapPin className="size-3" />
        {watchlistLabel}
      </span>
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-sky-900">
        <House className="size-3" />
        {sheltersLabel}
      </span>
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-slate-900">
        <Minus className="size-3" />
        {roadClosuresLabel}
      </span>
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-900">
        <Hospital className="size-3" />
        {hospitalsLabel}
      </span>
    </div>
  );
}
