import * as THREE from 'three';

export const FONTS = {
  display: 'Ultra, Georgia, serif',
  mono: '"Space Mono", ui-monospace, monospace',
  serif: '"Noto Serif", Georgia, serif',
  sans: '"Noto Sans", system-ui, sans-serif',
  condensed: 'Oswald, "Arial Narrow", sans-serif',
  marker: '"Permanent Marker", "Comic Sans MS", cursive',
  hand: 'Caveat, "Comic Sans MS", cursive',
};

// Canvas text silently falls back to a system font if the web font isn't loaded yet.
export async function loadFonts(text) {
  const specs = [
    `64px Ultra`, `700 32px "Space Mono"`, `400 32px "Space Mono"`,
    `900 48px "Noto Serif"`, `500 32px "Noto Sans"`, `700 32px "Noto Sans"`, `700 32px Oswald`, `32px "Permanent Marker"`, `700 32px Caveat`,
  ];
  const all = Promise.all(specs.map((f) => document.fonts.load(f, text).catch(() => {})));
  await Promise.race([all, new Promise((r) => setTimeout(r, 5000))]);
}

export function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function make(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function fitFont(ctx, text, font, size, maxW) {
  let s = size;
  ctx.font = font(s);
  while (ctx.measureText(text).width > maxW && s > 8) ctx.font = font((s -= 2));
  return s;
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// A real photo, cover-fitted into the avatar frame.
function drawPhoto(ctx, img, x, y, w, h) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 18);
  ctx.clip();
  const s = Math.max(w / img.width, h / img.height);
  const dw = img.width * s, dh = img.height * s;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

// Hand-drawn cartoon portrait based on the profile photo (short fluffy hair, navy suit, purple tie).
function drawCartoon(ctx, x, y, w, h) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 18);
  ctx.clip();
  const bg = ctx.createLinearGradient(0, y, 0, y + h);
  bg.addColorStop(0, '#dcebf8');
  bg.addColorStop(1, '#bcd5ee');
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);

  const cx = x + w / 2, cy = y + h * 0.43;
  const skin = '#f6d3b6', skinShade = '#e9b896', hair = '#17171b', navy = '#1f2b4a', navyDark = '#141c33';

  // suit shoulders
  ctx.fillStyle = navy;
  ctx.beginPath();
  ctx.moveTo(x - 10, y + h);
  ctx.bezierCurveTo(x + 5, y + h * 0.8, cx - 70, y + h * 0.74, cx - 32, y + h * 0.72);
  ctx.lineTo(cx + 32, y + h * 0.72);
  ctx.bezierCurveTo(cx + 70, y + h * 0.74, x + w - 5, y + h * 0.8, x + w + 10, y + h);
  ctx.closePath();
  ctx.fill();

  // neck
  ctx.fillStyle = skin;
  ctx.fillRect(cx - 17, cy + 50, 34, 50);
  ctx.fillStyle = skinShade;
  ctx.fillRect(cx - 17, cy + 50, 34, 12);

  // shirt V and collar
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(cx - 30, y + h * 0.715);
  ctx.lineTo(cx, y + h * 0.92);
  ctx.lineTo(cx + 30, y + h * 0.715);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - 22, y + h * 0.7);
  ctx.lineTo(cx - 2, y + h * 0.775);
  ctx.lineTo(cx - 26, y + h * 0.79);
  ctx.closePath();
  ctx.moveTo(cx + 22, y + h * 0.7);
  ctx.lineTo(cx + 2, y + h * 0.775);
  ctx.lineTo(cx + 26, y + h * 0.79);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,28,51,0.25)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // tie
  ctx.fillStyle = '#4b2b80';
  ctx.beginPath();
  ctx.moveTo(cx - 9, y + h * 0.765);
  ctx.lineTo(cx + 9, y + h * 0.765);
  ctx.lineTo(cx + 6, y + h * 0.805);
  ctx.lineTo(cx - 6, y + h * 0.805);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5a3596';
  ctx.beginPath();
  ctx.moveTo(cx - 6, y + h * 0.805);
  ctx.lineTo(cx + 6, y + h * 0.805);
  ctx.lineTo(cx + 13, y + h * 1.02);
  ctx.lineTo(cx - 13, y + h * 1.02);
  ctx.closePath();
  ctx.fill();

  // lapels
  ctx.fillStyle = navyDark;
  ctx.beginPath();
  ctx.moveTo(cx - 32, y + h * 0.72);
  ctx.lineTo(cx - 12, y + h * 0.95);
  ctx.lineTo(cx - 40, y + h * 0.84);
  ctx.closePath();
  ctx.moveTo(cx + 32, y + h * 0.72);
  ctx.lineTo(cx + 12, y + h * 0.95);
  ctx.lineTo(cx + 40, y + h * 0.84);
  ctx.closePath();
  ctx.fill();

  // ears
  for (const s of [-1, 1]) {
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.ellipse(cx + s * 57, cy + 8, 11, 17, s * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = skinShade;
    ctx.beginPath();
    ctx.ellipse(cx + s * 58, cy + 9, 5, 9, s * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  // face: slim, slightly pointed chin
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 62);
  ctx.bezierCurveTo(cx + 40, cy - 62, cx + 56, cy - 35, cx + 54, cy + 5);
  ctx.bezierCurveTo(cx + 52, cy + 45, cx + 30, cy + 68, cx, cy + 70);
  ctx.bezierCurveTo(cx - 30, cy + 68, cx - 52, cy + 45, cx - 54, cy + 5);
  ctx.bezierCurveTo(cx - 56, cy - 35, cx - 40, cy - 62, cx, cy - 62);
  ctx.fill();

  // hair: soft, fluffy volume with a fringe swept towards the viewer's left
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.moveTo(cx - 57, cy + 2);
  ctx.bezierCurveTo(cx - 70, cy - 30, cx - 64, cy - 70, cx - 38, cy - 84);
  ctx.quadraticCurveTo(cx - 30, cy - 104, cx - 10, cy - 96);
  ctx.quadraticCurveTo(cx + 4, cy - 112, cx + 20, cy - 98);
  ctx.quadraticCurveTo(cx + 40, cy - 104, cx + 46, cy - 84);
  ctx.bezierCurveTo(cx + 68, cy - 70, cx + 68, cy - 36, cx + 59, cy - 2);
  ctx.quadraticCurveTo(cx + 56, cy - 22, cx + 46, cy - 30);
  // fringe: tufts sweeping down to the left
  ctx.quadraticCurveTo(cx + 36, cy - 18, cx + 22, cy - 22);
  ctx.quadraticCurveTo(cx + 10, cy - 8, cx - 6, cy - 14);
  ctx.quadraticCurveTo(cx - 22, cy - 2, cx - 36, cy - 8);
  ctx.quadraticCurveTo(cx - 46, cy + 4, cx - 57, cy + 2);
  ctx.closePath();
  ctx.fill();
  // a couple of lighter strands for texture
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx + 30, cy - 80);
  ctx.quadraticCurveTo(cx + 10, cy - 60, cx - 18, cy - 30);
  ctx.moveTo(cx + 44, cy - 66);
  ctx.quadraticCurveTo(cx + 30, cy - 46, cx + 12, cy - 30);
  ctx.stroke();

  // eyebrows
  ctx.strokeStyle = '#2a2220';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx - 33, cy - 2);
  ctx.quadraticCurveTo(cx - 22, cy - 7, cx - 11, cy - 3);
  ctx.moveTo(cx + 11, cy - 3);
  ctx.quadraticCurveTo(cx + 22, cy - 7, cx + 33, cy - 2);
  ctx.stroke();

  // eyes
  ctx.fillStyle = '#231b18';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(cx + s * 22, cy + 12, 6.5, 7.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#ffffff';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(cx + s * 22 + 2.2, cy + 9.5, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // nose, blush, smile
  ctx.strokeStyle = skinShade;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx + 2, cy + 22);
  ctx.quadraticCurveTo(cx + 6, cy + 32, cx - 1, cy + 34);
  ctx.stroke();
  ctx.fillStyle = 'rgba(240,130,120,0.28)';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(cx + s * 34, cy + 32, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#a4523f';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(cx, cy + 36, 9, 0.22 * Math.PI, 0.78 * Math.PI);
  ctx.stroke();
  ctx.restore();
}

export function idCardTexture(p) {
  return make(1024, 660, (ctx, w, h) => {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 44);
    ctx.clip();
    ctx.fillStyle = '#f7f4ec';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(31,59,115,0.07)';
    ctx.lineWidth = 2;
    for (let r = 40; r < 260; r += 14) {
      ctx.beginPath();
      ctx.arc(w - 230, h - 250, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = '#141414';
    ctx.font = `700 20px ${FONTS.mono}`;
    ctx.fillText('STUDENT IDENTIFICATION CARD', 48, 64);
    ctx.fillStyle = '#d6352f';
    ctx.font = `900 34px ${FONTS.serif}`;
    ctx.textAlign = 'right';
    ctx.fillText('ABOUT ME', w - 48, 68);
    ctx.textAlign = 'left';

    if (p.avatarStyle === 'photo' && p.avatarImg) drawPhoto(ctx, p.avatarImg, 48, 96, 240, 290);
    else drawCartoon(ctx, 48, 96, 240, 290);

    ctx.fillStyle = '#141414';
    const fs = fitFont(ctx, 'INFORMATION', (s) => `${s}px ${FONTS.display}`, 84, w - 320 - 48);
    ctx.fillText('BASIC', 320, 96 + fs);
    ctx.fillText('INFORMATION', 320, 100 + fs * 2);

    const top = 100 + fs * 2 + 54;
    p.fields.slice(0, 6).forEach(([k, v], i) => {
      const x = 320 + (i % 2) * 330, y = top + Math.floor(i / 2) * 64;
      ctx.fillStyle = '#7a7f87';
      ctx.font = `700 15px ${FONTS.mono}`;
      ctx.fillText(k, x, y);
      ctx.fillStyle = '#141414';
      fitFont(ctx, v, (s) => `500 ${s}px ${FONTS.sans}`, 25, 300);
      ctx.fillText(v, x, y + 30);
    });

    const r = rng(7);
    ctx.fillStyle = '#141414';
    for (let bx = 48; bx < 288; ) {
      const bw = 1 + Math.floor(r() * 4);
      ctx.fillRect(bx, 420, bw, 70);
      bx += bw + 1 + Math.floor(r() * 3);
    }
    ctx.font = `400 15px ${FONTS.mono}`;
    ctx.fillText('2026 0101 0001', 48, 516);

    ctx.save();
    ctx.translate(w - 150, 470);
    ctx.rotate(-0.25);
    ctx.strokeStyle = 'rgba(214,53,47,0.5)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 70, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 58, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(214,53,47,0.55)';
    ctx.font = `700 20px ${FONTS.mono}`;
    ctx.textAlign = 'center';
    ctx.fillText('CERTIFIED', 0, 8);
    ctx.restore();

    ctx.fillStyle = '#d6352f';
    ctx.fillRect(w - 230, h - 122, 182, 38);
    ctx.fillStyle = '#fff';
    ctx.font = `700 16px ${FONTS.mono}`;
    ctx.textAlign = 'center';
    ctx.fillText('ACCESS · ALL', w - 139, h - 97);

    ctx.fillStyle = '#1f3b73';
    ctx.fillRect(0, h - 64, w, 64);
    ctx.fillStyle = '#f7f4ec';
    ctx.font = `700 18px ${FONTS.mono}`;
    ctx.textAlign = 'left';
    ctx.fillText(`ID NO. 2026-0001 · ${p.nameEn}`, 48, h - 26);
    ctx.textAlign = 'right';
    ctx.fillText('PERSONAL DESIGN PORTFOLIO', w - 48, h - 26);
    ctx.restore();
  });
}

export function spineTexture(color, band, label) {
  return make(64, 512, (ctx, w, h) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = band;
    ctx.fillRect(0, 40, w, 12);
    ctx.fillRect(0, h - 74, w, 26);
    ctx.save();
    ctx.translate(w / 2 + 7, h / 2 - 10);
    ctx.rotate(Math.PI / 2);
    ctx.font = `700 22px ${FONTS.mono}`;
    ctx.textAlign = 'center';
    ctx.fillText(label, 0, 0);
    ctx.restore();
  });
}

export function labelTexture({ w = 512, h = 256, bg = '#fff', radius = 24, border, lines }) {
  return make(w, h, (ctx) => {
    ctx.beginPath();
    ctx.roundRect(4, 4, w - 8, h - 8, radius);
    ctx.fillStyle = bg;
    ctx.fill();
    if (border) {
      ctx.lineWidth = 6;
      ctx.strokeStyle = border;
      ctx.stroke();
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const l of lines) {
      ctx.fillStyle = l.color;
      fitFont(ctx, l.text, l.font, l.size, w - 40);
      ctx.fillText(l.text, w / 2, l.y * h);
    }
  });
}

const PHOTO_SETS = [
  ['#ffd6a5', '#ff8fab'], ['#a0c4ff', '#bdb2ff'], ['#caffbf', '#9bf6ff'],
  ['#fdffb6', '#ffadad'], ['#d4ff3a', '#2840e8'], ['#e9ecef', '#8fa3b8'],
];

export function polaroidTexture(i, caption = '') {
  return make(256, 300, (ctx, w) => {
    ctx.fillStyle = '#fbfaf6';
    ctx.fillRect(0, 0, w, 300);
    const [a, b] = PHOTO_SETS[i % PHOTO_SETS.length];
    const g = ctx.createLinearGradient(0, 16, 0, 240);
    g.addColorStop(0, a);
    g.addColorStop(1, b);
    ctx.fillStyle = g;
    ctx.fillRect(16, 16, 224, 224);
    ctx.save();
    ctx.beginPath();
    ctx.rect(16, 16, 224, 224);
    ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    ctx.arc(60 + ((i * 47) % 140), 80, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(20,20,20,0.2)';
    ctx.beginPath();
    ctx.moveTo(16, 240);
    ctx.lineTo(80 + (i % 3) * 10, 150);
    ctx.lineTo(150, 205);
    ctx.lineTo(200, 160);
    ctx.lineTo(240, 200);
    ctx.lineTo(240, 240);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#333';
    ctx.font = `400 20px ${FONTS.mono}`;
    ctx.textAlign = 'center';
    ctx.fillText(caption, w / 2, 276);
  });
}

export function stickerTexture(kind) {
  return make(256, 256, (ctx, w, h) => {
    ctx.translate(w / 2, h / 2);
    const p = new Path2D();
    let fill = '#d4ff3a';
    if (kind === 'star' || kind === 'burst') {
      for (let k = 0; k < 24; k++) {
        const r = k % 2 ? 80 : 104, a = (k / 24) * Math.PI * 2;
        k ? p.lineTo(Math.cos(a) * r, Math.sin(a) * r) : p.moveTo(r, 0);
      }
      p.closePath();
    } else if (kind === 'heart') {
      fill = '#e0483e';
      p.moveTo(0, 86);
      p.bezierCurveTo(-130, 0, -90, -110, 0, -46);
      p.bezierCurveTo(90, -110, 130, 0, 0, 86);
    } else if (kind === 'bolt') {
      fill = '#ff9e1b';
      p.moveTo(20, -105);
      p.lineTo(-60, 15);
      p.lineTo(-5, 15);
      p.lineTo(-25, 105);
      p.lineTo(60, -20);
      p.lineTo(5, -20);
      p.closePath();
    } else if (kind === 'vibe') {
      fill = '#ff8fc8';
      p.roundRect(-110, -55, 220, 110, 55);
    } else if (kind === 'omg') {
      fill = '#ffd23f';
      const r = rng(9);
      for (let k = 0; k < 28; k++) {
        const rad = k % 2 ? 72 + r() * 8 : 98 + r() * 12, a = (k / 28) * Math.PI * 2;
        k ? p.lineTo(Math.cos(a) * rad * 1.1, Math.sin(a) * rad * 0.82) : p.moveTo(rad * 1.1, 0);
      }
      p.closePath();
    } else if (kind === 'flower') {
      fill = '#ff8fc8';
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2, x = Math.cos(a) * 52, y = Math.sin(a) * 52;
        p.moveTo(x + 46, y);
        p.arc(x, y, 46, 0, Math.PI * 2);
      }
    } else if (kind === 'cd' || kind === 'smile' || kind === 'hello') {
      fill = { cd: '#dfe3ea', smile: '#ffd23f', hello: '#2840e8' }[kind];
      p.arc(0, 0, 100, 0, Math.PI * 2);
    } else if (kind === 'rainbow') {
      fill = '#ff5f6d';
      p.arc(0, 40, 105, Math.PI, 0);
      p.closePath();
    } else if (kind === 'cloud') {
      fill = '#cfe8ff';
      for (const [x, y, rad] of [[-55, 15, 50], [0, -15, 62], [58, 12, 48], [0, 35, 50]]) {
        p.moveTo(x + rad, y);
        p.arc(x, y, rad, 0, Math.PI * 2);
      }
    }
    ctx.lineJoin = 'round';
    ctx.lineWidth = 22;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke(p);
    ctx.fillStyle = fill;
    ctx.fill(p);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (kind === 'star') {
      ctx.fillStyle = '#2840e8';
      ctx.font = `46px ${FONTS.display}`;
      ctx.fillText('NEW!', 0, 4);
    } else if (kind === 'hello') {
      ctx.fillStyle = '#fff';
      ctx.font = `42px ${FONTS.display}`;
      ctx.fillText('HELLO', 0, 4);
    } else if (kind === 'vibe') {
      ctx.fillStyle = '#141414';
      ctx.font = `52px ${FONTS.display}`;
      ctx.fillText('VIBE', 0, 4);
    } else if (kind === 'omg') {
      ctx.rotate(-0.12);
      ctx.lineWidth = 10;
      ctx.strokeStyle = '#141414';
      ctx.font = `66px ${FONTS.display}`;
      ctx.strokeText('OMG!', 0, 6);
      ctx.fillStyle = '#e0483e';
      ctx.fillText('OMG!', 0, 6);
    } else if (kind === 'flower') {
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath();
      ctx.arc(0, 0, 34, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === 'cd') {
      const g = ctx.createConicGradient(0, 0, 0);
      ['#ffb3c6', '#bde0fe', '#caffbf', '#fdffb6', '#ffb3c6'].forEach((c, k) => g.addColorStop(k / 4, c));
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, 96, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    } else if (kind === 'rainbow') {
      ['#ff5f6d', '#ffb84d', '#ffe66d', '#7bd389', '#6fa8ff', '#b388ff'].forEach((c, k) => {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(0, 40, 105 - k * 12, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
      });
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 40, 33, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
    } else if (kind === 'cloud') {
      ctx.fillStyle = '#2840e8';
      ctx.font = `italic 700 34px ${FONTS.mono}`;
      ctx.fillText('dreamy', 0, 18);
    } else if (kind === 'smile') {
      ctx.fillStyle = '#141414';
      ctx.beginPath();
      ctx.ellipse(-34, -22, 10, 16, 0, 0, Math.PI * 2);
      ctx.ellipse(34, -22, 10, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#141414';
      ctx.beginPath();
      ctx.arc(0, 8, 52, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    }
  });
}

export function numberTexture(n) {
  return make(128, 56, (ctx, w, h) => {
    ctx.fillStyle = '#eef1f4';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#9aa6b4';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, w - 8, h - 8);
    ctx.fillStyle = '#2b3440';
    ctx.font = `700 30px ${FONTS.mono}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(n).padStart(3, '0'), w / 2, h / 2 + 2);
  });
}

// The note in the typewriter. drawPaper() redraws it in place as the visitor types.
export function paperTexture() {
  return make(512, 560, (ctx, w, h) => drawPaper(ctx, w, h, '', false));
}

export function drawPaper(ctx, w, h, text, caret) {
  ctx.fillStyle = '#fffdf7';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(40,64,232,0.15)';
  ctx.lineWidth = 2;
  for (let y = 150; y < h; y += 50) {
    ctx.beginPath();
    ctx.moveTo(32, y);
    ctx.lineTo(w - 32, y);
    ctx.stroke();
  }
  ctx.font = `46px ${FONTS.display}`;
  ctx.fillStyle = '#141414';
  ctx.fillText('LEAVE A', 32, 74);
  ctx.fillStyle = '#d6352f';
  ctx.fillText('NOTE!', 32 + ctx.measureText('LEAVE A ').width, 74);
  ctx.fillStyle = '#141414';
  ctx.font = `700 30px ${FONTS.mono}`;
  if (!text) {
    ctx.globalAlpha = 0.75;
    ['DEAR RUIZE,', '', `START TYPING${caret ? ' |' : ''}`].forEach((t, i) => ctx.fillText(t, 36, 140 + i * 50));
    ctx.globalAlpha = 1;
    return;
  }
  // hard-wrap the typed text to the ruled lines; keep the newest lines in view
  const lines = [];
  for (const para of text.toUpperCase().split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      const t = line ? `${line} ${word}` : word;
      if (ctx.measureText(t).width > w - 72 && line) { lines.push(line); line = word; } else line = t;
    }
    lines.push(line);
  }
  const shown = lines.slice(-7); // the bottom of the sheet sits behind the platen
  shown.forEach((t, i) => ctx.fillText(i === shown.length - 1 && caret ? `${t}|` : t, 36, 140 + i * 50));
}

function skillCardBase(ctx, w, h, s) {
  ctx.beginPath();
  ctx.roundRect(6, 6, w - 12, h - 12, 44);
  ctx.fillStyle = s.color;
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#141414';
  ctx.stroke();
  ctx.fillStyle = s.ink;
}

// Front: the headline, one sentence and one big number, readable when the card is held up close.
export function skillCardTexture(s, total) {
  return make(1024, 640, (ctx, w, h) => {
    skillCardBase(ctx, w, h, s);
    ctx.globalAlpha = 0.65;
    ctx.font = `700 26px ${FONTS.mono}`;
    ctx.fillText(`${s.no} / ${s.tag}`, 60, 92);
    ctx.textAlign = 'right';
    ctx.fillText(`${s.no} / ${String(total).padStart(2, '0')}`, w - 60, 92);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
    fitFont(ctx, s.title, (z) => `900 ${z}px ${FONTS.serif}`, 112, w - 120);
    ctx.fillText(s.title, 56, 210);

    // stat block on the right, description wrapped beside it
    const statW = 330, sx = w - 60;
    ctx.textAlign = 'right';
    fitFont(ctx, s.stat[0], (z) => `${z}px ${FONTS.display}`, 104, statW);
    ctx.fillText(s.stat[0], sx, 380);
    ctx.globalAlpha = 0.75;
    ctx.font = `700 22px ${FONTS.mono}`;
    ctx.fillText(s.stat[1].toUpperCase(), sx, 424);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
    let size = 36;
    let lines;
    do {
      ctx.font = `500 ${size}px ${FONTS.sans}`;
      lines = wrapLines(ctx, s.desc, w - 120 - statW - 40);
    } while (lines.length > 4 && (size -= 2) > 24);
    lines.forEach((l, i) => ctx.fillText(l, 60, 290 + i * size * 1.36));

    ctx.globalAlpha = 0.35;
    ctx.fillRect(60, 520, w - 120, 3);
    ctx.globalAlpha = 0.8;
    ctx.font = `700 24px ${FONTS.mono}`;
    ctx.fillText(s.proof.toUpperCase(), 60, 576);
    ctx.textAlign = 'right';
    ctx.fillText('TAP TO FLIP ↻', w - 60, 576);
  });
}

// Back: the toolkit as chips; the first `core` ones are filled in as daily drivers.
export function skillCardBackTexture(s) {
  return make(1024, 640, (ctx, w, h) => {
    skillCardBase(ctx, w, h, s);
    ctx.globalAlpha = 0.65;
    ctx.font = `700 26px ${FONTS.mono}`;
    ctx.fillText(`${s.no} / TOOLKIT`, 60, 92);
    ctx.globalAlpha = 1;
    ctx.font = `900 64px ${FONTS.serif}`;
    ctx.fillText(s.title, 58, 176);
    const dark = s.ink === '#ffffff';
    let x = 60, y = 224;
    ctx.font = `600 38px ${FONTS.sans}`;
    s.stack.forEach((t, i) => {
      const core = i < (s.core ?? 0);
      const cw = ctx.measureText(t).width + 52;
      if (x + cw > w - 60) { x = 60; y += 88; }
      ctx.beginPath();
      ctx.roundRect(x, y, cw, 70, 35);
      ctx.fillStyle = core ? s.ink : dark ? 'rgba(255,255,255,0.16)' : '#ffffff';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = dark ? 'rgba(255,255,255,0.7)' : '#141414';
      ctx.stroke();
      ctx.fillStyle = core ? s.color : s.ink;
      ctx.fillText(t, x + 26, y + 48);
      x += cw + 16;
    });
    // legend
    ctx.fillStyle = s.ink;
    ctx.beginPath();
    ctx.roundRect(60, 552, 34, 34, 17);
    ctx.fill();
    ctx.globalAlpha = 0.8;
    ctx.font = `700 24px ${FONTS.mono}`;
    ctx.fillText('DAILY DRIVERS', 108, 578);
    ctx.textAlign = 'right';
    ctx.fillText('TAP TO FLIP BACK ↻', w - 60, 576);
  });
}

export function folderLabelTexture(c) {
  return labelTexture({
    w: 512, h: 256, bg: c.color, radius: 2,
    lines: [
      { text: c.en, font: (s) => `${s}px ${FONTS.display}`, size: 84, y: 0.42, color: c.ink },
      { text: c.sub, font: (s) => `900 ${s}px ${FONTS.serif}`, size: 40, y: 0.76, color: c.ink },
    ],
  });
}

// Word stickers: bubbly coloured text with a thick white die-cut edge.
export function wordStickerTexture(text, color) {
  return make(512, 256, (ctx, w, h) => {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const size = fitFont(ctx, text, (z) => `${z}px ${FONTS.display}`, 120, w - 70);
    ctx.font = `${size}px ${FONTS.display}`;
    ctx.lineJoin = 'round';
    ctx.lineWidth = 30;
    ctx.strokeStyle = '#ffffff';
    ctx.strokeText(text, w / 2, h / 2);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#141414';
    ctx.strokeText(text, w / 2, h / 2);
    ctx.fillStyle = color;
    ctx.fillText(text, w / 2, h / 2);
  });
}

// Photo-booth strip: three frames on a black strip.
export function photoStripTexture(i) {
  return make(160, 480, (ctx, w, h) => {
    ctx.fillStyle = '#161616';
    ctx.fillRect(0, 0, w, h);
    for (let k = 0; k < 3; k++) {
      const [a, b] = PHOTO_SETS[(i + k) % PHOTO_SETS.length];
      const y = 14 + k * 146;
      const g = ctx.createLinearGradient(0, y, 0, y + 132);
      g.addColorStop(0, a);
      g.addColorStop(1, b);
      ctx.fillStyle = g;
      ctx.fillRect(12, y, w - 24, 132);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath();
      ctx.arc(w / 2, y + 58, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(w / 2 - 34, y + 92, 68, 40);
    }
  });
}

/* ---------- experience books ---------- */

// Maple leaf body (no stem), normalised to [-1, 1] with y pointing up.
const MAPLE = [
  [0, 1], [0.12, 0.76], [0.29, 0.84], [0.22, 0.44], [0.48, 0.66], [0.55, 0.5], [0.83, 0.56], [0.73, 0.3],
  [0.95, 0.2], [0.5, -0.12], [0.6, -0.32], [0.06, -0.26], [-0.06, -0.26], [-0.6, -0.32], [-0.5, -0.12],
  [-0.95, 0.2], [-0.73, 0.3], [-0.83, 0.56], [-0.55, 0.5], [-0.48, 0.66], [-0.22, 0.44], [-0.29, 0.84],
  [-0.12, 0.76],
];

// Roundel in the style of the reference icon: a ring open at the bottom, a large leaf,
// and a thin stem curving down into the ring.
// variant 'cover' uses the recoloured logo (if any) for dark covers; 'paper' uses the original colours.
function drawLogo(ctx, book, cx, cy, r, variant = 'cover') {
  const img = (variant === 'cover' && book.logoCoverImg) || book.logoImg;
  if (img) {
    // the real logo artwork, fitted inside a 2r × 2r box without distorting it
    const iw = img.width || img.naturalWidth, ih = img.height || img.naturalHeight;
    const s = (2 * r) / Math.max(iw, ih);
    ctx.drawImage(img, cx - (iw * s) / 2, cy - (ih * s) / 2, iw * s, ih * s);
    return;
  }
  const color = book.accent;
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  if (book.logo === 'cap') {
    // graduation cap: diamond board, cap body and a tassel
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.62);
    ctx.lineTo(cx + r, cy - r * 0.18);
    ctx.lineTo(cx, cy + r * 0.26);
    ctx.lineTo(cx - r, cy - r * 0.18);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.55, cy + r * 0.05);
    ctx.lineTo(cx - r * 0.55, cy + r * 0.48);
    ctx.quadraticCurveTo(cx, cy + r * 0.82, cx + r * 0.55, cy + r * 0.48);
    ctx.lineTo(cx + r * 0.55, cy + r * 0.05);
    ctx.lineTo(cx, cy + r * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = r * 0.07;
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.78, cy - r * 0.08);
    ctx.lineTo(cx + r * 0.78, cy + r * 0.52);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + r * 0.78, cy + r * 0.6, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (book.logo === 'maple') {
    const lw = r * 0.11;
    const start = Math.PI / 2 + 0.05; // ring starts just left of the bottom, where the stem lands
    ctx.lineWidth = lw;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.arc(cx, cy, r, start, Math.PI / 2 - 0.24 + Math.PI * 2);
    ctx.stroke();
    const s = r * 0.76, ly = cy - r * 0.12;
    ctx.beginPath();
    MAPLE.forEach(([x, y], i) => {
      const px = cx + x * s, py = ly - y * s;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    });
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = lw * 0.7;
    ctx.beginPath();
    ctx.moveTo(cx, ly + 0.2 * s);
    ctx.quadraticCurveTo(cx + r * 0.02, cy + r * 0.62, cx + Math.cos(start) * r, cy + Math.sin(start) * r);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Die-cut sticker: the art gets a white border that follows its own outline (the art's alpha grown
// outward), like a vinyl sticker cut around the logo. Returns the printed face and the bare cut shape
// (white silhouette) for building the sticker's thickness.
export function dieCutTextures({ aspect = 1, art, under, border = 0.06 }) {
  const W = 1024, H = Math.round(W / aspect), b = Math.round(Math.min(W, H) * border);
  const artC = document.createElement('canvas');
  artC.width = W; artC.height = H;
  const box = [b * 1.15, b * 1.15, W - b * 2.3, H - b * 2.3];
  art(artC.getContext('2d'), ...box);
  const cut = document.createElement('canvas');
  cut.width = W; cut.height = H;
  const c = cut.getContext('2d', { willReadFrequently: true });
  // grow the art's silhouette by b with a distance transform (rounded corners, fills the gaps between
  // stripes, like a plotter cut). Done by hand because canvas `filter` is ignored by Safari.
  c.drawImage(artC, 0, 0);
  if (under) { c.fillStyle = '#fff'; under(c, ...box); } // optional extra cut area, e.g. to join separate pieces
  const px = c.getImageData(0, 0, W, H), d = px.data;
  const dist = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) dist[i] = d[i * 4 + 3] > 6 ? 0 : 1e9;
  const D = Math.SQRT2;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      let v = dist[i];
      if (v === 0) continue;
      if (x > 0) v = Math.min(v, dist[i - 1] + 1);
      if (y > 0) {
        v = Math.min(v, dist[i - W] + 1);
        if (x > 0) v = Math.min(v, dist[i - W - 1] + D);
        if (x < W - 1) v = Math.min(v, dist[i - W + 1] + D);
      }
      dist[i] = v;
    }
  }
  for (let y = H - 1; y >= 0; y--) {
    for (let x = W - 1; x >= 0; x--) {
      const i = y * W + x;
      let v = dist[i];
      if (v === 0) continue;
      if (x < W - 1) v = Math.min(v, dist[i + 1] + 1);
      if (y < H - 1) {
        v = Math.min(v, dist[i + W] + 1);
        if (x < W - 1) v = Math.min(v, dist[i + W + 1] + D);
        if (x > 0) v = Math.min(v, dist[i + W - 1] + D);
      }
      dist[i] = v;
    }
  }
  for (let i = 0; i < W * H; i++) {
    d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = 255;
    d[i * 4 + 3] = Math.max(0, Math.min(255, (b + 0.5 - dist[i]) * 255)); // half-pixel soft edge
  }
  c.putImageData(px, 0, 0);
  const tex = (draw) => make(W, H, draw);
  return {
    face: tex((ctx) => { ctx.drawImage(cut, 0, 0); ctx.drawImage(artC, 0, 0); }),
    cut: tex((ctx) => ctx.drawImage(cut, 0, 0)),
  };
}

// Paul Rand's Eye-Bee-M rebus, laid out on the classic sticker's proportions (830 × 240 grid):
// eye, bee, and the striped M cropped from the 8-bar logo, packed tight.
export function drawEyeBeeM(ibmImg) {
  return (ctx, x, y, w, h) => {
    const k = Math.min(h / 240, w / 830), ox = x + (w - 830 * k) / 2, oy = y + (h - 240 * k) / 2;
    const X = (u) => ox + u * k, Y = (v) => oy + v * k, R = (r) => r * k;
    // eye: thick orange brow over a tan iris
    // near-invisible backing so the die-cut wraps the whole eye in one rounded blob (any alpha counts as cut)
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath(); ctx.ellipse(X(125), Y(140), R(118), R(98), 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e46d0a';
    ctx.beginPath();
    ctx.ellipse(X(125), Y(102), R(125), R(102), 0, Math.PI, 0);
    ctx.ellipse(X(125), Y(102), R(112), R(58), 0, 0, Math.PI, true);
    ctx.fill();
    ctx.fillStyle = '#dcb47c';
    ctx.beginPath(); ctx.arc(X(125), Y(168), R(70), 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0b0b0b';
    ctx.beginPath(); ctx.arc(X(125), Y(168), R(30), 0, Math.PI * 2); ctx.fill();
    // bee: pink eyes, green wings, striped capsule body
    const bc = 422;
    ctx.fillStyle = '#f2b8c6';
    [-22, 22].forEach((d) => { ctx.beginPath(); ctx.arc(X(bc + d), Y(60), R(20), 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = '#2b8c34';
    [1, -1].forEach((m) => {
      const fx = (u) => X(bc + m * (u - bc));
      ctx.beginPath();
      ctx.moveTo(fx(382), Y(96));
      ctx.lineTo(fx(292), Y(150));
      ctx.lineTo(fx(304), Y(204));
      ctx.lineTo(fx(382), Y(170));
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(fx(320), Y(178), R(34), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(X(bc - 48), Y(82), R(96), R(158), R(46));
    ctx.fillStyle = '#f7bd16';
    ctx.fill();
    ctx.clip();
    ctx.fillStyle = '#0b0b0b';
    const band = 158 / 7;
    for (let i = 1; i < 7; i += 2) ctx.fillRect(X(bc - 50), Y(82 + band * i), R(100), R(band));
    ctx.restore();
    // M: cropped from the 8-bar wordmark (its glyph spans x 555–999 of the 1075-wide logo)
    if (ibmImg) {
      const iw = ibmImg.width || ibmImg.naturalWidth, ih = ibmImg.height || ibmImg.naturalHeight;
      const sx = iw * (555 / 1075), sw = iw * (445 / 1075), mw = 245, mh = (mw * ih) / sw;
      ctx.drawImage(ibmImg, sx, 0, sw, ih, X(830 - mw), Y(240 - mh), R(mw), R(mh));
    }
  };
}

// The classic two-part YouTube wordmark, flat: black "You", white "Tube" in a red rounded block.
// Laid out on a 1280 × 500 grid; each word is stretched to its slot so the proportions hold whatever
// condensed font ends up rendering.
export function drawYouTube(ctx, x, y, w, h) {
  const k = Math.min(w / 1280, h / 500), ox = x + (w - 1280 * k) / 2, oy = y + (h - 500 * k) / 2;
  const X = (u) => ox + u * k, Y = (v) => oy + v * k;
  const word = (text, color, left, right) => {
    ctx.save();
    ctx.font = `700 200px ${FONTS.condensed}`;
    ctx.textBaseline = 'alphabetic';
    const m = ctx.measureText(text);
    const sy = (320 * k) / m.actualBoundingBoxAscent, sx = ((right - left) * k) / (m.actualBoundingBoxLeft + m.actualBoundingBoxRight);
    ctx.translate(X(left), Y(405));
    ctx.scale(sx, sy);
    ctx.fillStyle = color;
    ctx.fillText(text, m.actualBoundingBoxLeft, 0);
    ctx.restore();
  };
  word('You', '#111111', 0, 470);
  ctx.fillStyle = '#e62117';
  ctx.beginPath();
  ctx.roundRect(X(520), Y(0), 760 * k, 500 * k, 115 * k);
  ctx.fill();
  word('Tube', '#ffffff', 595, 1210);
}

// Udemy wordmark: lowercase "udemy" with the purple chevron over the u.
export function drawUdemy(ctx, x, y, w, h) {
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.letterSpacing = '-2px';
  ctx.font = `700 200px ${FONTS.sans}`;
  const m = ctx.measureText('udemy'), xh = ctx.measureText('u').actualBoundingBoxAscent;
  const tw = m.actualBoundingBoxLeft + m.actualBoundingBoxRight, th = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  const k = Math.min(w / tw, h / th), left = x + (w - tw * k) / 2, base = y + (h - th * k) / 2 + m.actualBoundingBoxAscent * k;
  ctx.translate(left, base);
  ctx.scale(k, k);
  ctx.fillStyle = '#1c1d1f';
  ctx.fillText('udemy', m.actualBoundingBoxLeft, 0);
  // chevron sits over the u, as wide as the letter, up to the ascender line
  const u = ctx.measureText('u'), uw = u.actualBoundingBoxLeft + u.actualBoundingBoxRight, ux = m.actualBoundingBoxLeft - u.actualBoundingBoxLeft;
  const top = -m.actualBoundingBoxAscent, low = -xh - (m.actualBoundingBoxAscent - xh) * 0.22, t = uw * 0.3;
  ctx.fillStyle = '#a435f0';
  ctx.beginPath();
  ctx.moveTo(ux, low);
  ctx.lineTo(ux + uw / 2, top);
  ctx.lineTo(ux + uw, low);
  ctx.lineTo(ux + uw - t * 0.9, low);
  ctx.lineTo(ux + uw / 2, top + t);
  ctx.lineTo(ux + t * 0.9, low);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Whiteboard face: marker notes on a slightly smudged white surface.
export function whiteboardTexture(aspect) {
  const W = 1024, H = Math.round(W / aspect);
  return make(W, H, (ctx, w, h) => {
    ctx.fillStyle = '#fbfcfd';
    ctx.fillRect(0, 0, w, h);
    // ghosts of old, half-erased notes
    const r = rng(7);
    ctx.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      ctx.strokeStyle = `rgba(120,135,160,${0.04 + r() * 0.05})`;
      ctx.lineWidth = 18 + r() * 30;
      ctx.beginPath();
      const x = r() * w, y = r() * h;
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + 80, y - 30, x + 160, y + 40, x + 200 + r() * 200, y + r() * 30);
      ctx.stroke();
    }
    const ink = { blue: '#1d4ed8', red: '#dc2b20', black: '#1f2328', green: '#148a4a' };
    const tilt = (a, f) => { ctx.save(); ctx.rotate(a); f(); ctx.restore(); };
    // heading
    ctx.fillStyle = ink.black;
    ctx.font = `${h * 0.1}px ${FONTS.marker}`;
    ctx.textBaseline = 'alphabetic';
    tilt(-0.02, () => ctx.fillText('hi, I\u2019m Ruize!', w * 0.06, h * 0.2));
    // underline swoosh
    ctx.strokeStyle = ink.red;
    ctx.lineWidth = h * 0.012;
    ctx.beginPath();
    ctx.moveTo(w * 0.06, h * 0.25);
    ctx.quadraticCurveTo(w * 0.3, h * 0.215, w * 0.6, h * 0.235);
    ctx.stroke();
    // label + line rows
    const rows = [
      ['NOW', ink.red, 'Senior iOS Engineer @ IBM Canada'],
      ['TEACHING', ink.green, 'mobile dev on Udemy + imooc'],
      ['YOUTUBE', ink.blue, 'Fullstack School'],
    ];
    rows.forEach(([label, c, text], i) => {
      const y = h * (0.42 + i * 0.165), a = (i % 2 ? 0.012 : -0.01);
      tilt(a, () => {
        ctx.font = `${h * 0.06}px ${FONTS.marker}`;
        const lw = ctx.measureText(label).width;
        ctx.strokeStyle = c;
        ctx.lineWidth = h * 0.008;
        ctx.beginPath();
        ctx.roundRect(w * 0.06 - h * 0.02, y - h * 0.065, lw + h * 0.04, h * 0.085, h * 0.02);
        ctx.stroke();
        ctx.fillStyle = c;
        ctx.fillText(label, w * 0.06, y);
        ctx.fillStyle = ink.black;
        ctx.font = `700 ${h * 0.085}px ${FONTS.hand}`;
        ctx.fillText(text, w * 0.06 + lw + h * 0.07, y + h * 0.005);
      });
    });
    // a note pointing at the typewriter inside the locker
    ctx.fillStyle = ink.blue;
    ctx.font = `700 ${h * 0.075}px ${FONTS.hand}`;
    tilt(-0.03, () => ctx.fillText('say hi on the typewriter', w * 0.42, h * 0.93));
    ctx.strokeStyle = ink.blue;
    ctx.lineWidth = h * 0.009;
    ctx.beginPath();
    ctx.moveTo(w * 0.36, h * 0.9);
    ctx.quadraticCurveTo(w * 0.27, h * 0.92, w * 0.2, h * 0.96);
    ctx.moveTo(w * 0.225, h * 0.915);
    ctx.lineTo(w * 0.2, h * 0.96);
    ctx.lineTo(w * 0.25, h * 0.965);
    ctx.stroke();
  });
}

// Yellow sticky note with a couple of handwritten words.
export function stickyNoteTexture(text) {
  return make(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#ffe066';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.fillRect(0, 0, w, h * 0.12);
    ctx.fillStyle = '#3a2e00';
    ctx.textAlign = 'center';
    ctx.font = `700 ${h * 0.3}px ${FONTS.hand}`;
    text.split('\n').forEach((line, i, all) => ctx.fillText(line, w / 2, h * (0.56 + (i - (all.length - 1) / 2) * 0.3)));
  });
}

// Air Canada roundel on a white disc with the wordmark underneath.
export function drawAirCanada(roundel) {
  return (ctx, x, y, w, h) => {
    const d = Math.min(w, h * 0.74), cx = x + w / 2, cy = y + d / 2;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(cx, cy, d * 0.47, 0, Math.PI * 2); ctx.fill();
    if (roundel) ctx.drawImage(roundel, cx - d / 2, y, d, d);
    ctx.fillStyle = '#f01428';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.letterSpacing = `${h * 0.012}px`;
    fitFont(ctx, 'AIR CANADA', (sz) => `700 ${sz}px ${FONTS.sans}`, h * 0.2, w * 0.98);
    ctx.fillText('AIR CANADA', cx, y + h * 0.98);
    ctx.letterSpacing = '0px';
  };
}

// Air Canada tail fin: black swept fin with the red roundel.
export function drawAirCanadaTail(roundel) {
  return (ctx, x, y, w, h) => {
    const X = (u) => x + u * w, Y = (v) => y + v * h;
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.moveTo(X(0.02), Y(0.02));
    ctx.lineTo(X(0.2), Y(0.0));
    ctx.quadraticCurveTo(X(0.3), Y(0.0), X(0.36), Y(0.12));
    ctx.bezierCurveTo(X(0.5), Y(0.5), X(0.7), Y(0.75), X(0.97), Y(0.88));
    ctx.quadraticCurveTo(X(1.0), Y(0.9), X(0.98), Y(0.97));
    ctx.lineTo(X(0.13), Y(0.99));
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = w * 0.006;
    ctx.beginPath(); ctx.moveTo(X(0.12), Y(0.06)); ctx.lineTo(X(0.27), Y(0.97)); ctx.stroke();
    if (roundel) { const d = h * 0.6; ctx.drawImage(roundel, X(0.33) - d / 2, Y(0.6) - d / 2, d, d); }
  };
}

// The IBM bee: round eyes, teardrop wings, striped oval body. size = overall height.
export function drawRandBee(ctx, cx, cy, size, { wing = '#0b0b0b', head = '#0b0b0b', body = '#0b0b0b', stripe = '#1f70c1', stripes = 4 } = {}) {
  const s = size;
  ctx.fillStyle = head;
  [-1, 1].forEach((d) => { ctx.beginPath(); ctx.arc(cx + d * s * 0.1, cy - s * 0.42, s * 0.09, 0, Math.PI * 2); ctx.fill(); });
  ctx.fillStyle = wing;
  [-1, 1].forEach((d) => {
    ctx.save();
    ctx.translate(cx + d * s * 0.36, cy - s * 0.02);
    ctx.rotate(d * -0.35);
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.2, s * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(cx + d * s * 0.12, cy - s * 0.2);
    ctx.lineTo(cx + d * s * 0.3, cy - s * 0.15);
    ctx.lineTo(cx + d * s * 0.3, cy + s * 0.12);
    ctx.lineTo(cx + d * s * 0.12, cy + s * 0.1);
    ctx.fill();
  });
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy + s * 0.08, s * 0.16, s * 0.34, 0, 0, Math.PI * 2);
  ctx.fillStyle = body;
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = stripe;
  const top = cy + s * 0.08 - s * 0.34, step = (s * 0.68) / (stripes * 2 + 1);
  for (let i = 0; i < stripes; i++) ctx.fillRect(cx - s * 0.2, top + step * (i * 2 + 1), s * 0.4, step);
  ctx.restore();
}

// Simple drawn marks for teaching platforms (not official logo files).
function drawPlatform(ctx, kind, cx, cy, r) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (kind === 'youtube') {
    ctx.fillStyle = '#ff0033';
    ctx.beginPath();
    ctx.roundRect(cx - r, cy - r * 0.7, r * 2, r * 1.4, r * 0.38);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.28, cy - r * 0.38);
    ctx.lineTo(cx + r * 0.42, cy);
    ctx.lineTo(cx - r * 0.28, cy + r * 0.38);
    ctx.closePath();
    ctx.fill();
  } else {
    const [bg, label] = kind === 'udemy' ? ['#a435f0', 'udemy'] : ['#f01414', 'imooc'];
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(cx - r, cy - r * 0.7, r * 2, r * 1.4, r * 0.3);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    fitFont(ctx, label, (z) => `800 ${z}px ${FONTS.sans}`, r * 0.8, r * 1.7);
    ctx.fillText(label, cx, cy + r * 0.04);
  }
  ctx.restore();
}

function wrapLines(ctx, text, maxW) {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    const t = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(t).width > maxW) {
      lines.push(line);
      line = word;
    } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

const PAGE = { w: 1024, h: 1392, m: 96 };

export function bookCoverTexture(e) {
  return make(PAGE.w, PAGE.h, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    const ink = e.book.ink ?? '#ffffff';
    g.addColorStop(0, e.book.color);
    g.addColorStop(1, e.book.ink ? '#dfe3ea' : '#000000');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = e.book.ink ? 'rgba(15,98,254,0.15)' : 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, w - 80, h - 80);
    ctx.textAlign = 'center';
    if (e.book.wordmark) {
      // the logo already spells the name, so let it be the title
      drawLogo(ctx, e.book, w / 2, 560, 270);
    } else {
      drawLogo(ctx, e.book, w / 2, 470, 200);
      ctx.fillStyle = ink;
      fitFont(ctx, e.company.toUpperCase(), (s) => `${s}px ${FONTS.display}`, 110, w - 2 * PAGE.m);
      ctx.fillText(e.company.toUpperCase(), w / 2, 820);
    }
    ctx.fillStyle = ink;
    ctx.globalAlpha = 0.75;
    ctx.font = `700 34px ${FONTS.mono}`;
    ctx.fillText(e.title.toUpperCase(), w / 2, 900);
    ctx.fillText(e.years, w / 2, 950);
    ctx.globalAlpha = 1;
    ctx.fillStyle = e.book.accent;
    ctx.font = `700 28px ${FONTS.mono}`;
    ctx.fillText('WORK EXPERIENCE', w / 2, h - 110);
  });
}

export function bookSpineTexture(e) {
  return make(160, 1088, (ctx, w, h) => {
    ctx.fillStyle = e.book.color;
    ctx.fillRect(0, 0, w, h);
    drawLogo(ctx, e.book, w / 2, 120, 54);
    ctx.save();
    ctx.translate(w / 2, h / 2 + 60);
    ctx.rotate(Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = e.book.ink ?? '#ffffff';
    fitFont(ctx, e.company.toUpperCase(), (s) => `${s}px ${FONTS.display}`, 74, h - 360);
    ctx.fillText(e.company.toUpperCase(), 0, 0);
    ctx.restore();
    ctx.fillStyle = e.book.ink ?? '#ffffff';
    ctx.globalAlpha = 0.7;
    ctx.textAlign = 'center';
    ctx.font = `700 26px ${FONTS.mono}`;
    ctx.fillText(e.years.replace(' — ', '–').replace(/20(\d\d)$/, '$1'), w / 2, h - 60);
  });
}

function paperBase(ctx, w, h) {
  ctx.fillStyle = '#f7f1e3';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(120,90,40,0.05)';
  for (let y = 0; y < h; y += 6) ctx.fillRect(0, y, w, 1);
}

// Left page = inside of the front cover: company, dates and the role timeline.
export function bookLeftPageTexture(e, no = 1) {
  return make(PAGE.w, PAGE.h, (ctx, w, h) => {
    const { m } = PAGE;
    paperBase(ctx, w, h);
    ctx.fillStyle = '#5c616a';
    ctx.font = `700 30px ${FONTS.mono}`;
    ctx.fillText(`WORK EXPERIENCE · ${String(no).padStart(2, '0')}`, m, 150);
    drawLogo(ctx, e.book, w - m - 50, 138, 50, 'paper');
    ctx.fillStyle = '#141414';
    fitFont(ctx, e.company, (s) => `900 ${s}px ${FONTS.serif}`, 128, w - 2 * m);
    ctx.fillText(e.company, m, 300);
    ctx.fillStyle = '#3f444c';
    ctx.font = `500 38px ${FONTS.sans}`;
    ctx.fillText(e.via, m, 370);
    ctx.fillStyle = e.book.accent;
    ctx.font = `700 34px ${FONTS.mono}`;
    ctx.fillText(e.years, m, 425);
    ctx.fillStyle = '#141414';
    ctx.fillRect(m, 480, w - 2 * m, 4);
    ctx.fillStyle = '#5c616a';
    ctx.font = `700 28px ${FONTS.mono}`;
    ctx.fillText('ROLES', m, 560);
    const top = 640, gap = 190, x = m + 14;
    ctx.strokeStyle = '#c9c1ae';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, top + gap * (e.roles.length - 1));
    ctx.stroke();
    e.roles.forEach(([role, when], i) => {
      const y = top + i * gap;
      ctx.fillStyle = i === 0 ? e.book.accent : '#141414';
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#141414';
      fitFont(ctx, role, (s) => `700 ${s}px ${FONTS.sans}`, 52, w - 2 * m - 60);
      ctx.fillText(role, x + 50, y + 16);
      ctx.fillStyle = '#3f444c';
      ctx.font = `700 32px ${FONTS.mono}`;
      ctx.fillText(when, x + 50, y + 70);
    });
    if (e.facts?.length) {
      let fy = top + gap * (e.roles.length - 1) + 170;
      ctx.fillStyle = '#5c616a';
      ctx.font = `700 28px ${FONTS.mono}`;
      ctx.fillText('ENGAGEMENT', m, fy);
      fy += 30;
      for (const [k, v] of e.facts) {
        ctx.fillStyle = '#d8cfbb';
        ctx.fillRect(m, fy, w - 2 * m, 2);
        ctx.fillStyle = '#5c616a';
        ctx.font = `700 24px ${FONTS.mono}`;
        ctx.fillText(k, m, fy + 56);
        ctx.fillStyle = '#1d1d1f';
        fitFont(ctx, v, (s) => `500 ${s}px ${FONTS.sans}`, 34, w - 2 * m - 220);
        ctx.fillText(v, m + 220, fy + 58);
        fy += 92;
      }
    }
    ctx.fillStyle = '#7d7668';
    ctx.font = `700 24px ${FONTS.mono}`;
    ctx.fillText(e.product.toUpperCase(), m, h - 90);
  });
}

// Right page = top page of the block: highlights and stack.
export function bookRightPageTexture(e) {
  return make(PAGE.w, PAGE.h, (ctx, w, h) => {
    const { m } = PAGE;
    paperBase(ctx, w, h);
    ctx.fillStyle = '#5c616a';
    ctx.font = `700 30px ${FONTS.mono}`;
    ctx.fillText('HIGHLIGHTS', m, 150);
    // pick the largest text size at which highlights + stack still fit on the page
    let size = 40;
    const measure = (fs) => {
      ctx.font = `500 ${fs}px ${FONTS.sans}`;
      const lh = fs * 1.4, gap = fs * 0.85;
      let hh = 0;
      for (const item of e.highlights) hh += wrapLines(ctx, item, w - 2 * m - 50).length * lh + gap;
      ctx.font = `500 ${Math.min(38, fs)}px ${FONTS.sans}`;
      const stackLines = wrapLines(ctx, e.stack, w - 2 * m).length;
      return 240 + hh + 30 + 80 + 70 + stackLines * 54;
    };
    while (size > 28 && measure(size) > h - 140) size -= 2;
    const lh = size * 1.4, gap = size * 0.85;
    let y = 240;
    ctx.font = `500 ${size}px ${FONTS.sans}`;
    for (const item of e.highlights) {
      ctx.fillStyle = e.book.accent;
      ctx.fillRect(m, y - size * 0.65, 16, 16);
      ctx.fillStyle = '#1d1d1f';
      for (const line of wrapLines(ctx, item, w - 2 * m - 50)) {
        ctx.fillText(line, m + 44, y);
        y += lh;
      }
      y += gap;
    }
    y += 30;
    ctx.fillStyle = '#141414';
    ctx.fillRect(m, y, w - 2 * m, 4);
    y += 80;
    ctx.fillStyle = '#5c616a';
    ctx.font = `700 30px ${FONTS.mono}`;
    ctx.fillText('STACK', m, y);
    y += 70;
    ctx.fillStyle = '#1d1d1f';
    ctx.font = `500 ${Math.min(38, size)}px ${FONTS.sans}`;
    for (const line of wrapLines(ctx, e.stack, w - 2 * m)) {
      ctx.fillText(line, m, y);
      y += 54;
    }
    ctx.fillStyle = '#7d7668';
    ctx.font = `700 24px ${FONTS.mono}`;
    ctx.textAlign = 'right';
    ctx.fillStyle = e.feature ? e.book.accent : '#7d7668';
    ctx.fillText(e.feature ? 'TURN THE PAGE  →' : '— 01 —', w - m, h - 90);
  });
}

// Second spread, left page: the featured project as problem → approach.
export function bookFeatureLeftTexture(e) {
  return make(PAGE.w, PAGE.h, (ctx, w, h) => {
    const { m } = PAGE;
    const f = e.feature;
    paperBase(ctx, w, h);
    ctx.fillStyle = e.book.accent;
    ctx.font = `700 30px ${FONTS.mono}`;
    ctx.fillText('FEATURED PROJECT', m, 150);
    ctx.fillStyle = '#141414';
    fitFont(ctx, f.title, (s) => `900 ${s}px ${FONTS.serif}`, 120, w - 2 * m);
    ctx.fillText(f.title, m, 290);
    ctx.fillStyle = '#3f444c';
    ctx.font = `500 36px ${FONTS.sans}`;
    ctx.fillText(f.subtitle, m, 355);
    ctx.fillStyle = '#141414';
    ctx.fillRect(m, 410, w - 2 * m, 4);
    let y = 500;
    for (const [label, text] of [['THE PROBLEM', f.problem], ['WHAT I DID', f.approach]]) {
      ctx.fillStyle = '#5c616a';
      ctx.font = `700 28px ${FONTS.mono}`;
      ctx.fillText(label, m, y);
      y += 66;
      ctx.fillStyle = '#1d1d1f';
      ctx.font = `500 38px ${FONTS.sans}`;
      for (const line of wrapLines(ctx, text, w - 2 * m)) {
        ctx.fillText(line, m, y);
        y += 54;
      }
      y += 60;
    }
    ctx.fillStyle = '#7d7668';
    ctx.font = `700 24px ${FONTS.mono}`;
    ctx.fillText('←  BACK', m, h - 90);
  });
}

// A screenshot drawn as a rounded "phone card" with a soft shadow, cover-fitted.
function drawShot(ctx, img, x, y, w, h) {
  ctx.save();
  ctx.shadowColor = 'rgba(40,30,10,0.25)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 26);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 26);
  ctx.clip();
  if (img) {
    const s = Math.max(w / img.width, h / img.height);
    ctx.drawImage(img, x + (w - img.width * s) / 2, y + (h - img.height * s) / 2, img.width * s, img.height * s);
  } else {
    ctx.fillStyle = 'rgba(20,20,20,0.06)';
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(20,20,20,0.12)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 26);
  ctx.stroke();
}

function pageFooter(ctx, text, color, align = 'right') {
  ctx.fillStyle = color;
  ctx.font = `700 24px ${FONTS.mono}`;
  ctx.textAlign = align;
  ctx.fillText(text, align === 'right' ? PAGE.w - PAGE.m : PAGE.m, PAGE.h - 90);
  ctx.textAlign = 'left';
}

// Second spread, right page: impact numbers in a row, then the two key screens.
export function bookFeatureRightTexture(e, imgs = [], { clients = [], linkedin = '' } = {}) {
  return make(PAGE.w, PAGE.h, (ctx, w) => {
    const { m } = PAGE;
    paperBase(ctx, w, PAGE.h);
    ctx.fillStyle = '#5c616a';
    ctx.font = `700 30px ${FONTS.mono}`;
    ctx.fillText('IMPACT', m, 150);
    const metrics = e.feature.metrics, colW = (w - 2 * m) / metrics.length;
    metrics.forEach(([value, label], i) => {
      const x = m + i * colW;
      ctx.fillStyle = e.book.accent;
      fitFont(ctx, value, (s) => `${s}px ${FONTS.display}`, 64, colW - 40);
      ctx.fillText(value, x, 250);
      ctx.fillStyle = '#1d1d1f';
      ctx.font = `500 28px ${FONTS.sans}`;
      wrapLines(ctx, label, colW - 24).forEach((line, k) => ctx.fillText(line, x, 300 + k * 36));
    });
    if (clients.length) {
      // client engagements or teaching platforms as cards
      ctx.fillStyle = '#5c616a';
      ctx.font = `700 30px ${FONTS.mono}`;
      ctx.fillText(e.feature.cards ? 'PLATFORMS' : 'CLIENTS', m, 450);
      const ch = clients.length > 2 ? 196 : 230;
      clients.forEach((c, i) => {
        const y = 490 + i * (ch + 24);
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.roundRect(m, y, w - 2 * m, ch, 26);
        ctx.fill();
        ctx.strokeStyle = 'rgba(20,20,20,0.12)';
        ctx.lineWidth = 2;
        ctx.stroke();
        if (c.book) drawLogo(ctx, c.book, m + 110, y + ch / 2, 70, 'paper');
        else drawPlatform(ctx, c.platform, m + 110, y + ch / 2, 70);
        const ty = y + ch / 2 - 30;
        ctx.fillStyle = '#141414';
        ctx.font = `900 52px ${FONTS.serif}`;
        ctx.fillText(c.name, m + 220, ty);
        ctx.fillStyle = c.book ? c.book.accent : e.book.accent;
        ctx.font = `700 26px ${FONTS.mono}`;
        ctx.fillText(c.years, m + 220, ty + 44);
        ctx.fillStyle = '#3f444c';
        fitFont(ctx, c.line, (z) => `500 ${z}px ${FONTS.sans}`, 30, w - 2 * m - 250);
        ctx.fillText(c.line, m + 220, ty + 88);
      });
    } else if (e.feature.screens?.length) {
      const shots = e.feature.screens.map((i) => imgs[i]).slice(0, 2);
      const gap = 44, sh = 820, sw = Math.round(sh * 0.4615);
      const total = shots.length * sw + (shots.length - 1) * gap;
      shots.forEach((img, i) => drawShot(ctx, img, (w - total) / 2 + i * (sw + gap), 400, sw, sh));
    } else {
      // nothing visual to show: the tech stack as large tags
      ctx.fillStyle = '#5c616a';
      ctx.font = `700 30px ${FONTS.mono}`;
      ctx.fillText('BUILT WITH', m, 450);
      ctx.font = `700 46px ${FONTS.sans}`;
      let x = m, y = 510;
      e.stack.split('·').map((t) => t.trim()).filter(Boolean).forEach((tag, i) => {
        const tw = ctx.measureText(tag).width + 76;
        if (x + tw > w - m) {
          x = m;
          y += 124;
        }
        ctx.fillStyle = i % 3 === 0 ? e.book.accent : 'rgba(255,255,255,0.8)';
        ctx.beginPath();
        ctx.roundRect(x, y, tw, 96, 48);
        ctx.fill();
        ctx.strokeStyle = i % 3 === 0 ? e.book.accent : 'rgba(20,20,20,0.18)';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = i % 3 === 0 ? '#ffffff' : '#1d1d1f';
        ctx.fillText(tag, x + 38, y + 64);
        x += tw + 22;
      });
    }
    if (e.screens?.length) pageFooter(ctx, `${e.screensLabel ?? 'ALL SCREENS'}  →`, e.book.accent);
    else if (linkedin) {
      // last page of the book: hand off to LinkedIn
      const h = PAGE.h;
      ctx.fillStyle = '#141414';
      ctx.fillRect(m, h - 195, w - 2 * m, 4);
      ctx.font = `700 30px ${FONTS.mono}`;
      ctx.fillText('FULL HISTORY ON LINKEDIN  ↗', m, h - 135);
      ctx.fillStyle = '#3f444c';
      ctx.font = `500 32px ${FONTS.sans}`;
      ctx.fillText(linkedin, m, h - 88);
    }
  });
}

// Third spread: a 2×2 gallery of product screens on each page.
export function bookGalleryTexture(e, imgs, side, linkedin) {
  return make(PAGE.w, PAGE.h, (ctx, w, h) => {
    const { m } = PAGE;
    paperBase(ctx, w, h);
    // up to 4 screens: split evenly across the spread; more: 4 on the left, the rest on the right
    const leftCount = imgs.length <= 4 ? Math.ceil(imgs.length / 2) : 4;
    const list = side === 'left' ? imgs.slice(0, leftCount) : imgs.slice(leftCount, leftCount + 4);
    if (side === 'left') {
      ctx.fillStyle = e.book.accent;
      ctx.font = `700 30px ${FONTS.mono}`;
      ctx.fillText(e.screensLabel ?? 'SCREENS', m, 150);
      ctx.fillStyle = '#141414';
      ctx.font = `900 64px ${FONTS.serif}`;
      ctx.fillText(e.product, m, 225);
      if (e.screensNote) {
        ctx.fillStyle = '#5c616a';
        ctx.font = `500 28px ${FONTS.sans}`;
        ctx.fillText(e.screensNote, m, 268);
      }
    }
    const top = side === 'left' ? (e.screensNote ? 320 : 280) : 130;
    const bottom = side === 'left' ? h - 150 : h - 260;
    const gap = 36;
    if (list.length <= 2) {
      // a short page gets one larger row instead of a half-empty grid
      const sw = Math.min(Math.round((bottom - top) * 0.4615), Math.floor((w - 2 * m - gap) / 2));
      const sh = Math.round(sw / 0.4615);
      const total = list.length * sw + (list.length - 1) * gap;
      list.forEach((img, i) => drawShot(ctx, img, (w - total) / 2 + i * (sw + gap), top + (bottom - top - sh) / 2, sw, sh));
    } else {
      const sh = Math.floor((bottom - top - gap) / 2), sw = Math.round(sh * 0.4615);
      const gx = (w - (2 * sw + gap)) / 2;
      list.forEach((img, i) => drawShot(ctx, img, gx + (i % 2) * (sw + gap), top + Math.floor(i / 2) * (sh + gap), sw, sh));
    }
    if (side === 'left') {
      pageFooter(ctx, '←  BACK', '#7d7668', 'left');
      return;
    }
    ctx.fillStyle = '#7d7668';
    ctx.font = `500 26px ${FONTS.sans}`;
    ctx.fillText(e.screensCredit ?? '', m, h - 220);
    ctx.fillStyle = '#141414';
    ctx.fillRect(m, h - 195, w - 2 * m, 4);
    ctx.font = `700 30px ${FONTS.mono}`;
    ctx.fillText('FULL HISTORY ON LINKEDIN  ↗', m, h - 135);
    ctx.fillStyle = '#3f444c';
    ctx.font = `500 32px ${FONTS.sans}`;
    ctx.fillText(linkedin, m, h - 88);
  });
}
