import { AlertTriangle, Hospital, House, Construction } from "lucide-react";
import type { ReactNode } from "react";

type MapOverlayControlsProps = {
  title: string;
  sheltersLabel: string;
  roadClosuresLabel: string;
  hospitalsLabel: string;
  alertZonesLabel?: string;
  visibility: {
    shelters: boolean;
    roadClosures: boolean;
    hospitals: boolean;
  };
  onToggleShelters: () => void;
  onToggleRoadClosures: () => void;
  onToggleHospitals: () => void;
};

function ToggleSwitch({ pressed, label, onToggle }: { pressed: boolean; label: string; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={pressed}
      aria-label={label}
      className="relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors"
      style={{ backgroundColor: pressed ? "var(--color-md3-primary)" : "var(--color-md3-outline-variant)" }}
      onClick={onToggle}
    >
      <span
        className="absolute top-0.5 block h-4 w-4 rounded-full bg-white transition-transform ltr:left-0.5 rtl:right-0.5"
        style={{
          transform: pressed ? "translateX(16px)" : "translateX(0)",
        }}
      />
    </button>
  );
}

function LayerRow({
  icon,
  label,
  pressed,
  onToggle,
}: {
  icon: ReactNode;
  label: string;
  pressed: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-md3-surface-container-high">
      <div className="flex items-center gap-2.5">
        {icon}
        <span className="font-[family-name:var(--font-label)] text-xs font-medium text-md3-on-surface">
          {label}
        </span>
      </div>
      <ToggleSwitch pressed={pressed} label={label} onToggle={onToggle} />
    </div>
  );
}

export function MapOverlayControls({
  title,
  sheltersLabel,
  roadClosuresLabel,
  hospitalsLabel,
  alertZonesLabel,
  visibility,
  onToggleShelters,
  onToggleRoadClosures,
  onToggleHospitals,
}: MapOverlayControlsProps) {
  return (
    <section className="w-52 space-y-1 rounded-lg bg-md3-surface-container-low/90 p-3 backdrop-blur-sm">
      <p className="px-2 pb-1 font-[family-name:var(--font-label)] text-[10px] font-bold uppercase tracking-[0.2em] text-md3-on-surface-variant">
        {title}
      </p>

      <LayerRow
        icon={<House className="h-4 w-4 text-sky-400" />}
        label={sheltersLabel}
        pressed={visibility.shelters}
        onToggle={onToggleShelters}
      />
      <LayerRow
        icon={<Hospital className="h-4 w-4 text-emerald-400" />}
        label={hospitalsLabel}
        pressed={visibility.hospitals}
        onToggle={onToggleHospitals}
      />
      <LayerRow
        icon={<Construction className="h-4 w-4 text-slate-400" />}
        label={roadClosuresLabel}
        pressed={visibility.roadClosures}
        onToggle={onToggleRoadClosures}
      />
      {alertZonesLabel ? (
        <LayerRow
          icon={<AlertTriangle className="h-4 w-4 text-md3-error" />}
          label={alertZonesLabel}
          pressed={false}
          onToggle={() => {}}
        />
      ) : null}
    </section>
  );
}
