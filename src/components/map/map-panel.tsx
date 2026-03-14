import type { ReactNode } from "react";

type MapPanelProps = {
  children: ReactNode;
};

export function MapPanel({ children }: MapPanelProps) {
  return (
    <div className="h-[62vh] min-h-[380px] overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm dark:border-slate-700/80 dark:bg-slate-950/80 dark:shadow-[0_24px_60px_-36px_rgba(2,6,23,0.95)]">
      {children}
    </div>
  );
}
