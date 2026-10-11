// Procedural Three.js models — everything is built from primitives, no external 3D files.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as T from './textures.js';
import { profile, skills, workCategories, experiences } from './content.js';

export const L = { w: 0.9, h: 2.1, d: 0.72, t: 0.024, y0: 0.1, pitch: 0.915 };
export const MAIN = 1; // index of the locker that opens
export const DOOR_OPEN = 2.15; // radians
export const lockerX = (i) => (i - 1.5) * L.pitch;
const FLOOR = L.y0 + L.t;

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...o });
// Locker shell materials: physical (for clearcoat / sheen) and tagged so finishes.js can restyle them.
const shellMat = (role, color, o = {}) => {
  const m = new THREE.MeshPhysicalMaterial({ color, roughness: 0.55, ...o });
  m.userData = { role, baseColor: color };
  return m;
};
const boxG = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const rbox = (w, h, d, r) => new RoundedBoxGeometry(w, h, d, 3, r);
const cyl = (rt, rb, h, seg = 16) => new THREE.CylinderGeometry(rt, rb, h, seg);

function add(parent, geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

function decal(parent, tex, w, h, x, y, z, rz = 0, ry = 0) {
  const mat = new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, roughness: 0.7 });
  const m = add(parent, new THREE.PlaneGeometry(w, h), mat, x, y, z);
  m.rotation.set(0, ry, rz);
  m.userData.noShadow = true;
  return m;
}

function roundedRect(w, h, r) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return s;
}

// Re-centre an item on its bounding box so it rotates/scales around its middle when focused.
function finalize(g, meta) {
  g.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(g);
  const c = box.getCenter(V());
  const size = box.getSize(V());
  for (const ch of g.children) ch.position.sub(c);
  Object.assign(g.userData, meta, { size, baseSize: meta.fit ?? Math.max(size.x, size.y, size.z) });
  return g;
}

function placeOn(g, parent, x, bottom, z) {
  g.position.set(x, bottom + g.userData.size.y / 2, z);
  parent.add(g);
  return g;
}

/* ---------- interactive items ---------- */

function buildIdCard() {
  const g = new THREE.Group();
  const W = 0.28, H = 0.18;
  const card = new THREE.ExtrudeGeometry(roundedRect(W, H, 0.014), { depth: 0.004, bevelEnabled: false });
  add(g, card, std('#f7f4ec', { roughness: 0.35 }));
  decal(g, T.idCardTexture(profile), W, H, 0, 0, 0.0045);
  const metal = std('#d9dde3', { roughness: 0.2, metalness: 0.95 });
  add(g, rbox(0.034, 0.02, 0.01, 0.004), metal, 0, H / 2 + 0.004, 0.002);
  const ring = add(g, new THREE.TorusGeometry(0.011, 0.003, 8, 20), metal, 0, H / 2 + 0.024, 0.002);
  ring.rotation.y = Math.PI / 2;
  add(g, boxG(0.022, 0.075, 0.002), std('#f2c230', { roughness: 0.8 }), 0, H / 2 + 0.072, 0.002); // short lanyard stub
  return finalize(g, { id: 'about', label: 'ABOUT ME', focusTilt: new THREE.Euler(0, 0, 0), fit: 0.3, camLift: 0.05, focusY: 0.05, layout: 'solo' });
}

// A two-part case: the front half is a lid hinged on the top edge. Opening it flips the lid
// up and back, and the skill cards rise out of the shell.
function buildSuitcase() {
  const g = new THREE.Group();
  const inner = new THREE.Group(); // finalize() re-centres this, so local poses below stay stable
  g.add(inner);
  const shell = std('#79b8c9', { roughness: 0.42, metalness: 0.1 });
  const trim = std('#47667d', { roughness: 0.5 });
  const chrome = std('#e3e6ea', { roughness: 0.2, metalness: 0.95 });
  const lining = std('#2f4a5e', { roughness: 0.9 });
  const W = 0.6, H = 0.4, D = 0.2;

  add(inner, rbox(W, H, D / 2, 0.03), shell, 0, H / 2, -D / 4);
  add(inner, boxG(W - 0.07, H - 0.07, 0.004), lining, 0, H / 2, 0.001);
  const handle = add(inner, new THREE.TorusGeometry(0.065, 0.013, 10, 28, Math.PI), trim, W / 2, H / 2, -D / 4);
  handle.rotation.z = -Math.PI / 2;
  for (const sy of [-1, 1]) add(inner, rbox(0.016, 0.03, 0.03, 0.005), chrome, W / 2 + 0.006, H / 2 + sy * 0.065, -D / 4);

  const lid = new THREE.Group();
  lid.position.set(0, H, 0);
  inner.add(lid);
  add(lid, rbox(W, H, D / 2, 0.03), shell, 0, -H / 2, D / 4);
  add(lid, boxG(W - 0.07, H - 0.07, 0.004), lining, 0, -H / 2, -0.001);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    add(lid, rbox(0.07, 0.07, 0.03, 0.012), trim, sx * (W / 2 - 0.028), -H / 2 + sy * (H / 2 - 0.028), D / 2 - 0.006);
  }
  for (const sx of [-1, 1]) add(lid, rbox(0.05, 0.034, 0.02, 0.006), chrome, sx * 0.17, -0.05, D / 2 + 0.004);
  decal(lid, T.labelTexture({
    bg: '#fffdf6', border: '#2840e8', radius: 30,
    lines: [
      { text: 'SKILLS', font: (z) => `${z}px ${T.FONTS.display}`, size: 96, y: 0.42, color: '#2840e8' },
      { text: 'MY SKILLS · 02', font: (z) => `900 ${z}px ${T.FONTS.serif}`, size: 40, y: 0.76, color: '#d6352f' },
    ],
  }), 0.24, 0.12, -0.08, H * 0.47 - H, D / 2 + 0.003, 0.05);
  decal(lid, T.stickerTexture('star'), 0.09, 0.09, 0.17, 0.12 - H, D / 2 + 0.003, -0.2);
  decal(lid, T.stickerTexture('heart'), 0.07, 0.07, 0.19, 0.27 - H, D / 2 + 0.003, 0.25);

  const n = skills.length;
  const cardGeo = new THREE.ExtrudeGeometry(roundedRect(0.5, 0.3125, 0.02), { depth: 0.003, bevelEnabled: false });
  const CLOSED = (p) => ({ pos: { x: 0, y: H / 2, z: 0.012 + (n - 1 - p) * 0.004 }, rot: { x: 0, y: 0, z: 0 }, s: 0.95 });
  // slot 0 is the hero card held up above the case; the rest stay tucked in the shell, peeking out.
  const OPEN = (p, flip = false) => (p === 0
    ? { pos: { x: 0, y: H + 0.22, z: 0.2 }, rot: { x: 0.1, y: flip ? Math.PI : 0, z: 0 }, s: 1.5 }
    : { pos: { x: (p - (n - 1) / 2 - 0.5) * 0.07, y: H * 0.78 + p * 0.012, z: 0.008 + (n - p) * 0.008 }, rot: { x: 0, y: 0, z: (p - n / 2) * 0.05 }, s: 0.92 });
  const cards = skills.map((sk, i) => {
    const c = new THREE.Group();
    add(c, cardGeo, std(sk.color, { roughness: 0.5 }));
    decal(c, T.skillCardTexture(sk, skills.length), 0.5, 0.3125, 0, 0, 0.0035);
    decal(c, T.skillCardBackTexture(sk), 0.5, 0.3125, 0, 0, -0.0005, 0, Math.PI);
    c.userData.skillCard = i;
    c.visible = false;
    const p = CLOSED(i); // active starts at 0, so slot === index here
    c.position.set(p.pos.x, p.pos.y, p.pos.z);
    c.scale.setScalar(p.s);
    inner.add(c);
    return c;
  });

  const pose = (tl, c, p, at, duration = 0.55, ease = 'power3.out') => {
    tl.to(c.position, { ...p.pos, duration, ease }, at);
    tl.to(c.rotation, { ...p.rot, duration, ease }, at);
    tl.to(c.scale, { x: p.s, y: p.s, z: p.s, duration, ease }, at);
  };
  const LID_OPEN = -3.3; // just past vertical, so the lid leans back behind the cards
  let active = 0;
  let flipped = false;
  let running = null;
  const playing = () => !!running && running.progress() < 1; // isActive() is false until the first tick
  const slot = (i) => (i - active + n) % n;

  finalize(g, {
    id: 'skills', label: 'SKILLS', focusTilt: new THREE.Euler(-0.12, 0, 0), camLift: 0.15, fit: 1.05,
    layout: 'solo', soloSize: 1.05, focusY: -0.17, sway: 0.35,
  });
  Object.assign(g.userData, {
    count: n,
    wrap: true,
    state: () => ({ active, flipped }),
    onChange: null,
    // Reopening keeps the last active card, so the stack inside the case is already in slot order.
    open() {
      const tl = gsap.timeline({ defaults: { overwrite: 'auto' } });
      // The lid swings forward and up, past vertical, and rests leaning back behind the cards.
      // The cards only appear once the lid has swung clear of them.
      tl.to(lid.rotation, { x: LID_OPEN, duration: 0.7, ease: 'power2.inOut' }, 0);
      tl.add(() => cards.forEach((c) => { c.visible = true; }), 0.4);
      cards.forEach((c, i) => pose(tl, c, OPEN(slot(i)), 0.55 + slot(i) * 0.08, 0.7, 'back.out(1.2)'));
      g.userData.onChange?.(active);
      return tl;
    },
    close() {
      running?.kill();
      const tl = gsap.timeline({ defaults: { overwrite: 'auto' } });
      let at = 0;
      if (flipped) { flipped = false; tl.add(turn(cards[active], false), 0); at = 0.85; }
      cards.forEach((c, i) => pose(tl, c, CLOSED(slot(i)), at, 0.35, 'power2.in'));
      tl.to(lid.rotation, { x: 0, duration: 0.55, ease: 'power2.inOut' }, at + 0.35);
      tl.add(() => cards.forEach((c) => { c.visible = false; }), at + 0.6);
      return tl;
    },
    flip() {
      if (playing()) return running;
      flipped = !flipped;
      return (running = turn(cards[active], flipped));
    },
    // Step one card forward (+1) or back (-1). If the hero is showing its back it turns over in
    // place first, so its swinging edges never sweep through the cards below.
    step(dir) {
      if (playing()) return running; // one step at a time, or cards would collide mid-flight
      const master = (running = gsap.timeline());
      if (flipped) { flipped = false; master.add(turn(cards[active], false)); }
      master.add(dir > 0 ? stepForward() : stepBack());
      g.userData.onChange?.(active);
      return master;
    },
    next() { return this.step(1); },
    prev() { return this.step(-1); },
    // Jumps are played as single steps, so cards never swap depth order mid-air.
    async setActive(i) {
      let k = (i - active + n) % n;
      const dir = k <= n / 2 ? 1 : -1;
      if (dir < 0) k = n - k;
      for (; k > 0; k--) await this.step(dir);
    },
    // Clicking the hero card flips it; clicking a peeking card brings that one up.
    clickCard(i) { return i === active ? this.flip() : this.setActive(i); },
  });

  function turn(c, toBack) {
    const tl = gsap.timeline({ defaults: { overwrite: 'auto' } });
    const o = OPEN(0, toBack);
    // Step forward (and sink a touch, since forward also reads as up on screen) while turning, so
    // the swinging edges clear the cards below without the card rising off the top of the screen.
    tl.to(c.position, { y: o.pos.y - 0.09, z: o.pos.z + 0.24, duration: 0.25, ease: 'power2.out' }, 0);
    tl.to(c.scale, { x: o.s * 0.86, y: o.s * 0.86, z: o.s * 0.86, duration: 0.25, ease: 'power2.out' }, 0);
    tl.to(c.rotation, { y: o.rot.y, duration: 0.55, ease: 'power3.inOut' }, 0.1);
    tl.to(c.position, { y: o.pos.y, z: o.pos.z, duration: 0.3, ease: 'power2.inOut' }, 0.55);
    tl.to(c.scale, { x: o.s, y: o.s, z: o.s, duration: 0.3, ease: 'power2.inOut' }, 0.55);
    return tl;
  }

  // Cards change depth only by passing over the top of the others (never sideways and never by
  // shrinking): above this height a card's bottom edge clears every peeking card, tilt included.
  const OVER = H * 1.8;
  const OVER_S = OPEN(1).s;
  const drift = (tl, c, x, at, duration) => tl.to(c.position, { x, duration, ease: 'sine.inOut', yoyo: true, repeat: 1 }, at);

  // Forward: the hero lifts, drifts a little to the right, passes back over the stack and drops in
  // at the back; the front peeking card rises straight up; the others move up one slot.
  function stepForward() {
    const leaving = cards[active];
    active = (active + 1) % n;
    const back = OPEN(n - 1);
    const tl = gsap.timeline({ defaults: { overwrite: 'auto' } });
    tl.to(leaving.position, { y: OVER, duration: 0.3, ease: 'power2.out' }, 0);
    tl.to(leaving.scale, { x: OVER_S, y: OVER_S, z: OVER_S, duration: 0.3, ease: 'power2.out' }, 0);
    tl.to(leaving.rotation, { x: 0, y: 0, z: back.rot.z, duration: 0.5 }, 0);
    tl.to(leaving.position, { z: back.pos.z, duration: 0.3, ease: 'power1.inOut' }, 0.22);
    tl.to(leaving.position, { y: back.pos.y, duration: 0.35, ease: 'power2.inOut' }, 0.65);
    tl.to(leaving.position, { x: back.pos.x + 0.16, duration: 0.45, ease: 'sine.out' }, 0);
    tl.to(leaving.position, { x: back.pos.x, duration: 0.5, ease: 'sine.inOut' }, 0.5);
    // the front card waits until the hero is up and out of its way
    pose(tl, cards[active], OPEN(0), 0.5, 0.6, 'back.out(1.2)');
    cards.forEach((c, k) => { const p = slot(k); if (p > 0 && p < n - 1) pose(tl, c, OPEN(p), 0.5, 0.25); });
    return tl;
  }

  // Back: the back-most card rises behind the stack, comes forward over it and grows into the
  // hero; the old hero drops to the front slot once the others have moved back for it.
  function stepBack() {
    const leaving = cards[active];
    active = (active - 1 + n) % n;
    const rising = cards[active];
    const hero = OPEN(0);
    const front = OPEN(1);
    const tl = gsap.timeline({ defaults: { overwrite: 'auto' } });
    tl.to(rising.position, { y: OVER, duration: 0.3, ease: 'power2.out' }, 0);
    tl.to(rising.rotation, { ...hero.rot, duration: 0.5 }, 0.1);
    tl.to(rising.position, { z: hero.pos.z, duration: 0.35, ease: 'power1.inOut' }, 0.3);
    tl.to(rising.position, { x: hero.pos.x, y: hero.pos.y, duration: 0.35, ease: 'power2.inOut' }, 0.42);
    tl.to(rising.scale, { x: hero.s, y: hero.s, z: hero.s, duration: 0.4, ease: 'power2.out' }, 0.58);
    drift(tl, rising, 0.12, 0, 0.42);
    // the old hero first steps down in front of the stack, then settles into the front slot
    tl.to(leaving.position, { x: front.pos.x, y: front.pos.y, z: 0.1, duration: 0.4, ease: 'power2.inOut' }, 0);
    tl.to(leaving.rotation, { ...front.rot, duration: 0.4 }, 0);
    tl.to(leaving.scale, { x: front.s, y: front.s, z: front.s, duration: 0.4 }, 0);
    cards.forEach((c, k) => { const p = slot(k); if (c !== leaving && p > 1) pose(tl, c, OPEN(p), 0.3, 0.3); });
    tl.to(leaving.position, { z: front.pos.z, duration: 0.2, ease: 'power2.out' }, 0.62);
    return tl;
  }
  return g;
}

function folderShape(w, h, tabW, tabH, tabX) {
  const s = new THREE.Shape(), r = 0.012;
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(tabX + tabW, h / 2);
  s.lineTo(tabX + tabW - 0.015, h / 2 + tabH);
  s.lineTo(tabX + 0.015, h / 2 + tabH);
  s.lineTo(tabX, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return s;
}

function buildFolders() {
  const g = new THREE.Group();
  const kraft = std('#d6a86e', { roughness: 0.85 });
  const BW = 0.5, BH = 0.15, BD = 0.2, th = 0.012;
  add(g, boxG(BW, th, BD), kraft, 0, th / 2, 0);
  add(g, boxG(BW, BH, th), kraft, 0, BH / 2, BD / 2 - th / 2);
  add(g, boxG(BW, BH, th), kraft, 0, BH / 2, -BD / 2 + th / 2);
  add(g, boxG(th, BH, BD), kraft, -BW / 2 + th / 2, BH / 2, 0);
  add(g, boxG(th, BH, BD), kraft, BW / 2 - th / 2, BH / 2, 0);
  decal(g, T.labelTexture({
    w: 512, h: 150, bg: '#f4ead8', border: '#141414', radius: 10,
    lines: [
      { text: 'SELECTED WORK', font: (s) => `${s}px ${T.FONTS.display}`, size: 54, y: 0.42, color: '#141414' },
      { text: 'PORTFOLIO · 2026', font: (s) => `700 ${s}px ${T.FONTS.sans}`, size: 26, y: 0.78, color: '#d6352f' },
    ],
  }), 0.3, 0.088, 0, BH * 0.5, BD / 2 + 0.002);

  const fw = 0.44, fh = 0.29, n = workCategories.length;
  const folders = [];
  workCategories.forEach((c, idx) => {
    const pos = n - 1 - idx; // first category stands at the front
    const tabX = -fw / 2 + 0.02 + pos * 0.095;
    const geo = new THREE.ExtrudeGeometry(folderShape(fw, fh, 0.12, 0.04, tabX), { depth: 0.006, bevelEnabled: false, curveSegments: 6 });
    const m = add(g, geo, std(c.color, { roughness: 0.7 }), (pos - 1.5) * 0.006, th + fh / 2 + 0.004, -0.065 + pos * 0.035);
    m.rotation.set(-0.1, 0, (pos - 1.5) * 0.025);
    decal(m, T.labelTexture({
      w: 256, h: 64, bg: c.color, radius: 4,
      lines: [{ text: c.short, font: (s) => `700 ${s}px ${T.FONTS.mono}`, size: 34, y: 0.55, color: c.ink }],
    }), 0.1, 0.025, tabX + 0.06, fh / 2 + 0.02, 0.0072);
    decal(m, T.folderLabelTexture(c), 0.34, 0.17, 0, -0.01, 0.0072, -(pos - 1.5) * 0.04);
    folders.push({ mesh: m, cat: c });
  });
  // layout 'bare': no side panel — the box parks at the bottom and the folders spread out above it
  return finalize(g, { id: 'work', label: 'SELECTED WORK', focusTilt: new THREE.Euler(0.28, -0.25, 0), camLift: 0.35, layout: 'bare', folders });
}

function buildTypewriter() {
  const g = new THREE.Group();
  const cream = std('#efe4d0', { roughness: 0.45 });
  const dark = std('#3b302b', { roughness: 0.5 });
  const chrome = std('#cfd4da', { roughness: 0.2, metalness: 0.95 });
  add(g, rbox(0.44, 0.09, 0.34, 0.025), cream, 0, 0.045, 0);

  // keyboard deck: side profile extruded across the width (shape x = -z, shape y = y)
  const prof = new THREE.Shape();
  prof.moveTo(-0.17, 0.085);
  prof.lineTo(0, 0.15);
  prof.lineTo(0.17, 0.15);
  prof.lineTo(0.17, 0.085);
  prof.closePath();
  const deck = new THREE.ExtrudeGeometry(prof, { depth: 0.42, bevelEnabled: false });
  deck.rotateY(Math.PI / 2);
  deck.translate(-0.21, 0, 0);
  add(g, deck, cream);

  const keyGeo = cyl(0.013, 0.013, 0.014, 14);
  const slope = Math.atan2(0.065, 0.17); // keys sit square on the sloped deck instead of sinking into it
  const keys = [];
  [10, 10, 9, 8].forEach((count, r) => {
    const z = 0.14 - r * 0.038;
    const y = 0.085 + ((0.17 - z) / 0.17) * 0.065 + 0.008;
    for (let k = 0; k < count; k++) {
      const key = add(g, keyGeo, dark, (k - (count - 1) / 2) * 0.036 + r * 0.006, y, z);
      key.rotation.x = slope;
      keys.push(key);
    }
  });
  add(g, rbox(0.2, 0.012, 0.022, 0.005), dark, 0, 0.096, 0.166);
  add(g, boxG(0.5, 0.024, 0.06), cream, 0, 0.162, -0.1);
  const platen = add(g, cyl(0.032, 0.032, 0.48, 24), dark, 0, 0.19, -0.1);
  platen.rotation.z = Math.PI / 2;
  for (const sx of [-1, 1]) {
    const knob = add(g, cyl(0.022, 0.022, 0.03, 20), chrome, sx * 0.255, 0.19, -0.1);
    knob.rotation.z = Math.PI / 2;
  }
  const lever = add(g, cyl(0.005, 0.005, 0.13, 8), chrome, -0.27, 0.235, -0.06);
  lever.rotation.set(0.4, 0, 0.9);
  add(g, boxG(0.07, 0.022, 0.004), std('#c8423a', { roughness: 0.4 }), 0, 0.05, 0.171);
  // short enough to clear the shelf above it in the locker; its foot tucks into the platen
  const paperTex = T.paperTexture();
  const paper = decal(g, paperTex, 0.183, 0.2, 0, 0.292, -0.122);
  paper.rotation.x = -0.18;
  paper.material.side = THREE.DoubleSide;
  finalize(g, {
    id: 'contact', label: 'CONTACT', focusTilt: new THREE.Euler(0.16, -0.16, 0), camLift: 0.5,
    layout: 'solo', soloSize: 1.05, focusY: -0.06, sway: 0.3,
  });
  // finalize() re-centres the parts, so read rest positions only now
  const paperHome = paper.position.clone();
  keys.forEach((k) => { k.userData.rest = k.position.y; });
  const { width: pw, height: ph } = paperTex.image;
  let pressed = 0;
  Object.assign(g.userData, {
    // redraw the note with what's been typed so far
    write(text, caret) {
      T.drawPaper(paperTex.image.getContext('2d'), pw, ph, text, caret);
      paperTex.needsUpdate = true;
    },
    // a random key dips, like it was struck
    press() {
      const key = keys[(pressed = (pressed + 7) % keys.length)];
      gsap.timeline({ overwrite: true })
        .to(key.position, { y: key.userData.rest - 0.007, duration: 0.05, ease: 'power2.in' })
        .to(key.position, { y: key.userData.rest, duration: 0.14, ease: 'power2.out' });
    },
    // focused: the sheet is pulled up and out so it's big enough to write on (its foot stays in the platen)
    open() {
      return gsap.timeline()
        .to(paper.scale, { x: 1.8, y: 1.8, duration: 0.7, ease: 'power3.out' }, 0.2)
        .to(paper.position, { y: paperHome.y + 0.08, duration: 0.7, ease: 'power3.out' }, 0.2);
    },
    close() {
      return gsap.timeline()
        .to(paper.scale, { x: 1, y: 1, duration: 0.45, ease: 'power2.inOut' }, 0)
        .to(paper.position, { y: paperHome.y, duration: 0.45, ease: 'power2.inOut' }, 0);
    },
    // the note rolls up out of the machine, then a fresh sheet drops back in
    send() {
      const top = paperHome.y + 0.08;
      return gsap.timeline()
        .to(paper.position, { y: top + 0.3, duration: 0.6, ease: 'power2.in' })
        .to(paper.material, { opacity: 0, duration: 0.3 }, 0.35)
        .add(() => { paper.material.transparent = true; }, 0)
        .set(paper.position, { y: top - 0.15 })
        .add(() => g.userData.write('', false))
        .to(paper.material, { opacity: 1, duration: 0.2 })
        .to(paper.position, { y: top, duration: 0.5, ease: 'power3.out' });
    },
  });
  return g;
}

// A hardcover book in "reading" orientation: front cover faces +z, spine on the -x edge.
// open() swings the cover around the spine so its inside (left page) and the top page (right page) show.
const BOOK = { W: 0.25, H: 0.34, D: 0.05, ct: 0.006 };
function buildExperienceBook(exp, no) {
  const g = new THREE.Group();
  const inner = new THREE.Group();
  g.add(inner);
  const { W, H, D, ct } = BOOK;
  const cover = std(exp.book.color, { roughness: 0.75 });
  const paper = std('#efe6d2', { roughness: 0.9 });
  const tex = (t) => std('#ffffff', { map: t, roughness: 0.9 });
  const imgs = exp.screenImgs ?? [];
  const linkedin = profile.linkedin.replace('https://www.', '');

  // Spreads as [left page, right page]: overview → featured project → screens gallery.
  const spreads = [[T.bookLeftPageTexture(exp, no), T.bookRightPageTexture(exp)]];
  if (exp.feature) {
    // cards on the feature page: client engagements (other books) or explicit platform cards
    const clients = exp.feature.cards ?? (exp.feature.clients ?? [])
      .map((id) => experiences.find((x) => x.id === id))
      .filter(Boolean)
      .map((x) => ({ book: x.book, name: x.company, years: x.years, line: x.feature ? `${x.title} · ${x.feature.title}` : x.title }));
    spreads.push([T.bookFeatureLeftTexture(exp), T.bookFeatureRightTexture(exp, imgs, { clients, linkedin })]);
  }
  if (exp.screens?.length) spreads.push([T.bookGalleryTexture(exp, imgs, 'left', linkedin), T.bookGalleryTexture(exp, imgs, 'right', linkedin)]);
  const last = spreads.length - 1;

  add(inner, boxG(W, H, ct), cover, 0, 0, -D / 2 + ct / 2);
  add(inner, boxG(W - 0.01, H - 0.012, D - 2 * ct), [paper, paper, paper, paper, tex(spreads[last][1]), paper], 0.003, 0, 0);
  add(inner, boxG(ct, H + 0.002, D + 0.002), [cover, tex(T.bookSpineTexture(exp)), cover, cover, cover, cover], -W / 2 + ct / 2 - 0.001, 0, 0);

  const hinge = new THREE.Group();
  hinge.position.set(-W / 2, 0, D / 2 - ct / 2);
  inner.add(hinge);
  add(hinge, boxG(W, H, ct), [cover, cover, cover, cover, tex(T.bookCoverTexture(exp)), tex(spreads[0][0])], W / 2, 0, 0);

  // Turnable leaves stacked on the page block (leaf i: front = spread i right, back = spread i+1 left).
  // Each hinge sits above its leaf so a turned leaf lands on top of the open cover / earlier leaves.
  const lt = 0.002, lw = W - 0.01;
  const leaves = [];
  for (let i = 0; i < last; i++) {
    const rest = D / 2 - ct + lt * (last - i - 0.5);
    const flipped = D / 2 + lt * (i + 0.5) + 0.0015 * (i + 1);
    const lh = new THREE.Group();
    lh.position.set(-W / 2 + 0.008, 0, (rest + flipped) / 2);
    inner.add(lh);
    add(lh, boxG(lw, H - 0.014, lt), [paper, paper, paper, paper, tex(spreads[i][1]), tex(spreads[i + 1][0])], lw / 2, 0, rest - lh.position.z);
    leaves.push(lh);
  }

  finalize(g, {
    id: `exp-${exp.id}`,
    label: `WORK EXPERIENCE · ${exp.company.toUpperCase()}`,
    status: last ? 'CLICK THE PAGES OR ← → TO TURN · ESC TO PUT IT BACK' : 'READING · CLICK OUTSIDE OR ESC TO PUT IT BACK',
    focusTilt: new THREE.Euler(-0.08, 0, 0),
    camLift: 0.1,
    camFacing: [0, 0, 1], // walk up to the spine, not the (sideways) cover
    pullOut: 0.16, // slide out of the shelf before flying
    layout: 'center',
    fit: 2 * W, // sized for the open spread
    aspect: H / (2 * W),
  });
  const x0 = inner.position.x;
  let spread = 0;
  const changed = () => g.userData.onChange?.(spread);
  const flip = (i, turned, tl, at) => tl.to(leaves[i].rotation, { y: turned ? -Math.PI : 0, duration: 0.9, ease: 'power2.inOut' }, at);
  Object.assign(g.userData, {
    // dir: +1 next spread, -1 previous.
    canTurn(dir) {
      return spread + dir >= 0 && spread + dir <= last;
    },
    turn(dir) {
      if (!this.canTurn(dir)) return false;
      const tl = gsap.timeline({ defaults: { overwrite: 'auto' } });
      if (dir > 0) flip(spread, true, tl, 0);
      else flip(spread - 1, false, tl, 0);
      spread += dir;
      changed();
      return true;
    },
    // pager interface (shared with the skills case): one step = one spread, no wrap-around
    count: spreads.length,
    wrap: false,
    onChange: null,
    step(dir) { return this.turn(dir); },
    open() {
      changed();
      const tl = gsap.timeline({ defaults: { overwrite: 'auto' } });
      tl.to(hinge.rotation, { y: -Math.PI, duration: 1.1, ease: 'power3.inOut' }, 0.35);
      tl.to(inner.position, { x: x0 + W / 2, duration: 1.1, ease: 'power3.inOut' }, 0.35);
      return tl;
    },
    close() {
      const tl = gsap.timeline({ defaults: { overwrite: 'auto' } });
      let at = 0;
      for (let i = spread - 1; i >= 0; i--, at += 0.18) flip(i, false, tl, at);
      if (spread) at += 0.45;
      spread = 0;
      tl.to(hinge.rotation, { y: 0, duration: 0.7, ease: 'power2.inOut' }, at);
      tl.to(inner.position, { x: x0, duration: 0.7, ease: 'power2.inOut' }, at);
      return tl;
    },
  });
  return g;
}

/* ---------- decor ---------- */

function buildGuitar() {
  const g = new THREE.Group();
  const s = new THREE.Shape();
  s.moveTo(0, -0.22);
  s.bezierCurveTo(0.21, -0.22, 0.2, -0.02, 0.1, 0.02);
  s.bezierCurveTo(0.17, 0.1, 0.16, 0.21, 0.1, 0.23);
  s.bezierCurveTo(0.07, 0.24, 0.05, 0.15, 0.03, 0.12);
  s.lineTo(-0.03, 0.12);
  s.bezierCurveTo(-0.06, 0.16, -0.1, 0.19, -0.12, 0.15);
  s.bezierCurveTo(-0.15, 0.09, -0.1, 0.04, -0.1, 0.02);
  s.bezierCurveTo(-0.21, -0.02, -0.21, -0.22, 0, -0.22);
  const body = new THREE.ExtrudeGeometry(s, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 3, curveSegments: 24 });
  add(g, body, std('#8db9e3', { roughness: 0.28, metalness: 0.1 }));

  const pg = new THREE.Shape();
  pg.moveTo(0.02, -0.16);
  pg.bezierCurveTo(0.14, -0.15, 0.14, 0.0, 0.07, 0.04);
  pg.bezierCurveTo(0.12, 0.11, 0.1, 0.16, 0.06, 0.15);
  pg.lineTo(0.025, 0.12);
  pg.lineTo(-0.025, 0.12);
  pg.bezierCurveTo(-0.07, 0.13, -0.09, 0.08, -0.06, 0.03);
  pg.bezierCurveTo(-0.1, -0.04, -0.06, -0.12, 0.02, -0.16);
  const white = std('#f4f4f2', { roughness: 0.4 });
  add(g, new THREE.ExtrudeGeometry(pg, { depth: 0.002, bevelEnabled: false }), white, 0, 0, 0.043);

  const wood = std('#e3c99a', { roughness: 0.6 });
  const chrome = std('#dfe3ea', { roughness: 0.2, metalness: 0.95 });
  add(g, boxG(0.046, 0.52, 0.022), wood, 0, 0.38, 0.022);
  add(g, boxG(0.044, 0.5, 0.004), std('#6b4a35', { roughness: 0.6 }), 0, 0.38, 0.035);
  add(g, rbox(0.075, 0.16, 0.018, 0.008), wood, 0.012, 0.71, 0.02);
  for (let k = 0; k < 6; k++) {
    const t = add(g, cyl(0.006, 0.006, 0.02, 8), chrome, -0.03, 0.65 + k * 0.022, 0.02);
    t.rotation.z = Math.PI / 2;
  }
  for (const y of [-0.04, 0.02, 0.075]) add(g, rbox(0.075, 0.018, 0.008, 0.004), white, 0.0, y, 0.048);
  add(g, rbox(0.08, 0.03, 0.01, 0.003), chrome, 0, -0.12, 0.048);
  for (let k = 0; k < 6; k++) add(g, boxG(0.0012, 0.78, 0.0012), chrome, (k - 2.5) * 0.0065, 0.26, 0.052);
  for (const [x, y] of [[0.09, -0.1], [0.11, -0.05], [0.1, -0.15]]) add(g, cyl(0.011, 0.011, 0.012, 14), white, x, y, 0.048).rotation.x = Math.PI / 2;
  return finalize(g, { id: 'guitar', label: '🎸 HOBBY', focusTilt: new THREE.Euler() });
}

// Decorative books; leaves a gap of `gapW` before book number `gapAt` and returns where that gap starts.
function buildBooks(parent, y, startX, gapAt, gapW) {
  const r = T.rng(11);
  const palette = [
    ['#2840e8', '#d4ff3a'], ['#e0483e', '#fff'], ['#f2c230', '#141414'], ['#141414', '#d4ff3a'],
    ['#d9825b', '#fff1e0'], ['#7cc6a4', '#141414'], ['#ff8fc8', '#141414'], ['#5b4b8a', '#f2c230'],
  ];
  let x = startX, gapX = startX;
  const count = 8;
  for (let i = 0; i < count; i++) {
    if (i === gapAt) {
      gapX = x;
      x += gapW;
    }
    const w = 0.032 + r() * 0.03, h = 0.26 + r() * 0.11, d = 0.2 + r() * 0.05;
    const [c, b] = palette[i % palette.length];
    const side = std(c, { roughness: 0.7 });
    const spine = std('#fff', { map: T.spineTexture(c, b, ['VOL.', 'NOTE', 'ART', 'TYPE', 'DATA'][i % 5]), roughness: 0.7 });
    const book = add(parent, boxG(w, h, d), [side, side, side, side, spine, side], x + w / 2, y + h / 2, 0.09 - d / 2 + 0.05);
    if (i === count - 1) {
      // the last book leans left onto its neighbour: it rests on its bottom-left corner,
      // and its top-left corner just touches the previous book (no intersections)
      const t = 0.3;
      const x0 = x + h * Math.sin(t);
      book.rotation.z = t;
      book.position.set(x0 + (w / 2) * Math.cos(t) - (h / 2) * Math.sin(t), y + (w / 2) * Math.sin(t) + (h / 2) * Math.cos(t), book.position.z);
    }
    x += w + 0.002;
  }
  return gapX;
}

function buildInterior(g, mats) {
  const iw = L.w - 2 * L.t, idp = L.d - L.t, zc = L.t / 2;
  for (const y of [1.62, 1.02, 0.56]) add(g, boxG(iw, 0.02, idp - 0.02), mats.body, 0, y, zc - 0.01);
  const back = -L.d / 2 + L.t + 0.002;
  const items = {};

  // Experience books stand in the middle of the top shelf, spine out, between the decorative books.
  const expW = experiences.length * (BOOK.D + 0.004);
  let bx = buildBooks(g, 1.63, -0.405, 5, expW + 0.004) + 0.002;
  const shelfStart = bx;
  experiences.forEach((exp, i) => {
    const book = buildExperienceBook(exp, i + 1);
    book.rotation.y = Math.PI / 2;
    items[book.userData.id] = placeOn(book, g, bx + BOOK.D / 2, 1.63, 0.14 - BOOK.W / 2);
    bx += BOOK.D + 0.004;
  });
  const pot = add(g, cyl(0.042, 0.032, 0.07, 20), std('#d9825b', { roughness: 0.8 }), 0.37, 1.665, 0.02);
  add(pot, new THREE.CapsuleGeometry(0.026, 0.07, 6, 12), std('#5fae6e', { roughness: 0.7 }), 0, 0.085, 0);

  items.skills = placeOn(buildSuitcase(), g, -0.07, 1.03, 0.04);
  const cup = add(g, cyl(0.042, 0.038, 0.11, 20), std('#2840e8', { roughness: 0.5 }), 0.33, 1.085, 0.05);
  [['#f2c230', -0.1], ['#e0483e', 0.12], ['#141414', 0.02]].forEach(([c, a], k) => {
    const pencil = add(cup, cyl(0.006, 0.006, 0.2, 6), std(c, { roughness: 0.6 }), (k - 1) * 0.014, 0.07, (k % 2) * 0.01);
    pencil.rotation.z = a;
  });
  decal(g, T.polaroidTexture(2, 'SUMMER'), 0.1, 0.117, 0.32, 1.42, back, 0.12);

  items.work = placeOn(buildFolders(), g, -0.08, 0.57, 0.02);
  decal(g, T.stickerTexture('vibe'), 0.12, 0.12, 0.3, 0.8, back, -0.15);

  const tw = buildTypewriter();
  tw.rotation.y = -0.18;
  items.contact = placeOn(tw, g, 0.1, FLOOR, 0.1);
  const ball = add(g, new THREE.SphereGeometry(0.1, 28, 20), std('#e8833a', { roughness: 0.7 }), -0.29, FLOOR + 0.1, 0.06);
  const seam = std('#3b2a20', { roughness: 0.8 });
  add(ball, new THREE.TorusGeometry(0.1, 0.003, 6, 40), seam);
  add(ball, new THREE.TorusGeometry(0.1, 0.003, 6, 40), seam).rotation.y = Math.PI / 2;
  ball.rotation.set(0.4, 0.3, 0.2);
  decal(g, T.polaroidTexture(4, '2026'), 0.11, 0.13, -0.12, 0.4, back, -0.08);

  // where the camera parks after a book goes back: centred on the experience books
  const shelfCenter = new THREE.Vector3((shelfStart + bx) / 2, 1.63 + BOOK.H / 2, 0.05);
  const light = new THREE.PointLight('#f4f8ff', 0, 2.6, 1.2);
  light.position.set(0, 1.9, 0.3);
  g.add(light);
  return { items, light, shelfCenter };
}

/* ---------- lockers ---------- */

function buildDoor(i, mats) {
  const pivot = new THREE.Group();
  const dw = L.w - 0.014, dh = L.h - 0.014, dt = 0.022, f = dt / 2;
  const panel = add(pivot, rbox(dw, dh, dt, 0.01), mats.body.clone(), -dw / 2, 0, 0);
  const pill = rbox(0.3, 0.032, 0.014, 0.0065);
  for (let k = 0; k < 4; k++) {
    add(panel, pill, mats.vent, 0, dh / 2 - 0.22 - k * 0.055, f + 0.003);
    add(panel, pill, mats.vent, 0, -dh / 2 + 0.2 + k * 0.055, f + 0.003);
  }
  // handle: grey rounded base with a blue inset, like the reference
  add(panel, rbox(0.075, 0.25, 0.018, 0.008), mats.handle, -dw / 2 + 0.1, 0.04, f + 0.008);
  add(panel, rbox(0.036, 0.17, 0.012, 0.005), mats.handleInset, -dw / 2 + 0.1, 0.04, f + 0.016);
  const plate = std('#fff', { map: T.numberTexture(i + 101), roughness: 0.35, metalness: 0.4 });
  add(panel, boxG(0.13, 0.055, 0.004), [mats.metal, mats.metal, mats.metal, mats.metal, plate, mats.metal], 0, dh / 2 - 0.09, f + 0.002);

  const anchor = new THREE.Object3D();
  anchor.position.set(-dw / 2 + 0.1, 0.04, f + 0.04);
  panel.add(anchor);
  pivot.userData = { door: i, anchor, panel, dims: { dw, dh, f } };
  return pivot;
}

// Draggable stickers. Each spec: [texture, width, height, x, y, rotation] in door-panel coordinates.
const stickers = [];
const STICKER_SCALE = 1.35;
function sticker(door, inside, [tex, w0, h0, x, y, rz]) {
  const w = w0 * STICKER_SCALE, h = h0 * STICKER_SCALE;
  const { panel, dims } = door.userData;
  const lift = 0.003 + (stickers.length % 6) * 0.0004; // stagger so overlapping stickers don't z-fight
  const m = decal(panel, tex, w, h, x, y, inside ? -dims.f - lift : dims.f + lift, rz, inside ? Math.PI : 0);
  m.userData.sticker = {
    id: `s${stickers.length}`,
    face: inside ? -1 : 1,
    rz,
    bounds: [dims.dw / 2 - w * 0.3, dims.dh / 2 - h * 0.3],
    baseZ: m.position.z,
  };
  stickers.push(m);
  return m;
}

// Die-cut sticker: the cut shape is stacked a few times to give the vinyl real thickness (edge + shadow
// follow the logo's outline), with the printed face on top. spec: { tex: { face, cut }, w, h, x, y, rz }
function dieCutSticker(door, inside, { tex, w: w0, h: h0, x, y, rz }) {
  const w = w0 * STICKER_SCALE, h = h0 * STICKER_SCALE, layers = 7, step = 0.0007;
  const { panel, dims } = door.userData;
  const g = new THREE.Group();
  const side = new THREE.MeshStandardMaterial({ map: tex.cut, alphaTest: 0.5, color: '#e9e9e9', roughness: 0.6 });
  for (let i = 0; i < layers; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), side);
    m.position.z = i * step;
    m.userData.noShadow = i > 0;
    g.add(m);
  }
  const face = decal(g, tex.face, w, h, 0, 0, layers * step);
  face.material.roughness = 0.45;
  const lift = 0.0015 + (stickers.length % 6) * 0.0004;
  g.position.set(x, y, inside ? -dims.f - lift : dims.f + lift);
  g.rotation.set(0, inside ? Math.PI : 0, rz);
  panel.add(g);
  g.userData.sticker = { id: `s${stickers.length}`, face: inside ? -1 : 1, rz, bounds: [dims.dw / 2 - w * 0.3, dims.dh / 2 - h * 0.3], baseZ: g.position.z };
  stickers.push(g);
  return g;
}

function decorateDoorFronts(doors) {
  const [d0, d1, d2, d3] = doors;
  const S = T.stickerTexture, P = T.polaroidTexture, W = T.wordStickerTexture;
  const fronts = [
    [d0, [
      [T.photoStripTexture(0), 0.07, 0.21, 0.24, 0.36, 0.06],
      [P(0, 'BFF'), 0.15, 0.176, 0.02, 0.32, 0.08],
      [S('heart'), 0.1, 0.1, -0.22, 0.52, -0.2],
      [W('Style', '#ff5fa2'), 0.22, 0.11, -0.06, 0.06, -0.12],
      [S('star'), 0.13, 0.13, 0.22, -0.2, 0.3],
      [S('flower'), 0.11, 0.11, -0.16, -0.32, 0],
      [S('cd'), 0.12, 0.12, 0.12, -0.46, 0],
    ]],
    [d1, [
      [S('smile'), 0.11, 0.11, 0.2, 0.6, 0.2],
      [S('cloud'), 0.15, 0.15, -0.02, 0.36, -0.08],
      [W('HI!', '#ffd23f'), 0.16, 0.08, 0.14, -0.34, 0.1],
    ]],
    [d2, [
      [P(1, 'TOKYO'), 0.15, 0.176, -0.12, 0.42, -0.1],
      [P(3, 'SKI'), 0.14, 0.165, 0.15, 0.26, 0.12],
      [S('rainbow'), 0.14, 0.14, -0.16, 0.08, -0.06],
      [S('omg'), 0.15, 0.15, 0.18, -0.16, 0.12],
      [S('hello'), 0.15, 0.15, 0.0, -0.4, 0],
    ]],
    [d3, [
      [S('cd'), 0.11, 0.11, -0.2, 0.44, 0],
      [S('bolt'), 0.13, 0.13, 0.08, 0.5, 0.1],
      [T.photoStripTexture(2), 0.07, 0.21, 0.24, 0.22, -0.05],
      [P(5, 'HOME'), 0.15, 0.176, -0.12, -0.16, -0.06],
      [W('DREAM', '#6fa8ff'), 0.22, 0.11, 0.06, -0.44, 0.08],
    ]],
  ];
  for (const [door, specs] of fronts) for (const spec of specs) sticker(door, false, spec);
}

// The inside of the main door: hook, hanging ID card, photos and stickers.
// Small magnetic whiteboard for the inside of the door: aluminium frame, marker tray with a pen,
// and a sticky note held by two magnets. Built facing +z with its back at z = 0.
function buildWhiteboard() {
  const g = new THREE.Group();
  const w = 0.66, h = 0.46, fr = 0.018, d = 0.012;
  const alu = std('#c9ced6', { roughness: 0.35, metalness: 0.7 });
  add(g, boxG(w - 0.01, h - 0.01, 0.004), std('#e8ebef'), 0, 0, 0.002);
  const face = add(g, new THREE.PlaneGeometry(w - fr * 2, h - fr * 2), new THREE.MeshStandardMaterial({ map: T.whiteboardTexture((w - fr * 2) / (h - fr * 2)), roughness: 0.25 }), 0, 0, d * 0.55);
  face.userData.noShadow = true;
  [[0, h / 2 - fr / 2, w, fr], [0, -h / 2 + fr / 2, w, fr], [-w / 2 + fr / 2, 0, fr, h], [w / 2 - fr / 2, 0, fr, h]].forEach(([x, y, bw, bh]) => add(g, rbox(bw, bh, d, 0.004), alu, x, y, d / 2));
  // marker tray along the bottom with a pen resting in it
  add(g, rbox(w * 0.6, 0.012, 0.03, 0.004), alu, 0, -h / 2 - 0.004, 0.015);
  const pen = new THREE.Group();
  add(pen, cyl(0.008, 0.008, 0.11, 14), std('#f4f4f4', { roughness: 0.4 }), 0, 0, 0);
  add(pen, cyl(0.0085, 0.0085, 0.035, 14), std('#1d4ed8', { roughness: 0.4 }), 0, 0.06, 0);
  add(pen, cyl(0.004, 0.006, 0.012, 10), std('#1d4ed8'), 0, -0.061, 0);
  pen.rotation.z = Math.PI / 2 + 0.03;
  pen.position.set(0.06, -h / 2 + 0.01, 0.022);
  g.add(pen);
  // sticky note + magnets in the top-right corner
  decal(g, T.stickyNoteTexture('ship\nit!'), 0.1, 0.1, w / 2 - 0.085, h / 2 - 0.09, d * 0.55 + 0.0015, -0.08);
  [['#e23b3b', -0.03, 0.035], ['#2d6cdf', 0.03, 0.035]].forEach(([c, dx, dy]) => {
    const m = add(g, cyl(0.011, 0.011, 0.008, 20), std(c, { roughness: 0.35 }), w / 2 - 0.085 + dx, h / 2 - 0.09 + dy, d * 0.55 + 0.005);
    m.rotation.x = Math.PI / 2;
  });
  return finalize(g, {
    id: 'board', label: 'NOW · WHITEBOARD', layout: 'solo', soloSize: 1.1, focusY: 0.02, camLift: 0.05, sway: 0.5,
    focusTilt: new THREE.Euler(0, 0, 0), noSpin: true, status: 'MOVE TO TILT · ESC TO GO BACK',
  });
}

// Little things hanging from pegs under the whiteboard. Each is built with its hanging point at the
// origin, facing +z, and dangles downward.
function buildRubberDuck() {
  const g = new THREE.Group();
  const yellow = std('#ffd23f', { roughness: 0.45 }), orange = std('#ff8a1f', { roughness: 0.5 }), black = std('#1b1b1b');
  add(g, cyl(0.0009, 0.0009, 0.03, 6), std('#e9e4da'), 0, -0.015, 0);
  add(g, new THREE.SphereGeometry(0.03, 24, 16), yellow, 0, -0.072, 0).scale.set(1.2, 0.82, 1);
  add(g, new THREE.SphereGeometry(0.019, 20, 14), yellow, 0.016, -0.043, 0);
  const beak = add(g, new THREE.ConeGeometry(0.008, 0.016, 12), orange, 0.04, -0.045, 0);
  beak.rotation.z = -Math.PI / 2;
  beak.scale.set(1, 1, 0.6);
  [-1, 1].forEach((sd) => add(g, new THREE.SphereGeometry(0.003, 8, 6), black, 0.025, -0.038, sd * 0.012));
  add(g, new THREE.SphereGeometry(0.012, 12, 8), yellow, -0.036, -0.062, 0).scale.set(1.2, 0.7, 1.4); // tail
  return g;
}

function buildKeys(mats) {
  const g = new THREE.Group();
  const brass = std('#c9a24a', { roughness: 0.3, metalness: 0.85 });
  const ring = add(g, new THREE.TorusGeometry(0.015, 0.0022, 8, 28), mats.metal, 0, -0.016, 0);
  ring.rotation.y = Math.PI / 2;
  const key = (mat, rz) => {
    const k = new THREE.Group();
    const head = add(k, cyl(0.011, 0.011, 0.003, 20), mat, 0, -0.012, 0);
    head.rotation.x = Math.PI / 2;
    add(k, boxG(0.006, 0.042, 0.0025), mat, 0, -0.043, 0);
    add(k, boxG(0.006, 0.004, 0.0025), mat, 0.005, -0.05, 0);
    add(k, boxG(0.005, 0.004, 0.0025), mat, 0.004, -0.06, 0);
    k.position.set(0, -0.03, 0);
    k.rotation.z = rz;
    g.add(k);
  };
  key(brass, 0.22);
  key(mats.metal, -0.18);
  add(g, rbox(0.026, 0.04, 0.004, 0.006), std('#e23b3b', { roughness: 0.5 }), -0.012, -0.058, -0.005).rotation.z = 0.35; // tag hangs behind the keys
  return g;
}

function buildEarbudCase() {
  const g = new THREE.Group();
  add(g, boxG(0.006, 0.05, 0.0015), std('#2b2f36', { roughness: 0.8 }), 0, -0.025, 0);
  add(g, new THREE.TorusGeometry(0.006, 0.0015, 6, 16), std('#c9ced6', { roughness: 0.3, metalness: 0.8 }), 0, -0.054, 0);
  add(g, rbox(0.046, 0.054, 0.024, 0.011), std('#f6f6f4', { roughness: 0.3 }), 0, -0.088, 0);
  add(g, boxG(0.0465, 0.0012, 0.0245), std('#d9d9d6'), 0, -0.078, 0);
  add(g, new THREE.SphereGeometry(0.0016, 8, 6), new THREE.MeshStandardMaterial({ color: '#36d36b', emissive: '#36d36b', emissiveIntensity: 0.8 }), 0, -0.09, 0.0122);
  return g;
}

function decorateMainDoorInside(door, mats) {
  const { panel, dims } = door.userData;
  const zi = -dims.f;
  const hookY = 0.72;
  add(panel, boxG(0.03, 0.05, 0.006), mats.metal, 0, hookY, zi - 0.003);
  add(panel, cyl(0.004, 0.004, 0.035, 8), mats.metal, 0, hookY, zi - 0.02).rotation.x = Math.PI / 2;
  add(panel, cyl(0.004, 0.004, 0.02, 8), mats.metal, 0, hookY + 0.008, zi - 0.036);

  const board = buildWhiteboard();
  board.rotation.y = Math.PI;
  board.position.set(0, -0.49, zi - board.userData.size.z / 2);
  panel.add(board);

  // pegs under the board with a few small things hanging off them (+x is the viewer's left)
  const pegY = -0.8;
  [[0.2, buildKeys(mats), 0.06], [0, buildRubberDuck(), -0.04], [-0.2, buildEarbudCase(), 0.03]].forEach(([x, thing, rz]) => {
    add(panel, rbox(0.022, 0.022, 0.006, 0.003), mats.metal, x, pegY, zi - 0.003);
    add(panel, cyl(0.0035, 0.0035, 0.024, 10), mats.metal, x, pegY, zi - 0.014).rotation.x = Math.PI / 2;
    thing.rotation.set(0, Math.PI, rz);
    thing.position.set(x, pegY - 0.002, zi - 0.022);
    panel.add(thing);
  });

  const card = buildIdCard();
  card.rotation.set(0, Math.PI, 0.03);
  card.position.set(0, hookY - card.userData.size.y / 2, zi - 0.014);
  panel.add(card);

  // where I've worked and taught, as thick die-cut stickers (inside the door, +x is on the viewer's left)
  const logo = (id) => experiences.find((e) => e.id === id)?.book?.logoImg;
  const ibm = logo('ibm'), ac = logo('aircanada');
  const fit = (img) => (ctx, x, y, w, h) => { const iw = img.width || img.naturalWidth, ih = img.height || img.naturalHeight, k = Math.min(w / iw, h / ih); ctx.drawImage(img, x + (w - iw * k) / 2, y + (h - ih * k) / 2, iw * k, ih * k); };
  const big = 1.25;
  [
    // IBM: the 8-bar wordmark, Paul Rand's Eye-Bee-M, and the little bee
    ibm && { tex: T.dieCutTextures({ aspect: 2.5, art: fit(ibm), border: 0.09 }), w: 0.2, h: 0.08, x: -0.22, y: 0.87, rz: -0.14 },
    { tex: T.dieCutTextures({ aspect: 3.2, art: T.drawEyeBeeM(ibm), border: 0.08 }), w: 0.24, h: 0.075, x: -0.2, y: 0.27, rz: -0.04 },
    { tex: T.dieCutTextures({ aspect: 1, art: (ctx, x, y, w, h) => T.drawRandBee(ctx, x + w / 2, y + h * 0.53, h * 0.95), border: 0.1 }), w: 0.08, h: 0.08, x: 0.26, y: -0.16, rz: 0.18 },
    // Air Canada: roundel + wordmark, and a tail fin
    { tex: T.dieCutTextures({ aspect: 0.95, art: T.drawAirCanada(ac), border: 0.06 }), w: 0.14, h: 0.147, x: 0.29, y: 0.71, rz: 0.08 },
    { tex: T.dieCutTextures({ aspect: 1.45, art: T.drawAirCanadaTail(ac), border: 0.07 }), w: 0.13, h: 0.09, x: 0.27, y: 0.3, rz: 0.06 },
    // YouTube channel
    { tex: T.dieCutTextures({ aspect: 2.4, art: T.drawYouTube, under: (ctx, x, y, w, h) => ctx.fillRect(x + w * 0.02, y + h * 0.2, w * 0.4, h * 0.62), border: 0.07 }), w: 0.19, h: 0.079, x: 0.04, y: 0.05, rz: -0.04 },
    // Udemy courses
    { tex: T.dieCutTextures({ aspect: 2.8, art: T.drawUdemy, border: 0.08 }), w: 0.17, h: 0.061, x: -0.17, y: -0.17, rz: 0.05 },
  ].filter(Boolean).forEach((spec) => dieCutSticker(door, true, { ...spec, w: spec.w * big, h: spec.h * big }));
  return { card, board };
}

export function buildWorld() {
  const root = new THREE.Group();
  const mats = {
    body: shellMat('body', '#cfe1f2', { roughness: 0.7 }),
    inner: shellMat('inner', '#6f8fb8', { roughness: 0.75 }),
    vent: shellMat('vent', '#e4eef9', { roughness: 0.7 }),
    plinth: shellMat('plinth', '#b4cde6', { roughness: 0.7 }),
    metal: std('#dfe3ea', { roughness: 0.22, metalness: 0.95 }),
    handle: std('#a9b1bb', { roughness: 0.4, metalness: 0.5 }),
    handleInset: std('#5d8fc8', { roughness: 0.5 }),
  };
  const H = L.h, cy = L.y0 + H / 2;
  const doors = [];
  let interior;

  for (let i = 0; i < 4; i++) {
    const g = new THREE.Group();
    g.position.x = lockerX(i);
    root.add(g);
    const b = mats.body; // back panel: deep blue only on the face looking into the locker
    add(g, boxG(L.w, H, L.t), [b, b, b, b, mats.inner, b], 0, cy, -L.d / 2 + L.t / 2);
    add(g, rbox(L.t, H, L.d, 0.01), mats.body, -L.w / 2 + L.t / 2, cy, 0);
    add(g, rbox(L.t, H, L.d, 0.01), mats.body, L.w / 2 - L.t / 2, cy, 0);
    add(g, rbox(L.w, L.t, L.d, 0.01), mats.body, 0, L.y0 + H - L.t / 2, 0);
    add(g, rbox(L.w, L.t, L.d, 0.01), mats.body, 0, L.y0 + L.t / 2, 0);
    if (i === MAIN) {
      // Pale outside, deep blue inside: only visible once the door opens.
      const ih = H - 2 * L.t, idp = L.d - L.t - 0.004, iz = L.t / 2 - 0.002;
      add(g, boxG(0.004, ih, idp), mats.inner, -L.w / 2 + L.t + 0.002, cy, iz);
      add(g, boxG(0.004, ih, idp), mats.inner, L.w / 2 - L.t - 0.002, cy, iz);
      add(g, boxG(L.w - 2 * L.t, 0.004, idp), mats.inner, 0, L.y0 + H - L.t - 0.002, iz);
      add(g, boxG(L.w - 2 * L.t, 0.004, idp), mats.inner, 0, L.y0 + L.t + 0.002, iz);
    }
    add(g, boxG(L.w - 0.02, L.y0, L.d - 0.06), mats.plinth, 0, L.y0 / 2, -0.03);
    for (const hy of [-0.75, 0, 0.75]) add(g, cyl(0.011, 0.011, 0.09, 12), mats.metal, L.w / 2 - 0.006, cy + hy, L.d / 2 + 0.012);

    const door = buildDoor(i, mats);
    door.position.set(L.w / 2 - 0.006, cy, L.d / 2 + 0.013);
    g.add(door);
    doors.push(door);
    if (i === MAIN) interior = buildInterior(g, mats);
  }
  add(root, rbox(L.pitch * 3 + L.w + 0.05, 0.035, L.d + 0.05, 0.012), mats.body, 0, L.y0 + H + 0.0175, 0.005);

  decorateDoorFronts(doors);
  const inside = decorateMainDoorInside(doors[MAIN], mats);
  interior.items.about = inside.card;
  interior.items.board = inside.board;

  const guitar = buildGuitar();
  guitar.rotation.set(-0.2, -0.3, -0.06);
  placeOn(guitar, root, lockerX(3) + 0.3, 0, 0.66);

  const shelfCenter = interior.shelfCenter.clone().add(new THREE.Vector3(lockerX(MAIN), 0, 0));
  return { root, doors, items: interior.items, guitar, interiorLight: interior.light, stickers, shelfCenter };
}
