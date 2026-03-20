import type { ReactNode } from "react";

type MapPanelProps = {
  children: ReactNode;
};

export function MapPanel({ children }: MapPanelProps) {
  return (
    <div className="h-[62vh] min-h-[380px] overflow-hidden rounded-lg border border-[var(--border-panel)] bg-[var(--surface-raised)]">
      {children}
    </div>
  );
}
