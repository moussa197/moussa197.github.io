// Hero signature: a field of code glyphs that lights up around the pointer.
// Without a mouse (or after a few idle seconds) a slow autopilot takes over.
// Reduced motion: a still, dim field. Paused whenever the hero is off-screen.
(() => {
  'use strict';

  const hero = document.querySelector('.hero');
  const canvas = document.querySelector('.glyph-field');
  if (!hero || !canvas || !canvas.getContext) return;

  const ctx = canvas.getContext('2d');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const GLYPHS = '{}()<>[]/;=+*#_01'.split('');
  const CELL = 26;
  const RADIUS = 190;
  const DIM_ALPHA = 0.7;
  const IDLE_DELAY = 2500;
  const FRAME = 1000 / 30;

  let width = 0;
  let height = 0;
  let cells = [];
  let colors = { dim: '#363b31', lit: '#d5fa63' };
  let visible = true;
  let frameId = 0;
  let lastFrame = 0;

  const pointer = { x: 0, y: 0, lastMove: -Infinity };

  const pick = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];

  function readColors() {
    const style = getComputedStyle(document.documentElement);
    const light = document.documentElement.dataset.theme === 'light';
    colors = {
      dim: style.getPropertyValue('--line').trim() || colors.dim,
      lit: light ? '#496b13' : style.getPropertyValue('--lime').trim() || colors.lit,
    };
  }

  function build() {
    const rect = hero.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = "500 14px 'Space Grotesk', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const cols = Math.floor(width / CELL);
    const rows = Math.floor(height / CELL);
    const offsetX = (width - (cols - 1) * CELL) / 2;
    const offsetY = (height - (rows - 1) * CELL) / 2;

    cells = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        cells.push({ x: offsetX + col * CELL, y: offsetY + row * CELL, char: pick(), glow: 0 });
      }
    }
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = colors.dim;
    for (const cell of cells) {
      ctx.globalAlpha = DIM_ALPHA * (1 - cell.glow);
      ctx.fillText(cell.char, cell.x, cell.y);
    }

    ctx.fillStyle = colors.lit;
    for (const cell of cells) {
      if (cell.glow < 0.02) continue;
      ctx.globalAlpha = cell.glow;
      ctx.fillText(cell.char, cell.x, cell.y);
    }
    ctx.globalAlpha = 1;
  }

  function step(now) {
    frameId = requestAnimationFrame(step);
    if (now - lastFrame < FRAME) return;
    lastFrame = now;

    // Follow the mouse; otherwise drift along a slow, looping path.
    let x = pointer.x;
    let y = pointer.y;
    if (now - pointer.lastMove > IDLE_DELAY) {
      x = width * (0.5 + 0.38 * Math.sin(now * 0.00021));
      y = height * (0.5 + 0.32 * Math.sin(now * 0.00033 + 1.2));
    }

    for (const cell of cells) {
      const distance = Math.hypot(cell.x - x, cell.y - y);
      const reach = Math.max(0, 1 - distance / RADIUS);
      const target = reach ** 1.5;
      // Rise fast, fade slowly: the light leaves a short trail behind the pointer.
      cell.glow += (target - cell.glow) * (target > cell.glow ? 0.35 : 0.06);
      if (cell.glow > 0.25 && Math.random() < 0.07) cell.char = pick();
    }

    draw();
  }

  function start() {
    if (frameId || reduceMotion.matches || !visible || document.hidden) return;
    lastFrame = 0;
    frameId = requestAnimationFrame(step);
  }

  function stop() {
    cancelAnimationFrame(frameId);
    frameId = 0;
  }

  function settle() {
    stop();
    cells.forEach((cell) => (cell.glow = 0));
    draw();
  }

  hero.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') return;
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.lastMove = performance.now();
  });

  hero.addEventListener('pointerleave', () => (pointer.lastMove = -Infinity));

  new ResizeObserver(build).observe(hero);

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    visible ? start() : stop();
  }).observe(hero);

  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  reduceMotion.addEventListener('change', () => (reduceMotion.matches ? settle() : start()));

  new MutationObserver(() => {
    readColors();
    draw();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  readColors();
  build();
  document.fonts?.ready.then(build);
  start();
})();
