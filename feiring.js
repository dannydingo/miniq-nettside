const MiniQCelebration = (() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const colors = ['#f9a52e', '#f5ca45', '#39a572', '#42a3dc', '#ae76cb', '#ef786c'];
  const layer = document.createElement('div');
  layer.className = 'celebration-layer';
  layer.setAttribute('aria-hidden', 'true');
  document.body.append(layer);

  function clear() {
    layer.replaceChildren();
  }

  function burst({ x, y, count, large, delay = 0 }) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const particles = Array.from({ length: count }, (_, index) => {
      const particle = document.createElement('i');
      const angle = (index / count + Math.random() * .07) * Math.PI * 2;
      const distance = large ? Math.min(width, height) * (.35 + Math.random() * .28) : 22 + Math.random() * 36;
      const drift = Math.cos(angle) * distance;
      const rise = -Math.abs(Math.sin(angle) * distance);
      const star = index % 5 === 0 || !large;
      const duration = large ? 1450 + Math.random() * 1200 : 430 + Math.random() * 220;

      particle.className = star ? 'celebration-particle celebration-star' : 'celebration-particle';
      if (star) particle.textContent = '✦';
      const styles = {
        '--x': `${x}px`,
        '--y': `${y}px`,
        '--drift': `${drift}px`,
        '--rise': `${rise}px`,
        '--end': `${large ? height - y + 20 : -rise * .45}px`,
        '--spin': `${(Math.random() - .5) * 820}deg`,
        '--size': `${star ? 12 + Math.random() * 13 : 6 + Math.random() * 7}px`,
        '--color': colors[index % colors.length],
        '--duration': `${duration}ms`,
        '--delay': `${delay + Math.random() * (large ? 190 : 45)}ms`,
      };
      for (const [property, value] of Object.entries(styles)) particle.style.setProperty(property, value);
      particle.addEventListener('animationend', () => particle.remove(), { once: true });
      return particle;
    });
    layer.append(...particles);
  }

  function sparkle(target) {
    if (reducedMotion.matches) return;
    const rect = target.getBoundingClientRect();
    burst({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, count: 7, large: false });
  }

  function win({ finale = false } = {}) {
    clear();
    if (reducedMotion.matches) return;
    const y = window.innerHeight * .43;
    for (const side of [.22, .78]) {
      burst({ x: window.innerWidth * side, y, count: 40, large: true });
    }
    if (finale) {
      burst({ x: window.innerWidth * .5, y: y * .73, count: 40, large: true, delay: 530 });
    }
  }

  return { clear, sparkle, win };
})();
