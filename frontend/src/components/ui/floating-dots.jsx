import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export function FloatingDots({
  className,
  maxRadius = 2.5, // Increased from 0.5
  maxSpeed = 0.5, // Slower for smoother feel
  minSpeed = 0.05, // Slower minimum
  color = "black",
  dotCount = 120, // Increased from 50
  opacity = 0.6, // NEW: configurable opacity
}) {
  const canvasRef = useRef(null);
  const dotsRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const parent = canvas.parentElement;

    const resizeCanvas = () => {
      const { width, height } = parent.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;

      // Reinitialize dots on resize
      dotsRef.current = Array.from({ length: dotCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * (maxRadius - 0.5) + 0.5,
        vx: (Math.random() - 0.5) * (maxSpeed - minSpeed) + minSpeed,
        vy: (Math.random() - 0.5) * (maxSpeed - minSpeed) + minSpeed,
      }));
    };

    const handleResize = () => {
      resizeCanvas();
    };

    window.addEventListener("resize", handleResize);
    resizeCanvas();

    let animationId;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      dotsRef.current.forEach((dot) => {
        // Update position
        dot.x += dot.vx;
        dot.y += dot.vy;

        // Bounce off edges
        if (dot.x < 0 || dot.x > canvas.width) dot.vx *= -1;
        if (dot.y < 0 || dot.y > canvas.height) dot.vy *= -1;

        // Draw dot with opacity
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = opacity;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [maxRadius, maxSpeed, minSpeed, color, dotCount, opacity]);

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "absolute inset-0 w-full h-full pointer-events-none",
        className,
      )}
    />
  );
}
