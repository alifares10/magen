"use client";

import type { ReactNode } from "react";
import { forwardRef, useImperativeHandle } from "react";
import { motion } from "framer-motion";
import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner";
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Variant = "default" | "success" | "error" | "warning";
type Position =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "ghost";
}

export interface ToastOptions {
  title?: ReactNode;
  message: ReactNode;
  variant?: Variant;
  duration?: number;
  position?: Position;
  actions?: ActionButton;
  onDismiss?: () => void;
  highlightTitle?: boolean;
  dismissLabel?: string;
}

export interface ToasterRef {
  show: (props: ToastOptions) => void;
}

const variantStyles: Record<Variant, string> = {
  default: "bg-card border-border text-foreground",
  success: "bg-card border-green-600/50",
  error: "border-red-700 bg-red-600/95 text-red-50",
  warning: "bg-card border-amber-600/50",
};

const titleColor: Record<Variant, string> = {
  default: "text-foreground",
  success: "text-green-600 dark:text-green-400",
  error: "text-red-50",
  warning: "text-amber-600 dark:text-amber-400",
};

const iconColor: Record<Variant, string> = {
  default: "text-muted-foreground",
  success: "text-green-600 dark:text-green-400",
  error: "text-red-100",
  warning: "text-amber-600 dark:text-amber-400",
};

const variantIcons: Record<
  Variant,
  (props: { className?: string }) => ReactNode
> = {
  default: Info,
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
};

const toastAnimation = {
  initial: { opacity: 0, y: 50, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 50, scale: 0.95 },
};

const Toaster = forwardRef<ToasterRef, { defaultPosition?: Position }>(
  ({ defaultPosition = "bottom-right" }, ref) => {
    useImperativeHandle(ref, () => ({
      show({
        title,
        message,
        variant = "default",
        duration = 4000,
        position = defaultPosition,
        actions,
        onDismiss,
        highlightTitle,
        dismissLabel = "Dismiss notification",
      }) {
        const Icon = variantIcons[variant];

        sonnerToast.custom(
          (toastId) => (
            <motion.div
              variants={toastAnimation}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={cn(
                "flex w-full max-w-xs items-start justify-between rounded-xl border p-3 shadow-md",
                variantStyles[variant],
              )}
            >
              <div className="flex items-start gap-2">
                <Icon
                  className={cn("mt-0.5 h-4 w-4 shrink-0", iconColor[variant])}
                />
                <div className="space-y-0.5">
                  {title && (
                    <h3
                      className={cn(
                        "text-xs font-medium leading-none",
                        titleColor[variant],
                        highlightTitle && titleColor.success,
                      )}
                    >
                      {title}
                    </h3>
                  )}
                  <div
                    className={cn(
                      "text-xs",
                      variant === "error"
                        ? "text-red-100/95"
                        : "text-muted-foreground",
                    )}
                  >
                    {message}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {actions?.label && (
                  <Button
                    variant={actions.variant ?? "outline"}
                    size="sm"
                    onClick={() => {
                      actions.onClick();
                      sonnerToast.dismiss(toastId);
                    }}
                    className={cn(
                      "cursor-pointer",
                      variant === "success"
                        ? "text-green-600 border-green-600 hover:bg-green-600/10 dark:hover:bg-green-400/20"
                        : variant === "error"
                          ? "border-red-200/50 text-red-50 hover:bg-white/15"
                          : variant === "warning"
                            ? "text-amber-600 border-amber-600 hover:bg-amber-600/10 dark:hover:bg-amber-400/20"
                            : "text-foreground border-border hover:bg-muted/10 dark:hover:bg-muted/20",
                    )}
                  >
                    {actions.label}
                  </Button>
                )}

                <button
                  onClick={() => {
                    sonnerToast.dismiss(toastId);
                    onDismiss?.();
                  }}
                  className={cn(
                    "rounded-full p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-ring",
                    variant === "error"
                      ? "hover:bg-white/15"
                      : "hover:bg-muted/50 dark:hover:bg-muted/30",
                  )}
                  aria-label={dismissLabel}
                >
                  <X
                    className={cn(
                      "h-3 w-3",
                      variant === "error"
                        ? "text-red-100"
                        : "text-muted-foreground",
                    )}
                  />
                </button>
              </div>
            </motion.div>
          ),
          { duration, position },
        );
      },
    }));

    return (
      <SonnerToaster
        position={defaultPosition}
        toastOptions={{ unstyled: true, className: "flex justify-end" }}
      />
    );
  },
);

Toaster.displayName = "Toaster";

export default Toaster;
