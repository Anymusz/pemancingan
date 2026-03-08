// src/components/ui/moving-border.jsx

import React from "react";
import {
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useTransform,
} from "motion/react";
import { useRef } from "react";
import { cn } from "@/utils/utils";

/**
 * MovingBorderButton - Button dengan animated border effect
 * Untuk CTA khusus yang perlu attention-grabbing animation
 */
export function MovingBorderButton({
  borderRadius = "1.75rem", // ✅ SAMA DENGAN SHADCN
  children,
  as: Component = "button",
  containerClassName,
  borderClassName,
  duration = 3000,
  className,
  ...otherProps
}) {
  return (
    <Component
      className={cn(
        "relative overflow-hidden bg-transparent p-[1px] transition-transform active:scale-[0.98]",
        containerClassName,
      )}
      style={{
        borderRadius: borderRadius,
      }}
      {...otherProps}
    >
      {/* Animated Border Container */}
      <div
        className="absolute inset-0"
        style={{ borderRadius: `calc(${borderRadius} * 0.96)` }}
      >
        <MovingBorder duration={duration} rx="30%" ry="30%">
          <div
            className={cn(
              "size-20 opacity-90 bg-[radial-gradient(var(--color-primary)_40%,transparent_60%)]",
              borderClassName,
            )}
          />
        </MovingBorder>
      </div>

      {/* Button Content */}
      <div
        className={cn(
          "relative flex h-full w-full items-center justify-center gap-2",
          "bg-sky-400 border border-border/50", // ✅ BACKGROUND SKY-500
          "text-sm font-medium text-slate-50", // ✅ TEXT SLATE-500
          "backdrop-blur-sm transition-all",
          "hover:bg-sky-500", // ✅ HOVER SKY-600
          "shadow-sm hover:shadow-md",
          className,
        )}
        style={{
          borderRadius: `calc(${borderRadius} * 0.96)`,
        }}
      >
        {children}
      </div>
    </Component>
  );
}

/**
 * MovingBorder - SVG path animation component
 * Internal component untuk MovingBorderButton
 */
export const MovingBorder = ({
  children,
  duration = 3000,
  rx,
  ry,
  ...otherProps
}) => {
  const pathRef = useRef();
  const progress = useMotionValue(0);

  useAnimationFrame((time) => {
    const length = pathRef.current?.getTotalLength();
    if (length) {
      const pxPerMillisecond = length / duration;
      progress.set((time * pxPerMillisecond) % length);
    }
  });

  const x = useTransform(
    progress,
    (val) => pathRef.current?.getPointAtLength(val).x,
  );
  const y = useTransform(
    progress,
    (val) => pathRef.current?.getPointAtLength(val).y,
  );

  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`;

  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="absolute size-full"
        width="100%"
        height="100%"
        {...otherProps}
      >
        <rect
          fill="none"
          width="100%"
          height="100%"
          rx={rx}
          ry={ry}
          ref={pathRef}
        />
      </svg>
      <motion.div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          display: "inline-block",
          transform,
        }}
      >
        {children}
      </motion.div>
    </>
  );
};
