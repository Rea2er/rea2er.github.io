import { profile, workCategories } from './content.js';
import { createWorkpage } from './workpage.js';

const $ = (s, el = document) => el.querySelector(s);
const pad = (n) => String(n).padStart(2, '0');

const views = {
  about: () => `
    <p class="eyebrow">01 / BASIC INFORMATION</p>
    <h2 class="display one-line">ABOUT ME</h2>
    <p class="subtitle">Basic information · ${profile.role}</p>
    <dl class="fields">${profile.fields.map(([k, v, url]) => `<div><dt>${k}</dt><dd>${url ? `<a href="${url}" target="_blank" rel="noopener">${v} ↗</a>` : v}</dd></div>`).join('')}</dl>
    <p class="bio">${profile.bio}</p>
    <div class="tags">${profile.tags.map((t) => `<span>${t}</span>`).join('')}</div>`,

};

export function createUI(h) {
  const panel = $('#panel');
  const body = $('.panel-body', panel);
  const toastEl = $('#toast');
  const tip = $('#tip');
  const hint = $('#hint');
  const status = $('#status');
  let toastTimer;

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 2600);
  }

  function setActiveNav(id) {
    document.querySelectorAll('[data-go]').forEach((b) => b.classList.toggle('is-active', b.dataset.go === id));
  }

  function openPanel(id) {
    body.innerHTML = views[id]();
    body.scrollTop = 0;
    panel.dataset.kind = id;
    requestAnimationFrame(() => panel.classList.add('is-open'));
    setActiveNav(id);
  }

  function closePanel() {
    panel.classList.remove('is-open');
    setActiveNav(null);
  }

  // Shared pager for anything with pages (skill cards, book spreads): a counter and arrows under it.
  const pagerEl = $('#pager');
  function pager(show, i = 0, n = 0, wrap = true) {
    pagerEl.classList.toggle('is-on', show);
    if (!show) return;
    $('.sp-count', pagerEl).textContent = `${pad(i + 1)} / ${pad(n)}`;
    $('.sp-dots', pagerEl).innerHTML = Array.from({ length: n }, (_, k) => `<i class="${k === i ? 'is-on' : ''}"></i>`).join('');
    $('[data-sp="prev"]', pagerEl).disabled = !wrap && i === 0;
    $('[data-sp="next"]', pagerEl).disabled = !wrap && i === n - 1;
  }
  $('[data-sp="prev"]', pagerEl).addEventListener('click', () => h.onStep(-1));
  $('[data-sp="next"]', pagerEl).addEventListener('click', () => h.onStep(1));

  panel.addEventListener('click', (e) => {
    if (e.target.closest('.close')) return h.onClose();
  });
  /* contact: the visitor types straight onto the paper in the typewriter */
  const LINKEDIN = 'https://www.linkedin.com/in/ruizenie';
  const noteBar = $('#note-bar');
  const noteIn = $('#note-input');
  let caretOn = true, caretTimer = 0;
  const redraw = () => h.onNote(noteIn.value, caretOn);
  function note(show) {
    noteBar.classList.toggle('is-on', show);
    clearInterval(caretTimer);
    if (!show) { noteIn.blur(); return; }
    caretTimer = setInterval(() => { caretOn = !caretOn; redraw(); }, 530);
    noteIn.focus({ preventScroll: true });
    redraw();
  }
  noteIn.addEventListener('input', () => { caretOn = true; redraw(); h.onNoteKey(); });
  // Notes aren't delivered anywhere: copy the note and open LinkedIn so the visitor can paste it in a
  // message. The tab has to open inside the click (popup blockers), so the send animation plays behind it.
  $('[data-note="send"]', noteBar).addEventListener('click', async () => {
    const text = noteIn.value.trim();
    if (!text) { toast('Type your note on the paper first'); noteIn.focus(); return; }
    const copied = navigator.clipboard?.writeText(text).then(() => true, () => false) ?? Promise.resolve(false);
    window.open(LINKEDIN, '_blank', 'noopener');
    await h.onNoteSend(text);
    noteIn.value = '';
    redraw();
    toast((await copied) ? 'Note copied: paste it in a LinkedIn message to me' : 'Opened LinkedIn: message me there');
  });

  document.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => h.onNav(b.dataset.go)));
  $('[data-action="home"]').addEventListener('click', h.onHome);
  $('[data-action="close-locker"]').addEventListener('click', h.onCloseLocker);
  $('.bare-close').addEventListener('click', () => h.onClose());

  /* ---------- work pages (one layout per category, see workpage.js) ---------- */
  const work = createWorkpage();
  function openWork(id) {
    const idx = workCategories.findIndex((c) => c.id === id);
    work.open(workCategories[idx], idx);
  }

  return {
    toast,
    openPanel,
    closePanel,
    openWork,
    pager,
    note,
    focusNote: () => noteIn.focus({ preventScroll: true }),
    // Focus without a side panel (the work folders): just a close button and the nav highlight.
    bare(id) {
      document.body.classList.toggle('is-bare', !!id);
      if (id) setActiveNav(id);
      else if (!panel.classList.contains('is-open')) setActiveNav(null);
    },
    closeWork: work.close,
    setNav: setActiveNav,
    isWorkOpen: work.isOpen,
    setStatus: (t) => { status.textContent = t; },
    tip(text, x, y) {
      tip.classList.toggle('is-on', !!text);
      if (text) {
        tip.textContent = text;
        tip.style.transform = `translate(${x + 16}px, ${y + 16}px)`;
      }
    },
    hint(visible, x = 0, y = 0) {
      hint.classList.toggle('is-on', visible);
      if (visible) hint.style.transform = `translate(${x}px, ${y}px)`;
    },
  };
}
