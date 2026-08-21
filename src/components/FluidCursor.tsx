import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

export const FluidCursor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Mouse coordinates
    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetX = mouseX;
    let targetY = mouseY;

    const particles: Particle[] = [];

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      const isLightMode = document.body.classList.contains('light');
      const currentColors = isLightMode 
        ? ['#0f172a', '#1e293b', '#334155', '#475569'] // Dark ink for light mode
        : ['#FF5722', '#FF7043', '#FF9800', '#E65100']; // Fire/Orange for dark mode

      // Spawn fluid trail particles on mouse move
      for (let i = 0; i < 3; i++) {
        particles.push({
          x: targetX + (Math.random() - 0.5) * 10,
          y: targetY + (Math.random() - 0.5) * 10,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5 - 0.5,
          size: Math.random() * 20 + 12,
          alpha: 0.6,
          color: currentColors[Math.floor(Math.random() * currentColors.length)],
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Render loop
    const render = () => {
      // Smooth interpolation for main cursor blob
      mouseX += (targetX - mouseX) * 0.15;
      mouseY += (targetY - mouseY) * 0.15;

      ctx.clearRect(0, 0, width, height);

      const isLightMode = document.body.classList.contains('light');

      // Draw fluid glow aura around cursor
      const gradient = ctx.createRadialGradient(
        mouseX,
        mouseY,
        0,
        mouseX,
        mouseY,
        140
      );
      
      if (isLightMode) {
        gradient.addColorStop(0, 'rgba(15, 23, 42, 0.15)');
        gradient.addColorStop(0.5, 'rgba(30, 41, 59, 0.04)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        gradient.addColorStop(0, 'rgba(255, 87, 34, 0.25)');
        gradient.addColorStop(0.5, 'rgba(255, 112, 67, 0.08)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(mouseX, mouseY, 140, 0, Math.PI * 2);
      ctx.fill();

      // Update and draw fluid particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.size *= 0.94;
        p.alpha -= 0.015;

        if (p.alpha <= 0 || p.size <= 1) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-40 fluid-canvas"
    />
  );
};
