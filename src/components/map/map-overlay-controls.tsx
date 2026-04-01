import { AlertTriangle, ChevronDown, ChevronUp, Construction, Hospital, House } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type MapOverlayControlsProps = {
  title: string;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
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

function ToggleSwitch({ pressed }: { pressed: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="relative h-7 w-12 shrink-0 rounded-full transition-colors"
      style={{ backgroundColor: pressed ? "var(--color-md3-primary)" : "var(--color-md3-outline-variant)" }}
    >
      <span
        className="absolute top-0.5 block h-6 w-6 rounded-full bg-white transition-transform ltr:left-0.5 rtl:right-0.5"
        style={{
          transform: pressed ? "translateX(20px)" : "translateX(0)",
        }}
      />
    </span>
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
    <button
      type="button"
      role="switch"
      aria-checked={pressed}
      aria-label={label}
      onClick={onToggle}
      className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-start transition-colors hover:bg-md3-surface-container-high"
    >
      <div className="flex items-center gap-2.5">
        {icon}
        <span className="font-[family-name:var(--font-label)] text-xs font-medium text-md3-on-surface">
          {label}
        </span>
      </div>
      <ToggleSwitch pressed={pressed} />
    </button>
  );
}

export function MapOverlayControls({
  title,
  collapsed = false,
  onToggleCollapsed,
  sheltersLabel,
  roadClosuresLabel,
  hospitalsLabel,
  alertZonesLabel,
  visibility,
  onToggleShelters,
  onToggleRoadClosures,
  onToggleHospitals,
}: MapOverlayControlsProps) {
  const CollapseIcon = collapsed ? ChevronDown : ChevronUp;

  return (
    <section
      className={cn(
        "space-y-1 rounded-lg bg-md3-surface-container-low/90 p-3 backdrop-blur-sm md:w-52",
        collapsed ? "w-auto max-w-max" : "w-full max-w-sm",
      )}
    >
      {onToggleCollapsed ? (
        <button
          type="button"
          aria-expanded={!collapsed}
          aria-controls="mobile-map-layer-controls"
          onClick={onToggleCollapsed}
          className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-start transition-colors hover:bg-md3-surface-container-high"
        >
          <span className="font-[family-name:var(--font-label)] text-[10px] font-bold uppercase tracking-[0.2em] text-md3-on-surface-variant">
            {title}
          </span>
          <CollapseIcon className="h-4 w-4 text-md3-on-surface-variant" />
        </button>
      ) : (
        <p className="px-2 pb-1 font-[family-name:var(--font-label)] text-[10px] font-bold uppercase tracking-[0.2em] text-md3-on-surface-variant">
          {title}
        </p>
      )}

      {!collapsed ? (
        <div id="mobile-map-layer-controls" className="space-y-1">
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
        </div>
      ) : null}
    </section>
  );
}
