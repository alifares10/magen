import type { ReactNode } from "react";

type MapPanelProps = {
  children: ReactNode;
};

export function MapPanel({ children }: MapPanelProps) {
  return (
    <div className="h-[62vh] min-h-[380px] overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
      {children}
    </div>
  );
}
