// File: src/components/feedback/Toast.jsx
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/utils/utils";
import { useEffect, useState, useRef, useCallback } from "react";

export const Toast = ({
  id,
  variant = "info",
  title,
  description,
  duration,
  onClose,
  index = 0,
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const progressRef = useRef(null);
  const timerRef = useRef(null);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  // Auto-close durations per variant
  const defaultDurations = {
    success: 4000,
    info: 5000,
    warning: 6000,
    error: 7000,
  };

  const toastDuration = duration || defaultDurations[variant];
  const isActive = index === 0;

  // Icons per variant
  const icons = {
    success: <CheckCircle2 className="h-4 w-4" />,
    error: <AlertCircle className="h-4 w-4" />,
    warning: <AlertTriangle className="h-4 w-4" />,
    info: <Info className="h-4 w-4" />,
  };

  // Variant styles
  const variantStyles = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-amber-500",
    info: "bg-blue-500",
  };

  const iconBgStyles = {
    success:
      "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400",
    error: "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400",
    warning:
      "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
    info: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  };

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  }, [id, onClose]);

  const handleClickToStop = useCallback(() => {
    setIsPaused(true);
  }, []);

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // Main timer effect
  useEffect(() => {
    if (!isActive || isPaused) return;

    startTimeRef.current = Date.now();
    setRemainingSeconds(Math.ceil(toastDuration / 1000));

    // Setup progress bar animation
    if (progressRef.current) {
      progressRef.current.style.transition = "none";
      progressRef.current.style.width = "100%";

      void progressRef.current.offsetWidth;

      progressRef.current.style.transition = `width ${toastDuration}ms linear`;
      progressRef.current.style.width = "0%";
    }

    // Countdown interval
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, toastDuration - elapsed);
      setRemainingSeconds(Math.ceil(remaining / 1000));

      if (remaining <= 0) {
        clearInterval(intervalRef.current);
      }
    }, 1000);

    // Auto close timer
    timerRef.current = setTimeout(() => {
      handleClose();
    }, toastDuration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused, toastDuration, handleClose]);

  // Pause effect - freeze progress bar
  useEffect(() => {
    if (isPaused && progressRef.current) {
      const computedStyle = window.getComputedStyle(progressRef.current);
      const currentWidth = computedStyle.width;

      progressRef.current.style.transition = "none";
      progressRef.current.style.width = currentWidth;
    }
  }, [isPaused]);

  // Stack effect
  const getStackStyles = () => {
    if (index === 0) return {};

    const offset = Math.min(index * 8, 16);

    return {
      transform: `translateY(-${offset}px)`,
      zIndex: 100 - index,
    };
  };

  return (
    <div
      className={cn(
        "relative w-full bg-white dark:bg-slate-900 rounded-2xl overflow-hidden",
        "shadow-[0_8px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.3)]",
        "border border-slate-200/60 dark:border-slate-700/60",
        "transition-all duration-300",
        isExiting
          ? "animate-out fade-out slide-out-to-right"
          : "animate-in fade-in slide-in-from-right-full",
      )}
      role="alert"
      style={getStackStyles()}
    >
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={cn(
              "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
              iconBgStyles[variant],
            )}
          >
            {icons[variant]}
          </div>

          {/* Text Content - Aligned with icon center */}
          <div className="flex-1 min-w-0 pt-1">
            <h5 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">
              {title}
            </h5>

            {/* Description with Expand/Collapse */}
            {description && (
              <div
                className={cn(
                  "overflow-hidden transition-all ease-out",
                  isExpanded
                    ? "max-h-[400px] opacity-100 mt-1 duration-[250ms]"
                    : "max-h-0 opacity-0 duration-200",
                )}
              >
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {description}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons - Aligned with icon center */}
          <div className="flex-shrink-0 flex items-center gap-1 pt-1">
            {/* Expand Button with hover effect */}
            {description && (
              <button
                onClick={toggleExpand}
                className={cn(
                  "w-6 h-6 flex items-center justify-center rounded-md",
                  "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300",
                  "transition-colors duration-200",
                  "focus:outline-none group",
                )}
                aria-label={isExpanded ? "Collapse" : "Expand"}
              >
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200 ease-out",
                    "group-hover:-translate-y-0.5 group-hover:scale-105",
                    isExpanded ? "rotate-180" : "rotate-0",
                  )}
                />
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={handleClose}
              className={cn(
                "w-6 h-6 flex items-center justify-center rounded-md",
                "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300",
                "transition-colors duration-200",
                "focus:outline-none group",
              )}
              aria-label="Close notification"
            >
              <X className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-90" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer - Countdown (only show when active AND not paused) */}
      {isActive && !isPaused && (
        <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2.5 border-t border-slate-200/60 dark:border-slate-700/50 text-xs text-slate-600 dark:text-slate-400">
          <span>
            This message will close in{" "}
            <strong className="font-semibold text-slate-700 dark:text-slate-300">
              {remainingSeconds}
            </strong>{" "}
            second{remainingSeconds !== 1 ? "s" : ""}.{" "}
            <button
              onClick={handleClickToStop}
              className="font-medium text-slate-700 dark:text-slate-300 hover:underline focus:outline-none focus:underline"
            >
              Click to stop.
            </button>
          </span>
        </div>
      )}

      {/* Progress Bar - Show when active, keep frozen when paused */}
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-200/50 dark:bg-slate-700/50">
          <div
            ref={progressRef}
            className={cn("h-full rounded-br-2xl", variantStyles[variant])}
            style={{ width: "100%" }}
          />
        </div>
      )}
    </div>
  );
};

export default Toast;
