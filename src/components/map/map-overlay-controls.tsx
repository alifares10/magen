type MapOverlayControlsProps = {
  title: string;
  sheltersLabel: string;
  roadClosuresLabel: string;
  hospitalsLabel: string;
  visibility: {
    shelters: boolean;
    roadClosures: boolean;
    hospitals: boolean;
  };
  onToggleShelters: () => void;
  onToggleRoadClosures: () => void;
  onToggleHospitals: () => void;
};

function getToggleClasses(isActive: boolean): string {
  if (isActive) {
    return "border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-300";
  }

  return "border-[var(--border-panel)] bg-[var(--surface-raised)] text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200";
}

export function MapOverlayControls({
  title,
  sheltersLabel,
  roadClosuresLabel,
  hospitalsLabel,
  visibility,
  onToggleShelters,
  onToggleRoadClosures,
  onToggleHospitals,
}: MapOverlayControlsProps) {
  return (
    <section className="flex flex-wrap items-center gap-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">{title}</p>

      <button
        type="button"
        aria-pressed={visibility.shelters}
        className={`rounded-sm border px-2 py-0.5 text-[10px] font-semibold transition-colors ${getToggleClasses(visibility.shelters)}`}
        onClick={onToggleShelters}
      >
        {sheltersLabel}
      </button>

      <button
        type="button"
        aria-pressed={visibility.roadClosures}
        className={`rounded-sm border px-2 py-0.5 text-[10px] font-semibold transition-colors ${getToggleClasses(visibility.roadClosures)}`}
        onClick={onToggleRoadClosures}
      >
        {roadClosuresLabel}
      </button>

      <button
        type="button"
        aria-pressed={visibility.hospitals}
        className={`rounded-sm border px-2 py-0.5 text-[10px] font-semibold transition-colors ${getToggleClasses(visibility.hospitals)}`}
        onClick={onToggleHospitals}
      >
        {hospitalsLabel}
      </button>
    </section>
  );
}
