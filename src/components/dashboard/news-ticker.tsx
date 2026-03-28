"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { TickerItem } from "@/lib/feed/filters";

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

function getTickerBadgeClasses(type: TickerItem["type"]): string {
  switch (type) {
    case "alert":
      return "bg-md3-error-container text-md3-error font-black";
    case "official":
      return "bg-md3-secondary-container text-md3-on-surface font-black";
    case "news":
      return "bg-md3-surface-container-highest text-md3-on-surface-variant font-bold";
  }
}

function getTickerBadgeLabel(type: TickerItem["type"], content: NewsTickerContent): string {
  if (type === "alert") return content.tickerBreakingTag;
  if (type === "official") return "UPDATE";
  return content.tickerTypes[type];
}

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
        className="flex items-center gap-12 overflow-x-auto"
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
        className="flex items-center gap-12"
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
    <div className="flex items-center bg-md3-surface-container-lowest py-1">
      <div className="min-w-0 flex-1 px-3">
        {items.length === 0 ? (
          <p className="text-xs text-md3-on-surface-variant">
            {hasActiveFilters && allItemsCount > 0
              ? content.filterNoMatches
              : content.tickerFallback}
          </p>
        ) : (
          <TickerMarquee>
            {items.map((item) => (
              <span key={item.id} className="inline-flex shrink-0 items-center gap-3">
                <span
                  className={`px-2 py-0.5 font-[family-name:var(--font-sans)] text-[10px] tracking-tighter ${getTickerBadgeClasses(item.type)}`}
                >
                  {getTickerBadgeLabel(item.type, content)}
                </span>
                <span className="text-xs font-medium text-md3-on-surface">{item.title}</span>
              </span>
            ))}
          </TickerMarquee>
        )}
      </div>
    </div>
  );
}

export type { NewsTickerContent };
