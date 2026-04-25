import { useEffect, useRef, useMemo } from "react";

interface Star {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  opacity: number;
  life: number;
  maxLife: number;
}

interface Nebula {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  color: string;
  opacity: number;
  rotation: number;
  driftSpeed: number;
  driftOffset: number;
}

export function GalaxyCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const starsRef = useRef<Star[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const nebulaRef = useRef<Nebula[]>([]);

  const generateStars = (width: number, height: number): Star[] => {
    const stars: Star[] = [];
    const count = Math.floor((width * height) / 1200);
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.6 + 0.2,
        opacity: Math.random() * 0.7 + 0.1,
        twinkleSpeed: Math.random() * 0.008 + 0.002,
        twinkleOffset: Math.random() * Math.PI * 2,
      });
    }
    return stars;
  };

  const generateNebulae = (width: number, height: number): Nebula[] => {
    const nebulaColors = [
      "rgba(0,100,180,",
      "rgba(80,0,150,",
      "rgba(0,50,120,",
      "rgba(20,80,160,",
      "rgba(60,0,100,",
      "rgba(0,150,100,",
    ];
    return Array.from({ length: 7 }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radiusX: Math.random() * 200 + 120,
      radiusY: Math.random() * 120 + 60,
      color: nebulaColors[i % nebulaColors.length],
      opacity: Math.random() * 0.18 + 0.06,
      rotation: Math.random() * Math.PI * 2,
      driftSpeed: Math.random() * 0.0003 + 0.0001,
      driftOffset: Math.random() * Math.PI * 2,
    }));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      starsRef.current = generateStars(canvas.width, canvas.height);
      nebulaRef.current = generateNebulae(canvas.width, canvas.height);
    };

    resize();
    window.addEventListener("resize", resize);

    let lastShootingStarTime = 0;

    const spawnShootingStar = () => {
      const w = canvas.width;
      const h = canvas.height;
      const angle = (Math.random() * 40 + 15) * (Math.PI / 180);
      shootingStarsRef.current.push({
        x: Math.random() * w * 0.7,
        y: Math.random() * h * 0.4,
        length: Math.random() * 140 + 80,
        speed: Math.random() * 8 + 5,
        angle,
        opacity: 1,
        life: 0,
        maxLife: Math.random() * 60 + 40,
      });
    };

    const draw = (timestamp: number) => {
      const delta = timestamp - timeRef.current;
      timeRef.current = timestamp;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Deep space gradient background
      const bg = ctx.createRadialGradient(
        canvas.width * 0.5, canvas.height * 0.5, 0,
        canvas.width * 0.5, canvas.height * 0.5, Math.max(canvas.width, canvas.height) * 0.75
      );
      bg.addColorStop(0, "rgba(8, 12, 40, 1)");
      bg.addColorStop(0.4, "rgba(4, 6, 20, 1)");
      bg.addColorStop(1, "rgba(2, 3, 10, 1)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Nebulae
      nebulaRef.current.forEach((neb) => {
        const driftT = timestamp * neb.driftSpeed + neb.driftOffset;
        const driftX = Math.sin(driftT) * 15;
        const driftY = Math.cos(driftT * 0.7) * 10;
        const scaleT = 1 + Math.sin(driftT * 0.3) * 0.08;

        ctx.save();
        ctx.translate(neb.x + driftX, neb.y + driftY);
        ctx.rotate(neb.rotation + driftT * 0.05);
        ctx.scale(scaleT, scaleT);

        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, neb.radiusX);
        const pulseOpacity = neb.opacity * (0.85 + Math.sin(driftT * 0.4) * 0.15);
        grad.addColorStop(0, neb.color + (pulseOpacity * 1.4) + ")");
        grad.addColorStop(0.4, neb.color + (pulseOpacity * 0.7) + ")");
        grad.addColorStop(1, neb.color + "0)");

        ctx.scale(1, neb.radiusY / neb.radiusX);
        ctx.beginPath();
        ctx.arc(0, 0, neb.radiusX, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
      });

      // Twinkling stars
      starsRef.current.forEach((star) => {
        const twinkle = Math.sin(timestamp * star.twinkleSpeed + star.twinkleOffset);
        const opacity = star.opacity * (0.4 + 0.6 * ((twinkle + 1) / 2));
        const r = star.radius * (0.85 + 0.15 * ((twinkle + 1) / 2));

        // Occasional bright star with cross-hair glow
        if (star.radius > 1.4) {
          ctx.save();
          ctx.globalAlpha = opacity * 0.4;
          const starGlow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, r * 6);
          starGlow.addColorStop(0, "rgba(200, 230, 255, 0.8)");
          starGlow.addColorStop(1, "rgba(200, 230, 255, 0)");
          ctx.fillStyle = starGlow;
          ctx.beginPath();
          ctx.arc(star.x, star.y, r * 6, 0, Math.PI * 2);
          ctx.fill();

          // Cross-hair lines for bright stars
          ctx.globalAlpha = opacity * 0.3;
          ctx.strokeStyle = "rgba(200, 230, 255, 0.8)";
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(star.x - r * 8, star.y);
          ctx.lineTo(star.x + r * 8, star.y);
          ctx.moveTo(star.x, star.y - r * 8);
          ctx.lineTo(star.x, star.y + r * 8);
          ctx.stroke();
          ctx.restore();
        }

        ctx.globalAlpha = opacity;
        ctx.fillStyle = `rgba(220, 235, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Shooting stars
      if (timestamp - lastShootingStarTime > 4500 + Math.random() * 3000) {
        spawnShootingStar();
        lastShootingStarTime = timestamp;
      }

      shootingStarsRef.current = shootingStarsRef.current.filter((ss) => {
        ss.life += 1;
        ss.x += Math.cos(ss.angle) * ss.speed;
        ss.y += Math.sin(ss.angle) * ss.speed;
        const progress = ss.life / ss.maxLife;
        const opacity = progress < 0.2 ? progress / 0.2 : (1 - progress) * 1.2;

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
        const grad = ctx.createLinearGradient(
          ss.x - Math.cos(ss.angle) * ss.length,
          ss.y - Math.sin(ss.angle) * ss.length,
          ss.x,
          ss.y
        );
        grad.addColorStop(0, "rgba(255, 255, 255, 0)");
        grad.addColorStop(0.6, "rgba(180, 220, 255, 0.6)");
        grad.addColorStop(1, "rgba(255, 255, 255, 1)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(ss.x - Math.cos(ss.angle) * ss.length, ss.y - Math.sin(ss.angle) * ss.length);
        ctx.lineTo(ss.x, ss.y);
        ctx.stroke();
        ctx.restore();

        return ss.life < ss.maxLife;
      });

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
