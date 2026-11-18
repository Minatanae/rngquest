// Heroes are PixelLab sprites (assets/heroes); scenery, enemies and icons are still drawn in code, with soft lighting on top.
import { FLOORS, RARITY, HERO_ART, ENEMY_ART, ENEMY_SCALE, HERO_SCALE, ENV_ART } from './data.js';
import { findHero, heroStats } from './game.js';
import { ICONS } from './art.js';
import { paintEnemy, ENEMY_SIZE } from './enemy-art.js';

const cache = new Map();
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const rgbOf = c => { if (c[0] !== '#') return c.match(/\d+/g).slice(0, 3).map(Number); const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
export function shade(hex, f) { return `rgb(${rgbOf(hex).map(v => Math.max(0, Math.min(255, Math.round(v * f)))).join(',')})`; }
const rgba = (hex, a) => `rgba(${rgbOf(hex).join(',')},${a})`;
const hash = n => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };
const INK = '#0e0b14';

// 1px dark outline around a sprite (canvas grows by 2px each way)
function outlined(src) {
  const w = src.width, h = src.height, c = mk(w + 2, h + 2), x = c.getContext('2d');
  const d = src.getContext('2d').getImageData(0, 0, w, h).data;
  x.fillStyle = INK;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (d[(j * w + i) * 4 + 3] > 0) { x.fillRect(i, j + 1, 3, 1); x.fillRect(i + 1, j, 1, 3); }
  x.drawImage(src, 1, 1);
  return c;
}
export function spriteURL(c) { return c._url || (c._url = c.toDataURL()); }

// ---- heroes ------------------------------------------------------------------
// Front-right (south-east) frames for idle / walk / attack. Each animation has its own canvas size,
// so every frame is drawn with the feet of its first frame as the anchor.
const HERO_DIR = 'assets/heroes/';
const heroArt = {}; // folder -> anim -> { frames, ax, ay }
const loadImg = src => new Promise((ok, err) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => err(new Error(`missing ${src}`)); i.src = src; });
function feetOf(img) {
  const c = mk(img.width, img.height), x = c.getContext('2d');
  x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height).data;
  let minX = c.width, maxX = 0, minY = -1, maxY = 0;
  for (let y = 0; y < c.height; y++) for (let i = 0; i < c.width; i++) if (d[(y * c.width + i) * 4 + 3]) { if (i < minX) minX = i; if (i > maxX) maxX = i; if (minY < 0) minY = y; maxY = y; }
  return { ax: Math.round((minX + maxX) / 2), ay: maxY + 1, vw: maxX - minX + 1, vh: maxY - minY + 1 };   // visible width and height
}
const enemyArt = {}; // enemy key -> image (already trimmed and facing left)
const propArt = {};  // small PixelLab props drawn in the dungeon (the gravestone of a fallen hero)
export async function loadArt() {
  // a missing picture never stops the game: that enemy falls back to its drawn-in-code look
  await Promise.all(ENEMY_ART.map(async k => { enemyArt[k] = await loadImg(`assets/enemies/${k}.png`).catch(() => null); }));
  propArt.grave = await loadImg('assets/props/grave.png').catch(() => null);
  const meta = await (await fetch(HERO_DIR + 'heroes.json')).json();
  await Promise.all(Object.entries(meta).map(async ([folder, anims]) => {
    heroArt[folder] = {};
    await Promise.all(Object.entries(anims).map(async ([anim, m]) => {
      const frames = await Promise.all([...Array(m.frames).keys()].map(i => loadImg(`${HERO_DIR}${folder}/${anim}/${String(i).padStart(2, '0')}.png`)));
      heroArt[folder][anim] = { frames, ...feetOf(frames[0]) };
    }));
  }));
}
// heroes from older saves may have a gender without art yet: fall back to the class's first folder
const artFolder = h => { if (h.art && heroArt[h.art]) return h.art; const a = HERO_ART[h.cls] || HERO_ART.warrior; return a[h.gender] || Object.values(a)[0]; };
export const HERO_TALL = 64, HERO_WIDE = 44;
// frame k of an animation (wraps around); n = frame count
export function heroFrame(h, anim, k) {
  const folder = artFolder(h), A = heroArt[folder][anim], n = A.frames.length;
  return { img: A.frames[((k % n) + n) % n], ax: A.ax, ay: A.ay, vw: A.vw, vh: A.vh, k: HERO_SCALE[folder] || 1, n };
}
// k scales the hero in the dungeon (feet stay on the spot); the dungeon canvas renders at 4x, so 0.8 stays near pixel-exact
function drawHero(x, f, fx, fy) { const k = f.k || 1; x.drawImage(f.img, Math.round(fx - f.ax * k), Math.round(fy - f.ay * k), f.img.width * k, f.img.height * k); }
// standing portrait for the UI: 48x66 with the feet at the bottom centre
export function heroSprite(h) {
  const key = `h|${artFolder(h)}`;
  if (cache.has(key)) return cache.get(key);
  const f = heroFrame(h, 'idle', 0), w = Math.max(48, f.vw + 4), c = mk(w, 66);   // wider for four-legged heroes
  drawHero(c.getContext('2d'), { ...f, k: 1 }, w / 2, 65);   // card portraits stay full size
  cache.set(key, c);
  return c;
}
// white silhouette of a sprite, drawn over it for a split second when it takes a hit
function flashOf(c) {
  if (c._fl) return c._fl;
  const f = mk(c.width, c.height), x = f.getContext('2d');
  x.drawImage(c, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#ffffff'; x.fillRect(0, 0, f.width, f.height);
  return (c._fl = f);
}
// idle frame from the clock, offset per hero so a group doesn't breathe in sync
const idleK = (t, i) => Math.floor(t * 5 + i * 1.7);

// ---- enemies -----------------------------------------------------------------
export function enemySprite(e) {
  if (enemyArt[e.key]) return enemyArt[e.key];
  const { shape, color } = e, key = `e|${shape}|${color}`;
  if (cache.has(key)) return cache.get(key);
  const [w, h] = ENEMY_SIZE[shape] || [36, 36], c = mk(w, h), x = c.getContext('2d');
  paintEnemy(shape, color, (px, py, pw, ph, col) => { x.fillStyle = col; x.fillRect(px, py, pw, ph); }, shade);
  const out = outlined(c);
  cache.set(key, out);
  return out;
}

// ---- item icons ----------------------------------------------------------------
export function itemIcon(it) {
  const name = it.slot === 'trinket' ? 'trinket' : it.kind, key = `i|${name}|${it.rar}`;
  if (cache.has(key)) return cache.get(key);
  const rows = ICONS[name] || ICONS.trinket, c = mk(10, 10), x = c.getContext('2d');
  const pal = { m: '#dfe6ee', n: '#8f99a6', w: '#8a6238', r: RARITY[it.rar].color, c: '#ffffff', b: '#4a6fc0', y: '#e8c44a' };
  rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.') { x.fillStyle = pal[ch]; x.fillRect(i, j, 1, 1); } }));
  const out = outlined(c);
  cache.set(key, out);
  return out;
}

// ---- lighting helpers ------------------------------------------------------------
function glow(x, cx, cy, r, col, a) {
  const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, rgba(col, a)); g.addColorStop(0.4, rgba(col, a * 0.45)); g.addColorStop(1, rgba(col, 0));
  x.globalCompositeOperation = 'lighter'; x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2); x.globalCompositeOperation = 'source-over';
}
function vignette(x, W, H, a) {
  const g = x.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.62);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`);
  x.fillStyle = g; x.fillRect(0, 0, W, H);
}
function shadow(x, cx, cy, w) { x.fillStyle = 'rgba(0,0,0,.4)'; x.beginPath(); x.ellipse(cx, cy, w / 2, Math.max(2.2, w * 0.15), 0, 0, 7); x.fill(); }

// ---- town ------------------------------------------------------------------
// Elevated 3/4 view of the town square: houses show their front wall and the roof sloping away,
// the Hole is an open pit in the middle of the plaza. The static scenery is painted once into an
// offscreen layer (`townBase`); lights, smoke, the Hole's glow, the winch rope, heroes and graves
// are drawn live on top every frame.
export const TOWN_W = 480, TOWN_H = 270;
const HOLE = { cx: 300, cy: 172, rx: 104, ry: 50 };
const SHOP = { x: 22, by: 186, w: 116, wh: 44, rd: 30 };
const ROOFS = ['#7a3b3b', '#4f5d7a', '#6a5236', '#456a52', '#7a5f3b', '#5e4a6a'];
let townBase = null;
const townLights = { windows: [], chimneys: [], lamps: [] };

function roofed(p, x0, by, w, wh, rd, roof, wall) {
  // front wall: plaster with timber beams over a stone footing
  p(x0, by - wh, w, wh, wall); p(x0, by - wh, w, 1, shade(wall, 0.7));
  p(x0, by - 4, w, 4, '#6e665c'); p(x0, by - 4, w, 1, '#8a8174'); p(x0, by - 1, w, 1, '#4a443e');
  p(x0, by - wh, 1, wh, shade(wall, 0.72)); p(x0 + w - 1, by - wh, 1, wh, shade(wall, 0.6));
  p(x0 + Math.floor(w * 0.66), by - wh, Math.ceil(w * 0.34), wh - 4, shade(wall, 0.9));
  p(x0, by - Math.floor(wh / 2), w, 1, shade(wall, 0.55));
  // roof plane sloping away from the camera (a trapezoid seen from above)
  for (let r = 0; r < rd; r++) {
    const inset = Math.round((r / rd) * 3), y = by - wh - 1 - r;
    const c = r % 3 === 0 ? shade(roof, 0.72) : shade(roof, 1.08 - 0.3 * (r / rd));
    p(x0 - 3 + inset, y, w + 6 - inset * 2, 1, c);
  }
  p(x0 - 3, by - wh - 1, w + 6, 1, shade(roof, 0.5));               // eave edge
  p(x0, by - wh, w, 2, 'rgba(0,0,0,.35)');                            // shadow under the eave
  p(x0, by - wh - rd, w, 1, shade(roof, 1.25));                       // ridge catches the moon
}
function pine(p, cx, by, h) {
  p(cx - 1, by - 4, 3, 4, '#3a2a1e');
  for (let r = 0; r < h; r++) { const hw = Math.round(1 + (r / h) * (h * 0.42)); p(cx - hw, by - 4 - h + r, hw * 2 + 1, 1, r % 4 < 2 ? '#1f3a29' : '#284a33'); }
  p(cx - Math.round(h * 0.42), by - 5, Math.round(h * 0.84) + 1, 1, '#16291d');
}
function buildTownBase() {
  const W = TOWN_W, H = TOWN_H, c = mk(W, H), x = c.getContext('2d');
  const p = (px, py, w, h, col) => { x.fillStyle = col; x.fillRect(Math.round(px), Math.round(py), Math.round(w), Math.round(h)); };
  townLights.windows = []; townLights.chimneys = []; townLights.lamps = [];
  // night sky, stars, moon and two mountain ranges
  const sky = x.createLinearGradient(0, 0, 0, 96);
  [[0, '#0d1030'], [0.4, '#232350'], [0.7, '#4a3a6a'], [0.9, '#9a5a6a'], [1, '#d08a62']].forEach(([o, col]) => sky.addColorStop(o, col));
  x.fillStyle = sky; x.fillRect(0, 0, W, 96);
  for (let i = 0; i < 90; i++) p(hash(i) * W, hash(i + 50) * 56, 1, 1, `rgba(255,255,255,${0.3 + 0.6 * hash(i + 9)})`);
  for (const [mc, mh, md, col] of [[0.9, 40, 7, '#33294f'], [1.3, 30, 9, '#221c3c']]) for (let i = 0; i < W; i++) { const m = mh * 0.5 + Math.abs(((i * mc + 20) % 120) - 60) * 0.32 + hash(Math.floor(i / md) + mh) * 5; p(i, 96 - m, 1, m, col); }
  // ground: dark grass, fading lighter toward the viewer
  const gr = x.createLinearGradient(0, 92, 0, H); gr.addColorStop(0, '#22311f'); gr.addColorStop(1, '#3b5232');
  x.fillStyle = gr; x.fillRect(0, 92, W, H - 92);
  for (let i = 0; i < 700; i++) { const gx = hash(i + 9) * W, gy = 94 + hash(i + 99) * (H - 94); p(gx, gy, 2, 1, hash(i) > 0.5 ? '#4a6340' : '#1d2b1b'); }
  // tree line and the back row of houses along the far edge of the square
  for (let i = 0; i < 40; i++) pine(p, i * 12 + hash(i) * 8, 100 + hash(i + 3) * 4, 14 + hash(i + 7) * 10);
  let hx = 4;
  for (let i = 0; hx < W - 30; i++) {
    const w = 34 + Math.floor(hash(i + 3) * 18), wh = 22 + Math.floor(hash(i + 31) * 8), rd = 14 + Math.floor(hash(i + 13) * 6), by = 116 + Math.floor(hash(i + 41) * 4);
    roofed(p, hx, by, w, wh, rd, ROOFS[i % ROOFS.length], i % 3 ? '#c7b593' : '#b8a888');
    p(hx + Math.floor(w / 2) - 3, by - 13, 7, 13, '#3a2f2a'); p(hx + Math.floor(w / 2) - 3, by - 13, 7, 1, '#5a4a40');
    for (const wx of [hx + 5, hx + w - 11]) { p(wx - 1, by - wh + 6, 8, 8, '#5a4a3a'); townLights.windows.push([wx, by - wh + 7, 6, 6, i * 7 + wx]); }
    p(hx + w - 10, by - wh - rd + 2, 4, 9, '#5a4a40'); p(hx + w - 11, by - wh - rd + 1, 6, 2, '#6e5e52');
    if (i % 2 === 0) townLights.chimneys.push([hx + w - 8, by - wh - rd, i]);
    hx += w + 6 + Math.floor(hash(i + 77) * 10);
    if (hash(i + 5) > 0.4) pine(p, hx - 3, by + 2, 16 + hash(i + 8) * 8);
  }
  // cobbled plaza around the Hole
  x.save(); x.beginPath(); x.ellipse(HOLE.cx - 20, HOLE.cy + 6, 230, 100, 0, 0, 7); x.clip();
  x.fillStyle = '#4e4840'; x.fillRect(0, 100, W, H);
  for (let r = 0; r < 60; r++) {
    const y = 104 + r * 3 + Math.floor(r / 3);
    for (let cx = -((r * 5) % 9); cx < W; ) { const w = 5 + Math.floor(hash(r * 97 + cx) * 4), v = hash(r * 31 + cx * 7); p(cx, y, w - 1, 2, v > 0.66 ? '#7d7466' : v > 0.33 ? '#6a6257' : '#5c554c'); p(cx, y, w - 1, 1, v > 0.5 ? '#8f8678' : '#776e62'); cx += w; }
  }
  x.restore();
  const edge = x.createRadialGradient(HOLE.cx - 20, HOLE.cy + 6, 160, HOLE.cx - 20, HOLE.cy + 6, 240); edge.addColorStop(0, 'rgba(34,49,31,0)'); edge.addColorStop(1, 'rgba(34,49,31,.9)');
  x.fillStyle = edge; x.fillRect(0, 96, W, H);
  // the Hole: rim stones, then the shaft falling away, with a stair spiralling down its inside wall
  const { cx, cy, rx, ry } = HOLE, E = (ex, ey, erx, ery, col) => { x.fillStyle = col; x.beginPath(); x.ellipse(ex, ey, erx, ery, 0, 0, 7); x.fill(); };
  E(cx, cy + 3, rx + 9, ry + 7, '#2e2a26'); E(cx, cy, rx + 7, ry + 5, '#7a7064');
  E(cx, cy + 1, rx, ry, '#3e3832'); E(cx, cy + 5, rx - 6, ry - 5, '#231f22'); E(cx, cy + 10, rx - 16, ry - 13, '#141117'); E(cx, cy + 15, rx - 34, ry - 25, '#08060c'); E(cx, cy + 18, rx - 54, ry - 36, '#030205');
  for (let i = 0; i < 44; i++) { const a = (i / 44) * Math.PI * 2, sx = cx + Math.cos(a) * (rx + 4), sy = cy + Math.sin(a) * (ry + 2); p(sx - 3, sy - 1, 6, 3, i % 2 ? '#958a7a' : '#6a6156'); p(sx - 3, sy - 1, 6, 1, i % 2 ? '#aaa08f' : '#7d7466'); }
  // far inner wall: a band of stone strata, then the stair hugging it as it winds down to the right
  x.save(); x.beginPath(); x.ellipse(cx, cy + 1, rx, ry, 0, Math.PI, 0); x.ellipse(cx, cy + 16, rx - 6, ry - 6, 0, 0, Math.PI, true); x.clip();
  for (let r = 0; r < 18; r++) p(cx - rx, cy - ry + r * 2, rx * 2, 1, r % 3 ? '#2e2925' : '#3c362f');
  x.restore();
  for (let i = 0; i < 22; i++) {
    const a = Math.PI * (1.08 + i * 0.036), d = i * 1.1;
    const sx = cx + Math.cos(a) * (rx - 5 - d * 0.6), sy = cy + Math.sin(a) * (ry - 3 - d * 0.5) + d;
    p(sx - 3, sy, 7, 2, i % 2 ? '#7a7064' : '#6a6156'); p(sx - 3, sy + 2, 7, 1, '#1d1a1a');
  }
  // winch frame over the far rim
  const wx = cx + 50, wy = cy - ry - 6;
  p(wx - 22, wy - 34, 3, 36, '#5a4630'); p(wx + 20, wy - 34, 3, 36, '#4a3a26'); p(wx - 24, wy - 36, 50, 4, '#6b5236'); p(wx - 24, wy - 36, 50, 1, '#86683f');
  p(wx - 4, wy - 34, 9, 7, '#3a2e22'); p(wx - 3, wy - 33, 7, 5, '#7a5a36');
  // the shop, front-left of the square
  const S0 = SHOP;
  roofed(p, S0.x, S0.by, S0.w, S0.wh, S0.rd, '#3f6a8a', '#c4a774');
  p(S0.x + 50, S0.by - 22, 16, 22, '#3a2f2a'); p(S0.x + 50, S0.by - 22, 16, 2, '#5a4a40'); p(S0.x + 62, S0.by - 12, 2, 2, '#e8c44a');
  for (const [wx2, wy2] of [[S0.x + 10, S0.by - 26], [S0.x + 82, S0.by - 26]]) { p(wx2 - 2, wy2 - 2, 24, 16, '#5a4a3a'); townLights.windows.push([wx2, wy2, 20, 12, -1]); p(wx2 + 9, wy2, 2, 12, '#5a4a3a'); }
  for (let i = 0; i < 9; i++) p(S0.x + 4 + i * 12, S0.by - S0.wh + 2, 12, 5, i % 2 ? '#c9b48a' : '#8a3b3b');   // striped awning
  p(S0.x + 4, S0.by - S0.wh + 7, 108, 1, '#3a2a20');
  p(S0.x + 36, S0.by - S0.wh - S0.rd - 4, 44, 12, '#6b4a2a'); p(S0.x + 37, S0.by - S0.wh - S0.rd - 3, 42, 10, '#e8d9a8');   // sign
  p(S0.x + 44, S0.by - S0.wh - S0.rd + 1, 12, 1, '#5a5a66'); p(S0.x + 49, S0.by - S0.wh - S0.rd - 1, 1, 5, '#5a5a66'); p(S0.x + 62, S0.by - S0.wh - S0.rd - 1, 8, 6, '#7a3b3b'); p(S0.x + 64, S0.by - S0.wh - S0.rd, 4, 4, '#e8c44a');
  townLights.chimneys.push([S0.x + S0.w - 18, S0.by - S0.wh - S0.rd - 6, 99]);
  p(S0.x + S0.w - 20, S0.by - S0.wh - S0.rd - 6, 5, 12, '#5a4a40');
  for (const [bx, by2] of [[S0.x - 2, S0.by + 4], [S0.x + 8, S0.by + 6], [S0.x + S0.w - 4, S0.by + 4]]) { p(bx, by2 - 10, 9, 10, '#7a5a36'); p(bx, by2 - 10, 9, 2, '#96744a'); p(bx, by2 - 7, 9, 1, '#3a2a1c'); p(bx, by2 - 3, 9, 1, '#3a2a1c'); }
  p(S0.x + S0.w - 18, S0.by - 2, 12, 9, '#8a6a42'); p(S0.x + S0.w - 18, S0.by - 2, 12, 1, '#a8885a'); p(S0.x + S0.w - 13, S0.by - 2, 1, 9, '#5a4226');
  // dirt path from the shop door to the rim
  for (let i = 0; i < 60; i++) { const t2 = i / 59, px2 = S0.x + 58 + t2 * (cx - rx - 10 - S0.x - 58), py2 = S0.by + 6 + Math.sin(t2 * 3) * 6 - t2 * 8; p(px2, py2, 4, 3, i % 2 ? '#7a6a52' : '#6a5c48'); }
  // graveyard behind a fence, bottom right
  p(398, 214, 78, 52, '#2a3624'); for (let i = 0; i < 40; i++) p(400 + hash(i + 300) * 74, 216 + hash(i + 340) * 48, 2, 1, '#3d5236');
  for (let i = 0; i < 14; i++) { p(398 + i * 6, 208, 2, 8, '#5a4630'); } p(398, 210, 80, 1, '#6b5236'); p(398, 213, 80, 1, '#4a3a26');
  // lamp posts (flames are live)
  for (const [lx, ly] of [[176, 214], [196, 120], [420, 150], [250, 250], [92, 230]]) { p(lx, ly - 18, 2, 18, '#3a3238'); p(lx - 2, ly - 22, 6, 4, '#2a2428'); p(lx - 1, ly, 4, 1, '#1d1a1e'); townLights.lamps.push([lx + 1, ly - 20]); }
  return c;
}
export function drawTown(x, S, t) {
  const W = TOWN_W, H = TOWN_H;
  if (!townBase) townBase = buildTownBase();
  x.drawImage(townBase, 0, 0);
  const p = (px, py, w, h, col) => { x.fillStyle = col; x.fillRect(Math.round(px), Math.round(py), w, h); };
  // moon with a slow glow
  glow(x, 410, 26, 34, '#fff2c0', 0.22); x.fillStyle = '#fbf0c4'; x.beginPath(); x.arc(410, 26, 8, 0, 7); x.fill(); x.fillStyle = '#1c1c44'; x.beginPath(); x.arc(406, 23, 7, 0, 7); x.fill();
  for (let i = 0; i < 12; i++) if (Math.sin(t * (0.6 + hash(i)) + i * 3) > 0.7) p(hash(i + 400) * W, hash(i + 450) * 50, 1, 1, '#ffffff');
  // lit windows come and go
  for (const [wx, wy, ww, wh, k] of townLights.windows) {
    const lit = k < 0 || hash(k + Math.floor(t / 5)) > 0.3;
    p(wx, wy, ww, wh, lit ? '#ffd76b' : '#2a2a3a'); if (lit) { p(wx, wy + wh - 2, ww, 2, '#e8a840'); glow(x, wx + ww / 2, wy + wh / 2, ww + 6, '#ffb85a', k < 0 ? 0.35 : 0.22); }
  }
  // the Hole glows in the colour of the deepest floor reached; motes rise out of it
  const { cx, cy, rx, ry } = HOLE, accent = S.accent || FLOORS[Math.min(FLOORS.length - 1, S.cleared)].pal.accent;
  x.save(); x.beginPath(); x.ellipse(cx, cy + 6, rx - 8, ry - 7, 0, 0, 7); x.clip();
  glow(x, cx, cy + 18, 70, accent, 0.26 + 0.08 * Math.sin(t * 1.3));
  for (let i = 0; i < 18; i++) { const a = (t * 10 + i * 31) % 40; x.fillStyle = rgba(accent, 0.6 * (1 - a / 40)); x.fillRect(Math.round(cx - 50 + hash(i + 3) * 100), Math.round(cy + 24 - a), 1, 1); }
  x.restore();
  // winch rope drops into the Hole while a party is down there
  const active = S.expeditions.some(e => !e.done), wx = cx + 50, wy = cy - ry - 6, rope = 10 + (active ? 30 + Math.sin(t) * 4 : 0);
  p(wx, wy - 28, 1, rope, '#c9b88a'); p(wx - 2, wy - 28 + rope, 5, 4, '#ffd76b'); glow(x, wx, wy - 26 + rope, 14, '#ffb85a', 0.5);
  // lamp flames
  for (const [lx, ly] of townLights.lamps) { const fk = hash(Math.floor(t * 8) + lx); p(lx - 1, ly - 1, 3, 3, fk > 0.5 ? '#ffb24a' : '#ff8a2a'); p(lx, ly - 2 + (Math.floor(t * 8) % 2), 1, 1, '#ffe9a0'); glow(x, lx, ly, 22 + fk * 3, '#ffb85a', 0.42); }
  // chimney smoke
  for (const [mx, my, k] of townLights.chimneys) for (let j = 0; j < 6; j++) { const a = (t * 0.3 + j / 6 + hash(k)) % 1; x.fillStyle = `rgba(200,190,210,${0.32 * (1 - a)})`; x.fillRect(Math.round(mx + Math.sin(a * 5 + k) * 2 + a * 6), Math.round(my - a * 22), 2 + Math.round(a * 3), 2 + Math.round(a * 3)); }
  // gravestones, newest first
  S.graveyard.slice(0, 12).forEach((g, i) => { const gx = 406 + (i % 6) * 11, gy = 236 + Math.floor(i / 6) * 18; p(gx, gy - 9, 7, 9, '#9a9aa6'); p(gx + 1, gy - 10, 5, 1, '#9a9aa6'); p(gx + 6, gy - 9, 1, 9, '#6a6a76'); p(gx + 3, gy - 7, 1, 4, '#4a4a56'); p(gx + 2, gy - 6, 3, 1, '#4a4a56'); p(gx - 1, gy, 9, 1, '#1d2418'); });
  // idle heroes gather on the square in front of the shop, nearest drawn last
  const idle = S.heroes.filter(h => !h.busy).slice(0, 10);
  const spots = idle.map((h, i) => { const row = i > 4 ? 1 : 0; return { h, i, fx: 44 + (i - row * 5) * 34 + row * 17, fy: 222 + row * 28 }; }).sort((a, b) => a.fy - b.fy);
  for (const s of spots) { shadow(x, s.fx, s.fy, 26); drawHero(x, heroFrame(s.h, 'idle', idleK(t, s.i)), s.fx, s.fy); }
  // night air
  const fog = x.createLinearGradient(0, 80, 0, 120); fog.addColorStop(0, 'rgba(240,150,110,0)'); fog.addColorStop(0.5, 'rgba(240,150,110,.12)'); fog.addColorStop(1, 'rgba(240,150,110,0)');
  x.fillStyle = fog; x.fillRect(0, 80, W, 40);
  x.fillStyle = 'rgba(20,16,50,.16)'; x.fillRect(0, 0, W, H);
  vignette(x, W, H, 0.5);
}

// ---- dungeon ---------------------------------------------------------------
// Elevated 3/4 view: a short back wall on top, a diamond-tiled floor below, the party on the left
// facing front-right and the enemies on the right facing front-left. Positions are feet points.
export const DUN_W = 320, DUN_H = 180;
const WALL = 64, FH = DUN_H - WALL, ATK_MS = 420, TW = 32, TH = 16;
const HERO_SLOTS = [[120, 132], [84, 110], [78, 158]];             // front, back-top, back-bottom
const ENEMY_SLOTS = [[204, 130], [244, 108], [246, 156], [284, 132]]; // front first
const BOSS_SLOT = [256, 138], BOSS_SIDE = [[206, 112], [204, 160]];
function enemyLayout(ex) {
  const boss = ex.enemies.findIndex(e => e.boss);
  let k = 0;
  return ex.enemies.map((e, i) => {
    const spr = enemySprite(e);
    const [fx, fy] = i === boss ? BOSS_SLOT : boss >= 0 ? (BOSS_SIDE[k++] || ENEMY_SLOTS[3]) : ENEMY_SLOTS[i % ENEMY_SLOTS.length];
    const sc = enemyArt[e.key] ? ENEMY_SCALE[e.key] || 1 : 1;   // small creatures are drawn smaller
    return { fx, fy, w: spr.width * sc, h: spr.height * sc, spr };
  });
}
// the floor and the wall scroll left while the party walks, so the heroes seem to walk forward (right)
const floorScroll = new Map();
const WALK_PX = 32;   // floor pixels per second while walking (the back wall moves slower, see scenery)
function isoFloor(x, pal, sd, off) {
  const W = DUN_W, k = Math.floor(off / TW), ox = -(off - k * TW);
  x.fillStyle = shade(pal.floor, 0.45); x.fillRect(0, WALL, W, FH); // grout between tiles
  for (let r = -1; r * (TH / 2) < FH + TH; r++) for (let c = -1; c * TW < W + TW; c++) {
    const cx = ox + c * TW + (r & 1 ? TW / 2 : 0), cy = WALL + r * (TH / 2);
    const v = hash((c + k) * 13.7 + r * 71.3 + sd), depth = 0.72 + 0.4 * Math.max(0, Math.min(1, (cy - WALL) / FH));
    const col = shade(pal.floor, depth * (0.88 + 0.2 * v)), hi = shade(pal.floor, depth * 1.18);
    for (let dy = -TH / 2 + 1; dy < TH / 2; dy++) {
      const hw = Math.round((TW / 2) * (1 - Math.abs(dy) / (TH / 2))) - 1, y = cy + dy;
      if (hw <= 0 || y < WALL) continue;
      x.fillStyle = dy === -TH / 2 + 2 ? hi : col; x.fillRect(Math.round(cx - hw), Math.round(y), hw * 2, 1);
    }
    if (v > 0.9) { x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(Math.round(cx - 3), Math.round(cy), 5, 1); x.fillRect(Math.round(cx + 1), Math.round(cy + 1), 3, 1); }
  }
  const ao = x.createLinearGradient(0, WALL, 0, WALL + 14); ao.addColorStop(0, 'rgba(0,0,0,.55)'); ao.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = ao; x.fillRect(0, WALL, W, 14);
}
// scenery behind the characters, different on every floor
function decor(x, f, sd, t, pal, lights) {
  const W = DUN_W, R = n => hash(sd + n), RI = (n, m) => Math.floor(R(n) * m);
  const p = (px, py, w, h, c) => { x.fillStyle = c; x.fillRect(px, py, w, h); };
  if (f === 1) {
    for (let i = 0; i < 16; i++) p(RI(i, W), RI(i + 20, 56), 3 + RI(i + 40, 6), 2, i % 2 ? '#4f7a3f' : '#3d6a35');
    for (let i = 0; i < 7; i++) { const vx = RI(i + 60, W), len = 8 + RI(i + 70, 22); p(vx, 0, 1, len, '#3d6a35'); for (let j = 3; j < len; j += 4) p(vx + (j % 8 ? -1 : 1), j, 1, 1, '#7fbf6a'); }
    for (const bx of [92, 150 + RI(5, 40)]) { p(bx, WALL - 10, 8, 10, '#7a5a36'); p(bx, WALL - 10, 1, 10, '#96744a'); p(bx + 7, WALL - 10, 1, 10, '#5a4226'); p(bx, WALL - 8, 8, 1, '#3a2a1c'); p(bx, WALL - 3, 8, 1, '#3a2a1c'); }
  } else if (f === 2) {
    for (let i = 0; i < 5; i++) { const hx = 12 + i * 44 + RI(i, 14), hy = 22 + RI(i + 9, 26); x.fillStyle = '#2a2018'; x.beginPath(); x.ellipse(hx, hy, 7, 5, 0, 0, 7); x.fill(); x.fillStyle = '#0c0806'; x.beginPath(); x.ellipse(hx, hy + 1, 5, 3.5, 0, 0, 7); x.fill(); if (R(i + 30) > 0.5) { p(hx - 2, hy, 1, 1, '#ff5a4a'); p(hx + 1, hy, 1, 1, '#ff5a4a'); } }
    for (let i = 0; i < 40; i++) p(RI(i + 50, W), WALL + 6 + RI(i + 90, FH - 10), 3, 1, i % 2 ? '#c9a36b' : '#8a6f45');
    for (let i = 0; i < 4; i++) { const bx = RI(i + 140, W); const by = WALL + 14 + i * 26; p(bx, by, 5, 1, '#e6dcc4'); p(bx - 1, by - 1, 1, 3, '#e6dcc4'); p(bx + 5, by - 1, 1, 3, '#e6dcc4'); }
  } else if (f === 3) {
    for (let i = 0; i < 9; i++) {
      const mx = RI(i, W), my = i < 5 ? WALL : 20 + RI(i + 20, 36), col = i % 2 ? '#b07cc6' : '#5fd6c0', hgt = 3 + RI(i + 40, 6);
      p(mx + 2, my - hgt, 2, hgt, '#e6dcc4'); p(mx, my - hgt - 3, 6, 3, col); p(mx + 1, my - hgt - 4, 4, 1, col); p(mx + 1, my - hgt - 3, 1, 1, '#ffffff');
      lights.push([mx + 3, my - hgt - 2, 12, col, 0.3 + 0.1 * Math.sin(t * 2 + i)]);
    }
    for (let i = 0; i < 12; i++) p(RI(i + 70, W), RI(i + 90, 56), 4, 2, '#4a3d63');
  } else if (f === 4) {
    for (let i = 0; i < 10; i++) { const sx = RI(i, W); p(sx, 0, 2, 20 + RI(i + 9, 36), 'rgba(95,199,192,.18)'); }
    for (let i = 0; i < 6; i++) { const cx = RI(i + 30, W); for (let j = 0; j < 4; j++) p(cx + (j % 2 ? 2 : -2) * (j > 1 ? 1 : 0), WALL - 2 - j * 2, 2, 2, j % 2 ? '#e07a8a' : '#c0566a'); }
    for (let i = 0; i < 5; i++) { const dx = RI(i + 60, W), a = (t * 0.8 + R(i + 70)) % 1; p(dx, Math.floor(a * WALL), 1, 2, '#9fe6e0'); }
    const wg = x.createLinearGradient(0, WALL + 2, 0, DUN_H); wg.addColorStop(0, 'rgba(60,150,170,.15)'); wg.addColorStop(1, 'rgba(60,150,170,.5)');
    x.fillStyle = wg; x.fillRect(0, WALL + 2, W, DUN_H - WALL);
    for (let i = 0; i < 14; i++) { const rx = (RI(i + 80, W) + Math.sin(t + i) * 4) | 0; p(rx, WALL + 6 + (i * 29) % (FH - 10), 6 + RI(i + 100, 8), 1, 'rgba(200,255,250,.35)'); }
  } else if (f === 5) {
    for (let i = 0; i < 4; i++) {
      const nx = 24 + i * 62 + RI(i, 10); p(nx, 26, 14, 18, '#1c1a1e'); p(nx - 1, 25, 16, 1, '#6e6a60'); p(nx - 1, 44, 16, 1, '#6e6a60');
      p(nx + 4, 35, 6, 5, '#e6dcc4'); p(nx + 5, 40, 4, 2, '#e6dcc4'); p(nx + 5, 37, 1, 2, '#14121a'); p(nx + 8, 37, 1, 2, '#14121a');
      p(nx + 1, 40, 1, 4, '#e8e0c8'); p(nx + 1, 39, 1, 1, '#ffb24a'); lights.push([nx + 1.5, 39, 9, '#ffb24a', 0.4 + 0.1 * hash(Math.floor(t * 7) + i)]);
    }
    p(96, WALL - 7, 22, 7, '#4a3a2e'); p(96, WALL - 7, 22, 1, '#6b5a45'); p(105, WALL - 6, 4, 1, '#d8d2bd'); p(106, WALL - 7, 2, 3, '#d8d2bd');
    for (let i = 0; i < 6; i++) p(RI(i + 40, W), WALL + 6 + RI(i + 50, FH - 10), 4, 1, '#d8d2bd');
  } else if (f === 6) {
    for (let i = 0; i < 7; i++) { let lx = RI(i, W), ly = WALL + 3; ly += 6 + RI(i, FH - 30); for (let j = 0; j < 8; j++) { p(lx, ly, 4, 1, '#ff5a1a'); p(lx + 1, ly, 2, 1, '#ffd23a'); lx += 3 + RI(i * 10 + j, 2); ly += RI(i * 10 + j + 5, 3) - 1; } lights.push([lx - 14, ly, 20, '#ff6a1a', 0.22 + 0.08 * Math.sin(t * 3 + i)]); }
    for (let i = 0; i < 4; i++) { const cx = 20 + i * 55 + RI(i + 20, 12), len = 10 + RI(i + 30, 16); for (let j = 0; j < len; j += 2) p(cx + (j % 4 ? 0 : 1), j, 1, 2, '#3a3238'); p(cx - 1, len, 3, 3, '#5a4a40'); }
    p(92, WALL - 6, 12, 3, '#3a3238'); p(95, WALL - 3, 6, 3, '#2a2428'); p(92, WALL - 6, 12, 1, '#6a5a60'); p(88, WALL - 6, 4, 2, '#3a3238');
    const lg = x.createLinearGradient(0, WALL - 20, 0, WALL); lg.addColorStop(0, 'rgba(255,90,20,0)'); lg.addColorStop(1, 'rgba(255,90,20,.22)'); x.fillStyle = lg; x.fillRect(0, WALL - 20, W, 20);
  } else if (f === 7) {
    for (let i = 0; i < 22; i++) { const ix = i * 10 + RI(i, 6), len = 4 + RI(i + 30, 14); for (let j = 0; j < len; j++) p(ix + (j > len * 0.6 ? 1 : 0), j, j > len * 0.6 ? 1 : j > len * 0.3 ? 2 : 3, 1, j % 3 ? '#bfe6f5' : '#ffffff'); }
    for (let i = 0; i < 6; i++) { const sx = RI(i + 60, W), w = 14 + RI(i + 70, 16); x.fillStyle = '#e6f2f8'; x.beginPath(); x.ellipse(sx, WALL + 1, w / 2, 4, 0, Math.PI, 0); x.fill(); x.fillStyle = '#b8d4e2'; x.fillRect(sx - w / 2, WALL, w, 2); }
    for (let i = 0; i < 4; i++) { const cx = 30 + i * 50 + RI(i + 90, 14); p(cx, 30, 2, 8, '#8fd0e8'); p(cx - 2, 33, 6, 2, '#bfe6f5'); p(cx, 29, 1, 1, '#ffffff'); lights.push([cx + 1, 34, 14, '#8fd0e8', 0.25]); }
  } else if (f === 8) {
    for (let i = 0; i < 4; i++) {
      const fx = 18 + i * 62 + RI(i, 8), fw = 16 + RI(i + 10, 6), fh = 20 + RI(i + 20, 6), fy = 14;
      p(fx, fy, fw, fh, '#c9a03a'); p(fx, fy, fw, 1, '#f0d070'); p(fx, fy + fh - 1, fw, 1, '#8a6a1a'); p(fx + 2, fy + 2, fw - 4, fh - 4, '#1a1626');
      p(fx + fw / 2 - 3 | 0, fy + 6, 6, 7, '#3a3350'); p(fx + fw / 2 - 4 | 0, fy + 13, 8, fh - 15, '#2a2540');
      const blink = Math.sin(t * 0.7 + i * 2) > -0.6; if (blink) { p((fx + fw / 2 - 2) | 0, fy + 9, 1, 1, '#ff5a6a'); p((fx + fw / 2 + 1) | 0, fy + 9, 1, 1, '#ff5a6a'); }
    }
    p(0, WALL + 40, W, 26, '#5a1c2e'); p(0, WALL + 40, W, 1, '#c9a03a'); p(0, WALL + 65, W, 1, '#c9a03a');
  } else if (f === 9) {
    for (let i = 0; i < 9; i++) {
      let vx = RI(i, W), vy = 0; const len = 16 + RI(i + 9, 40);
      for (let j = 0; j < len; j += 2) { p(vx, vy, 2, 2, '#2f4a2a'); if (j % 6 === 0) p(vx + 2, vy, 1, 1, '#14121a'); vx += RI(i * 50 + j, 3) - 1; vy += 2; }
      p(vx - 1, vy, 4, 3, '#c22a4a'); p(vx, vy - 1, 2, 5, '#e05a78'); p(vx, vy + 1, 1, 1, '#ffd0d8'); lights.push([vx + 1, vy + 1, 8, '#e05a78', 0.25]);
    }
    for (let i = 0; i < 5; i++) { const hx = RI(i + 60, W), w = 16 + RI(i + 70, 14); x.fillStyle = '#243a22'; x.beginPath(); x.ellipse(hx, WALL + 1, w / 2, 6, 0, Math.PI, 0); x.fill(); for (let j = 0; j < 3; j++) p(hx - w / 3 + j * w / 3 | 0, WALL - 3 - (j % 2) * 2, 2, 2, '#c22a4a'); }
  } else if (f === 10) {
    for (let i = 0; i < 3; i++) {
      const wx = 40 + i * 84, g = x.createLinearGradient(0, 8, 0, 44); g.addColorStop(0, '#05030c'); g.addColorStop(1, '#2a1560');
      x.fillStyle = g; x.beginPath(); x.moveTo(wx, 44); x.lineTo(wx, 18); x.arc(wx + 9, 18, 9, Math.PI, 0); x.lineTo(wx + 18, 44); x.fill();
      for (let j = 0; j < 8; j++) p(wx + 2 + RI(i * 20 + j, 14), 12 + RI(i * 20 + j + 9, 28), 1, 1, `rgba(255,255,255,${0.4 + 0.6 * Math.abs(Math.sin(t + j + i))})`);
      lights.push([wx + 9, 30, 26, '#7b4fd6', 0.22]);
    }
    for (const px of [8, 92, 176, 250]) { p(px, 0, 8, WALL, '#3a2c66'); p(px, 0, 2, WALL, '#5a48a0'); p(px + 6, 0, 2, WALL, '#1f173a'); p(px - 2, WALL - 4, 12, 4, '#2a1f4d'); p(px - 2, 0, 12, 3, '#2a1f4d'); }
    for (let i = 0; i < 6; i++) { const rx = 20 + i * 34, ry = 50 + Math.sin(t * 1.2 + i) * 3; p(rx, ry | 0, 3, 1, '#c9a8ff'); p(rx + 1, (ry | 0) - 1, 1, 3, '#c9a8ff'); lights.push([rx + 1.5, ry, 7, '#a57bff', 0.35]); }
  }
}
// drifting particles in front of the characters
function particles(x, f, t, pal) {
  const W = DUN_W, H = DUN_H, p = (px, py, w, h, c) => { x.fillStyle = c; x.fillRect(px | 0, py | 0, w, h); };
  const rise = (n, col, spd) => { for (let i = 0; i < n; i++) { const a = (t * spd * (0.5 + hash(i + 7)) + hash(i)) % 1; p(hash(i + 20) * W + Math.sin(a * 6 + i) * 4, H - a * H, 1, 1, rgba(col, 0.8 * (1 - a))); } };
  const fall = (n, col, spd, w) => { for (let i = 0; i < n; i++) { const a = (t * spd * (0.5 + hash(i + 7)) + hash(i)) % 1; p((hash(i + 20) * W + a * 30 + Math.sin(a * 8 + i) * 5) % W, a * H, w, w, rgba(col, 0.85)); } };
  if (f === 3) rise(24, '#c8a0e8', 0.12);
  else if (f === 6) rise(30, '#ffb23a', 0.3);
  else if (f === 7) fall(40, '#ffffff', 0.2, 1);
  else if (f === 9) fall(16, '#e05a78', 0.12, 2);
  else if (f === 10) rise(26, '#a57bff', 0.1);
  else rise(14, '#ffffff', 0.04);   // dust in the torchlight
}
// The room around the party: back wall, floor and the place's scenery, as one endless strip `off` pixels along.
// Every screen-wide stretch has its own scenery, so while the party walks new things come into view from the right.
// The floor moves at walking speed and the back wall, further away, a little over half as fast: parallax for depth and speed.
const WALL_PARALLAX = 0.55;
function scenery(x, f, pal, seed, off, t) {
  const W = DUN_W, fo = Math.round(off), wo = Math.round(off * WALL_PARALLAX), kb = Math.floor(wo / 16), bo = wo - kb * 16;
  x.fillStyle = pal.bg; x.fillRect(0, 0, W, DUN_H);
  // back wall
  for (let r = 0; r < 8; r++) for (let c = -1; c < 22; c++) {
    const bx = c * 16 + (r % 2) * 8 - bo, by = r * 8, v = hash(r * 31 + c + kb + seed);
    x.fillStyle = v > 0.5 ? pal.wall : pal.wall2; x.fillRect(bx, by, 15, 7);
    x.fillStyle = 'rgba(255,255,255,.07)'; x.fillRect(bx, by, 15, 1);
    x.fillStyle = 'rgba(0,0,0,.22)'; x.fillRect(bx, by + 6, 15, 1);
    if (v > 0.86) { x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(bx + 4, by + 2, 5, 1); x.fillRect(bx + 8, by + 3, 3, 1); }
  }
  const wg = x.createLinearGradient(0, 0, 0, WALL); wg.addColorStop(0, 'rgba(0,0,0,.6)'); wg.addColorStop(0.5, 'rgba(0,0,0,.1)'); wg.addColorStop(1, 'rgba(0,0,0,.35)');
  x.fillStyle = wg; x.fillRect(0, 0, W, WALL);
  isoFloor(x, pal, seed, fo);
  x.fillStyle = 'rgba(0,0,0,.6)'; x.fillRect(0, WALL - 1, W, 2);
  // scenery, one screen-wide stretch at a time: what hangs on the wall moves with the wall, what lies on the floor with the floor
  const lights = [];
  for (const [o, top, h, onWall] of [[wo, 0, WALL, true], [fo, WALL, DUN_H - WALL, false]]) {
    const k0 = Math.floor(o / W);
    for (const k of [k0, k0 + 1]) {
      const dx = k * W - o, L = [], torch = [];
      x.save(); x.beginPath(); x.rect(0, top, W, h); x.clip(); x.translate(dx, 0);
      decor(x, f, seed + k * 1009, t, pal, L);
      if (onWall) for (const tx of [70, 200]) {
        const fk = hash(Math.floor(t * 9) + tx + k * 13);
        x.fillStyle = '#3a3238'; x.fillRect(tx - 2, 30, 6, 2); x.fillRect(tx, 32, 2, 5); x.fillStyle = '#6a5a60'; x.fillRect(tx - 2, 30, 6, 1);
        x.fillStyle = pal.accent; x.fillRect(tx - 1, 25, 4, 5); x.fillRect(tx, 23 - (fk > 0.5), 2, 3);
        x.fillStyle = '#ffffff'; x.fillRect(tx, 27, 2, 2);
        torch.push([tx + 1, 27, 46 + fk * 4, pal.accent, 0.42], [tx + 1, WALL + 30, 60, pal.accent, 0.12]);
      }
      x.restore();
      for (const l of [...L.filter(l => (l[1] < WALL) === onWall), ...torch]) lights.push([l[0] + dx, l[1], l[2], l[3], l[4]]);
    }
  }
  for (const l of lights) glow(x, l[0], l[1], l[2], l[3], l[4]);   // light is not clipped: torches still light the floor
}
// ---- PixelLab environments: parallax layers per place, in assets/env/<slug>/ (slugs listed in ENV_ART, data.js) ----
// far.png (opaque, slowest), wall.png (pillars and arches with see-through gaps), floor.png (opaque, walking speed),
// and foreground props (fastest, only while walking). Each strip loops as itself plus its mirror image, so the seam
// never shows and one loop is two images long; the props come at random spacing, so that layer never repeats.
const ENV_SPEED = { far: 0.15, mid: 0.32, wall: 0.55, fg: 1.7 };
const envArt = {};   // slug -> layers once loaded, null while loading, false if missing
const slugOf = place => (place && place.name ? place.name.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '') : '');
// cut the empty rows off the bottom of a layer, so what stands in it can be stood exactly on the floor line
function trimBottom(img) {
  const s = mk(img.width, img.height), sx = s.getContext('2d');
  sx.drawImage(img, 0, 0);
  const d = sx.getImageData(0, 0, s.width, s.height).data;
  let h = s.height;
  while (h > 1) { let any = false; for (let i = 0; i < s.width && !any; i++) any = d[((h - 1) * s.width + i) * 4 + 3] > 0; if (any) break; h--; }
  const c = mk(img.width, h); c.getContext('2d').drawImage(s, 0, 0);
  return c;
}
function mirrorLoop(img) {
  const c = mk(img.width * 2, img.height), x = c.getContext('2d');
  x.drawImage(img, 0, 0); x.translate(img.width * 2, 0); x.scale(-1, 1); x.drawImage(img, 0, 0);
  return c;
}
function darkened(img, a) {   // foreground props are near-silhouettes, so they never compete with the fight
  const c = mk(img.width, img.height), x = c.getContext('2d');
  x.drawImage(img, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = `rgba(8,5,14,${a})`; x.fillRect(0, 0, c.width, c.height);
  return c;
}
// A strip of separate things (pillars, candelabras) cut apart at its see-through gaps and laid out again with wide,
// uneven spacing in a shuffled order: one long loop that never feels like a fence.
// Real rooms are not fences: some things stand in pairs, most a fair way apart, and now and then there is a long empty
// stretch. Each gap is drawn from one of those three kinds.
const naturalGap = r => (r < 0.25 ? 4 + r * 64 : r < 0.75 ? 60 + (r - 0.25) * 160 : 170 + (r - 0.75) * 640);   // 4–20, 60–140, 170–330
function spacedLoop(img, seed, minPieces = 1) {
  const s = mk(img.width, img.height), sx = s.getContext('2d');
  sx.drawImage(img, 0, 0);
  const d = sx.getImageData(0, 0, s.width, s.height).data, used = i => { for (let y = 0; y < s.height; y++) if (d[(y * s.width + i) * 4 + 3]) return true; return false; };
  const pieces = [];
  for (let i = 0, a = -1; i <= s.width; i++) { const u = i < s.width && used(i); if (u && a < 0) a = i; if (!u && a >= 0) { pieces.push([a, i - a]); a = -1; } }
  if (pieces.length < minPieces || pieces.length > 24) return null;   // one continuous thing (an arcade, a fence), or a scatter of tiny bits: leave it whole
  const order = [...pieces, ...pieces].map((p, i) => [hash(seed + i * 9.7), p]).sort((p, q) => p[0] - q[0]).map(p => p[1]);
  const gaps = order.map((_, i) => Math.round(naturalGap(hash(seed + i * 3.3 + 50))));
  const c = mk(order.reduce((n, p, i) => n + p[1] + gaps[i], 0), img.height), x = c.getContext('2d');
  let at = 0;
  order.forEach(([a, w], i) => { at += Math.round(gaps[i] / 2); x.drawImage(s, a, 0, w, img.height, at, 0, w, img.height); at += w + gaps[i] - Math.round(gaps[i] / 2); });
  return c;
}
function envFor(place) {
  const slug = slugOf(place), cfg = ENV_ART[slug];
  if (!cfg) return null;
  if (envArt[slug] !== undefined) return envArt[slug];
  envArt[slug] = null;
  const dir = `assets/env/${slug}/`;
  Promise.all([loadImg(dir + 'far.png'), loadImg(dir + 'mid.png').catch(() => null), cfg.pillars ? loadImg(dir + 'wall.png') : null, loadImg(dir + 'floor.png'), ...cfg.fg.map(([f]) => loadImg(dir + f + '.png'))])
    .then(([far, mid, wall, floor, ...fg]) => {
      envArt[slug] = { far: mirrorLoop(far),
        mid: mid && (spacedLoop(trimBottom(mid), 29, 4) || mirrorLoop(trimBottom(mid))),   // separate pieces (pillars, idols) get uneven gaps
        wall: wall && (cfg.spaced ? spacedLoop(trimBottom(wall), 17) : mirrorLoop(trimBottom(wall))), floor: mirrorLoop(floor),
        wallDrop: cfg.wallDrop || 12, fg: fg.map((img, i) => ({ img: darkened(img, 0.55), top: cfg.fg[i][1] === 'top' })) };
    })
    .catch(() => { envArt[slug] = false; });
  return null;
}
// one looping strip, scrolled `off` pixels left
function strip(x, img, off, y) {
  const w = img.width, o = ((Math.round(off) % w) + w) % w;
  for (let sx = -o; sx < DUN_W; sx += w) x.drawImage(img, sx, y);
}
// The floor is a top-down texture laid down in perspective: drawn row by row, narrower and denser toward the back, so
// its stones converge like a real floor seen from above at an angle. Nearer rows move faster (the floor's own parallax);
// the row under the heroes' feet moves at walking speed.
const FLOOR_TOP = 84, P_BACK = 0.7, P_FRONT = 1.75, P_FEET = 135, P_STEP = 0.5;
function perspFloor(x, tex, off) {
  const W = DUN_W, FH = DUN_H - FLOOR_TOP, Lw = tex.width, sAt = y => P_BACK + (P_FRONT - P_BACK) * (y - FLOOR_TOP) / FH;
  const toff = off / sAt(P_FEET);
  let v = 0;
  for (let y = FLOOR_TOP; y < DUN_H; y += P_STEP) {
    const s = sAt(y + P_STEP / 2), sw = W / s, sh = P_STEP / s, sy = Math.min(tex.height - sh, v);
    const sx = (((W / 2 - sw / 2 + toff) % Lw) + Lw) % Lw, first = Math.min(sw, Lw - sx);
    x.drawImage(tex, sx, sy, first, sh, 0, y, first * s, P_STEP);
    if (first < sw) x.drawImage(tex, 0, sy, sw - first, sh, first * s, y, (sw - first) * s, P_STEP);
    v += sh;
  }
  const fog = x.createLinearGradient(0, FLOOR_TOP, 0, FLOOR_TOP + FH * 0.45);   // the back of the floor fades into the dark
  fog.addColorStop(0, 'rgba(6,4,12,.6)'); fog.addColorStop(1, 'rgba(6,4,12,0)');
  x.fillStyle = fog; x.fillRect(0, FLOOR_TOP, W, FH * 0.45);
}
function envScenery(x, E, off) {
  // every layer stands on the floor line: the far halls' own ground meets the floor, the arcade's bases touch it
  strip(x, E.far, off * ENV_SPEED.far, FLOOR_TOP + 6 - E.far.height);
  x.fillStyle = 'rgba(6,4,12,.3)'; x.fillRect(0, 0, DUN_W, FLOOR_TOP);   // haze: each layer further back is dimmer
  if (E.mid) { strip(x, E.mid, off * ENV_SPEED.mid, FLOOR_TOP + 2 - E.mid.height); x.fillStyle = 'rgba(6,4,12,.18)'; x.fillRect(0, 0, DUN_W, FLOOR_TOP); }
  perspFloor(x, E.floor, off);
  if (E.wall) strip(x, E.wall, off * ENV_SPEED.wall, FLOOR_TOP + E.wallDrop - E.wall.height);   // optional pillar layer
}
function envForeground(x, E, off, a) {
  if (!E.fg.length || a <= 0.01) return;
  const o = off * ENV_SPEED.fg, SEG = 180, k0 = Math.floor(o / SEG);
  x.globalAlpha = a;
  for (let k = k0 - 1; k <= k0 + 2; k++) {
    if (hash(k * 7.31 + 3) < 0.25) continue;   // some stretches have nothing passing in front
    const p = E.fg[Math.floor(hash(k * 3.7 + 1) * E.fg.length)], px = Math.round(k * SEG + hash(k * 5.3) * (SEG - p.img.width) - o);
    if (px > DUN_W || px + p.img.width < 0) continue;
    x.drawImage(p.img, px, p.top ? -6 : DUN_H - p.img.height + 8);
  }
  x.globalAlpha = 1;
}
// A postcard of a place for the quest panel: its wall and floor, drifting slowly by, with its particles and hazard.
export const PLACE_H = 112;
// A still picture: nothing scrolls or flickers. Returns true once it is final (false while the place's art still loads),
// so the page draws it once instead of every frame.
export function drawPlace(x, place) {
  const W = DUN_W, H = PLACE_H, f = place.style || 1, E = envFor(place);
  if (E) { x.save(); x.translate(0, -12); envScenery(x, E, 0); x.restore(); }
  else scenery(x, f, place.pal, f * 100 + 37, 0, 0);
  if (place.hazard === 'dark') { x.fillStyle = 'rgba(0,0,10,.3)'; x.fillRect(0, 0, W, H); }
  const g = x.createLinearGradient(0, H * 0.45, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.55)');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  return !ENV_ART[slugOf(place)] || E !== null;   // no PixelLab art, or it has loaded (or failed): done
}
export function drawDungeon(x, S, ex, t, anim, floaters) {
  const f = ex.floor, fl = ex.place || FLOORS[f - 1], pal = fl.pal, W = DUN_W, H = DUN_H;
  const walking = !ex.done && ex.phase !== 'fight';
  const sc = floorScroll.get(ex.id) || { off: 0, t, graves: {}, fgA: 0 }, dt = Math.min(0.2, Math.max(0, t - sc.t));
  if (walking) sc.off += dt * WALK_PX;
  sc.fgA = Math.max(0, Math.min(1, sc.fgA + (walking ? dt : -dt) * 3));   // the foreground fades away during fights
  sc.t = t; floorScroll.set(ex.id, sc);
  const E = envFor(fl);
  if (E) envScenery(x, E, sc.off); else scenery(x, f, pal, f * 100 + (ex.depth || 1) * 37, sc.off, t);

  const now = performance.now(), actAge = anim ? now - anim.t : 1e9, lunge = actAge < 260 ? Math.sin((actAge / 260) * Math.PI) * 6 : 0;
  const hitAge = (side, k, heal = false) => { let a = 1e9; for (const fo of floaters) if (fo.ex === ex.id && fo.side === side && (side === 'h' ? fo.id : fo.i) === k && !fo.txt && !!fo.heal === heal) a = Math.min(a, now - fo.t0); return a; };
  const bar = (bx, by, w, r, col) => { x.fillStyle = INK; x.fillRect(bx - 1, by - 1, w + 2, 4); x.fillStyle = '#3a2a30'; x.fillRect(bx, by, w, 2); x.fillStyle = col; x.fillRect(bx, by, Math.max(0, Math.round(w * r)), 2); x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(bx, by, Math.max(0, Math.round(w * r)), 1); };
  // every unit becomes { y, draw, over }: drawn back-to-front by feet y; `over` (bars, glows) after all bodies
  const units = [], heroAt = {}, lay = enemyLayout(ex);
  ex.heroIds.forEach((id, i) => {
    const h = findHero(S, id), [hx, hy] = HERO_SLOTS[i] || HERO_SLOTS[0];
    heroAt[id] = [hx, hy];
    if (!h) {
      // a gravestone where the hero fell: it stays on that spot, so it slides away behind the party when they walk on
      if (sc.graves[id] == null) sc.graves[id] = sc.off;
      const gx = Math.round(hx - (sc.off - sc.graves[id])), gy = hy, gi = propArt.grave;
      if (gx < -30) return;
      units.push({ y: hy, draw() {
        shadow(x, gx, gy, 20);
        if (gi) { x.drawImage(gi, gx - Math.round(gi.width / 2), gy - gi.height + 1); return; }
        const g0 = gx - 9; x.fillStyle = INK; x.fillRect(g0, gy - 22, 18, 22); x.fillStyle = '#9a9aa6'; x.fillRect(g0 + 1, gy - 20, 16, 20); x.fillRect(g0 + 3, gy - 21, 12, 1); x.fillStyle = '#6a6a76'; x.fillRect(g0 + 15, gy - 20, 2, 20); x.fillStyle = '#4a4a56'; x.fillRect(g0 + 8, gy - 17, 2, 11); x.fillRect(g0 + 5, gy - 14, 8, 2);
      } });
      return;
    }
    if (ex.done && ex.outcome !== 'wiped') return;
    const acting = ex.act && ex.act.side === 'h' && ex.act.id === id, hurt = hitAge('h', id) < 150, healAge = hitAge('h', id, true), healed = healAge < 400;
    const dx = (acting ? lunge : 0) - (hurt ? 2 : 0);
    let fr;
    if (acting && actAge < ATK_MS) { const n = heroFrame(h, 'attack', 0).n; fr = heroFrame(h, 'attack', Math.min(n - 1, Math.floor(actAge / ATK_MS * n))); }
    else fr = walking ? heroFrame(h, 'walk', Math.floor(t * 9 + i * 2)) : heroFrame(h, 'idle', idleK(t, i));
    units.push({
      y: hy,
      draw() {
        shadow(x, hx + dx, hy, 26);
        drawHero(x, fr, hx + dx, hy);
        if (hurt) { x.globalAlpha = 0.75; drawHero(x, { ...fr, img: flashOf(fr.img) }, hx + dx, hy); x.globalAlpha = 1; }
      },
      over() {
        if (healed) glow(x, hx, hy - 30, 28, '#7dff8a', 0.45 * (1 - healAge / 400));
        if (acting && actAge < ATK_MS && (h.cls === 'mage' || h.cls === 'cleric')) glow(x, hx + 14 + dx, hy - 48, 18, h.cls === 'mage' ? '#6fd6ff' : '#ffe9a0', 0.7);
        const r = h.hp / (h.maxHp ?? heroStats(h).maxHp), top = hy - (fr.k !== 1 ? Math.round(fr.vh * fr.k) : HERO_TALL) - 4;
        bar(hx - 10, top, 20, r, r > 0.5 ? '#5fd05f' : r > 0.25 ? '#e0c14a' : '#e04a4a');
        if (ex.cs[id] && ex.cs[id].poison > 0) { x.fillStyle = '#9be05f'; x.fillRect(hx - 3, top - 5, 2, 2); x.fillRect(hx + 1, top - 7, 1, 1); x.fillRect(hx - 6, top - 6, 1, 1); }
      },
    });
  });
  ex.enemies.forEach((e, i) => {
    if (e.hp <= 0) return;
    const L = lay[i], dx = ex.act && ex.act.side === 'e' && ex.act.i === i ? -lunge : 0;
    const air = e.shape === 'flyer' || e.shape === 'ghost' || e.shape === 'eye';
    // fliers hover; enemies with PixelLab art (single still frame) get a slow 1px breathing bob
    const bob = air ? Math.round(Math.sin(t * 3 + i) * 2) - 12 : enemyArt[e.key] ? (Math.sin(t * 2.4 + i * 1.7) > 0.4 ? -1 : 0) : 0;
    const left = Math.round(L.fx - L.w / 2 + dx), top = Math.round(L.fy - L.h + bob);
    L.cx = L.fx; L.top = top;
    const ehit = hitAge('e', i) < 150, ex2 = left + (ehit ? 2 : 0);
    units.push({
      y: L.fy,
      draw() {
        shadow(x, L.fx + dx, L.fy, L.w * (air ? 0.5 : 0.8));
        if (e.boss) glow(x, L.fx, top + L.h / 2, 46, e.color, 0.3 + 0.08 * Math.sin(t * 2));
        if (e.shape === 'ghost') x.globalAlpha = 0.85;
        x.drawImage(L.spr, ex2, top, L.w, L.h);
        x.globalAlpha = 1;
        if (ehit) { x.globalAlpha = 0.75; x.drawImage(flashOf(L.spr), ex2, top, L.w, L.h); x.globalAlpha = 1; }
      },
      over() { const bw = Math.min(32, Math.max(16, L.w - 8)); bar(Math.round(L.fx - bw / 2), top - 5, bw, e.hp / e.maxHp, e.boss ? '#c07be8' : '#e04a4a'); },
    });
  });
  units.sort((a, b) => a.y - b.y);
  for (const u of units) u.draw();
  if (E) envForeground(x, E, sc.off, sc.fgA);
  for (const u of units) if (u.over) u.over();
  particles(x, f, t, pal);
  if (fl.hazard === 'dark') { x.fillStyle = 'rgba(0,0,10,.42)'; x.fillRect(0, 0, W, H); }
  if (fl.hazard === 'burn') { x.fillStyle = `rgba(255,90,20,${0.07 + 0.03 * Math.sin(t * 4)})`; x.fillRect(0, 0, W, H); }
  vignette(x, W, H, 0.6);
  // floating numbers
  x.textAlign = 'center'; x.font = 'bold 9px ui-monospace, Menlo, Consolas, monospace';
  for (const fo of floaters) {
    if (fo.ex !== ex.id) continue;
    const age = (now - fo.t0) / 900; if (age > 1) continue;
    let fx, fy;
    if (fo.side === 'h') { const at = heroAt[fo.id]; if (!at) continue; fx = at[0]; fy = at[1] - HERO_TALL - 8; }
    else { const L = lay[fo.i]; if (!L) continue; fx = L.fx; fy = (L.top ?? L.fy - L.h) - 8; }
    fy -= age * 12; fx += fo.jx;
    const s = fo.txt || (fo.heal ? '+' : '-') + fo.n;
    x.globalAlpha = 1 - age * age;
    x.lineWidth = 2; x.strokeStyle = INK; x.strokeText(s, fx, fy);
    x.fillStyle = fo.txt ? '#cfd3da' : fo.heal ? '#7dff8a' : fo.crit ? '#ffd23a' : fo.side === 'h' ? '#ff6a5a' : '#ffffff';
    x.fillText(s, fx, fy);
    x.globalAlpha = 1;
  }
  if (ex.done) {
    x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(0, 0, W, H);
    x.font = 'bold 14px ui-monospace, Menlo, Consolas, monospace';
    x.fillStyle = ex.outcome === 'wiped' ? '#ff6a5a' : ex.outcome === 'cleared' ? '#ffd23a' : '#cfd3da';
    x.fillText(ex.outcome === 'wiped' ? 'PARTY LOST' : ex.outcome === 'cleared' ? 'ROOM CLEARED' : 'RETREATED', W / 2, H / 2);
  }
}
// for tools/env-preview.html: a place's PixelLab layers as one full-height still scene; true once drawn
export function drawScene(x, place, off = 0) { const E = envFor(place); if (!E) return E === false; envScenery(x, E, off); return true; }
