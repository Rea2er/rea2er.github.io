import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildWorld, MAIN, DOOR_OPEN, lockerX } from './models.js';
import { loadFonts, loadImage, stickerTexture } from './textures.js';
import { fontText, profile, experiences } from './content.js';
import { createUI } from './ui.js';
import { applyFinish } from './finishes.js';

const V3 = THREE.Vector3;
const canvas = document.getElementById('scene');

/* ---------- renderer & scenes ---------- */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.autoClear = false;
const BG = new THREE.Color('#f4f5f7');
renderer.setClearColor(BG);

// The focused item is moved into its own scene and drawn after a translucent
// "frost" quad, so it floats above the dimmed locker.
const scene = new THREE.Scene();
const focusScene = new THREE.Scene();
const dimScene = new THREE.Scene();
const dimCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const dimMat = new THREE.MeshBasicMaterial({ color: BG, transparent: true, opacity: 0, toneMapped: false, depthTest: false });
dimScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), dimMat));

const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 60);
const baseCam = camera.clone(); // camera pose without mouse parallax

const env = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
for (const [s, k] of [[scene, 0.85], [focusScene, 0.9]]) {
  s.environment = env;
  s.environmentIntensity = k;
  s.add(new THREE.HemisphereLight('#ffffff', '#dde5ef', 1.3));
}
const sun = new THREE.DirectionalLight('#ffffff', 1.6);
sun.position.set(2.5, 5.5, 6);
sun.target.position.set(0, 1, 0);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -3.5, right: 3.5, top: 3.5, bottom: -2, near: 1, far: 20 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.02;
scene.add(sun, sun.target);
const focusSun = new THREE.DirectionalLight('#ffffff', 2);
focusSun.position.set(-2, 4, 6);
focusScene.add(focusSun);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.1 }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

/* ---------- state ---------- */
let W;
let opened = false;
let busy = true;
let current = null;
let hovered = null;
let atShelf = false; // camera parked at the book shelf after putting a book back
let queuedNav = null; // nav clicks that arrive mid-animation run once it finishes
const rig = { pos: new V3(), target: new V3(), par: 1 };
const dim = { v: 0 };
const idle = { k: 0, spin: 0 };
let focusBase = null;
const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
const pointer = { x: 0, y: 0, dirty: false, onCanvas: false, mouse: true };

const ui = createUI({
  onClose: () => unfocus(),
  onStep: (d) => { if (!busy) current?.userData.step?.(d); },
  onNote: (text, caret) => current?.userData.write?.(text, caret),
  onNoteKey: () => current?.userData.press?.(),
  onNoteSend: () => current?.userData.send?.(),
  onNav: (id) => { if (busy) queuedNav = id; else nav(id); },
  onHome: () => closeLocker(),
  onCloseLocker: () => closeLocker(),
});

const STATUS = {
  closed: 'CLICK THE LOCKER TO OPEN · DRAG THE STICKERS',
  open: 'CLICK AN OBJECT INSIDE',
  focus: 'MOVE TO TILT · CLICK TO SPIN · ESC TO GO BACK',
  skills: 'CLICK THE CARD TO FLIP · ← → TO SWITCH · ESC TO GO BACK',
  contact: 'TYPE ON THE PAPER · ESC TO GO BACK',
  work: 'PICK A FOLDER · ESC TO GO BACK',
  shelf: 'PICK ANOTHER BOOK · CLICK OUTSIDE OR ESC TO STEP BACK',
};

/* ---------- camera shots ---------- */
function shot(name) {
  const aspect = camera.aspect;
  const t = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  const fit = (w, h) => Math.max(h / 2 / t, w / 2 / (t * aspect));
  if (name === 'open') {
    const x = lockerX(MAIN);
    const d = fit(1.9, 2.4);
    return { pos: new V3(x + 0.45, 1.3, 0.3 + d), target: new V3(x + 0.3, 1.15, 0.2) };
  }
  const d = fit(4.7, 3.0);
  return { pos: new V3(0.15, 1.5, d), target: new V3(0.15, 1.1, 0) };
}

// Close-up of the experience books, so the next one is one click away.
function shelfShot() {
  const t = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  const c = W.shelfCenter;
  const d = Math.max(0.55 / 2 / t, 0.9 / 2 / (t * camera.aspect));
  return { pos: new V3(c.x + 0.05, c.y + 0.12, c.z + d), target: c.clone(), dist: d };
}

// Nav entry for the experience books: open the locker if needed and park the camera at the shelf.
async function goShelf() {
  if (busy) return;
  if (!opened) await openLocker();
  if (current) await unfocus(false);
  if (atShelf) return;
  busy = true;
  setHover(null);
  ui.setNav('experience');
  const tl = gsap.timeline();
  tweenRig(shelfShot(), 1.1, tl);
  tl.to(rig, { par: 1, duration: 1 }, 0);
  await tl;
  atShelf = true;
  busy = false;
  ui.setStatus(STATUS.shelf);
}

const nav = (id) => (id === 'experience' ? goShelf() : focus(id));

async function leaveShelf() {
  if (!atShelf || busy) return;
  busy = true;
  atShelf = false;
  ui.setNav(null);
  setHover(null);
  const tl = gsap.timeline();
  tweenRig(shot('open'), 1.1, tl);
  await tl;
  busy = false;
  ui.setStatus(STATUS.open);
}

function setRig(s) {
  rig.pos.copy(s.pos);
  rig.target.copy(s.target);
}

function tweenRig(s, duration, tl, at = 0) {
  tl.to(rig.pos, { x: s.pos.x, y: s.pos.y, z: s.pos.z, duration, ease: 'power3.inOut' }, at);
  tl.to(rig.target, { x: s.target.x, y: s.target.y, z: s.target.z, duration, ease: 'power3.inOut' }, at);
}

function isPortrait() {
  return innerWidth < 760 || camera.aspect < 0.85;
}

// Camera close-up in front of an item: the "walk up to it" move before it lifts out.
function closeUp(item) {
  item.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(item);
  const c = box.getCenter(new V3()), size = box.getSize(new V3());
  const facing = item.userData.camFacing
    ? new V3(...item.userData.camFacing)
    : new V3(0, 0, 1).applyQuaternion(item.getWorldQuaternion(new THREE.Quaternion()));
  const dir = facing.lerp(rig.pos.clone().sub(c).normalize(), 0.45);
  dir.y += item.userData.camLift ?? 0.15;
  dir.normalize();
  const t = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  const w = Math.max(size.x, size.z) * 2.2, h = size.y * 2.2;
  const dist = Math.max(h / 2 / t, w / 2 / (t * camera.aspect), 0.7);
  return { pos: c.clone().addScaledVector(dir, dist), target: c, dist };
}

// Where a focused item should float (relative to a camera pose): left of the panel on desktop,
// above the bottom sheet on mobile.
function focusTarget(item, pose) {
  baseCam.position.copy(pose.pos);
  baseCam.lookAt(pose.target);
  baseCam.updateMatrixWorld();
  const t = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  const dist = Math.min(1.4, pose.dist * 0.7), visH = 2 * dist * t, visW = visH * camera.aspect;
  const portrait = isPortrait();
  const u = item.userData;
  const bare = u.layout === 'bare';
  let local, size;
  if (portrait) {
    local = new V3(0, visH * 0.2, -dist);
    size = Math.min(visW * 0.72, visH * 0.34);
  } else {
    // Centre the item in whatever room the side panel leaves on the left, and let it fill that room.
    const panelW = document.getElementById('panel').offsetWidth || 460;
    const gap = THREE.MathUtils.clamp(innerWidth * 0.04, 16, 64);
    const room = innerWidth - panelW - gap * 2;
    const toWorld = visW / innerWidth;
    local = new V3((room / 2 - innerWidth / 2) * toWorld, 0, -dist);
    size = Math.min(room * 0.74, innerHeight * 0.66) * toWorld;
  }
  if (bare) {
    local = new V3(0, -visH * 0.32, -dist);
    size = Math.min(visW * 0.3, visH * 0.26);
  }
  if (u.layout === 'solo') {
    // the ID card on its own: centred, no side panel
    local = new V3(0, 0, -dist);
    size = Math.min(visW * (portrait ? 0.88 : 0.72), visH * 0.82) * (u.soloSize ?? 1);
  }
  if (u.layout === 'center') {
    // open books: centred and as large as the spread allows
    local = new V3(0, 0, -dist);
    size = Math.min(visW * (portrait ? 0.92 : 0.66), (visH * 0.78) / u.aspect);
  }
  local.y += (u.focusY ?? 0) * visH; // per-item nudge, as a fraction of the visible height
  return {
    pos: local.applyMatrix4(baseCam.matrixWorld),
    quat: baseCam.quaternion.clone().multiply(new THREE.Quaternion().setFromEuler(u.focusTilt)),
    scale: size / u.baseSize,
  };
}

/* ---------- locker open / close ---------- */
async function openLocker() {
  if (opened) return;
  busy = true;
  setHover(null);
  const door = W.doors[MAIN];
  const tl = gsap.timeline();
  tl.to(door.rotation, { y: 0.1, duration: 0.18, ease: 'power1.out' })
    .to(door.rotation, { y: DOOR_OPEN, duration: 1.25, ease: 'back.out(1.1)' });
  tweenRig(shot('open'), 1.6, tl, 0.1);
  tl.to(W.interiorLight, { intensity: 1.3, duration: 1.2 }, 0.2);
  await tl;
  opened = true;
  busy = false;
  document.body.classList.add('is-open');
  ui.setStatus(STATUS.open);
}

async function closeLocker() {
  if (busy || !opened) return;
  atShelf = false;
  ui.setNav(null);
  if (current) await unfocus();
  busy = true;
  setHover(null);
  document.body.classList.remove('is-open');
  const door = W.doors[MAIN];
  const tl = gsap.timeline();
  tl.to(door.rotation, { y: 0, duration: 0.8, ease: 'power2.in' })
    .to(door.rotation, { y: 0.035, duration: 0.08, ease: 'power1.out' })
    .to(door.rotation, { y: 0, duration: 0.12, ease: 'power1.in' });
  tweenRig(shot('overview'), 1.4, tl, 0);
  tl.to(W.interiorLight, { intensity: 0, duration: 0.8 }, 0.2);
  await tl;
  opened = false;
  busy = false;
  ui.setStatus(STATUS.closed);
}

/* ---------- focus ---------- */
function flyTo(item, to, duration) {
  const p0 = item.position.clone(), q0 = item.quaternion.clone(), s0 = item.scale.x;
  const o = { k: 0 };
  return gsap.to(o, {
    k: 1, duration, ease: 'power3.inOut',
    onUpdate: () => {
      item.position.lerpVectors(p0, to.pos, o.k);
      item.position.y += Math.sin(o.k * Math.PI) * 0.08;
      item.quaternion.slerpQuaternions(q0, to.quat, o.k);
      item.scale.setScalar(THREE.MathUtils.lerp(s0, to.scale, o.k));
    },
  });
}

const wait = (sec) => new Promise((r) => gsap.delayedCall(sec, r));

// World transform an object will have once it's back under its original parent.
function homeWorld(h) {
  h.parent.updateWorldMatrix(true, false);
  const m = new THREE.Matrix4().compose(h.pos, h.quat, h.scale).premultiply(h.parent.matrixWorld);
  const to = { pos: new V3(), quat: new THREE.Quaternion(), scale: 1 };
  const sv = new V3();
  m.decompose(to.pos, to.quat, sv);
  to.scale = sv.x;
  return to;
}

/* ---------- work folders: fly out of the box and float ---------- */
let focusPose = null;
let flying = [];
let foldersOut = false;
let foldersIdle = false;
// The folders spread into a 2×2 grid above the box, centred, with a small gap so they never
// overlap (and so can't cut into each other when they tilt with the mouse). Tilt per folder:
const FOLDER_TILT = [-0.035, 0.03, 0.025, -0.03];
const FOLDER_ASPECT = 0.75; // height incl. tab / width, from the folder shape in models.js
const STAR_SPOTS = [[-0.33, 0.24, 0.12], [0.34, -0.2, 0.08]];
const starMat = new THREE.MeshBasicMaterial({ alphaTest: 0.5, toneMapped: false });
const stars = STAR_SPOTS.map(() => new THREE.Mesh(new THREE.PlaneGeometry(1, 1), starMat));

function spotPose(pose, x, y, rz, scale) {
  baseCam.position.copy(pose.pos);
  baseCam.lookAt(pose.target);
  baseCam.updateMatrixWorld();
  const t = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  const dist = Math.min(1.4, pose.dist * 0.7) * 0.92;
  const visH = 2 * dist * t, visW = visH * camera.aspect;
  return {
    pos: new V3(x * visW, y * visH, -dist).applyMatrix4(baseCam.matrixWorld),
    quat: baseCam.quaternion.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, rz))),
    scale: scale(visW, visH),
  };
}

function folderTargets(pose) {
  const portrait = isPortrait();
  const w = (visW, visH) => (portrait ? visW * 0.42 : Math.min(visW * 0.3, visH * 0.36));
  // grid in fractions of the visible width/height; measured off the same frustum spotPose uses
  const t = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  const visH = 2 * Math.min(1.4, pose.dist * 0.7) * 0.92 * t, visW = visH * camera.aspect;
  const fw = w(visW, visH), gap = visH * 0.035;
  const cx = (fw + gap) / 2 / visW;
  const rowH = (fw * FOLDER_ASPECT + gap) / visH;
  const top = portrait ? 0.27 : 0.22;
  const spots = [[-cx, top], [cx, top], [-cx, top - rowH], [cx, top - rowH]];
  return {
    folders: spots.map(([x, y], i) => spotPose(pose, x, y, FOLDER_TILT[i], (vw, vh) => w(vw, vh) / 0.44)),
    stars: STAR_SPOTS.map(([x, y, rz]) => spotPose(pose, portrait ? x * 0.8 : x, y, rz, (vw, vh) => w(vw, vh) * 0.32)),
  };
}

async function flyFoldersOut() {
  const targets = folderTargets(focusPose);
  flying = current.userData.folders.map((f, i) => {
    const m = f.mesh;
    const home = { parent: m.parent, pos: m.position.clone(), quat: m.quaternion.clone(), scale: m.scale.clone() };
    focusScene.attach(m);
    return { ...f, home, base: targets.folders[i], hk: 0 };
  });
  foldersOut = true;
  stars.forEach((st, i) => {
    const b = targets.stars[i];
    st.position.copy(b.pos);
    st.quaternion.copy(b.quat);
    st.scale.setScalar(0.0001);
    st.userData.base = b;
    focusScene.add(st);
    gsap.to(st.scale, { x: b.scale, y: b.scale, z: b.scale, duration: 0.6, delay: 0.35 + i * 0.1, ease: 'back.out(2)' });
  });
  await Promise.all(flying.map((f, i) => flyTo(f.mesh, f.base, 0.85).delay(i * 0.08)));
  foldersIdle = true;
}

async function flyFoldersBack() {
  foldersIdle = false;
  stars.forEach((st) => gsap.to(st.scale, { x: 0.0001, y: 0.0001, z: 0.0001, duration: 0.25, onComplete: () => focusScene.remove(st) }));
  await Promise.all(flying.map((f, i) => flyTo(f.mesh, homeWorld(f.home), 0.6).delay((flying.length - 1 - i) * 0.05)));
  for (const f of flying) {
    f.home.parent.add(f.mesh);
    f.mesh.position.copy(f.home.pos);
    f.mesh.quaternion.copy(f.home.quat);
    f.mesh.scale.copy(f.home.scale);
    glow(f.mesh, 0);
  }
  flying = [];
  foldersOut = false;
}

async function focus(id) {
  if (busy || current?.userData.id === id) return;
  if (!opened) await openLocker();
  if (current) await unfocus(false);
  atShelf = false;
  busy = true;
  setHover(null);
  const item = W.items[id];
  const s = closeUp(item);
  focusBase = focusTarget(item, s);

  // 1) dolly the camera up to the item
  const dolly = gsap.timeline();
  tweenRig(s, 1.15, dolly);
  dolly.to(rig, { par: 0, duration: 0.6 }, 0);
  await wait(0.9);

  // 2) lift it out towards the viewer while the background frosts over
  item.userData.home = { parent: item.parent, pos: item.position.clone(), quat: item.quaternion.clone(), scale: item.scale.clone() };
  if (item.userData.pullOut) {
    // slide it out of the shelf first, like pulling a book
    await gsap.to(item.position, { z: item.position.z + item.userData.pullOut, duration: 0.45, ease: 'power2.out' });
  }
  focusScene.attach(item);
  current = item;
  if (item.userData.layout) ui.bare(id);
  else ui.openPanel(id);
  ui.setStatus(item.userData.status ?? STATUS[id] ?? STATUS.focus);
  gsap.to(dim, { v: 1, duration: 0.8, ease: 'power2.out' });
  await flyTo(item, focusBase, 1.0);
  focusPose = s;
  // anything with pages (the skills case, the books) gets the shared pager under it
  if (item.userData.step) item.userData.onChange = (i) => ui.pager(item.userData.count > 1, i, item.userData.count, item.userData.wrap);
  if (item.userData.write) ui.note(true);
  if (item.userData.open) await item.userData.open();
  if (item.userData.folders) await flyFoldersOut();
  idle.spin = 0;
  gsap.to(idle, { k: 1, duration: 0.8, ease: 'power2.out' });
  busy = false;
}

// pullBack=false keeps the camera close, used when jumping straight to another item.
async function unfocus(pullBack = true) {
  // ignore Esc / × while the item is still flying in, or its tween would keep writing over it
  if (!current || busy) return;
  busy = true;
  setHover(null);
  const item = current;
  gsap.killTweensOf(idle);
  idle.k = 0;
  ui.closePanel();
  ui.bare(null);
  ui.pager(false);
  ui.note(false);
  if (foldersOut) await flyFoldersBack();
  if (item.userData.close) await item.userData.close();
  const h = item.userData.home;
  // pulled-out items fly back to their pulled-out spot, then slide home
  const pulled = item.userData.pullOut ? { ...h, pos: h.pos.clone().add(new V3(0, 0, item.userData.pullOut)) } : h;
  const to = homeWorld(pulled);

  const tl = gsap.timeline();
  tl.to(dim, { v: 0, duration: 0.8, ease: 'power2.inOut' }, 0);
  tl.add(flyTo(item, to, 0.95), 0);
  tl.add(() => {
    h.parent.add(item);
    item.position.copy(pulled.pos);
    item.quaternion.copy(h.quat);
    item.scale.copy(h.scale);
    current = null;
    if (pulled !== h) gsap.to(item.position, { z: h.pos.z, duration: 0.45, ease: 'power2.inOut' });
  }, 0.95);
  const toShelf = pullBack && !!item.userData.pullOut;
  if (pullBack) {
    tweenRig(toShelf ? shelfShot() : shot('open'), toShelf ? 1.0 : 1.3, tl, 0.55);
    tl.to(rig, { par: 1, duration: 1 }, 0.9);
  }
  await tl;
  atShelf = toShelf;
  if (toShelf) ui.setNav('experience');
  busy = false;
  ui.setStatus(toShelf ? STATUS.shelf : STATUS.open);
}

/* ---------- picking & hover ---------- */
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

function pick(x, y) {
  ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  if (current) {
    if (foldersIdle) {
      const fh = raycaster.intersectObjects(flying.map((f) => f.mesh), true)[0];
      for (let o = fh?.object; o; o = o.parent) {
        const f = flying.find((x) => x.mesh === o);
        if (f) return { kind: 'folder', obj: o, cat: f.cat };
      }
    }
    const hit = raycaster.intersectObject(current, true)[0];
    if (!hit) return null;
    for (let o = hit.object; o; o = o.parent) if (o.userData.skillCard !== undefined) return { kind: 'card', obj: current, idx: o.userData.skillCard };
    return { kind: 'focused', obj: current };
  }
  const hit = raycaster.intersectObject(W.root, true)[0];
  for (let o = hit?.object; o; o = o.parent) {
    if (o.userData.sticker) return { kind: 'sticker', obj: o };
    if (o.userData.id) return { kind: 'item', obj: o };
    if (o.userData.door !== undefined) {
      if (o.userData.door === MAIN && opened) return null;
      return { kind: 'door', obj: o };
    }
  }
  return null;
}

function glow(obj, v) {
  obj.traverse((o) => {
    if (!o.isMesh) return;
    for (const m of [].concat(o.material)) {
      if (!m.emissive) continue;
      m.emissive.setRGB(1, 1, 1);
      m.emissiveIntensity = v;
    }
  });
}

// For open books: +1 if the pointer is over the right half (next page), -1 over the left half.
function bookSide(x) {
  current.getWorldPosition(tmpV).project(camera);
  return x > (tmpV.x * 0.5 + 0.5) * innerWidth ? 1 : -1;
}

function labelFor(t) {
  if (!t) return '';
  if (t.kind === 'focused') {
    if (!current.userData.canTurn || busy) return '';
    const side = bookSide(pointer.x);
    if (!current.userData.canTurn(side)) return '';
    return side > 0 ? 'NEXT PAGE  →' : '←  PREVIOUS PAGE';
  }
  if (t.kind === 'card') {
    const { active, flipped } = current.userData.state();
    return t.idx !== active ? 'BRING THIS CARD UP' : flipped ? 'FLIP BACK ↻' : 'SEE THE TOOLKIT ↻';
  }
  if (t.kind === 'sticker') return 'DRAG ME';
  if (t.kind === 'folder') return `${t.cat.en} · ${t.cat.sub}`;
  if (t.kind === 'door') return t.obj.userData.door === MAIN ? 'OPEN' : 'LOCKED';
  return t.obj.userData.label;
}

function setHover(t) {
  const obj = t?.obj ?? null;
  ui.tip(labelFor(t), pointer.x, pointer.y);
  if (obj === hovered) return;
  if (hovered && hovered !== current) glow(hovered, 0);
  const prev = hovered;
  hovered = obj;
  if (obj && obj !== current) glow(obj, 0.1);
  if (obj?.userData.id && obj.userData.id !== 'guitar') new THREE.Box3().setFromObject(obj).getCenter(leanAt);
  canvas.style.cursor = !obj ? '' : t.kind === 'sticker' ? 'grab' : 'pointer';
  const door = W.doors[MAIN];
  if (!opened && !busy && (obj === door || prev === door)) {
    gsap.to(door.rotation, { y: obj === door ? 0.07 : 0, duration: 0.4, ease: 'power2.out' });
  }
}

function rattle(door) {
  gsap.timeline()
    .to(door.rotation, { y: 0.05, duration: 0.06 })
    .to(door.rotation, { y: 0, duration: 0.06 })
    .to(door.rotation, { y: 0.04, duration: 0.06 })
    .to(door.rotation, { y: 0, duration: 0.08 });
  ui.toast('This one is locked — try the second locker');
}

function strum(guitar) {
  const z = guitar.rotation.z;
  gsap.timeline()
    .to(guitar.rotation, { z: z + 0.05, duration: 0.1 })
    .to(guitar.rotation, { z, duration: 1, ease: 'elastic.out(1.2, 0.3)' });
  ui.toast('🎸 Just for fun');
}

function onClick(x, y) {
  if (busy) return;
  const t = pick(x, y);
  if (current) {
    if (!t) return unfocus();
    if (t.kind === 'folder') return ui.openWork(t.cat.id);
    if (t.kind === 'card') return current.userData.clickCard(t.idx);
    if (current.userData.turn) return current.userData.turn(bookSide(x));
    if (current.userData.write) return ui.focusNote(); // clicking the typewriter keeps you typing
    if (!current.userData.open && !current.userData.folders && !current.userData.noSpin) {
      gsap.to(idle, { spin: idle.spin + Math.PI * 2, duration: 1.2, ease: 'power3.inOut' });
    }
    return;
  }
  if (!t || (atShelf && t.kind === 'door')) {
    if (atShelf) leaveShelf();
    return;
  }
  if (t.kind === 'door') {
    if (t.obj.userData.door === MAIN) openLocker();
    else rattle(t.obj);
  } else if (t.obj.userData.id === 'guitar') {
    strum(t.obj);
  } else {
    focus(t.obj.userData.id);
  }
}

/* ---------- draggable stickers ---------- */
// Positions are a per-viewer convenience, so localStorage is enough.
const STICKER_KEY = 'locker-stickers-v4';
const dragPlane = new THREE.Plane();
const dragHit = new V3();
let drag = null;
let stackTop = 0;

function restoreStickers() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(STICKER_KEY) || '{}'); } catch {}
  for (const m of W.stickers) {
    const p = saved[m.userData.sticker.id];
    if (!p) continue;
    m.position.x = p[0];
    m.position.y = p[1];
    m.rotation.z = m.userData.sticker.rz = p[2];
  }
}

function saveStickers() {
  const out = {};
  const r = (v) => Math.round(v * 1000) / 1000;
  for (const m of W.stickers) out[m.userData.sticker.id] = [r(m.position.x), r(m.position.y), r(m.userData.sticker.rz)];
  try { localStorage.setItem(STICKER_KEY, JSON.stringify(out)); } catch {}
}

// Pointer position projected onto the sticker's door surface, in door-panel coordinates.
function pointerOnPanel(x, y, panel) {
  ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  if (!raycaster.ray.intersectPlane(dragPlane, dragHit)) return null;
  return panel.worldToLocal(dragHit.clone());
}

function startDrag(mesh, x, y) {
  const panel = mesh.parent;
  const st = mesh.userData.sticker;
  panel.updateWorldMatrix(true, false);
  const normal = new V3(0, 0, st.face).transformDirection(panel.matrixWorld);
  dragPlane.setFromNormalAndCoplanarPoint(normal, mesh.getWorldPosition(new V3()));
  const p = pointerOnPanel(x, y, panel);
  if (!p) return false;
  drag = { mesh, panel, dx: p.x - mesh.position.x, dy: p.y - mesh.position.y, sx: x, sy: y, moved: false, tilt: 0, lastX: mesh.position.x };
  gsap.killTweensOf([mesh.scale, mesh.rotation, mesh.position]);
  // lift it off the door and bring it to the top of the pile
  stackTop = (stackTop + 1) % 40;
  mesh.position.z = st.baseZ + st.face * (0.003 + stackTop * 0.00008);
  gsap.to(mesh.scale, { x: 1.14, y: 1.14, duration: 0.2, ease: 'power2.out' });
  setHover(null);
  canvas.style.cursor = 'grabbing';
  return true;
}

function moveDrag(x, y) {
  if (!drag.moved && Math.hypot(x - drag.sx, y - drag.sy) > 4) drag.moved = true;
  if (!drag.moved) return;
  const p = pointerOnPanel(x, y, drag.panel);
  if (!p) return;
  const { mesh } = drag;
  const [bx, by] = mesh.userData.sticker.bounds;
  mesh.position.x = THREE.MathUtils.clamp(p.x - drag.dx, -bx, bx);
  mesh.position.y = THREE.MathUtils.clamp(p.y - drag.dy, -by, by);
  // swing a little with horizontal speed, like a sticker held by one corner
  const vx = mesh.position.x - drag.lastX;
  drag.lastX = mesh.position.x;
  drag.tilt += (THREE.MathUtils.clamp(-vx * 18 * mesh.userData.sticker.face, -0.35, 0.35) - drag.tilt) * 0.35;
  mesh.rotation.z = mesh.userData.sticker.rz + drag.tilt;
}

function endDrag() {
  const { mesh, moved } = drag;
  const st = mesh.userData.sticker;
  drag = null;
  canvas.style.cursor = '';
  gsap.to(mesh.scale, { x: 1, y: 1, duration: 0.6, ease: 'elastic.out(1.1, 0.45)' });
  if (moved) {
    gsap.to(mesh.rotation, { z: st.rz, duration: 0.7, ease: 'elastic.out(1.2, 0.4)' });
    saveStickers();
  } else {
    gsap.timeline()
      .to(mesh.rotation, { z: st.rz + 0.18, duration: 0.08 })
      .to(mesh.rotation, { z: st.rz - 0.12, duration: 0.1 })
      .to(mesh.rotation, { z: st.rz, duration: 0.5, ease: 'elastic.out(1.2, 0.4)' });
  }
}

let down = null;
canvas.addEventListener('pointerdown', (e) => {
  if (W && !busy && !current) {
    const t = pick(e.clientX, e.clientY);
    if (t?.kind === 'sticker' && startDrag(t.obj, e.clientX, e.clientY)) {
      canvas.setPointerCapture(e.pointerId);
      down = null;
      return;
    }
  }
  down = { x: e.clientX, y: e.clientY };
});
canvas.addEventListener('pointerup', (e) => {
  if (drag) return endDrag();
  if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 6) onClick(e.clientX, e.clientY);
  down = null;
});
canvas.addEventListener('pointercancel', () => { if (drag) endDrag(); });
window.addEventListener('pointermove', (e) => {
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = (e.clientY / innerHeight) * 2 - 1;
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  pointer.onCanvas = e.target === canvas;
  pointer.mouse = e.pointerType === 'mouse';
  pointer.dirty = true;
  if (drag) moveDrag(e.clientX, e.clientY);
});
window.addEventListener('keydown', (e) => {
  if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && current?.userData.step && !busy) {
    return current.userData.step(e.key === 'ArrowRight' ? 1 : -1);
  }
  if (e.key !== 'Escape') return;
  if (ui.isWorkOpen()) ui.closeWork();
  else if (current) unfocus();
  else if (atShelf) leaveShelf();
  else closeLocker();
});

/* ---------- resize & loop ---------- */
function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = baseCam.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  if (!W || busy) return;
  if (!current) return setRig(atShelf ? shelfShot() : shot(opened ? 'open' : 'overview'));
  {
    focusBase = focusTarget(current, { pos: rig.pos, target: rig.target, dist: rig.pos.distanceTo(rig.target) });
    current.position.copy(focusBase.pos);
    current.scale.setScalar(focusBase.scale);
    if (foldersIdle) {
      const tg = folderTargets({ pos: rig.pos, target: rig.target, dist: rig.pos.distanceTo(rig.target) });
      flying.forEach((f, i) => { f.base = tg.folders[i]; });
      stars.forEach((st, i) => { st.userData.base = tg.stars[i]; st.position.copy(tg.stars[i].pos); st.scale.setScalar(tg.stars[i].scale); });
    }
  }
}
window.addEventListener('resize', resize);

const clock = new THREE.Clock();
const tmpQ = new THREE.Quaternion();
const tmpE = new THREE.Euler();
const tmpV = new V3();
const camUp = new V3();
const camBack = new V3();
const Z_AXIS = new V3(0, 0, 1);
const anchorPos = new V3();
const leanAt = new V3(); // centre of the hovered item
const lean = { pos: new V3(), target: new V3() };
const leanGoal = { pos: new V3(), target: new V3() };

function frame() {
  const t = clock.getElapsedTime();
  mouse.sx += (mouse.x - mouse.sx) * 0.06;
  mouse.sy += (mouse.y - mouse.sy) * 0.06;
  // Hovering an item while the locker is open leans the camera a little towards it.
  // (not for thin targets like books: leaning would slide them out from under the pointer)
  if (opened && !busy && !current && hovered?.userData.id && hovered.userData.id !== 'guitar' && !hovered.userData.pullOut) {
    leanGoal.pos.subVectors(leanAt, rig.pos).multiplyScalar(0.04);
    leanGoal.target.subVectors(leanAt, rig.target).multiplyScalar(0.08);
  } else {
    leanGoal.pos.set(0, 0, 0);
    leanGoal.target.set(0, 0, 0);
  }
  lean.pos.lerp(leanGoal.pos, 0.05);
  lean.target.lerp(leanGoal.target, 0.05);
  camera.position.copy(rig.pos).add(lean.pos).add(new V3(mouse.sx * 0.12 * rig.par, -mouse.sy * 0.06 * rig.par, 0));
  camera.lookAt(tmpV.copy(rig.target).add(lean.target));

  if (current && idle.k > 0) {
    const sway = current.userData.sway ?? (current.userData.layout === 'center' ? 0.25 : 1); // keep open books steady enough to read
    tmpE.set(
      (mouse.sy * 0.25 + Math.sin(t * 0.8) * 0.04) * idle.k * sway,
      (mouse.sx * 0.4 + Math.sin(t * 0.6) * 0.08) * idle.k * sway + idle.spin,
      0,
    );
    current.quaternion.copy(focusBase.quat).multiply(tmpQ.setFromEuler(tmpE));
    current.position.copy(focusBase.pos).y += Math.sin(t * 1.2) * 0.008 * idle.k;
  }

  if (foldersIdle) {
    camUp.set(0, 1, 0).applyQuaternion(camera.quaternion);
    camBack.set(0, 0, 1).applyQuaternion(camera.quaternion);
    flying.forEach((f, i) => {
      f.hk += ((hovered === f.mesh ? 1 : 0) - f.hk) * 0.15;
      f.mesh.position.copy(f.base.pos)
        .addScaledVector(camUp, Math.sin(t * 1.1 + i * 1.7) * 0.006 + f.hk * 0.012)
        .addScaledVector(camBack, f.hk * 0.04);
      tmpE.set(mouse.sy * 0.12, mouse.sx * 0.18, Math.sin(t * 0.7 + i) * 0.03 - f.hk * 0.05);
      f.mesh.quaternion.copy(f.base.quat).multiply(tmpQ.setFromEuler(tmpE));
      f.mesh.scale.setScalar(f.base.scale * (1 + f.hk * 0.06));
    });
    stars.forEach((st, i) => {
      st.quaternion.copy(st.userData.base.quat).multiply(tmpQ.setFromAxisAngle(Z_AXIS, t * 0.4 * (i ? -1 : 1)));
    });
  }

  if (queuedNav && !busy && W) {
    const id = queuedNav;
    queuedNav = null;
    nav(id);
  }

  if (pointer.dirty && W && !drag) {
    pointer.dirty = false;
    if (busy || !pointer.onCanvas || !pointer.mouse) setHover(null);
    else setHover(pick(pointer.x, pointer.y));
  }

  if (W && !opened && !busy) {
    W.doors[MAIN].userData.anchor.getWorldPosition(anchorPos).project(camera);
    ui.hint(true, (anchorPos.x * 0.5 + 0.5) * innerWidth, (-anchorPos.y * 0.5 + 0.5) * innerHeight);
  } else {
    ui.hint(false);
  }

  renderer.clear();
  renderer.render(scene, camera);
  if (dim.v > 0.001) {
    dimMat.opacity = dim.v * 0.82;
    renderer.render(dimScene, dimCam);
  }
  if (current) {
    renderer.clearDepth();
    renderer.render(focusScene, camera);
  }
}

/* ---------- boot ---------- */
await loadFonts(fontText);
if (profile.avatarStyle === 'photo' && profile.avatar) profile.avatarImg = await loadImage(profile.avatar).catch(() => null);
// Recolour a logo to a single colour (e.g. white for a dark book cover), at a crisp size.
function tintImage(img, color) {
  const c = document.createElement('canvas');
  const k = 1200 / Math.max(img.naturalWidth, img.naturalHeight);
  c.width = Math.round(img.naturalWidth * k);
  c.height = Math.round(img.naturalHeight * k);
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0, c.width, c.height);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, c.width, c.height);
  return c;
}
for (const e of experiences) {
  if (e.book.logoSrc) e.book.logoImg = await loadImage(e.book.logoSrc).catch(() => null);
  if (e.book.logoImg && e.book.logoOnCover) e.book.logoCoverImg = tintImage(e.book.logoImg, e.book.logoOnCover);
  if (e.book.coverLogoSrc) e.book.logoCoverImg = await loadImage(e.book.coverLogoSrc).catch(() => null);
  if (e.screens) e.screenImgs = await Promise.all(e.screens.map((src) => loadImage(src).catch(() => null)));
}
W = buildWorld();
starMat.map = stickerTexture('burst');
W.root.traverse((o) => {
  if (!o.isMesh) return;
  o.castShadow = !o.userData.noShadow;
  o.receiveShadow = true;
});
// Hover glow edits emissive, so each interactive object needs its own material copies.
for (const obj of [...W.doors, ...Object.values(W.items), W.guitar]) {
  obj.traverse((o) => {
    if (o.isMesh) o.material = Array.isArray(o.material) ? o.material.map((m) => m.clone()) : o.material.clone();
  });
}
scene.add(W.root);
restoreStickers();

// Locker surface finish — pick another key from FINISHES in finishes.js to change the look.
const LOCKER_FINISH = 'clay';
applyFinish(W.root, LOCKER_FINISH, env, scene.environmentIntensity);

resize();
const start = shot('overview');
setRig(start);
renderer.setAnimationLoop(frame);
document.getElementById('loader').classList.add('is-done');
// Intro: orbit in from a three-quarter view to face the lockers.
const offset = start.pos.clone().sub(start.target);
const orbit = { a: 0.75, k: 1.35, lift: 0.9 };
const applyOrbit = () => rig.pos.copy(offset).multiplyScalar(orbit.k).applyAxisAngle(new V3(0, 1, 0), orbit.a).add(start.target).add(new V3(0, orbit.lift, 0));
applyOrbit();
await gsap.to(orbit, { a: 0, k: 1, lift: 0, duration: 2.4, delay: 0.1, ease: 'power3.inOut', onUpdate: applyOrbit });
busy = false;
ui.setStatus(STATUS.closed);
