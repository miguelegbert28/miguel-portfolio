/* ==========================================================================
   ASSET_BASE — where the images, video frames and 3D model are hosted.
   CHANGE THIS if your GitHub user/repo/branch differ. It must end with "/"
   and point at the repo's docs/assets/ folder. Tip: after tagging a release,
   use @v1.0.0 instead of @main so jsDelivr serves a fixed, cached version.
   ========================================================================== */
const ASSET_BASE = window.MED_ASSET_BASE || 'https://cdn.jsdelivr.net/gh/miguelegbert28/miguel-portfolio@main/docs/assets/';
const BOOKING_URL = 'https://crm.ladder.marketing/widget/booking/HqxAEbyGBtNWSgSNa52w';

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.186.1/+esm';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/loaders/GLTFLoader.js/+esm';
import { DRACOLoader } from 'https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/loaders/DRACOLoader.js/+esm';
import { RoomEnvironment } from 'https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/environments/RoomEnvironment.js/+esm';
import Lenis from 'https://cdn.jsdelivr.net/npm/lenis@1.3.27/+esm';

const root = document.getElementById('med-portfolio');
if (root && !root.dataset.init) { root.dataset.init = '1'; init(); }

function init() {
const A = (p) => ASSET_BASE + p;
const $ = (s) => root.querySelector(s);
const $$ = (s) => [...root.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t) => t * t * (3 - 2 * t);
const mq = (q) => window.matchMedia(q).matches;
const REDUCED = mq('(prefers-reduced-motion: reduce)');
const MOBILE = mq('(max-width: 820px)') || mq('(hover: none) and (pointer: coarse)');
const MODE = REDUCED ? 'static' : MOBILE ? 'video' : 'frames';
const FRAMES = { count: 122, hi: 'frames/1280', lo: 'frames/960', poster: 'img/poster_1280.webp' };
root.classList.add('med-js');
root.dataset.mode = MODE;
$$('[data-src]').forEach((im) => { im.src = A(im.dataset.src); });

/* smooth scroll + nav (no hash routing, so GHL can't hijack it) */
let lenis = null;
if (!REDUCED) lenis = new Lenis({ lerp: 0.075, wheelMultiplier: 0.9, smoothWheel: true });
$$('[data-target]').forEach((a) => a.addEventListener('click', (e) => {
  e.preventDefault();
  const id = a.dataset.target;
  const el = id === 'top' ? root : document.getElementById(id);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: id === 'med-process' ? -90 : 0, duration: 1.8 });
  else el.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
}));

/* hero */
const hero = $('#med-hero');
const sticky = $('#med-hero-sticky');
const canvas = $('.med-hero-canvas');
const ctx = canvas.getContext('2d');
const cutCanvas = $('.hero-cutout');
const cutCtx = cutCanvas.getContext('2d');
const video = $('.hero-video');
const headline = $('.headline');
const intro = $('.hero-intro');
const header = $('#med-header');
const hint = $('.scroll-hint');
const stories = $$('.story');
const STORY_CENTERS = [0.17, 0.35, 0.53, 0.71];
const STORY_HALF = 0.088;
const frames = new Array(FRAMES.count);
const poster = new Image(); poster.src = A(FRAMES.poster);
const cutSrc = new Image();
cutSrc.src = A(innerWidth > 1300 ? 'img/cutout_frame_1920.webp' : 'img/cutout_frame_1280.webp');
video.poster = A(FRAMES.poster);

function loadFrames() {
  const dir = innerWidth * Math.min(devicePixelRatio || 1, 1.5) > 1100 ? FRAMES.hi : FRAMES.lo;
  const order = [];
  for (let step = 16; step >= 1; step /= 2) for (let i = 0; i < FRAMES.count; i += step) if (!order.includes(i)) order.push(i);
  let k = 0;
  const next = () => {
    if (k >= order.length) return;
    const i = order[k++]; const im = new Image();
    im.decoding = 'async';
    im.onload = () => { frames[i] = im; next(); }; im.onerror = next;
    im.src = A(`${dir}/f_${String(i + 1).padStart(3, '0')}.webp`);
  };
  for (let c = 0; c < 6; c++) next();
}
function nearestFrame(i) {
  if (frames[i]) return frames[i];
  for (let d = 1; d < FRAMES.count; d++) { if (frames[i - d]) return frames[i - d]; if (frames[i + d]) return frames[i + d]; }
  return poster.complete ? poster : null;
}
let dirty = true;
function sizeCanvases() {
  const dpr = Math.min(devicePixelRatio || 1, MODE === 'frames' ? 1.5 : 1.25);
  for (const c of [canvas, cutCanvas]) { c.width = Math.round(innerWidth * dpr); c.height = Math.round(innerHeight * dpr); }
  dirty = true;
}
function drawCover(c, g, img, zoom, panX) {
  if (!img || !img.width) return;
  const cw = c.width, ch = c.height;
  const s = Math.max(cw / img.width, ch / img.height) * zoom;
  const w = img.width * s, h = img.height * s;
  const maxShift = Math.max(0, (w - cw) / 2);
  const x = (cw - w) / 2 + clamp(panX * cw * 0.16, -maxShift, maxShift);
  const y = (ch - h) / 2 + (zoom - 1) * h * 0.06;
  g.clearRect(0, 0, cw, ch); g.drawImage(img, x, y, w, h);
}
let target = 0, prog = 0, lastFrame = -1, pan = 0, zoom = 1;
function heroProgress() { const r = hero.getBoundingClientRect(); return clamp(-r.top / (r.height - innerHeight)); }
if (MODE === 'frames') loadFrames();
if (MODE === 'video') {
  canvas.style.display = 'none'; video.style.display = 'block';
  video.src = A('video/hero_loop.mp4'); video.preload = 'auto'; video.load();
}

/* sticky fallback: some page builders put overflow:hidden on a parent, which breaks position:sticky */
let pinMode = 'sticky';
function pinHero() {
  const r = hero.getBoundingClientRect();
  if (pinMode === 'sticky') {
    if (r.top < -40 && r.bottom > innerHeight + 40 && Math.abs(sticky.getBoundingClientRect().top) > 4) pinMode = 'js';
    else return;
  }
  sticky.classList.toggle('med-pin-fixed', r.top <= 0 && r.bottom > innerHeight);
  sticky.classList.toggle('med-pin-end', r.bottom <= innerHeight);
}

/* 3D automation core */
const zone = $('.three-zone');
const panels = $$('.panel');
const cta = $('#med-contact');
const coreCanvas = $('.core-canvas');
const fallback = $('.core-fallback');
let three = null, pulse = 0;
const io = new IntersectionObserver((ents) => ents.forEach((e) => {
  if (e.isIntersecting && !e.target.classList.contains('in')) { e.target.classList.add('in'); pulse = 1; }
  else if (e.isIntersecting) pulse = Math.max(pulse, 0.6);
}), { threshold: MOBILE ? 0.12 : 0.3 });
panels.forEach((p) => io.observe(p));
function webglOK() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } }
function initThree() {
  const renderer = new THREE.WebGLRenderer({ canvas: coreCanvas, antialias: !MOBILE, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, MOBILE ? 1.25 : 1.75));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  const camera = new THREE.PerspectiveCamera(32, innerWidth / innerHeight, 0.1, 100); camera.position.set(0, 0.2, 9);
  const key = new THREE.DirectionalLight(0xdff6ff, 2.2); key.position.set(4, 5, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0x29d3f2, 3.0); rim.position.set(-6, 1, -4); scene.add(rim);
  const fill = new THREE.PointLight(0x29d3f2, 6, 8, 2); scene.add(fill);
  const rig = new THREE.Group(); scene.add(rig);
  const spin = new THREE.Group(); rig.add(spin);
  const emissive = [], gears = [];
  const draco = new DRACOLoader().setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/libs/draco/gltf/');
  new GLTFLoader().setDRACOLoader(draco).load(A('model/automation_core.glb'), (gltf) => {
    const r0 = gltf.scene; const cache = {};
    r0.traverse((o) => {
      if (/Gear/.test(o.name) && o.isMesh) gears.push(o);
      if (!o.isMesh) return;
      const name = o.material.name || '';
      if (!cache[name]) {
        let nm = o.material;
        if (name.includes('BrushedSteel')) nm = new THREE.MeshPhysicalMaterial({ color: 0xa3a9b0, metalness: 1, roughness: 0.3, anisotropy: 0.75, anisotropyRotation: Math.PI / 2, clearcoat: 0.2 });
        else if (name.includes('Graphite')) nm = new THREE.MeshPhysicalMaterial({ color: 0x15181c, metalness: 0.9, roughness: 0.42, anisotropy: 0.5 });
        else if (name.includes('FrostedGlass')) nm = MOBILE
          ? new THREE.MeshPhysicalMaterial({ color: 0xbfe9f4, roughness: 0.25, transparent: true, opacity: 0.28, depthWrite: false })
          : new THREE.MeshPhysicalMaterial({ color: 0xd9f4fb, roughness: 0.32, transmission: 1, thickness: 0.25, ior: 1.45, attenuationColor: new THREE.Color(0x8fdcf0), attenuationDistance: 1.2, transparent: true });
        else if (name.includes('Emissive')) {
          const base = name.includes('Core') ? 4.2 : name.includes('Node') ? 3.2 : 2.4;
          const col = name.includes('Core') ? 0xcff6ff : name.includes('Node') ? 0x9ff0ff : 0x29d3f2;
          nm = new THREE.MeshStandardMaterial({ color: 0x0a1418, emissive: col, emissiveIntensity: base, roughness: 0.4 });
          nm.userData.base = base; emissive.push(nm);
        }
        cache[name] = nm;
      }
      o.material = cache[name];
    });
    const sph = new THREE.Box3().setFromObject(r0).getBoundingSphere(new THREE.Sphere());
    r0.position.sub(sph.center); spin.scale.setScalar(2.05 / sph.radius); spin.add(r0);
    three.ready = true;
  }, undefined, () => { three = null; fallback.style.display = 'block'; });
  three = { renderer, scene, camera, rig, spin, emissive, gears, fill, ready: false, cur: { x: 2, y: 0, s: 0.6, op: 0, rx: 0.3, ry: 0 } };
}
if (!REDUCED && webglOK()) initThree(); else fallback.style.display = 'block';

function sectionTargets() {
  if (MOBILE) return [{ x: 0.9, y: 1.2, s: 0.62 }, { x: -0.9, y: 1.2, s: 0.55 }, { x: 0.9, y: 1.3, s: 0.6 }];
  const X = Math.min(2.2, 1.25 * (innerWidth / innerHeight));
  return [{ x: X, y: 0, s: 0.86 }, { x: -X, y: 0.05, s: 0.72 }, { x: X * 1.02, y: -0.05, s: 0.8 }];
}
function zoneState() {
  const vh = innerHeight;
  const centers = panels.map((p) => { const r = p.getBoundingClientRect(); return r.top + r.height / 2 - vh / 2; });
  let s = 0;
  if (centers[0] >= 0) s = -centers[0] / (panels[0].offsetHeight * 0.9);
  else if (centers.at(-1) <= 0) s = centers.length - 1 - centers.at(-1) / panels.at(-1).offsetHeight;
  else for (let i = 0; i < centers.length - 1; i++) if (centers[i] <= 0 && centers[i + 1] > 0) { s = i - centers[i] / (centers[i + 1] - centers[i]); break; }
  const fadeIn = clamp((vh - zone.getBoundingClientRect().top) / (vh * 0.7));
  const fadeOut = clamp((cta.getBoundingClientRect().top - vh * 0.45) / (vh * 0.45));
  return { s, op: smooth(fadeIn) * smooth(fadeOut) * (MOBILE ? 0.32 : 1), out: 1 - fadeOut };
}
function fitHeadline() {
  headline.style.fontSize = '100px';
  const w = headline.scrollWidth || 1;
  headline.style.fontSize = `${Math.floor((100 * innerWidth * 0.9) / w)}px`;
}
function onResize() {
  fitHeadline(); sizeCanvases();
  if (three) { three.renderer.setSize(innerWidth, innerHeight, false); three.camera.aspect = innerWidth / innerHeight; three.camera.updateProjectionMatrix(); }
}
addEventListener('resize', onResize); onResize();
document.fonts && document.fonts.ready.then(fitHeadline);
[poster, cutSrc].forEach((im) => im.addEventListener('load', () => (dirty = true)));

let last = performance.now(), time = 0;
function raf(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now; time += dt;
  if (lenis) lenis.raf(now);
  pinHero();
  target = heroProgress();
  prog += (target - prog) * (REDUCED ? 1 : 1 - Math.exp(-dt / 0.22));
  if (Math.abs(target - prog) < 0.00005) prog = target;
  const p = prog;
  const io_ = 1 - smooth(clamp(p / 0.045)), blur = (1 - io_) * 14;
  intro.style.opacity = io_; intro.style.filter = REDUCED ? '' : `blur(${blur}px)`; intro.style.pointerEvents = io_ < 0.5 ? 'none' : '';
  headline.style.opacity = io_; headline.style.filter = REDUCED ? '' : `blur(${blur}px)`;
  headline.style.transform = `translateX(-50%) translateY(${-p * 600}px) scale(${1 + (1 - io_) * 0.04})`;
  cutCanvas.style.opacity = io_; hint.style.opacity = io_;
  const pastHero = hero.getBoundingClientRect().bottom <= innerHeight * 0.5;
  const hOp = pastHero ? 1 : io_;
  header.style.opacity = hOp; header.style.filter = REDUCED || hOp > 0.99 ? '' : `blur(${(1 - hOp) * 10}px)`;
  header.style.pointerEvents = hOp < 0.4 ? 'none' : '';
  header.classList.toggle('scrolled', pastHero);
  const rootR = root.getBoundingClientRect();
  header.style.visibility = rootR.bottom < 60 || rootR.top > innerHeight ? 'hidden' : '';

  let panT = 0, zoomT = 1;
  stories.forEach((el, i) => {
    const t = (p - STORY_CENTERS[i]) / STORY_HALF, o = clamp((1 - Math.abs(t)) * 2.6);
    const side = el.dataset.side === 'right' ? 1 : -1;
    el.style.opacity = o;
    if (!REDUCED) {
      el.style.filter = `blur(${(1 - o) * 8}px)`;
      el.style.transform = MOBILE ? `translateY(${t * -24}px)` : `translateY(calc(-50% + ${t * -60}px))`;
      el.firstElementChild.style.transform = `translateY(${t * -26}px) rotate(${t * 4}deg)`;
    }
    panT += -side * o; zoomT = Math.max(zoomT, 1 + 0.32 * o);
  });
  if (MODE === 'frames') {
    pan += (panT - pan) * (1 - Math.exp(-dt / 0.35)); zoom += (zoomT - zoom) * (1 - Math.exp(-dt / 0.35));
    const fi = Math.round(clamp(p / 0.94) * (FRAMES.count - 1));
    if (fi !== lastFrame || dirty || Math.abs(panT - pan) > 0.0005 || Math.abs(zoomT - zoom) > 0.0005) { drawCover(canvas, ctx, nearestFrame(fi), zoom, pan); lastFrame = fi; }
  } else if (MODE === 'video') {
    if (p > 0.012 && video.paused) video.play().catch(() => {});
    else if (p < 0.002 && !video.paused) { video.pause(); video.currentTime = 0; }
  } else if (MODE === 'static' && dirty) drawCover(canvas, ctx, poster, 1, 0);
  if (dirty && cutSrc.complete) drawCover(cutCanvas, cutCtx, cutSrc, 1, 0);
  dirty = false;

  const z = zoneState();
  if (three) {
    const tg = sectionTargets();
    const s = clamp(z.s, -1, 2.999);
    const i0 = Math.max(0, Math.floor(s)), i1 = Math.min(2, i0 + 1), f = s < 0 ? 0 : smooth(clamp(s - i0));
    const a = tg[i0], b = tg[i1], c = three.cur, kk = 1 - Math.exp(-dt / 0.45);
    const tx = a.x + (b.x - a.x) * f;
    const ty = a.y + (b.y - a.y) * f + (s < 0 ? s * 1.4 : 0) - z.out * 0.6;
    const ts = (a.s + (b.s - a.s) * f) * (0.75 + 0.25 * z.op) * (1 - z.out * 0.35);
    c.x += (tx - c.x) * kk; c.y += (ty - c.y) * kk; c.s += (ts - c.s) * kk;
    c.op += (z.op - c.op) * (1 - Math.exp(-dt / 0.25));
    if (z.op < c.op) c.op = Math.max(z.op, c.op - dt * 1.5);
    if (z.op === 0 && c.op < 0.01) c.op = 0;
    c.ry += ((s * 2.1 + time * 0.12) - c.ry) * kk; c.rx += ((0.32 + Math.sin(s * 1.7) * 0.25) - c.rx) * kk;
    coreCanvas.style.opacity = c.op.toFixed(3);
    if (c.op > 0.002 && three.ready) {
      three.rig.position.set(c.x, c.y, 0); three.rig.scale.setScalar(c.s);
      three.rig.rotation.set(c.rx, c.ry, Math.sin(time * 0.3) * 0.04);
      three.gears.forEach((g, idx) => g.rotateY(dt * (idx < 3 ? (idx % 2 ? 0.05 : -0.04) : (idx % 2 ? 0.35 : -0.28))));
      pulse *= Math.exp(-dt * 1.3);
      const glow = 0.75 + pulse * 1.8 + Math.sin(time * 2.2) * 0.12;
      three.emissive.forEach((m) => (m.emissiveIntensity = m.userData.base * glow));
      three.fill.intensity = 4 + pulse * 10;
      three.renderer.render(three.scene, three.camera);
    }
  } else if (fallback.style.display === 'block') {
    const right = Math.round(clamp(z.s, 0, 2)) % 2 === 0;
    fallback.style.opacity = (z.op * 0.9).toFixed(3);
    fallback.style.left = right ? 'auto' : '5vw'; fallback.style.right = right ? '5vw' : 'auto';
  }
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);
}
