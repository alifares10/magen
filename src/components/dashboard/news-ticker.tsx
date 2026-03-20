"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { TickerItem } from "@/lib/feed/filters";
import { getTickerItemTypeClasses } from "@/lib/feed/filters";

type NewsTickerContent = {
  tickerLabel: string;
  tickerFallback: string;
  tickerTypes: {
    alert: string;
    official: string;
    news: string;
  };
  tickerBreakingTag: string;
  severityLabel: string;
  sourceLabel: string;
  filterNoMatches: string;
};

type NewsTickerProps = {
  content: NewsTickerContent;
  items: TickerItem[];
  hasActiveFilters: boolean;
  allItemsCount: number;
};

function TickerMarquee({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (containerRef.current) {
      setContentWidth(containerRef.current.scrollWidth / 2);
    }
  }, [children]);

  if (prefersReducedMotion || contentWidth === 0) {
    return (
      <div
        ref={containerRef}
        className="flex items-center gap-6 overflow-x-auto"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <motion.div
        ref={containerRef}
        className="flex items-center gap-6"
        animate={{ x: isPaused ? undefined : [0, -contentWidth] }}
        transition={{
          x: {
            duration: contentWidth / 60,
            repeat: Infinity,
            ease: "linear",
          },
        }}
      >
        {children}
        {children}
      </motion.div>
    </div>
  );
}

export function NewsTicker({ content, items, hasActiveFilters, allItemsCount }: NewsTickerProps) {
  return (
    <div className="flex h-9 items-center border-b border-[var(--border-panel)] bg-[var(--ticker-bg,oklch(0.12_0.02_40))]">
      <span className="z-10 shrink-0 bg-rose-600 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
        {content.tickerLabel}
      </span>

      <div className="min-w-0 flex-1 px-3">
        {items.length === 0 ? (
          <p className="text-xs text-slate-400">
            {hasActiveFilters && allItemsCount > 0
              ? content.filterNoMatches
              : content.tickerFallback}
          </p>
        ) : (
          <TickerMarquee>
            {items.map((item) => (
              <span key={item.id} className="inline-flex shrink-0 items-center gap-2">
                <span
                  className={`inline-flex rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold ${getTickerItemTypeClasses(item.type)}`}
                >
                  {content.tickerTypes[item.type]}
                </span>
                {item.isBreaking ? (
                  <span className="text-[10px] font-bold uppercase text-amber-400">
                    {content.tickerBreakingTag}
                  </span>
                ) : null}
                <span className="text-xs text-slate-200">{item.title}</span>
                {item.sourceName ? (
                  <span className="text-[10px] text-slate-500">
                    [{item.sourceName}]
                  </span>
                ) : null}
                <span className="text-slate-700">|</span>
              </span>
            ))}
          </TickerMarquee>
        )}
      </div>
    </div>
  );
}

export type { NewsTickerContent };
