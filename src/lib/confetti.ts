export function triggerConfetti() {
  if (typeof window === 'undefined') return;

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const colors = ['#6366f1', '#8b5cf6', '#22d3ee', '#ec4899', '#f43f5e', '#fbbf24', '#10b981'];
  const particles: Array<{
    x: number;
    y: number;
    size: number;
    color: string;
    speedX: number;
    speedY: number;
    rotation: number;
    rotationSpeed: number;
    opacity: number;
  }> = [];

  // Create particles from center bottom and sides
  const particleCount = 120;
  for (let i = 0; i < particleCount; i++) {
    const isLeft = i % 2 === 0;
    particles.push({
      x: isLeft ? width * 0.1 : width * 0.9,
      y: height * 0.8,
      size: Math.random() * 8 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedX: (isLeft ? 1 : -1) * (Math.random() * 15 + 5),
      speedY: -(Math.random() * 20 + 10),
      rotation: Math.random() * 360,
      rotationSpeed: Math.random() * 10 - 5,
      opacity: 1,
    });
  }

  let animationFrameId: number;

  function update() {
    ctx!.clearRect(0, 0, width, height);

    let activeParticles = 0;

    for (let p of particles) {
      if (p.opacity <= 0) continue;

      activeParticles++;

      p.x += p.speedX;
      p.y += p.speedY;
      p.speedY += 0.5; // Gravity
      p.speedX *= 0.98; // Drag
      p.rotation += p.rotationSpeed;

      if (p.y > height * 0.6) {
        p.opacity -= 0.015;
      }

      ctx!.save();
      ctx!.translate(p.x, p.y);
      ctx!.rotate((p.rotation * Math.PI) / 180);
      ctx!.globalAlpha = Math.max(0, p.opacity);
      ctx!.fillStyle = p.color;

      // Draw random shapes (square, circle, triangle)
      const shapeType = p.x % 3;
      if (shapeType === 0) {
        ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else if (shapeType === 1) {
        ctx!.beginPath();
        ctx!.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx!.fill();
      } else {
        ctx!.beginPath();
        ctx!.moveTo(0, -p.size / 2);
        ctx!.lineTo(p.size / 2, p.size / 2);
        ctx!.lineTo(-p.size / 2, p.size / 2);
        ctx!.closePath();
        ctx!.fill();
      }

      ctx!.restore();
    }

    if (activeParticles > 0) {
      animationFrameId = requestAnimationFrame(update);
    } else {
      canvas.remove();
    }
  }

  update();

  // Cleanup safety limit
  setTimeout(() => {
    cancelAnimationFrame(animationFrameId);
    if (canvas.parentNode) {
      canvas.remove();
    }
  }, 4000);
}
