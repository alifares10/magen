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
      className={`relative flex min-h-11 flex-1 items-center justify-center px-2 py-3 font-[family-name:var(--font-label)] text-[10px] font-bold uppercase tracking-widest transition ${
        isActive
          ? "border-b-2 border-md3-primary text-md3-primary"
          : "text-md3-outline hover:text-md3-on-surface"
      }`}
    >
      {label}
      {isActive && !prefersReducedMotion ? (
        <motion.span
          layoutId="feed-tab-indicator"
          className="absolute inset-x-0 -bottom-px h-0.5 bg-md3-primary"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      ) : null}
    </button>
  );
}
