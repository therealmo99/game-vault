"use client";

import { useEffect, useRef } from "react";

export function BackgroundAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    let width = 0;
    let height = 0;
    let time = 0;

    // Particles for subtle ambient motion
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      hue: number;
    }

    const particles: Particle[] = [];
    const PARTICLE_COUNT = 60;

    function init() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;

      particles.length = 0;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.3 + 0.05,
          hue: Math.random() > 0.7 ? 45 : (Math.random() > 0.5 ? 220 : 0), // gold, cobalt, or neutral
        });
      }
    }

    function draw() {
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);

      // Subtle grid lines that breathe
      const gridSize = 80;
      const gridOffset = (time * 0.02) % gridSize;
      ctx.strokeStyle = "rgba(212, 168, 67, 0.015)";
      ctx.lineWidth = 0.5;

      for (let x = -gridOffset; x < width + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = -gridOffset; y < height + gridSize; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw particles
      particles.forEach((p, i) => {
        // Update position
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        // Subtle mouse attraction (handled via event)
        // Draw particle
        const alpha = p.opacity * (0.5 + Math.sin(time * 0.001 + i) * 0.3);
        if (p.hue === 45) {
          ctx.fillStyle = `rgba(212, 168, 67, ${alpha})`; // gold
        } else if (p.hue === 220) {
          ctx.fillStyle = `rgba(36, 113, 163, ${alpha})`; // cobalt
        } else {
          ctx.fillStyle = `rgba(168, 168, 168, ${alpha * 0.5})`; // neutral
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Connect nearby particles (very subtle)
        if (p.hue === 45) { // only gold particles connect
          particles.slice(i + 1).forEach(p2 => {
            if (p2.hue !== 45) return;
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120) {
              ctx.strokeStyle = `rgba(212, 168, 67, ${0.008 * (1 - dist / 120)})`;
              ctx.lineWidth = 0.3;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          });
        }
      });

      time += 16;
      animationRef.current = requestAnimationFrame(draw);
    }

    init();
    draw();

    // Handle resize
    const handleResize = () => init();
    window.addEventListener("resize", handleResize);

    // Subtle mouse interaction
    let mouseX = width / 2;
    let mouseY = height / 2;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      aria-hidden="true"
      style={{ opacity: 0.6 }}
    />
  );
}