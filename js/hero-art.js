// Hero sprite painter: 32x48 chibi figures (big head and hair, slim body, cape, held weapon).
// Pure drawing: receives p(x, y, w, h, colour) and the colour helpers, knows nothing about canvases.
import { RARITY } from './data.js';

const OUTFIT = {
  warrior: ['#a8463e', '#b8323a'], rogue: ['#3b3a4c', '#8a5cc0'], mage: ['#3b5cc0', '#e8c44a'],
  cleric: ['#ece6d4', '#d9a93f'], ranger: ['#4c8040', '#8a6238'],
};
const METAL = '#b4bdc9', BLADE = '#e8eef5', WOOD = '#7a5a36', GOLD = '#e8c44a', LEATHER = '#8a6238';
const IRIS = ['#3a6ea8', '#4a8a4a', '#7a4a2a', '#6a4a9a', '#a8504a'];

// pose: { bob: 0|1 (breathing), step: 0|1|2 (which leg is lifted), atk: 0|1|2 (wind-up, strike), blink }
export function paintHero(h, raw, shade, pose = {}) {
  const bob = pose.bob ? 1 : 0, step = pose.step || 0, atk = pose.atk || 0, lean = atk === 2 ? 1 : 0;
  let ox = 0, oy = 0;
  const p = (x, y, w, hh, c) => raw(x + ox, y + oy, w, hh, c);
  const L = c => shade(c, 1.2), D = c => shade(c, 0.74), DD = c => shade(c, 0.55);
  // block lit from the top-left
  const box = (x, y, w, hh, c) => { p(x, y, w, hh, c); p(x, y, 1, hh, L(c)); p(x, y, w, 1, L(c)); p(x + w - 1, y, 1, hh, D(c)); p(x, y + hh - 1, w, 1, D(c)); };
  const g = h.gear || {}, ar = g.armor ? g.armor.rar : -1, wr = g.weapon ? g.weapon.rar : -1;
  const [fit, trim] = OUTFIT[h.cls], { skin, hair, style } = h.look, f = h.gender === 'f', cls = h.cls;
  const robe = cls === 'mage' || cls === 'cleric';
  const rim = ar >= 1 ? RARITY[ar].color : GOLD, glint = wr >= 1 ? RARITY[wr].color : null;
  const iris = IRIS[(hair.charCodeAt(1) + hair.charCodeAt(3) + skin.charCodeAt(2)) % IRIS.length];
  const pants = cls === 'rogue' ? '#2f2d3a' : cls === 'ranger' ? '#6a5236' : '#4a4038';
  const boot = cls === 'warrior' && ar >= 0 ? '#7f8a98' : cls === 'ranger' ? '#5a4226' : '#3a2a22';

  // --- behind the body: cape, veil, quiver, long hair ---
  ox = lean; oy = bob;
  if (cls === 'warrior') { p(8, 21, 16, 20, D(trim)); p(8, 21, 1, 20, trim); p(8, 41, 3, 2, D(trim)); p(13, 41, 4, 1, D(trim)); p(20, 41, 4, 2, DD(trim)); p(22, 22, 2, 19, DD(trim)); }
  if (cls === 'rogue' || cls === 'ranger') { p(8, 20, 16, 17, D(fit)); p(8, 20, 1, 17, fit); p(22, 21, 2, 16, DD(fit)); p(9, 37, 4, 2, D(fit)); p(16, 37, 5, 1, D(fit)); }
  if (cls === 'cleric') { const v = '#f6f2e6'; p(8, 4, 16, 22, v); p(7, 7, 18, 16, v); p(22, 8, 3, 16, D(v)); p(9, 26, 14, 2, D(v)); }
  if (cls === 'ranger') { p(4, 13, 4, 12, WOOD); p(4, 13, 1, 12, L(WOOD)); p(4, 13, 4, 1, GOLD); p(4, 9, 1, 4, '#ffffff'); p(6, 8, 1, 5, '#ffffff'); p(5, 10, 1, 3, '#d94a3a'); p(7, 10, 1, 3, '#e8e0d0'); }
  if (f && cls !== 'cleric') {
    if (style === 2) { p(21, 6, 4, 4, hair); p(23, 9, 4, 14, hair); p(25, 10, 2, 12, D(hair)); p(24, 23, 2, 3, D(hair)); p(22, 7, 2, 2, trim); }
    else { p(8, 8, 16, 19, D(hair)); p(8, 8, 2, 19, hair); p(9, 27, 14, 2, D(hair)); p(10, 29, 4, 1, D(hair)); p(18, 29, 4, 1, DD(hair)); }
  }

  // --- legs or robe skirt ---
  ox = 0; oy = 0;
  if (robe) {
    for (let y = 30; y <= 45; y++) { const half = 5 + Math.floor((y - 30) / 4), x0 = 16 - half; p(x0, y, half * 2, 1, fit); p(x0, y, 1, 1, L(fit)); p(x0 + half * 2 - 2, y, 2, 1, D(fit)); }
    p(13, 34, 1, 11, D(fit)); p(19, 33, 1, 12, D(fit)); p(10, 38, 1, 7, D(fit));
    p(8, 44, 16, 2, trim); p(8, 45, 16, 1, D(trim));
    p(11 + (step === 1 ? 1 : 0), 46, 4, 1, '#2e2620'); p(17 + (step === 2 ? 1 : 0), 46, 4, 1, '#2e2620');
  } else {
    if (step === 1) { ox = 1; oy = -2; }
    box(11, 33, 5, 8, pants); p(15, 34, 1, 7, DD(pants)); box(10, 40, 6, 6, boot); p(10, 40, 6, 1, L(boot)); p(10, 46, 6, 1, '#17120f');
    if (cls === 'ranger') p(10, 41, 6, 1, WOOD);
    ox = 0; oy = 0; if (step === 2) { ox = 1; oy = -2; }
    box(16, 33, 5, 8, pants); p(16, 34, 5, 7, D(pants)); p(16, 34, 1, 7, DD(pants)); box(16, 40, 6, 6, boot); p(16, 40, 6, 1, L(boot)); p(16, 46, 6, 1, '#17120f');
    if (cls === 'ranger') p(16, 41, 6, 1, WOOD);
    ox = 0; oy = 0;
  }

  // --- torso, arms ---
  ox = lean; oy = bob;
  box(11, 20, 10, 10, fit); p(11, 20, 10, 1, D(fit)); p(18, 22, 2, 7, D(fit));
  if (!robe) { p(11, 30, 10, 4, D(fit)); p(11, 30, 1, 4, fit); p(11, 33, 10, 1, trim); p(15, 30, 1, 3, DD(fit)); }
  const wide = robe ? 1 : 0;
  box(8 - wide, 21, 3 + wide, 9, fit); box(21, 21, 3 + wide, 9, fit); p(21, 22, 3 + wide, 8, D(fit)); p(21, 21, 1, 9, DD(fit));
  if (robe) { p(7, 29, 4, 2, trim); p(21, 29, 4, 2, trim); }
  p(8, 31 - (robe ? 0 : 1), 3, 3, skin); p(21, 31 - (robe ? 0 : 1), 3, 3, D(skin));
  p(11, 28, 10, 2, '#4a3323'); p(11, 28, 10, 1, '#6a4a32'); p(15, 28, 2, 2, GOLD);

  // --- class clothing ---
  if (cls === 'warrior') {
    if (ar >= 0) {
      box(11, 20, 10, 8, METAL); p(11, 20, 10, 1, rim); p(15, 21, 2, 6, L(METAL)); p(12, 26, 8, 1, D(METAL));
      box(11, 30, 4, 4, METAL); box(17, 30, 4, 4, D(METAL)); p(11, 33, 4, 1, rim); p(17, 33, 4, 1, rim);
      box(6, 18, 6, 5, METAL); p(6, 22, 6, 1, rim); p(7, 19, 2, 1, '#ffffff'); box(20, 18, 6, 5, METAL); p(20, 22, 6, 1, rim); p(20, 19, 6, 3, D(METAL)); p(20, 18, 6, 1, METAL);
      p(8, 27, 3, 3, METAL); p(21, 27, 3, 3, D(METAL));
    } else { p(13, 21, 6, 1, L(fit)); p(15, 22, 2, 6, D(fit)); p(8, 27, 3, 3, LEATHER); p(21, 27, 3, 3, D(LEATHER)); }
  } else if (cls === 'rogue') {
    for (let i = 0; i < 4; i++) p(12 + i * 2, 21 + i * 2, 2, 2, LEATHER);
    p(12, 30, 3, 3, LEATHER); p(12, 30, 3, 1, L(LEATHER)); p(18, 30, 2, 3, D(LEATHER));
    p(8, 27, 3, 3, '#22212c'); p(21, 27, 3, 3, '#1a1922');
    if (ar >= 0) { box(7, 19, 5, 3, LEATHER); box(20, 19, 5, 3, D(LEATHER)); p(7, 21, 5, 1, rim); p(20, 21, 5, 1, rim); }
  } else if (cls === 'mage') {
    p(8, 19, 16, 4, D(fit)); p(8, 19, 16, 1, fit); p(8, 22, 16, 1, ar >= 1 ? rim : trim); p(15, 20, 2, 2, GOLD); p(15, 24, 2, 4, trim);
    p(15, 31, 2, 13, trim); p(16, 31, 1, 13, D(trim));
  } else if (cls === 'cleric') {
    p(12, 20, 2, 24, trim); p(18, 20, 2, 24, D(trim)); p(15, 22, 2, 6, trim); p(13, 24, 6, 2, trim);
    p(8, 19, 16, 3, '#f6f2e6'); p(8, 21, 16, 1, ar >= 1 ? rim : trim); p(22, 19, 2, 2, D('#f6f2e6'));
  } else {
    p(9, 18, 14, 3, D(fit)); p(9, 18, 14, 1, fit); p(21, 19, 2, 2, DD(fit));
    for (let i = 0; i < 4; i++) p(18 - i * 2, 21 + i * 2, 2, 2, LEATHER);
    p(8, 27, 3, 3, LEATHER); p(21, 27, 3, 3, D(LEATHER));
    if (ar >= 0) { box(7, 19, 5, 3, LEATHER); box(20, 19, 5, 3, D(LEATHER)); p(7, 21, 5, 1, rim); p(20, 21, 5, 1, rim); }
  }

  // --- head ---
  p(14, 18, 4, 2, D(skin));
  p(12, 6, 8, 2, skin); p(10, 8, 12, 9, skin); p(11, 17, 10, 1, skin); p(12, 18, 8, 1, skin);
  p(21, 9, 1, 7, D(skin)); p(19, 17, 2, 1, D(skin)); p(17, 18, 3, 1, D(skin)); p(10, 10, 12, 1, shade(skin, 0.9));
  // big anime eyes: dark lash line, bright iris, white catch-light
  for (const ex of [11, 18]) {
    p(ex, 11, 3, 1, '#2a1c24'); p(ex, 12, 3, 3, iris); p(ex, 12, 3, 1, shade(iris, 0.7)); p(ex + 1, 13, 2, 2, shade(iris, 0.55));
    p(ex, 12, 1, 2, '#ffffff'); p(ex + 2, 14, 1, 1, shade(iris, 1.5));
  }
  p(10, 11, 1, 1, '#2a1c24'); p(21, 11, 1, 1, '#2a1c24');
  if (pose.blink) for (const ex of [11, 18]) { p(ex, 11, 3, 4, skin); p(ex, 13, 3, 1, '#2a1c24'); }
  p(10, 15, 2, 1, '#f0a090'); p(20, 15, 2, 1, '#f0a090'); p(15, 16, 2, 1, '#b06a5a');
  if (!f && style === 1) { p(12, 17, 8, 2, D(hair)); p(11, 15, 1, 3, D(hair)); p(20, 15, 1, 3, DD(hair)); p(15, 16, 2, 1, '#b06a5a'); }

  // --- hair in front ---
  p(11, 3, 10, 2, hair); p(9, 5, 14, 3, hair); p(9, 8, 13, 2, hair);
  p(13, 9, 1, 1, skin); p(16, 9, 2, 1, skin); p(20, 9, 1, 1, skin);
  p(9, 10, 2, 6, hair); p(9, 10, 1, 6, L(hair)); p(21, 10, 2, 5, D(hair)); p(20, 5, 3, 4, D(hair));
  p(11, 5, 6, 1, L(hair)); p(12, 6, 3, 1, L(hair)); p(11, 3, 4, 1, L(hair));
  if (style === 0) p(14, 2, 3, 1, hair);
  if (style === 1) p(15, 4, 1, 5, D(hair));
  if (style === 2 && !f) { p(11, 2, 2, 1, hair); p(15, 1, 2, 2, hair); p(19, 2, 2, 1, D(hair)); }
  if (f) { p(9, 16, 2, 4, hair); p(21, 15, 2, 4, D(hair)); }

  // --- headgear ---
  if (cls === 'rogue') {
    p(9, 2, 14, 6, fit); p(8, 5, 3, 14, fit); p(21, 5, 3, 14, D(fit)); p(14, 1, 4, 1, fit); p(10, 3, 7, 1, L(fit)); p(8, 6, 1, 12, L(fit)); p(19, 3, 4, 5, D(fit));
    p(11, 16, 10, 3, trim); p(11, 16, 10, 1, L(trim)); p(19, 17, 2, 2, D(trim)); p(20, 19, 3, 6, D(trim)); p(21, 25, 2, 2, DD(trim));
  } else if (cls === 'mage') {
    p(5, 6, 22, 2, fit); p(5, 7, 22, 1, D(fit)); p(5, 6, 8, 1, L(fit)); p(10, 2, 12, 4, fit); p(12, 0, 8, 2, fit); p(19, 0, 4, 1, fit); p(22, 1, 2, 1, D(fit));
    p(11, 1, 1, 4, L(fit)); p(18, 2, 4, 3, D(fit)); p(10, 5, 12, 1, trim); p(15, 5, 2, 1, '#fff7b0'); p(14, 2, 1, 1, '#fff7b0');
  } else if (cls === 'cleric') {
    p(10, 7, 12, 1, GOLD); p(15, 6, 2, 2, '#6fd6ff'); p(15, 6, 1, 1, '#ffffff');
  } else if (cls === 'ranger') {
    p(10, 2, 12, 4, fit); p(9, 5, 15, 1, D(fit)); p(10, 2, 6, 1, L(fit)); p(18, 3, 4, 2, D(fit)); p(22, 5, 3, 1, D(fit));
    p(20, 0, 2, 4, '#d94a3a'); p(21, 0, 1, 2, '#ff9a8a'); p(22, 1, 1, 2, '#b8323a');
  } else if (ar >= 0) { p(10, 7, 12, 1, METAL); p(15, 6, 2, 2, rim); }

  // --- weapons ---
  if (atk === 1) { ox = lean - 1; oy = bob - 3; } else if (atk === 2) { ox = lean + 2; oy = bob + 1; }
  if (cls === 'warrior') {
    p(24, 6, 2, 24, BLADE); p(25, 7, 1, 23, METAL); p(24, 5, 1, 1, BLADE); p(24, 8, 1, 6, '#ffffff'); if (glint) p(24, 15, 1, 8, glint);
    p(22, 30, 6, 2, GOLD); p(22, 31, 6, 1, D(GOLD)); p(24, 32, 2, 4, '#5a3a22'); p(24, 36, 2, 1, GOLD);
    box(2, 22, 8, 12, trim); p(3, 34, 6, 2, trim); p(4, 36, 4, 2, D(trim)); p(5, 38, 2, 1, DD(trim));
    p(2, 22, 8, 1, METAL); p(2, 22, 1, 12, L(METAL)); p(9, 23, 1, 11, D(METAL)); p(5, 25, 2, 7, GOLD); p(4, 27, 4, 2, GOLD);
  } else if (cls === 'rogue') {
    for (const dx of [22, 9]) { p(dx, 33, 1, 7, BLADE); p(dx, 39, 1, 1, METAL); p(dx - 1, 32, 3, 1, GOLD); if (glint) p(dx, 34, 1, 3, glint); }
  } else if (cls === 'mage') {
    const orb = glint || '#6fd6ff';
    p(25, 9, 2, 37, WOOD); p(26, 9, 1, 37, D(WOOD)); p(23, 3, 6, 1, GOLD); p(23, 3, 1, 6, GOLD); p(28, 3, 1, 6, D(GOLD)); p(24, 9, 4, 1, GOLD);
    p(24, 4, 4, 4, orb); p(24, 4, 2, 2, '#ffffff'); p(26, 6, 2, 2, D(orb));
  } else if (cls === 'cleric') {
    const head = glint || GOLD;
    p(25, 14, 2, 31, WOOD); p(26, 14, 1, 31, D(WOOD)); box(23, 8, 6, 6, head); p(22, 10, 1, 2, head); p(29, 10, 1, 2, D(head)); p(25, 6, 2, 2, head); p(25, 14, 2, 1, GOLD); p(24, 9, 2, 2, '#ffffff');
  } else {
    const bow = glint || '#9a6a3a';
    p(27, 9, 2, 28, bow); p(28, 9, 1, 28, D(bow)); p(26, 6, 2, 4, bow); p(25, 4, 2, 3, bow); p(26, 36, 2, 4, bow); p(25, 39, 2, 3, D(bow));
    p(24, 5, 1, 36, 'rgba(240,240,240,.85)'); p(27, 21, 2, 4, LEATHER);
  }
}
