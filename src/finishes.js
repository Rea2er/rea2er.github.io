// Surface finish presets for the locker shell. Each preset only changes how the surface
// reacts to light (roughness, metalness, clearcoat, sheen, detail maps) — colours stay as set in models.js.
import * as THREE from 'three';
import { rng } from './textures.js';

export const FINISHES = {
  soft: { label: 'Soft matte', note: 'soft vinyl toy', roughness: 0.72, metalness: 0, env: 1, sheen: 0.25, sheenRoughness: 0.8 },
  satin: { label: 'Satin', note: 'subtle sheen', roughness: 0.38, metalness: 0.28, env: 1 },
  matte: { label: 'Matte', note: 'no shine, fine grain', roughness: 0.9, metalness: 0, env: 0.55, roughMap: 'grain' },
  gloss: { label: 'Gloss', note: 'clear coat, sharp highlights', roughness: 0.3, metalness: 0, env: 1.7, clearcoat: 1, clearcoatRoughness: 0.03 },
  metal: { label: 'Polished metal', note: 'mirror-like', roughness: 0.16, metalness: 0.75, env: 2.3 },
  brushed: { label: 'Brushed metal', note: 'vertical brushing', roughness: 0.42, metalness: 0.7, env: 2.1, roughMap: 'brushed' },
  worn: { label: 'Worn paint', note: 'scratches, chips, rust', roughness: 0.65, metalness: 0.2, env: 0.9, worn: true },
  clay: { label: 'Clay', note: 'no highlights, velvety', roughness: 1, metalness: 0, env: 0.5, sheen: 0.7, sheenRoughness: 0.9 },
};

const ROLES = new Set(['body', 'inner', 'plinth', 'vent']);
const cache = new Map();

function canvasTex(key, size, draw, srgb) {
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  cache.set(key, tex);
  return tex;
}

function roughnessMap(kind) {
  return canvasTex(`rough-${kind}`, 512, (ctx, s) => {
    const r = rng(kind === 'brushed' ? 3 : 5);
    if (kind === 'brushed') {
      ctx.fillStyle = '#909090';
      ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < 1600; i++) {
        const v = (90 + r() * 110) | 0;
        ctx.fillStyle = `rgba(${v},${v},${v},${0.2 + r() * 0.4})`;
        ctx.fillRect(r() * s, 0, 0.6 + r() * 1.6, s);
      }
    } else {
      const img = ctx.createImageData(s, s);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = 170 + r() * 70;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    }
  });
}

// Worn paint has the paint colour baked into the map, so chips can show bare grey metal.
function wornMap(hex) {
  return canvasTex(`worn-${hex}`, 1024, (ctx, s) => {
    const r = rng(parseInt(hex.slice(1), 16) % 997);
    ctx.fillStyle = hex;
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = `rgba(${r() > 0.5 ? '255,255,255' : '40,50,60'},${0.03 + r() * 0.04})`;
      ctx.beginPath();
      ctx.arc(r() * s, r() * s, 20 + r() * 90, 0, Math.PI * 2);
      ctx.fill();
    }
    const grime = ctx.createLinearGradient(0, s * 0.7, 0, s);
    grime.addColorStop(0, 'rgba(60,50,40,0)');
    grime.addColorStop(1, 'rgba(60,50,40,0.25)');
    ctx.fillStyle = grime;
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 90; i++) {
      const edge = r() < 0.6;
      const x = edge ? (r() < 0.5 ? r() * 60 : s - r() * 60) : r() * s;
      const y = r() * s;
      ctx.fillStyle = r() < 0.15 ? '#9b6a45' : '#b9bec4';
      ctx.beginPath();
      for (let k = 0; k < 7; k++) {
        const a = (k / 7) * Math.PI * 2, rad = 3 + r() * 12;
        k ? ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad) : ctx.moveTo(x + rad, y);
      }
      ctx.fill();
    }
    ctx.lineCap = 'round';
    for (let i = 0; i < 160; i++) {
      const x = r() * s, y = r() * s, len = 10 + r() * 70, a = (r() - 0.5) * 1.2;
      ctx.strokeStyle = `rgba(${r() > 0.5 ? '210,215,220' : '50,55,60'},${0.25 + r() * 0.35})`;
      ctx.lineWidth = 0.6 + r() * 1.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
      ctx.stroke();
    }
  }, true);
}

// `env` is assigned per material because with scene.environment alone three.js ignores envMapIntensity.
export function applyFinish(root, key, env = null, envBase = 1) {
  const f = FINISHES[key] ?? FINISHES.soft;
  root.traverse((o) => {
    if (!o.isMesh) return;
    for (const m of [].concat(o.material)) {
      if (!ROLES.has(m.userData.role)) continue;
      const base = m.userData.baseColor;
      m.roughness = f.roughness;
      m.metalness = f.metalness;
      m.envMap = env;
      m.envMapIntensity = (f.env ?? 1) * envBase;
      m.clearcoat = f.clearcoat ?? 0;
      m.clearcoatRoughness = f.clearcoatRoughness ?? 0;
      m.sheen = f.sheen ?? 0;
      m.sheenRoughness = f.sheenRoughness ?? 1;
      m.sheenColor.set('#ffffff');
      m.map = f.worn ? wornMap(base) : null;
      m.color.set(f.worn ? '#ffffff' : base);
      m.roughnessMap = f.roughMap ? roughnessMap(f.roughMap) : f.worn ? roughnessMap('grain') : null;
      m.needsUpdate = true;
    }
  });
}
