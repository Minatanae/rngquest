// Enemy sprite painters. Each draws one creature type on a 36x36 grid (boss: 60x66), facing left,
// tinted by the enemy's own colour `c`. Pure drawing: receives p(x, y, w, h, colour) and shade().
const BONE = '#e6dcc4', DARK = '#14121a', WOOD = '#7a5a36', GOLD = '#e8c44a', STEEL = '#dfe6ee', PINK = '#f0a0a0';
export const ENEMY_SIZE = { boss: [60, 66] };

export function paintEnemy(shape, c, p, shade) {
  const L = k => shade(k, 1.25), D = k => shade(k, 0.7), DD = k => shade(k, 0.5), R = Math.round;
  const box = (x, y, w, h, k) => { p(x, y, w, h, k); p(x, y, 1, h, L(k)); p(x, y, w, 1, L(k)); p(x + w - 1, y, 1, h, D(k)); p(x, y + h - 1, w, 1, D(k)); };
  const ell = (cx, cy, rx, ry, k) => { for (let y = -ry; y <= ry; y++) { const w = R(rx * Math.sqrt(1 - (y * y) / (ry * ry + 0.01))); p(R(cx) - w, R(cy) + y, w * 2 + 1, 1, k); } };
  // shaded ball, lit from the top-left
  const ball = (cx, cy, rx, ry, k) => { ell(cx, cy, rx, ry, D(k)); ell(cx - 1, cy - 1, Math.max(1, rx - 1), Math.max(1, ry - 1), k); ell(cx - rx * 0.4, cy - ry * 0.45, Math.max(1, R(rx * 0.3)), Math.max(1, R(ry * 0.25)), L(k)); };
  const line = (x0, y0, x1, y1, k, w = 1) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let i = 0; i <= n; i++) p(R(x0 + ((x1 - x0) * i) / n), R(y0 + ((y1 - y0) * i) / n), w, w, k); };
  const eye = (x, y, k = '#ffffff') => { p(x, y, 3, 3, k); p(x, y + 1, 2, 2, DARK); p(x + 2, y, 1, 1, '#ffffff'); };

  const paint = {
    blob() {
      ell(18, 32, 16, 3, D(c)); ball(18, 23, 14, 11, c); ell(18, 31, 14, 3, c);
      p(3, 33, 3, 2, D(c)); p(29, 33, 4, 2, D(c)); ell(26, 21, 2, 2, L(c)); ell(24, 27, 1, 1, L(c));
      p(8, 14, 5, 2, '#ffffff'); p(7, 16, 2, 3, '#ffffff');
      eye(9, 21); eye(18, 21); p(12, 28, 7, 1, DARK); p(11, 27, 1, 1, DARK); p(19, 27, 1, 1, DARK);
    },
    rat() {
      line(31, 28, 34, 24, PINK, 2); line(34, 24, 33, 18, PINK, 1);
      ball(21, 26, 11, 7, c); ball(10, 24, 6, 5, c); p(3, 25, 5, 3, c); p(3, 27, 5, 1, D(c)); p(2, 25, 2, 2, PINK);
      ball(12, 17, 3, 3, c); ell(12, 17, 1, 1, PINK); ball(7, 18, 2, 2, D(c));
      p(8, 22, 2, 2, '#ff5a4a'); p(8, 22, 1, 1, '#ffd0c0'); p(5, 28, 1, 2, '#ffffff'); p(1, 28, 3, 1, '#d8d8d8'); p(2, 30, 3, 1, '#d8d8d8');
      p(13, 31, 3, 3, D(c)); p(12, 34, 5, 1, PINK); p(25, 31, 4, 3, D(c)); p(24, 34, 6, 1, PINK);
      for (let i = 0; i < 4; i++) p(16 + i * 4, 19 + (i % 2), 2, 1, L(c));
    },
    beast() {
      ell(33, 14, 2, 6, c); ell(33, 12, 1, 4, L(c));
      box(25, 25, 3, 10, D(c)); box(29, 26, 3, 9, DD(c)); ball(22, 21, 11, 7, c); ball(13, 20, 6, 7, c);
      box(9, 26, 3, 9, c); box(14, 27, 3, 8, D(c)); p(8, 34, 5, 1, DD(c)); p(24, 34, 5, 1, DD(c));
      ball(9, 14, 6, 5, c); box(1, 15, 7, 4, c); p(1, 15, 2, 2, DARK); p(2, 19, 6, 1, DARK); p(3, 20, 1, 2, '#ffffff'); p(6, 20, 1, 2, '#ffffff');
      p(8, 6, 2, 5, c); p(9, 5, 1, 1, c); p(12, 7, 2, 4, D(c)); p(9, 8, 1, 2, PINK);
      p(7, 12, 3, 2, '#ffe66b'); p(7, 13, 1, 1, DARK); p(6, 11, 4, 1, DD(c));
      for (let i = 0; i < 5; i++) p(14 + i * 3, 14 + (i % 2), 2, 1, L(c));
    },
    humanoid() {
      box(11, 27, 4, 7, c); box(17, 27, 4, 7, D(c)); p(9, 33, 6, 2, D(c)); p(17, 33, 6, 2, DD(c));
      box(10, 16, 12, 12, '#6a5444'); p(10, 26, 3, 3, '#6a5444'); p(15, 27, 2, 2, '#6a5444'); p(19, 26, 3, 3, '#4a3a2e'); p(10, 22, 12, 1, '#3a2a1c'); p(14, 18, 4, 3, '#4a3a2e');
      box(22, 17, 4, 10, D(c)); p(22, 27, 4, 2, DD(c));
      ball(15, 10, 7, 6, c); p(4, 7, 5, 2, c); p(3, 6, 2, 1, c); p(22, 7, 5, 2, D(c)); p(26, 6, 2, 1, D(c));
      p(9, 8, 4, 1, DD(c)); p(15, 8, 4, 1, DD(c)); eye(10, 9, '#ffe66b'); eye(16, 9, '#ffe66b');
      p(10, 13, 8, 1, DARK); p(11, 13, 1, 1, '#ffffff'); p(16, 13, 1, 1, '#ffffff'); p(11, 12, 1, 1, '#ffffff');
      box(6, 17, 4, 9, c); p(5, 25, 5, 3, c);
      p(3, 12, 3, 16, WOOD); p(3, 12, 1, 16, shade(WOOD, 1.25)); ball(4, 9, 3, 4, WOOD); p(1, 7, 1, 2, STEEL); p(7, 9, 1, 2, STEEL); p(3, 4, 1, 2, STEEL);
    },
    skeleton() {
      p(3, 6, 2, 20, '#9aa3ad'); p(3, 6, 1, 20, STEEL); p(3, 4, 1, 2, STEEL); p(4, 12, 1, 3, '#8a5a3a'); p(1, 25, 6, 1, WOOD); p(3, 26, 2, 3, '#3a2a22');
      p(11, 20, 10, 9, 'rgba(70,45,60,.85)'); p(11, 29, 3, 2, 'rgba(70,45,60,.85)'); p(17, 29, 2, 3, 'rgba(70,45,60,.85)');
      p(15, 16, 2, 13, c); for (let i = 0; i < 4; i++) { p(10, 17 + i * 3, 12, 1, i % 2 ? D(c) : c); p(10, 18 + i * 3, 1, 1, c); p(21, 18 + i * 3, 1, 1, D(c)); }
      p(11, 28, 10, 2, c); p(11, 29, 10, 1, D(c));
      p(7, 17, 2, 9, c); p(6, 25, 3, 2, c); p(24, 17, 2, 9, D(c)); p(24, 26, 3, 2, D(c)); p(8, 16, 4, 2, c); p(20, 16, 5, 2, D(c));
      p(12, 30, 2, 5, c); p(18, 30, 2, 5, D(c)); p(10, 34, 5, 1, c); p(17, 34, 5, 1, D(c));
      ball(16, 9, 6, 6, c); p(12, 13, 8, 3, c); p(12, 7, 3, 4, DARK); p(17, 7, 3, 4, DARK); p(13, 9, 1, 1, '#6fd6ff'); p(18, 9, 1, 1, '#6fd6ff');
      p(15, 11, 1, 2, DARK); p(12, 14, 8, 1, DARK); for (let i = 0; i < 4; i++) p(12 + i * 2, 14, 1, 1, c);
    },
    flyer() {
      for (const m of [0, 1]) for (let x = 1; x <= 13; x++) {
        const d = 13 - x, top = 14 - Math.floor(d * 0.65), bot = 22 - Math.floor(d * 0.45) + (d % 4 === 0 ? -3 : d % 4 === 2 ? 1 : 0), X = m ? 35 - x : x;
        p(X, top, 1, Math.max(1, bot - top), m ? DD(c) : D(c)); p(X, top, 1, 1, m ? D(c) : L(c));
        if (d % 4 === 0) p(X, top, 1, bot - top + 2, m ? D(c) : c);
      }
      ball(18, 19, 5, 6, c); ball(18, 11, 5, 4, c); p(13, 4, 2, 5, c); p(14, 3, 1, 1, c); p(21, 4, 2, 5, D(c)); p(22, 3, 1, 1, D(c)); p(14, 6, 1, 2, PINK);
      p(14, 10, 3, 2, '#ff5a4a'); p(19, 10, 3, 2, '#ff5a4a'); p(14, 10, 1, 1, '#ffd0c0'); p(19, 10, 1, 1, '#ffd0c0');
      p(16, 13, 4, 1, DARK); p(16, 14, 1, 2, '#ffffff'); p(19, 14, 1, 2, '#ffffff'); p(16, 25, 1, 2, DD(c)); p(19, 25, 1, 2, DD(c));
    },
    spider() {
      for (let i = 0; i < 4; i++) { line(14 + i * 3, 22, 9 + i * 7, 10 + (i % 2) * 2, DD(c), 2); line(9 + i * 7, 10 + (i % 2) * 2, 5 + i * 8, 34, DD(c), 2); }
      ball(24, 20, 9, 8, c); p(22, 15, 5, 2, '#ff5a4a'); p(23, 17, 3, 1, '#ff5a4a'); p(22, 18, 5, 2, '#ff5a4a');
      for (let i = 0; i < 4; i++) { line(10 + i * 3, 23, 3 + i * 6, 12 + (i % 2) * 2, c, 2); line(3 + i * 6, 12 + (i % 2) * 2, 1 + i * 7, 34, D(c), 2); p(3 + i * 6, 11 + (i % 2) * 2, 2, 1, L(c)); }
      ball(11, 23, 6, 5, c);
      p(6, 21, 2, 2, '#ff5a4a'); p(9, 20, 2, 2, '#ff5a4a'); p(6, 24, 1, 1, '#ff5a4a'); p(10, 23, 1, 1, '#ff5a4a'); p(6, 21, 1, 1, '#ffd0c0'); p(9, 20, 1, 1, '#ffd0c0');
      p(5, 27, 1, 3, '#ffffff'); p(8, 27, 1, 3, '#ffffff'); p(5, 26, 4, 1, DD(c));
    },
    ghost() {
      for (let y = 16; y <= 35; y++) {
        const half = 9 - Math.floor((y - 16) / 5), cx = 18 + R(Math.sin(y / 3) * 1.5);
        for (let x = cx - half; x <= cx + half; x++) { if (y > 31 && (x + y) % 3 === 0) continue; p(x, y, 1, 1, x < cx - half + 2 ? L(c) : x > cx + half - 3 ? DD(c) : (x + y) % 7 === 0 ? D(c) : c); }
      }
      p(5, 18, 9, 4, c); p(5, 18, 9, 1, L(c)); p(5, 21, 9, 1, D(c)); p(2, 18, 3, 1, BONE); p(1, 20, 4, 1, BONE); p(2, 22, 3, 1, BONE);
      p(24, 19, 6, 4, D(c)); p(29, 22, 3, 1, D(BONE)); p(30, 20, 3, 1, D(BONE));
      ball(17, 11, 9, 9, c); p(10, 16, 15, 3, c); ell(15, 12, 5, 5, DARK); p(11, 11, 2, 2, '#b8f2ff'); p(16, 11, 2, 2, '#b8f2ff'); p(12, 15, 5, 1, '#3a3050');
    },
    golem() {
      box(27, 10, 7, 15, D(c)); box(27, 24, 8, 7, D(c)); box(19, 26, 7, 9, D(c)); box(10, 26, 7, 9, c);
      box(9, 10, 18, 17, c); box(13, 3, 10, 8, c); p(14, 6, 3, 2, '#ffb23a'); p(19, 6, 3, 2, '#ffb23a'); p(14, 6, 1, 1, '#fff7b0'); p(19, 6, 1, 1, '#fff7b0'); p(15, 9, 6, 1, DD(c));
      p(15, 14, 6, 7, DD(c)); p(16, 15, 4, 5, '#ffb23a'); p(17, 16, 2, 2, '#fff7b0');
      p(11, 13, 1, 4, DD(c)); p(12, 16, 2, 1, DD(c)); p(23, 20, 1, 5, DD(c)); p(21, 24, 3, 1, DD(c)); p(12, 22, 3, 1, DD(c));
      box(2, 10, 7, 17, c); box(1, 26, 9, 7, c); p(3, 29, 1, 3, DD(c)); p(6, 29, 1, 3, DD(c)); p(4, 13, 1, 5, DD(c));
      p(10, 11, 2, 2, L(c)); p(24, 11, 2, 2, L(c)); p(8, 34, 10, 1, DD(c)); p(18, 34, 9, 1, DD(c));
    },
    mushroom() {
      box(13, 30, 4, 5, BONE); box(19, 30, 4, 5, shade(BONE, 0.8)); p(11, 34, 6, 1, shade(BONE, 0.7)); p(19, 34, 6, 1, shade(BONE, 0.6));
      box(12, 16, 12, 15, BONE); p(8, 20, 4, 2, BONE); p(6, 22, 3, 3, BONE); p(24, 20, 4, 2, shade(BONE, 0.8)); p(27, 22, 3, 3, shade(BONE, 0.8));
      ball(18, 9, 15, 8, c); p(4, 12, 28, 3, D(c)); p(6, 15, 24, 2, '#b8a888'); for (let i = 0; i < 8; i++) p(7 + i * 3, 15, 1, 2, '#8a7a60');
      ell(10, 7, 2, 2, '#ffffff'); ell(20, 4, 3, 2, '#ffffff'); ell(28, 9, 2, 1, '#ffffff'); ell(15, 11, 1, 1, '#ffffff');
      p(13, 20, 3, 3, DARK); p(19, 20, 3, 3, DARK); p(13, 20, 1, 1, '#ffffff'); p(19, 20, 1, 1, '#ffffff'); p(15, 25, 5, 1, DARK); p(14, 24, 1, 1, DARK); p(20, 24, 1, 1, DARK);
    },
    turtle() {
      const SK = '#c2cc9a';
      p(32, 25, 4, 2, SK); box(25, 28, 5, 7, shade(SK, 0.8)); box(11, 28, 5, 7, SK); p(10, 34, 2, 1, '#ffffff'); p(13, 34, 2, 1, '#ffffff'); p(25, 34, 2, 1, '#ffffff');
      ball(6, 22, 5, 4, SK); p(1, 23, 3, 2, shade(SK, 0.7)); p(3, 20, 2, 2, DARK); p(3, 20, 1, 1, '#ffffff'); p(2, 25, 5, 1, DARK);
      ball(21, 19, 13, 10, c); p(9, 26, 25, 3, D(c)); p(9, 26, 25, 1, L(c));
      p(15, 12, 1, 14, DD(c)); p(21, 9, 1, 17, DD(c)); p(27, 12, 1, 14, DD(c)); p(10, 18, 23, 1, DD(c));
      p(20, 6, 3, 3, L(c)); p(21, 5, 1, 1, L(c)); p(27, 9, 2, 2, L(c)); p(13, 9, 2, 2, L(c)); p(32, 15, 2, 2, c);
    },
    eel() {
      const seg = [[29, 32, 4, 3], [24, 32, 4, 3], [19, 30, 4, 4], [16, 25, 4, 4], [18, 20, 4, 4], [20, 15, 4, 4], [17, 10, 5, 4]];
      p(32, 30, 4, 2, D(c)); p(34, 28, 2, 2, D(c));
      for (const [x, y] of seg) p(x + 3, y - 4, 2, 2, L(c));
      for (const [x, y, rx, ry] of seg) ball(x, y, rx, ry, c);
      for (const [x, y] of seg.slice(2)) ell(x - 2, y + 1, 1, 2, '#f4f0d0');
      ball(11, 9, 6, 4, c); p(4, 10, 8, 3, DARK); p(4, 13, 8, 2, D(c)); p(3, 8, 3, 2, c);
      p(5, 10, 1, 2, '#ffffff'); p(8, 10, 1, 2, '#ffffff'); p(6, 12, 1, 1, '#ffffff'); p(10, 12, 1, 1, '#ffffff');
      p(9, 6, 3, 2, '#ffe66b'); p(9, 7, 1, 1, DARK); p(13, 4, 2, 2, L(c)); p(16, 5, 2, 2, L(c));
      p(26, 12, 1, 3, '#fff7b0'); p(27, 14, 2, 1, '#fff7b0'); p(8, 18, 2, 1, '#fff7b0'); p(9, 19, 1, 2, '#fff7b0');
    },
    imp() {
      for (let i = 0; i < 7; i++) { p(22 + i, 14 - i, 1, 6 + i, DD(c)); p(13 - i, 15 - i, 1, 5 + i, DD(c)); } p(22, 14, 7, 1, D(c));
      line(20, 27, 28, 31, D(c), 2); line(28, 31, 31, 25, D(c), 2); p(30, 22, 3, 3, c); p(31, 21, 1, 1, c);
      p(13, 28, 2, 6, c); p(18, 28, 2, 6, D(c)); p(12, 34, 4, 1, DARK); p(17, 34, 4, 1, DARK);
      ball(16, 23, 5, 6, c); ell(15, 24, 2, 3, L(c)); p(21, 21, 4, 2, D(c)); p(24, 22, 2, 4, D(c));
      p(8, 20, 5, 2, c); p(6, 16, 2, 5, c); ball(6, 12, 4, 4, '#ffb23a'); ell(6, 12, 2, 2, '#fff7b0'); p(5, 6, 1, 2, '#ffb23a'); p(8, 7, 1, 1, '#ff7a2a');
      ball(16, 12, 7, 6, c); p(7, 11, 3, 2, c); p(23, 11, 3, 2, D(c));
      p(9, 2, 2, 6, BONE); p(8, 1, 2, 2, BONE); p(21, 2, 2, 6, shade(BONE, 0.75)); p(22, 1, 2, 2, shade(BONE, 0.75));
      p(11, 10, 3, 3, '#ffe66b'); p(17, 10, 3, 3, '#ffe66b'); p(12, 10, 1, 3, DARK); p(18, 10, 1, 3, DARK); p(10, 9, 4, 1, DD(c)); p(17, 9, 4, 1, DD(c));
      p(11, 15, 10, 1, DARK); p(12, 15, 1, 1, '#ffffff'); p(15, 15, 1, 1, '#ffffff'); p(18, 15, 1, 1, '#ffffff');
    },
    yeti() {
      const SK = '#8fb0c8';
      ball(31, 22, 4, 9, D(c)); ball(31, 31, 3, 3, shade(SK, 0.75)); box(20, 29, 7, 6, D(c)); box(10, 29, 7, 6, c); p(9, 34, 9, 1, DD(c)); p(19, 34, 9, 1, DD(c));
      ball(18, 22, 13, 11, c); for (let i = 0; i < 6; i++) { p(9 + i * 3, 20 + (i % 2), 2, 1, L(c)); p(10 + i * 3, 26 + (i % 2), 2, 1, D(c)); }
      p(8, 2, 2, 6, BONE); p(7, 1, 2, 2, BONE); p(23, 2, 2, 6, shade(BONE, 0.75)); p(24, 1, 2, 2, shade(BONE, 0.75));
      ball(16, 10, 8, 7, c); ell(14, 12, 5, 4, SK); p(9, 7, 11, 2, D(c));
      p(10, 9, 3, 2, '#b8f2ff'); p(15, 9, 3, 2, '#b8f2ff'); p(10, 10, 1, 1, DARK); p(15, 10, 1, 1, DARK);
      p(11, 13, 7, 2, DARK); p(12, 13, 1, 2, '#ffffff'); p(16, 13, 1, 2, '#ffffff'); p(14, 14, 1, 1, '#ffffff');
      ball(5, 22, 5, 9, c); ball(5, 31, 4, 3, SK); p(3, 33, 1, 1, DARK); p(5, 33, 1, 1, DARK); p(7, 33, 1, 1, DARK);
    },
    knight() {
      const A = '#e0c14a';
      p(12, 13, 17, 20, DD(c)); p(27, 15, 3, 19, shade(c, 0.35)); p(13, 33, 4, 2, DD(c)); p(21, 33, 6, 1, DD(c));
      box(18, 28, 5, 7, D(c)); box(11, 28, 5, 7, c); p(9, 34, 7, 1, DD(c)); p(18, 34, 7, 1, DD(c)); p(12, 31, 3, 1, A);
      box(24, 17, 4, 9, DD(c)); box(10, 13, 14, 12, c); p(15, 15, 4, 6, A); p(16, 16, 2, 4, D(A)); p(10, 23, 14, 1, DD(c)); box(11, 24, 12, 4, D(c)); p(11, 27, 12, 1, A);
      box(22, 11, 7, 6, D(c)); p(22, 16, 7, 1, A); box(5, 11, 7, 6, c); p(5, 16, 7, 1, A); p(6, 12, 2, 1, '#ffffff');
      box(11, 2, 12, 10, c); p(12, 6, 9, 2, DARK); p(13, 6, 2, 2, '#ff5a6a'); p(17, 6, 2, 2, '#ff5a6a'); p(16, 8, 1, 3, DD(c)); p(13, 9, 1, 2, DD(c)); p(19, 9, 1, 2, DD(c));
      p(15, 0, 7, 2, A); p(20, 1, 5, 3, A); p(23, 4, 3, 3, D(A));
      box(6, 17, 4, 9, D(c)); p(5, 25, 5, 3, c);
      p(2, 2, 3, 23, STEEL); p(4, 3, 1, 22, '#9aa3ad'); p(2, 1, 2, 1, STEEL); p(2, 4, 1, 8, '#ffffff'); p(0, 24, 7, 2, A); p(2, 26, 3, 4, '#3a2a22'); p(2, 30, 3, 1, A);
    },
    eye() {
      for (let i = 0; i < 4; i++) for (let y = 25; y <= 35 - (i % 2) * 2; y++) p(9 + i * 5 + R(Math.sin(y / 2 + i) * 1.5), y, 2, 1, i % 2 ? D(c) : c);
      p(12, 1, 2, 4, c); p(18, 0, 2, 4, c); p(24, 2, 2, 4, D(c));
      ball(18, 15, 13, 12, c); ell(15, 15, 9, 8, '#f4f0e4'); ell(16, 16, 8, 6, '#ffffff');
      ell(12, 15, 5, 5, '#ff4a6a'); ell(12, 15, 4, 4, '#ff7a8a'); ell(11, 15, 1, 4, DARK); p(13, 11, 2, 2, '#ffffff');
      p(20, 10, 3, 1, '#e08a8a'); p(22, 11, 1, 2, '#e08a8a'); p(20, 20, 3, 1, '#e08a8a'); p(22, 18, 1, 2, '#e08a8a');
      p(7, 7, 14, 1, D(c)); p(6, 23, 16, 1, DD(c));
    },
    plant() {
      const ST = '#3f7a3a', A = '#ff8fb0';
      ell(12, 33, 8, 2, ST); ell(27, 33, 7, 2, shade(ST, 0.75)); p(8, 32, 6, 1, shade(ST, 1.3));
      line(26, 31, 32, 18, shade(ST, 0.75), 2); p(28, 26, 1, 1, BONE); p(32, 22, 1, 1, BONE); ball(32, 15, 3, 3, A); p(32, 15, 1, 1, '#ffd23a');
      ball(6, 28, 2, 2, A); p(6, 28, 1, 1, '#ffd23a');
      for (const [x, y] of [[20, 32], [21, 29], [21, 26], [20, 23], [18, 20]]) ball(x, y, 2, 2, ST);
      p(23, 27, 1, 1, BONE); p(18, 24, 1, 1, BONE); p(23, 31, 1, 1, BONE);
      ball(14, 16, 9, 5, c); p(4, 11, 17, 4, '#5a1020'); p(6, 12, 13, 2, '#8a2038'); ball(14, 8, 10, 5, c);
      for (let i = 0; i < 6; i++) { p(5 + i * 3, 11, 1, 2, '#ffffff'); p(6 + i * 3, 14, 1, 1, '#ffffff'); }
      ell(11, 6, 1, 1, L(c)); ell(17, 5, 1, 1, L(c)); ell(21, 8, 1, 1, L(c)); p(9, 4, 2, 1, '#ffffff');
      p(22, 5, 3, 2, ST); p(24, 3, 2, 3, ST);
    },
    boss() {
      // robe
      for (let y = 22; y <= 65; y++) { const half = R(14 + (y - 22) * 0.2); for (let x = 30 - half; x <= 30 + half; x++) { if (y > 61 && (x * 3 + y) % 4 === 0) continue; p(x, y, 1, 1, x < 30 - half + 2 ? D(c) : x > 30 + half - 4 ? shade(c, 0.3) : (x + y * 2) % 9 === 0 ? shade(c, 0.4) : DD(c)); } }
      p(26, 38, 8, 26, D(c)); p(26, 38, 1, 26, c); p(33, 38, 1, 26, DD(c)); for (let i = 0; i < 4; i++) p(29, 42 + i * 6, 2, 2, GOLD);
      // far arm, chest, shoulders
      box(47, 27, 7, 16, D(c)); p(46, 43, 9, 6, shade(BONE, 0.7)); p(47, 49, 1, 2, shade(BONE, 0.7)); p(50, 49, 1, 3, shade(BONE, 0.7)); p(53, 49, 1, 2, shade(BONE, 0.7));
      box(20, 22, 20, 17, c); for (let i = 0; i < 4; i++) { p(21, 25 + i * 3, 7, 1, DD(c)); p(32, 25 + i * 3, 7, 1, DD(c)); }
      ball(30, 30, 4, 4, '#ffe66b'); ell(30, 30, 2, 2, '#ffffff'); p(20, 38, 20, 1, GOLD);
      p(46, 11, 2, 7, shade(BONE, 0.75)); p(51, 13, 2, 6, shade(BONE, 0.75)); ball(47, 23, 9, 6, D(c)); p(39, 27, 16, 1, GOLD);
      p(7, 13, 2, 6, BONE); p(12, 11, 2, 7, BONE); ball(13, 23, 9, 6, c); p(5, 27, 16, 1, GOLD);
      // skull + crown
      ball(30, 13, 8, 8, BONE); p(24, 18, 12, 4, BONE); p(34, 18, 2, 4, shade(BONE, 0.75));
      p(24, 11, 5, 4, DARK); p(31, 11, 5, 4, DARK); p(25, 12, 2, 2, '#ffe66b'); p(32, 12, 2, 2, '#ffe66b'); p(25, 12, 1, 1, '#ffffff'); p(32, 12, 1, 1, '#ffffff');
      p(29, 16, 2, 2, DARK); p(25, 20, 10, 1, DARK); for (let i = 0; i < 5; i++) p(25 + i * 2, 20, 1, 1, BONE);
      p(22, 4, 17, 3, GOLD); p(22, 6, 17, 1, shade(GOLD, 0.7)); for (const [x, h] of [[22, 4], [26, 3], [29, 5], [33, 3], [37, 4]]) { p(x, 4 - h, 2, h, GOLD); p(x, 4 - h, 1, 1, '#fff7b0'); }
      p(29, 5, 2, 1, '#ff4a6a'); p(24, 5, 1, 1, '#6fd6ff'); p(36, 5, 1, 1, '#6fd6ff');
      // near arm + great blade
      box(6, 27, 7, 16, c); p(4, 42, 10, 7, BONE); p(4, 48, 10, 1, shade(BONE, 0.7));
      p(2, 3, 4, 41, STEEL); p(5, 4, 1, 40, '#9aa3ad'); p(2, 1, 3, 2, STEEL); p(2, 5, 1, 14, '#ffffff'); p(3, 20, 1, 20, L(c)); p(0, 44, 9, 2, GOLD); p(0, 45, 9, 1, shade(GOLD, 0.7)); p(2, 46, 4, 9, '#3a2a22'); p(1, 55, 6, 2, GOLD);
    },
  };
  (paint[shape] || paint.blob)();
}
