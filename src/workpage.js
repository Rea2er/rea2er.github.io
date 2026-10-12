// Full-screen work pages behind the folders. Each category has its own layout, picked by
// `layout` in content.js: scatter (apps), magazine (courses), player (youtube), orbit (projects).
import * as T from './textures.js';
import { skills, experiences, profile } from './content.js';

const $ = (s, el = document) => el.querySelector(s);
const pad = (n) => String(n).padStart(2, '0');
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function createWorkpage() {
  const wp = $('#workpage');
  const view = $('.wp-view', wp);
  let active = null; // { cat, cleanup, key }

  function open(cat, idx) {
    clearTimeout(clearTimer);
    close(true);
    wp.dataset.layout = cat.layout;
    wp.style.setProperty('--accent', cat.color === '#f5f3ee' ? '#e8e2d4' : cat.color);
    const layout = LAYOUTS[cat.layout];
    view.innerHTML = '';
    active = { cat, ...layout(view, cat, idx) };
    wp.classList.add('is-open');
    wp.setAttribute('aria-hidden', 'false');
  }

  let clearTimer = 0;
  function close(instant) {
    if (!active) return;
    active.cleanup?.();
    active = null;
    if (instant) return;
    wp.classList.remove('is-open');
    wp.setAttribute('aria-hidden', 'true');
    // empty the page once it has faded out, so nothing left behind can catch clicks
    clearTimeout(clearTimer);
    clearTimer = setTimeout(() => { if (!active) view.innerHTML = ''; }, 600);
  }

  // Arrow keys belong to the open page, not the 3D scene underneath.
  window.addEventListener('keydown', (e) => {
    if (!active || !wp.classList.contains('is-open')) return;
    if (e.key === 'Escape' && active.escape?.()) { e.stopImmediatePropagation(); return; }
    if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && active.key) {
      e.stopImmediatePropagation();
      active.key(e.key === 'ArrowRight' ? 1 : -1);
    }
  }, true);

  $('.wp-back', wp).addEventListener('click', () => close());
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1500));
  idle(() => preloadImages(), { timeout: 4000 });
  return { open, close: () => close(), isOpen: () => wp.classList.contains('is-open') };
}

// Every image the work pages use; fetched and decoded ahead of time so tiles never pop in grey.
function preloadImages() {
  const urls = [
    ...SHOTS.map(([n]) => `assets/locker-${n}.jpg`),
    ...FLUTTER.map(([f]) => `assets/flutter-${f}.jpg`),
    ...Array.from({ length: 8 }, (_, k) => `assets/aircanada-app-${k + 1}.jpg`),
    ...Array.from({ length: 6 }, (_, k) => `assets/pnc-app-${k + 1}.jpg`),
    ...Array.from({ length: 14 }, (_, k) => `assets/dailytails-${pad(k + 1)}.jpg`),
  ];
  urls.forEach((u) => { const img = new Image(); img.decoding = 'async'; img.src = u; img.decode?.().catch(() => {}); });
}

const head = (cat, idx, cls = '') => `
  <header class="wp-h ${cls}">
    <span class="wp-no">${pad(idx + 1)} /</span>
    <h2 class="wp-big">${cat.en}</h2>
    <p class="wp-sub">${cat.sub}</p>
  </header>`;

/* ---------- APPS: prints tossed on a table ---------- */
// [left %, top %, rotation°] inside the table area
const TOSS = [[12, 50, -9], [27, 58, 6], [42, 47, -4], [57, 59, 7], [71, 53, -6], [85, 62, 5], [34, 74, -5], [64, 76, 8]];

function scatter(view, cat, idx) {
  // page 1 is the category's own items; extra pages (cat.pages) follow, switched from the pager below
  const pages = [{ name: 'Work apps', note: cat.note, items: cat.items }, ...(cat.pages ?? [])];
  let page = 0, items = pages[0].items;
  view.innerHTML = `
    ${head(cat, idx, 'is-right')}
    <div class="sc-table"></div>
    <p class="wp-help"></p>
    ${pages.length > 1 ? `<nav class="sc-pages">${pages.map((p, k) => `<button data-p="${k}">${pad(k + 1)} ${p.name}</button>`).join('')}</nav>` : ''}
    <div class="sc-light" hidden>
      <button class="sc-nav" data-d="-1" aria-label="Previous">←</button>
      <figure><img alt=""><figcaption><b></b><span></span></figcaption></figure>
      <button class="sc-nav" data-d="1" aria-label="Next">→</button>
    </div>`;
  const table = $('.sc-table', view);
  let prints = [], top = 0;
  // two loose rows for the dense page, the hand-placed toss otherwise
  const spot = (i, n, dense) => {
    if (!dense) return TOSS[i % TOSS.length];
    const per = Math.ceil(n / 2), row = Math.floor(i / per), col = i % per, r = T.rng(i + 3);
    return [8 + (col + (row ? 0.5 : 0)) * (84 / per), 41 + row * 31 + (r() - 0.5) * 5, (r() - 0.5) * 16];
  };
  function render(k, animate = true) {
    page = k;
    const pg = pages[k];
    items = pg.items;
    table.classList.toggle('is-dense', !!pg.dense);
    table.innerHTML = items.map((it, i) => {
      const [x, y, r] = spot(i, items.length, pg.dense);
      return `<figure class="sc-print" data-i="${i}" style="left:${x}%;top:${y}%;--r:${r}deg;z-index:${i + 1}">
        <img src="${it.img}" alt="${it.title}" draggable="false"><figcaption>${it.title}</figcaption></figure>`;
    }).join('');
    $('.wp-help', view).textContent = `${pg.note} · DRAG TO REARRANGE · CLICK TO LOOK CLOSER`;
    view.querySelectorAll('.sc-pages button').forEach((b) => b.classList.toggle('is-on', +b.dataset.p === k));
    prints = [...table.querySelectorAll('.sc-print')];
    top = prints.length;
    if (animate) gsap.from(prints, { y: () => innerHeight * 0.7, rotation: () => gsap.utils.random(-40, 40), opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.05, delay: 0.1, clearProps: 'transform,opacity' });
  }
  render(0);
  gsap.from($('.wp-h', view), { x: 60, opacity: 0, duration: 0.8, ease: 'power3.out', delay: 0.1 });
  const flip = (k) => {
    if (k === page || k < 0 || k >= pages.length) return;
    gsap.to(prints, { y: -innerHeight * 0.6, opacity: 0, rotation: () => gsap.utils.random(-30, 30), duration: 0.45, ease: 'power2.in', stagger: 0.02, onComplete: () => render(k) });
  };
  $('.sc-pages', view)?.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) flip(+b.dataset.p); });

  // drag to rearrange; a press without movement opens the print
  let drag = null;
  const down = (e) => {
    const el = e.target.closest('.sc-print');
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    el.style.zIndex = ++top;
    const r = table.getBoundingClientRect();
    drag = { el, x: e.clientX, y: e.clientY, l: parseFloat(el.style.left), t: parseFloat(el.style.top), w: r.width, h: r.height, moved: false };
    el.classList.add('is-held');
  };
  const move = (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.hypot(dx, dy) > 5) drag.moved = true;
    drag.el.style.left = `${clamp(drag.l + (dx / drag.w) * 100, 4, 96)}%`;
    drag.el.style.top = `${clamp(drag.t + (dy / drag.h) * 100, 8, 96)}%`;
    drag.el.style.setProperty('--tilt', `${clamp(dx * 0.04, -8, 8)}deg`);
  };
  const up = () => {
    if (!drag) return;
    drag.el.classList.remove('is-held');
    drag.el.style.setProperty('--tilt', '0deg');
    if (!drag.moved) show(+drag.el.dataset.i);
    drag = null;
  };
  table.addEventListener('pointerdown', down);
  table.addEventListener('pointermove', move);
  table.addEventListener('pointerup', up);
  table.addEventListener('pointercancel', up);

  const light = $('.sc-light', view);
  let cur = 0;
  function show(i) {
    cur = (i + items.length) % items.length;
    const it = items[cur];
    $('img', light).src = it.img;
    $('b', light).textContent = it.title;
    $('span', light).textContent = it.sub;
    if (light.hidden) {
      light.hidden = false;
      gsap.fromTo($('figure', light), { scale: 0.85, opacity: 0, rotation: -4 }, { scale: 1, opacity: 1, rotation: 0, duration: 0.45, ease: 'back.out(1.6)' });
    }
  }
  const hide = () => { if (light.hidden) return false; light.hidden = true; return true; };
  light.addEventListener('click', (e) => {
    const nav = e.target.closest('.sc-nav');
    if (nav) show(cur + +nav.dataset.d);
    else hide();
  });
  // arrows step through the open print, or flip pages when nothing is open
  return { key: (d) => { if (!light.hidden) show(cur + d); else flip(page + d); }, escape: hide };
}

/* ---------- COURSES: a giant word with a booklet turning its pages ---------- */
function magazine(view, cat, idx) {
  const course = (c) => ({
    hero: `<div class="mz-pg mz-hero" style="--c:${c.color}">
        <span class="mz-plat">${c.platform.toUpperCase()}</span>
        <p class="mz-kick">${c.kicker} · ${c.years}</p>
        <h3>${c.title}</h3>
        <dl>${c.stats.map(([v, l]) => `<div><dt>${v}</dt><dd>${l}</dd></div>`).join('')}</dl>
      </div>`,
    points: `<div class="mz-pg mz-points">
        <p class="mz-kick">WHAT YOU BUILD</p>
        <ol>${c.points.map((p) => `<li>${p}</li>`).join('')}</ol>
        <p class="mz-foot">${c.platform} · ${c.title}</p>
      </div>`,
  });
  const cover = `<div class="mz-pg mz-cover"><p class="mz-kick">${pad(idx + 1)} / ${cat.sub}</p><h3>Course<br>Book</h3><p>${cat.items.length} courses · 1,000+ learners</p><span class="mz-tap">TURN THE PAGE →</span></div>`;
  const end = `<div class="mz-pg mz-end"><p>Also teaching on</p><h3>YouTube</h3><p>13.1K subscribers · Fullstack School</p><span class="mz-sign">the end</span></div>`;
  const back = '<div class="mz-pg mz-back"></div>';
  // spreads: [left, right]; leaf i shows spreads[i].right on its front and spreads[i+1].left on its back
  const spreads = [[null, cover], ...cat.items.map((c) => { const p = course(c); return [p.hero, p.points]; }), [end, back]];
  const leaves = spreads.slice(0, -1).map((s, i) => [s[1], spreads[i + 1][0]]);
  view.innerHTML = `
    <span class="wp-no mz-no">${pad(idx + 1)} /</span>
    <h2 class="mz-word">${cat.en}</h2>
    <div class="mz-book">
      <div class="mz-base">${back}</div>
      ${leaves.map(([f, b], i) => `<div class="mz-leaf" style="z-index:${leaves.length - i}"><div class="mz-face is-front">${f}</div><div class="mz-face is-back">${b}</div></div>`).join('')}
    </div>
    <div class="wp-ctrl mz-ctrl"><button data-d="-1" aria-label="Previous page">←</button><span class="wp-count"></span><button data-d="1" aria-label="Next page">→</button></div>
    <p class="wp-help">CLICK THE PAGES OR USE ← → TO TURN</p>`;
  const book = $('.mz-book', view);
  const els = [...view.querySelectorAll('.mz-leaf')];
  const last = els.length;
  let at = 0;
  const count = $('.wp-count', view);
  // closed book sits centred as a single page; open, the spine is centred
  const shift = (i) => (i === 0 ? -25 : i === last ? 25 : 0);
  const sync = () => {
    count.textContent = `${pad(at + 1)} / ${pad(last + 1)}`;
    view.querySelector('[data-d="-1"]').disabled = at === 0;
    view.querySelector('[data-d="1"]').disabled = at === last;
  };
  gsap.set(book, { xPercent: shift(0) });
  gsap.from($('.mz-word', view), { scale: 1.15, opacity: 0, duration: 1, ease: 'power3.out' });
  gsap.from(book, { y: 80, rotation: -6, opacity: 0, duration: 0.9, ease: 'power3.out', delay: 0.2 });
  function turn(d) {
    const to = at + d;
    if (to < 0 || to > last) return;
    const leaf = els[d > 0 ? at : at - 1];
    const tl = gsap.timeline();
    tl.to(leaf, { rotationY: d > 0 ? -180 : 0, duration: 0.9, ease: 'power2.inOut' }, 0);
    // swap stacking at the halfway point so the turning page lands on top of its new pile
    tl.call(() => { leaf.style.zIndex = d > 0 ? 100 + at : last - els.indexOf(leaf); }, null, 0.45);
    tl.to(book, { xPercent: shift(to), duration: 0.9, ease: 'power2.inOut' }, 0);
    at = to;
    book.classList.toggle('is-end', at === last); // closed at the back: only the last page shows
    sync();
  }
  book.addEventListener('click', (e) => {
    const r = book.getBoundingClientRect();
    turn(e.clientX > r.left + r.width / 2 ? 1 : -1);
  });
  view.querySelector('.mz-ctrl').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) turn(+b.dataset.d); });
  sync();
  return { key: turn };
}

/* ---------- YOUTUBE: channel on the left, a player on the right ---------- */
function player(view, cat, idx) {
  const ch = cat.channel;
  const ROWS = 4;
  view.innerHTML = `
    <div class="yt-grid">
      <div class="yt-side">
        <span class="wp-no">${pad(idx + 1)} /</span>
        <h2 class="wp-big">${cat.en}</h2>
        <p class="wp-sub">${ch.name} · ${ch.years}</p>
        <dl class="yt-stats">${ch.stats.map(([v, l]) => `<div><dt>${v}</dt><dd>${l}</dd></div>`).join('')}</dl>
        ${ch.url ? `<a class="yt-go" href="${ch.url}" target="_blank" rel="noopener">VISIT THE CHANNEL ↗</a>` : '<p class="yt-go is-off">SEARCH “FULLSTACK SCHOOL” ON YOUTUBE</p>'}
      </div>
      <div class="yt-main">${Array.from({ length: ROWS }, (_, r) => {
        const covers = cat.items.filter((_, k) => k % ROWS === r);
        const strip = covers.map((id) => `<a class="yt-cover" href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener" aria-label="Watch on YouTube"><img src="https://i.ytimg.com/vi/${id}/mqdefault.jpg" alt="" loading="lazy" onerror="this.parentNode.remove()"></a>`).join('');
        // the strip is doubled so the loop is seamless; odd rows run the other way
        return `<div class="yt-row${r % 2 ? ' is-rev' : ''}" style="--dur:${38 + r * 6}s"><div class="yt-track">${strip}${strip}</div></div>`;
      }).join('')}
      </div>
    </div>`;
  gsap.from($('.yt-side', view).children, { x: -40, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.06 });
  gsap.from(view.querySelectorAll('.yt-row'), { x: (i) => (i % 2 ? -80 : 80), opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, delay: 0.1 });
  return {};
}

/* ---------- PROJECTS: a cloud of tiles that morphs between shapes ---------- */
// Every tile is a piece of work; each filter gathers its tiles into a shape that stands for it
// (see SHAPES), framed by a thin HUD whose readouts update live.
const SHOTS = [['open', 'the locker, open'], ['shelf', 'experience, as books'], ['skills', 'skills, as cards'], ['work', 'work, as folders'], ['id', 'about, as an ID card']];
// Flutter apps built on the channel: [file, name, aspect of the two-phone crop]
const FLUTTER = [['food', 'Food Delivery', 0.906], ['task', 'Task Management', 0.924], ['elearn', 'Online Course', 0.924], ['clothes', 'Clothes Shop', 0.942],
  ['getx', 'GetX Task Todo', 0.8], ['chat', 'Chat', 0.924], ['nft', 'NFT Profile', 0.924], ['travel', 'Travel Blog', 0.942], ['ebook', 'E-Book', 0.906],
  ['staggered', 'Staggered Grid', 0.922], ['game', 'Game Store', 0.924], ['house', 'House Rent', 0.922], ['job', 'Job Finder', 0.924], ['darkmode', 'Dark Mode', 0.924]];
const STICKERS = ['star', 'burst', 'heart', 'bolt', 'vibe', 'omg', 'flower', 'cd', 'smile', 'hello', 'rainbow', 'cloud'];
const CHIP = ['#ff5cd1', '#f6ff3a', '#5cf0ff', '#ff8a3d', '#b2ff59'];
let codeTiles = null; // canvas textures from textures.js, drawn once and cached as data URLs

function gatherCodeTiles() {
  if (codeTiles) return codeTiles;
  const out = [];
  const add = (fn, aspect, caption) => { try { out.push({ src: fn().image.toDataURL('image/png'), aspect, caption }); } catch { /* skip anything that can't draw */ } };
  STICKERS.forEach((k) => add(() => T.stickerTexture(k), 1, `drawn in code · ${k} sticker`));
  [['Style', '#ff5fa2'], ['DREAM', '#5b7cff'], ['LOVE', '#e8452c'], ['HI!', '#ffc93c']].forEach(([w, c]) => add(() => T.wordStickerTexture(w, c), 2, 'drawn in code · word sticker'));
  skills.forEach((sk) => {
    add(() => T.skillCardTexture(sk, skills.length), 1.6, `drawn in code · ${sk.title}`);
    add(() => T.skillCardBackTexture(sk), 1.6, `drawn in code · ${sk.title} toolkit`);
  });
  experiences.forEach((e) => add(() => T.bookCoverTexture(e), 0.74, `drawn in code · ${e.company} book`));
  [0, 1, 2, 3].forEach((i) => add(() => T.polaroidTexture(i), 0.82, 'drawn in code · polaroid'));
  [0, 1].forEach((i) => add(() => T.photoStripTexture(i), 0.34, 'drawn in code · photo strip'));
  add(() => T.idCardTexture(profile), 1.56, 'drawn in code · ID card');
  return (codeTiles = out);
}

function buildTiles(cat) {
  const r = T.rng(11);
  const tiles = [];
  SHOTS.forEach(([name, caption]) => {
    const src = `assets/locker-${name}.jpg`;
    tiles.push({ type: 'img', src, aspect: 1.6, caption: `locker · ${caption}`, project: 'locker', group: 'locker' });
    for (let k = 0; k < 9; k++) {
      const zoom = 2.2 + r() * 2.4, aspect = [1, 1.33, 0.8, 1.5][k % 4];
      tiles.push({ type: 'crop', src, aspect, zoom, x: 8 + r() * 84, y: 10 + r() * 80, caption: `locker · ${caption} (detail)`, project: 'locker', group: 'locker' });
    }
  });
  gatherCodeTiles().forEach((t) => tiles.push({ type: 'img', ...t, project: 'locker', group: 'locker' }));
  FLUTTER.forEach(([file, name, aspect]) => {
    const src = `assets/flutter-${file}.jpg`, caption = `flutter · ${name} app`;
    tiles.push({ type: 'img', src, aspect, caption, project: 'flutter', group: 'flutter' });
    // each crop holds two phones: also show each phone on its own
    if (file !== 'getx') [0, 100].forEach((x) => tiles.push({ type: 'crop', src, aspect: aspect / 2, zoom: 2, x, y: 50, caption, project: 'flutter', group: 'flutter' }));
  });
  for (let n = 1; n <= 8; n++) tiles.push({ type: 'img', src: `assets/aircanada-app-${n}.jpg`, aspect: 0.46, caption: 'apps · Air Canada', project: 'apps', group: 'apps' });
  for (let n = 1; n <= 6; n++) tiles.push({ type: 'img', src: `assets/pnc-app-${n}.jpg`, aspect: 0.46, caption: 'apps · PNC Mobile', project: 'apps', group: 'apps' });
  cat.notes.forEach((nt) => tiles.push({ type: 'note', ...nt, aspect: 1.25, caption: `note · ${cat.projects[nt.project].title}`, group: 'notes' }));
  // shuffle so the groups mix through the shape
  for (let i = tiles.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [tiles[i], tiles[j]] = [tiles[j], tiles[i]]; }
  return tiles;
}

// Each shape returns N points roughly inside the unit cube (screen y points down). Apart from the
// sphere and grid, shapes are drawn on a hidden canvas and filled with evenly spread points, so each
// filter gathers its tiles into something that stands for it: my initials, the Flutter logo, an
// iPhone, a locker, a wall of sticky notes.
function maskPoints(n, w, h, draw, size = 0.95, seed = 1) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = ctx.strokeStyle = '#fff';
  ctx.lineCap = ctx.lineJoin = 'round';
  draw(ctx, w, h);
  const d = ctx.getImageData(0, 0, w, h).data, cand = [];
  for (let y = 0; y < h; y += 3) for (let x = 0; x < w; x += 3) if (d[(y * w + x) * 4 + 3] > 128) cand.push([x, y]);
  // farthest-point sampling: each new point goes where the shape is emptiest
  const r = T.rng(seed), dist = new Float32Array(cand.length).fill(Infinity), out = [];
  let at = Math.floor(r() * cand.length);
  for (let k = 0; k < n && cand.length; k++) {
    const [px, py] = cand[at];
    out.push([((px - w / 2) / (h / 2)) * size, ((py - h / 2) / (h / 2)) * size, (r() - 0.5) * 0.3]);
    let best = 0;
    for (let q = 0; q < cand.length; q++) {
      const dd = (cand[q][0] - px) ** 2 + (cand[q][1] - py) ** 2;
      if (dd < dist[q]) dist[q] = dd;
      if (dist[q] > dist[best]) best = q;
    }
    at = best;
  }
  return out;
}
const FLUTTER_LOGO = [ // official geometry, 166 × 202 viewBox
  [[37.7, 128.9], [9.8, 101], [100.4, 10.4], [155.9, 10.4]],
  [[155.9, 93.1], [100.4, 93.1], [51.8, 141.7], [79.6, 169.6]],
  [[79.6, 169.6], [107.4, 141.6], [155.9, 191.6], [100.4, 191.6]],
];
const SHAPES = {
  rn: (n) => maskPoints(n, 640, 320, (ctx, w, h) => {
    // a plain bold sans whose strokes are about two tiles wide, so the letters read like pixel type
    ctx.font = `700 300px ${T.FONTS.sans}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '24px';
    ctx.fillText('RN', w / 2, h / 2 + 8);
  }, 0.8, 2),
  flutter: (n) => maskPoints(n, 332, 404, (ctx) => {
    ctx.scale(2, 2);
    FLUTTER_LOGO.forEach((poly) => { ctx.beginPath(); poly.forEach(([x, y]) => ctx.lineTo(x, y)); ctx.closePath(); ctx.fill(); });
  }, 0.95, 3),
  iphone: (n) => maskPoints(n, 300, 600, (ctx) => {
    ctx.lineWidth = 20;
    ctx.beginPath(); ctx.roundRect(30, 20, 240, 560, 52); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(112, 52, 76, 22, 11); ctx.fill(); // Dynamic Island
  }, 0.95, 4),
  locker: (n) => maskPoints(n, 420, 600, (ctx) => {
    // wider than the iPhone, with the vents and handle drawn as bold bars so they show through the tiles
    ctx.lineWidth = 18;
    ctx.beginPath(); ctx.roundRect(24, 20, 372, 560, 12); ctx.stroke();
    ctx.lineWidth = 16;
    ctx.beginPath();
    [92, 132, 172, 428, 468, 508].forEach((y) => { ctx.moveTo(110, y); ctx.lineTo(310, y); }); // vents
    ctx.moveTo(338, 250); ctx.lineTo(338, 350); // handle
    ctx.stroke();
  }, 0.95, 5),
  board(n) { // sticky notes pinned in slightly uneven rows
    const r = T.rng(6), cols = Math.min(4, Math.ceil(Math.sqrt(n * 1.4))), rows = Math.ceil(n / cols);
    return Array.from({ length: n }, (_, i) => {
      const c = i % cols, rw = Math.floor(i / cols), inRow = Math.min(cols, n - rw * cols);
      return [(c - (inRow - 1) / 2) * 0.62 + (r() - 0.5) * 0.08, (rw - (rows - 1) / 2) * 0.5 + (r() - 0.5) * 0.08, (r() - 0.5) * 0.1];
    });
  },
  sphere(n) {
    return Array.from({ length: n }, (_, i) => {
      const y = 1 - (2 * (i + 0.5)) / n, rr = Math.sqrt(1 - y * y), a = i * 2.39996;
      return [Math.cos(a) * rr, y, Math.sin(a) * rr];
    });
  },
  grid(n) {
    const cols = Math.ceil(Math.sqrt(n * 1.9)), rows = Math.ceil(n / cols);
    return Array.from({ length: n }, (_, i) => [((i % cols) / (cols - 1) - 0.5) * 2.1, (Math.floor(i / cols) / Math.max(1, rows - 1) - 0.5) * 1.15, 0]);
  },
};
// each filter starts in the shape that stands for it; ‹ › still cycles through all of them
const FILTER_SHAPE = { all: 'rn', flutter: 'flutter', apps: 'iphone', locker: 'locker', notes: 'board' };
// tiles shrink in the drawn shapes so their outline reads instead of blurring into a block
const TILE_SCALE = { rn: 0.42, flutter: 0.55, iphone: 1, locker: 0.4, board: 1, sphere: 1, grid: 1 };
const shapeCache = new Map();
const shapePoints = (name, n) => {
  const key = `${name}:${n}`;
  if (!shapeCache.has(key)) shapeCache.set(key, SHAPES[name](n));
  return shapeCache.get(key);
};
const SHAPE_NAMES = Object.keys(SHAPES);

function orbit(view, cat, idx) {
  const tiles = buildTiles(cat);
  view.innerHTML = `
    <div class="ob-stage"><div class="ob-rig">${tiles.map((t, i) => {
      const inner = t.type === 'note'
        ? (t.logo ? `<img src="${t.logo}" alt="">` : `<b>${t.big}</b>`) + `<small>${t.small}</small>`
        : '';
      const bg = t.type === 'img' ? `background-image:url('${t.src}')`
        : t.type === 'crop' ? `background-image:url('${t.src}');background-size:${t.zoom * 100}% auto;background-position:${t.x}% ${t.y}%` : '';
      return `<div class="ob-tile ob-${t.type} ob-p-${t.project}" data-i="${i}" style="${bg}">${inner}</div>`;
    }).join('')}</div></div>
    <div class="ob-hud" aria-hidden="true">
      <span class="ob-l tl" data-k="rotate"></span><span class="ob-l tc" data-k="title"></span><span class="ob-l tr" data-k="noise"></span>
      <span class="ob-l bl" data-k="zoom"></span><span class="ob-l bc" data-k="shape"></span><span class="ob-l br" data-k="depth"></span>
    </div>
    <div class="ob-shapes"><button data-s="-1" aria-label="Previous shape">‹</button><span></span><button data-s="1" aria-label="Next shape">›</button></div>
    <div class="ob-filter">${['all', 'flutter', 'locker', 'apps', 'notes'].map((f) => `<button data-f="${f}"${f === 'all' ? ' class="is-on"' : ''}>${f}</button>`).join('')}</div>
    <span class="wp-no ob-no">${pad(idx + 1)} / ${cat.en}</span>
    <div class="ob-chip" hidden></div>
    <div class="ob-frame" hidden><span class="ob-fc tl"></span><span class="ob-fc br"></span></div>
    <div class="wl-pop" hidden><div class="wl-card"><button class="wl-x" aria-label="Close">×</button><span class="wl-sub"></span><h3></h3><p></p></div></div>`;
  const stage = $('.ob-stage', view);
  const els = [...view.querySelectorAll('.ob-tile')];
  const hud = Object.fromEntries([...view.querySelectorAll('.ob-l')].map((el) => [el.dataset.k, el]));
  const chip = $('.ob-chip', view);
  const state = tiles.map(() => ({ cur: [0, 0, 0], from: [0, 0, 0], to: [0, 0, 0], start: 0, delay: 0, on: true, k: 0 }));
  let shape = SHAPE_NAMES.indexOf(FILTER_SHAPE.all), filter = 'all', rotY = 0.6, rotX = -0.18, velY = 0.0025, zoom = 1, raf = 0, drag = null, hoverI = -1;
  const noise = 0.22, depth = 0.035;
  let tileScale = TILE_SCALE[SHAPE_NAMES[shape]];

  // base (in-shape) and big (selected) sizes; the selected tile is laid out at its big size so it stays sharp
  const base = tiles.map(() => [0, 0]), big = tiles.map(() => [0, 0]);
  function sizeTiles() {
    const u = Math.min(innerWidth, innerHeight) * 0.115, L = Math.min(innerWidth * 0.5, innerHeight * 0.56);
    els.forEach((el, i) => {
      const a = tiles[i].aspect, w = u * Math.sqrt(a) * 1.05;
      base[i] = [w, w / a];
      big[i] = a >= 1 ? [L, L / a] : [L * a, L];
      const [bw, bh] = i === sel ? big[i] : base[i];
      el.style.width = `${bw}px`;
      el.style.height = `${bh}px`;
    });
    if (sel >= 0) placeFrame();
  }

  /* click to bring a tile forward: it flies to the centre at its big size inside a thin blue frame */
  const PERSP = 1400;
  let sel = -1;
  const focus = { k: 0 };
  const frameEl = $('.ob-frame', view);
  function placeFrame() {
    const [w, h] = big[sel];
    frameEl.style.width = `${w + 22}px`;
    frameEl.style.height = `${h + 22}px`;
  }
  function select(i) {
    if (sel === i) return;
    if (sel >= 0) restore(sel);
    sel = i;
    const t = tiles[i], pr = cat.projects[t.project];
    els[i].style.width = `${big[i][0]}px`;
    els[i].style.height = `${big[i][1]}px`;
    $('.tl', frameEl).textContent = t.caption;
    $('.br', frameEl).textContent = `${pr.title} — ${pr.sub}`;
    placeFrame();
    frameEl.hidden = false;
    gsap.killTweensOf(focus);
    gsap.fromTo(focus, { k: 0 }, { k: 1, duration: 0.75, ease: 'power3.out' });
    gsap.fromTo(frameEl, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.4, delay: 0.35, ease: 'power2.out' });
  }
  function restore(i) {
    els[i].style.width = `${base[i][0]}px`;
    els[i].style.height = `${base[i][1]}px`;
  }
  function release() {
    if (sel < 0) return false;
    const i = sel;
    frameEl.hidden = true;
    gsap.killTweensOf(focus);
    gsap.to(focus, { k: 0, duration: 0.55, ease: 'power3.inOut', onComplete: () => { if (sel === i) { restore(i); sel = -1; } } });
    return true;
  }
  function reform(animate = true) {
    const live = state.map((s, i) => (filter === 'all' || tiles[i].group === filter ? i : -1)).filter((i) => i >= 0);
    const pts = shapePoints(SHAPE_NAMES[shape], live.length);
    const now = performance.now();
    state.forEach((s, i) => { s.on = false; });
    live.forEach((i, k) => {
      const s = state[i];
      s.on = true;
      s.from = s.cur.slice();
      s.to = pts[k];
      s.start = animate ? now : now - 1e5;
      s.delay = animate ? k * 4 : 0;
    });
    $('.ob-shapes span', view).innerHTML = SHAPE_NAMES.map((n, k) => `<i${k === shape ? ' class="is-on"' : ''}>${n}</i>`).join('');
    hud.title.textContent = `ruize nie’s ${filter} · ${live.length}`;
    hud.shape.textContent = `shape~ ${SHAPE_NAMES[shape]} ${live.length}`;
  }
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
  function frame(now) {
    if (!drag) {
      if (SHAPE_NAMES[shape] === 'sphere') { rotY += velY; velY += (0.0025 - velY) * 0.03; }
      else {
        // flat shapes face the viewer and only sway, otherwise they'd turn edge-on
        const front = Math.round(rotY / (Math.PI * 2)) * Math.PI * 2 + Math.sin(now / 2600) * 0.32;
        rotY += (front - rotY) * 0.04;
        rotX += (-0.04 - rotX) * 0.04;
      }
    }
    const R = Math.min(innerWidth, innerHeight) * 0.33 * zoom;
    tileScale += (TILE_SCALE[SHAPE_NAMES[shape]] - tileScale) * 0.06;
    const cy = Math.cos(rotY), sy = Math.sin(rotY), cx = Math.cos(rotX), sx = Math.sin(rotX);
    const t = now / 1000;
    els.forEach((el, i) => {
      const s = state[i];
      s.k += ((s.on ? 1 : 0) - s.k) * 0.12;
      if (s.k < 0.01 && !s.on) { el.style.visibility = 'hidden'; return; }
      el.style.visibility = ''; // inherit: an explicit 'visible' would poke through the hidden page and eat clicks
      const p = Math.min(1, Math.max(0, (now - s.start - s.delay) / 1100)), e = ease(p);
      for (let a = 0; a < 3; a++) s.cur[a] = s.from[a] + (s.to[a] - s.from[a]) * e;
      const n = noise * 0.05;
      let [x, y, z] = [s.cur[0] + Math.sin(t * 0.9 + i) * n, s.cur[1] + Math.cos(t * 0.7 + i * 1.3) * n, s.cur[2]];
      [x, z] = [x * cy + z * sy, -x * sy + z * cy];
      [y, z] = [y * cx - z * sx, y * sx + z * cx];
      let px = x * R, py = y * R, pz = z * R;
      let sc = s.k * tileScale * (i === hoverI && i !== sel ? 1.35 / Math.sqrt(tileScale) : 1);
      let op = Math.min(1, 0.55 + (z + 1) * 0.35);
      if (i === sel) {
        // in front of every tile in the shape, scaled back so it reads at exactly its big size
        const f = focus.k, zc = Math.min(R * 1.35, PERSP * 0.6);
        const from = (base[i][0] / big[i][0]) * tileScale;
        px *= 1 - f; py *= 1 - f; pz += (zc - pz) * f;
        sc = from * s.k + ((PERSP - zc) / PERSP - from * s.k) * f;
        op += (1 - op) * f;
      }
      el.style.transform = `translate(-50%, -50%) translate3d(${px}px, ${py}px, ${pz}px) scale(${sc})`;
      el.style.opacity = String(op);
    });
    hud.rotate.textContent = `rotate~ ${(((((rotY * 180) / Math.PI) % 360) + 360) % 360).toFixed(1)}`;
    hud.zoom.textContent = `zoom~ ${(zoom * 15).toFixed(1)}`;
    hud.noise.textContent = `noise~ ${noise.toFixed(2)}`;
    hud.depth.textContent = `depth~ ${depth.toFixed(3)}`;
    raf = requestAnimationFrame(frame);
  }

  stage.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, ry: rotY, rx: rotX, moved: false }; stage.setPointerCapture(e.pointerId); });
  stage.addEventListener('pointermove', (e) => {
    if (drag) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.hypot(dx, dy) > 5) drag.moved = true;
      const ry = drag.ry + dx * 0.006;
      velY = ry - rotY;
      rotY = ry;
      rotX = Math.max(-0.9, Math.min(0.9, drag.rx - dy * 0.004));
      return;
    }
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('.ob-tile');
    hoverI = el ? +el.dataset.i : -1;
    chip.hidden = hoverI < 0 || hoverI === sel;
    if (hoverI >= 0) {
      chip.textContent = tiles[hoverI].caption;
      chip.style.background = CHIP[hoverI % CHIP.length];
      chip.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 14}px)`;
    }
  });
  stage.addEventListener('pointerup', (e) => {
    if (!drag) return;
    const click = !drag.moved;
    drag = null;
    if (!click) return;
    if (hoverI >= 0 && hoverI === sel) pop(cat.projects[tiles[sel].project]);
    else if (hoverI >= 0) select(hoverI);
    else release();
  });
  stage.addEventListener('pointerleave', () => { hoverI = -1; chip.hidden = true; });
  stage.addEventListener('wheel', (e) => { e.preventDefault(); zoom = Math.max(0.6, Math.min(1.7, zoom - e.deltaY * 0.0012)); }, { passive: false });
  const step = (d) => { release(); shape = (shape + d + SHAPE_NAMES.length) % SHAPE_NAMES.length; reform(); };
  $('.ob-shapes', view).addEventListener('click', (e) => {
    const b = e.target.closest('button');
    const i = e.target.closest('i');
    if (b) step(+b.dataset.s);
    else if (i) { release(); shape = [...i.parentNode.children].indexOf(i); reform(); }
  });
  $('.ob-filter', view).addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    release();
    filter = b.dataset.f;
    shape = SHAPE_NAMES.indexOf(FILTER_SHAPE[filter]);
    view.querySelectorAll('.ob-filter button').forEach((x) => x.classList.toggle('is-on', x === b));
    reform();
  });

  const popEl = $('.wl-pop', view);
  function pop(pr) {
    $('.wl-sub', popEl).textContent = pr.sub;
    $('h3', popEl).textContent = pr.title;
    $('p', popEl).textContent = pr.body;
    popEl.hidden = false;
    gsap.fromTo($('.wl-card', popEl), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' });
  }
  const unpop = () => { if (popEl.hidden) return false; popEl.hidden = true; return true; };
  popEl.addEventListener('click', (e) => { if (e.target === popEl || e.target.closest('.wl-x')) unpop(); });

  sizeTiles();
  // start collapsed in the centre, then burst out into the first shape
  reform(true);
  raf = requestAnimationFrame(frame);
  addEventListener('resize', sizeTiles);
  return {
    key: step,
    escape: () => unpop() || release(),
    cleanup: () => { cancelAnimationFrame(raf); removeEventListener('resize', sizeTiles); },
  };
}

const LAYOUTS = { scatter, magazine, player, orbit };
