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
    return "border-slate-900 bg-slate-900 text-white";
  }

  return "border-slate-300 bg-white text-slate-800";
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
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">{title}</p>

      <button
        type="button"
        aria-pressed={visibility.shelters}
        className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${getToggleClasses(visibility.shelters)}`}
        onClick={onToggleShelters}
      >
        {sheltersLabel}
      </button>

      <button
        type="button"
        aria-pressed={visibility.roadClosures}
        className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${getToggleClasses(visibility.roadClosures)}`}
        onClick={onToggleRoadClosures}
      >
        {roadClosuresLabel}
      </button>

      <button
        type="button"
        aria-pressed={visibility.hospitals}
        className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${getToggleClasses(visibility.hospitals)}`}
        onClick={onToggleHospitals}
      >
        {hospitalsLabel}
      </button>
    </section>
  );
}
