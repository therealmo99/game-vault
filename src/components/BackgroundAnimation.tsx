"use client";

import { useEffect, useRef, useState } from "react";

export function BackgroundAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [prefersReduced, setPrefersReduced] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (prefersReduced) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let time = 0;
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    // Three layers of particles for depth
    interface Particle {
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      layer: 0 | 1 | 2;
      phase: number;
      hue: number;
      speed: number;
    }

    const layers = [
      { count: 25, sizeRange: [0.5, 1.5], opacityRange: [0.03, 0.08], speedRange: [0.02, 0.04], connectDist: 180 },
      { count: 15, sizeRange: [1, 2.5], opacityRange: [0.05, 0.12], speedRange: [0.04, 0.08], connectDist: 140 },
      { count: 8, sizeRange: [2, 4], opacityRange: [0.08, 0.18], speedRange: [0.06, 0.12], connectDist: 100 },
    ];

    const particles: Particle[] = [];

    function init() {
      width = canvas.width = window.innerWidth * DPR;
      height = canvas.height = window.innerHeight * DPR;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.scale(DPR, DPR);

      particles.length = 0;
      const cssWidth = window.innerWidth;
      const cssHeight = window.innerHeight;

      layers.forEach((layer, layerIdx) => {
        for (let i = 0; i < layer.count; i++) {
          const x = Math.random() * cssWidth;
          const y = Math.random() * cssHeight;
          particles.push({
            x, y,
            baseX: x,
            baseY: y,
            vx: (Math.random() - 0.5) * 0.2,
            vy: (Math.random() - 0.5) * 0.2,
            size: Math.random() * (layer.sizeRange[1] - layer.sizeRange[0]) + layer.sizeRange[0],
            opacity: Math.random() * (layer.opacityRange[1] - layer.opacityRange[0]) + layer.opacityRange[0],
            layer: layerIdx as 0 | 1 | 2,
            phase: Math.random() * Math.PI * 2,
            hue: Math.random() > 0.85 ? 45 : (Math.random() > 0.5 ? 220 : 0),
            speed: Math.random() * (layer.speedRange[1] - layer.speedRange[0]) + layer.speedRange[0],
          });
        }
      });

      mouseX = targetMouseX = cssWidth / 2;
      mouseY = targetMouseY = cssHeight / 2;
    }

    function draw() {
      if (!ctx || !isVisible) return;

      const cssWidth = window.innerWidth;
      const cssHeight = window.innerHeight;

      ctx.clearRect(0, 0, cssWidth, cssHeight);

      // Subtle breathing grid
      const gridSize = 80;
      const gridOffset = (Math.sin(time * 0.00015) * 20) % gridSize;
      ctx.strokeStyle = "rgba(232, 176, 58, 0.008)";
      ctx.lineWidth = 0.5;

      for (let x = -gridOffset; x < cssWidth + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, cssHeight);
        ctx.stroke();
      }
      for (let y = -gridOffset; y < cssHeight + gridSize; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(cssWidth, y);
        ctx.stroke();
      }

      // Radial gradient vignette (subtle)
      const vignette = ctx.createRadialGradient(
        cssWidth / 2, cssHeight / 2, 0,
        cssWidth / 2, cssHeight / 2, Math.max(cssWidth, cssHeight) * 0.7
      );
      vignette.addColorStop(0, "rgba(232, 176, 58, 0)");
      vignette.addColorStop(1, "rgba(10, 10, 10, 0.15)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, cssWidth, cssHeight);

      // Update and draw particles
      const mouseInfluence = 0.0008;

      particles.forEach((p, i) => {
        // Smooth mouse following
        const dx = targetMouseX - p.x;
        const dy = targetMouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 300 && dist > 0) {
          const force = (1 - dist / 300) * mouseInfluence * (p.layer + 1);
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }

        // Return to base position
        const bx = p.baseX - p.x;
        const by = p.baseY - p.y;
        p.vx += bx * 0.0003;
        p.vy += by * 0.0003;

        // Damping
        p.vx *= 0.985;
        p.vy *= 0.985;

        p.x += p.vx;
        p.y += p.vy;

        // Subtle orbital motion
        p.phase += p.speed * 0.01;
        const orbitRadius = 15 * (p.layer + 1);
        p.x += Math.sin(p.phase) * orbitRadius * 0.002;
        p.y += Math.cos(p.phase * 0.7) * orbitRadius * 0.002;

        // Opacity breathing
        const breathOpacity = p.opacity * (0.6 + Math.sin(time * 0.0005 + i * 0.5) * 0.4);

        // Draw particle
        let color: string;
        if (p.hue === 45) {
          color = `rgba(232, 176, 58, ${breathOpacity})`;
        } else if (p.hue === 220) {
          color = `rgba(36, 113, 163, ${breathOpacity * 0.7})`;
        } else {
          color = `rgba(160, 160, 160, ${breathOpacity * 0.4})`;
        }

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Connections (only within same layer, gold particles)
        if (p.hue === 45) {
          const layerConfig = layers[p.layer];
          particles.slice(i + 1).forEach(p2 => {
            if (p2.hue !== 45 || p2.layer !== p.layer) return;
            const dx2 = p.x - p2.x;
            const dy2 = p.y - p2.y;
            const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
            if (dist2 < layerConfig.connectDist) {
              const alpha = 0.012 * (1 - dist2 / layerConfig.connectDist) * (p.layer === 2 ? 1.5 : 1);
              ctx.strokeStyle = `rgba(232, 176, 58, ${alpha})`;
              ctx.lineWidth = p.layer === 2 ? 0.6 : 0.4;
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

    function handleMouseMove(e: MouseEvent) {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    }

    function handleVisibilityChange() {
      setIsVisible(!document.hidden);
      if (!document.hidden && !animationRef.current) {
        draw();
      }
    }

    init();
    draw();

    window.addEventListener("resize", init, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", init);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [prefersReduced]);

  if (prefersReduced) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      aria-hidden="true"
      style={{ opacity: 0.8 }}
    />
  );
}