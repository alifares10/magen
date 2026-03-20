"use client";

import { motion, useReducedMotion } from "framer-motion";

type FeedTabButtonProps = {
  label: string;
  isActive: boolean;
  onClick: () => void;
};

export function FeedTabButton({ label, isActive, onClick }: FeedTabButtonProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className="relative px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:text-slate-200"
    >
      {label}
      {isActive ? (
        <motion.span
          layoutId={prefersReducedMotion ? undefined : "feed-tab-indicator"}
          className="absolute inset-x-0 -bottom-px h-0.5 bg-amber-400"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      ) : null}
    </button>
  );
}
