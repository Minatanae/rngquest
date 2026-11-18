// RNG Quest: The Daily Adventure (rngquest.com). The page: roll the Winds of Fate, choose Adventure! or wait until tomorrow (rest), watch your heroes, check the leaderboard.
// Rules live in daily.js; this file only draws the page and wires up clicks.
import * as D from './daily.js';
import { heroSprite, spriteURL, drawTown, drawDungeon, drawPlace, loadArt, TOWN_W, TOWN_H, DUN_W, DUN_H, PLACE_H } from './sprites.js';

await loadArt();
const KEY = 'pitside-daily-v4', ROLL_MS = 1900;   // save key kept from the working title Pitside, so saves survive
const load = () => { try { const s = JSON.parse(localStorage.getItem(KEY)); return s && s.v === 4 ? s : null; } catch { return null; } };
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* storage unavailable */ } };
let S = load() || D.newState();
D.ensureDay(S, D.currentDayKey(S));
S.speed = 1;       // adventures always play at normal speed
const ui = { rollAt: 0, flick: '', flickAt: 0, dust: [], dieSeg: -1, g: { open: false } };
const floaters = [], canvases = new Map();
let anim = null, lastHtml = '', pointerDown = false, pointerAt = 0;

// ---- helpers ------------------------------------------------------------------------------
const fmt = n => Math.floor(n).toLocaleString('en-US');
const btn = (label, a, cls = '', data = '', dis = false) => `<button class="${cls}" data-a="${a}" ${data} ${dis ? 'disabled' : ''}>${label}</button>`;
const rolling = () => ui.rollAt && performance.now() - ui.rollAt < ROLL_MS;
// the verdict names your real chances (party, wounds, floor and roll together), so a word never contradicts the %
const ODDS_WORDS = [[100, 'Perfect', 'v-great'], [90, 'Blessed', 'v-great'], [80, 'Bright', 'v-good'], [65, 'Favourable', 'v-good'], [50, 'Fair', 'v-mid'],
  [35, 'Uncertain', 'v-mid'], [20, 'Ominous', 'v-bad'], [10, 'Grim', 'v-bad'], [3, 'Dire', 'v-doom'], [0, 'Doomed', 'v-doom']];
const oddsWord = p => ODDS_WORDS.find(([m]) => (p ?? 50) >= m);
const verdictClass = p => oddsWord(p)[2];
// after the d20 lands, its verdict and the chance to clear stay up this long before the party sets off by itself
const REVEAL_MS = 2800;
const revealing = () => S.day.pending && ui.rollAt && performance.now() - ui.rollAt < ROLL_MS + REVEAL_MS;
const nextDepth = () => (S.day.depth || 0) + 1;
const span = depth => (depth === 1 ? 'rooms 1–4' : `room ${D.floorNo(depth)}`);

// ---- page sections -------------------------------------------------------------------------
function header() {
  return `<div class="dd-head">
    <div><h1>RNG Quest</h1><div class="sub">The Daily Adventure · Day ${D.dayNumber(S)}</div></div>
    <div class="dbgs">${ui.screen === 'board' ? btn('◀ Back', 'home', 'pix sm') : btn('Leaderboard', 'board', 'pix sm')}${btn('Prototype: next day', 'nextday', 'pix sm dbg')}${btn('Reset', 'reset', 'pix sm dbg danger')}</div>
  </div>`;
}
// the winds of fate, rolled inside today's quest: the d20 tray, then the verdict
function winds() {
  const d = S.day, depth = nextDepth();
  let body;
  if (rolling()) body = '<div class="math">The winds are turning…</div>';
  else {
    const pct = d.odds, tone = pct == null ? '' : pct < 35 ? 'low' : pct < 65 ? 'mid' : 'high';
    body = `<div class="readout"><div class="ro-line"><span>Winds of fate</span><b>${d.roll}</b></div>
      <div class="ro-line"><span>Party score</span><b>${fmt(D.partyScore(S))}</b></div>
      <div class="ro-odds">${pct == null ? 'Reading the winds…' : `Chance to clear ${span(depth)}: <b class="${tone}">${pct}%</b>`}</div></div>
      <div class="hint-line">${depth > 1 ? 'The party presses on…' : 'The party sets off…'}</div>`;
  }
  return `<div class="winds"><div data-canvas="die"></div>${body}</div>`;
}
// today so far: floors cleared, renown banked, and the deepest floor anyone reached today
function dayLine() {
  const d = S.day, deep = D.deepestToday(S);
  const deepTxt = deep && deep.deepest ? ` · deepest today: room ${deep.deepest}${deep.you ? ' (you!)' : ` (${deep.name})`}` : '';
  const e = S.history.find(x => x.day === d.key) || {};
  const money = d.choice === 'lost' ? `<b class="death">−${fmt(e.lost || 0)}</b> renown lost` : d.choice === 'rest' ? `<b class="loot">+${fmt(d.renown || 0)}</b> renown banked` : `<b class="loot">+${fmt(d.haul || 0)}</b> renown carried`;
  return `<div class="dayline">Today: ${d.floor ? `through <b>room ${d.floor}</b>` : 'no room cleared'} · ${money}${deepTxt}</div>`;
}
// 2. check the roster: pick up to three for the party, reroll a slot once a day
function heroCard(h) {
  const c = D.DCLASS[h.cls], U = h.unique && D.UNIQUES[h.unique], rk = h.rank || 'C';
  // the whole card wears its rank: coloured frame and tint, a pixel rank badge, the floor tile under the hero
  return `<div class="slot-wrap">
    <div class="pcard c-${h.cls} rank-${rk} ${U ? 'unique' : ''} ${h.dead ? 'fallen' : ''}" style="--rk:${D.RANKS[rk].color}">
      <span class="pc-class" title="${c.ability}">${c.name}</span>
      <i class="rank-shield" style="background-image:var(--rk-shield-${rk})" title="Rank ${rk}" aria-label="Rank ${rk}"></i>
      <div class="pc-stage"><i class="tile t2"></i><i class="tile"></i><img class="spr ${h.dead ? 'dead' : ''}" src="${spriteURL(heroSprite(h))}" alt=""></div>
      <div class="pc-name">${h.name}</div>
      <div class="pc-sub"><b class="rk">Rank ${rk}</b> ${c.name}</div>
      ${h.dead ? `<div class="pc-info"><span class="dead-tag">Dead</span><small class="dawn">Fell in the dungeon today.</small></div>` : `
      <div class="pc-info">${U ? `<span class="sig" title="${U.desc}">★ ${U.sig}</span>` : ''}
        <div class="abil" title="${c.ability}">✦ ${c.ability.split(':')[0]}</div>
        ${vitals(h)}
        <div class="pc-score">Hero score <b>${D.heroScore(h)}</b></div>
        <div class="meta">${h.kills} kill${h.kills === 1 ? '' : 's'} today</div></div>`}
    </div>
  </div>`;
}
// health always; mana only for healers. Wounds and spent mana stay until dawn.
function vitals(h) {
  const max = h.maxHp || 1, hp = Math.max(0, Math.round(h.hp ?? max)), r = hp / max, mm = D.maxMana(h);
  const hpBar = `<div class="vital"><span>HP</span><div class="bar hp ${r < 0.35 ? 'low' : r < 0.7 ? 'mid' : ''}"><i style="width:${(r * 100).toFixed(0)}%"></i></div><small>${hp}/${max}</small></div>`;
  const mnBar = mm ? `<div class="vital"><span>MP</span><div class="bar mp"><i style="width:${((h.mana ?? mm) / mm * 100).toFixed(0)}%"></i></div><small>${h.mana ?? mm}/${mm}</small></div>` : '';
  return `<div class="vitals">${hpBar}${mnBar}</div>`;
}
// every day starts at the summoning circle: three new heroes, what you get is what you get
function summonBar() {
  const left = D.starterLeft(S), first = !S.firstPartyDone;
  if (left) return `<div class="summon-bar first"><div class="sb-title">${first ? 'Summon your first three heroes' : "Summon today's party"}</div>
    <small>${first ? 'Every adventurer starts with three heroes from the summoning circle.' : 'Every day three new heroes answer the call.'} What you get is what you get.</small>
    ${btn(`✦ Summon (${D.DAILY.party - left + 1}/${D.DAILY.party})`, 'gopen', 'big adventure pix')}</div>`;
  return '';   // once today's three are summoned there is nothing to say here
}
// the party's score (every hero's rank), big, and how it compares with other players' parties today
function partyScoreBox() {
  const me = D.partyScore(S), rivals = D.rivalPartyScores(S), below = rivals.filter(n => n < me).length, above = rivals.filter(n => n > me).length;
  const vs = below >= above ? `higher than ${Math.round(below / rivals.length * 100)}%` : `lower than ${Math.round(above / rivals.length * 100)}%`;
  return `<div class="party-score"><small>Party score</small><b>${fmt(me)}</b><span>${vs} of players</span></div>`;
}
// today's party: the score, then the three heroes (inside the quest panel; on its own while summoning)
function partyBody() {
  const first = D.starterLeft(S) > 0;   // until today's three are summoned there is only the summoning circle
  return `${first ? '' : partyScoreBox()}
    ${summonBar()}
    ${S.heroes.length ? `<div class="pgrid roster">${S.heroes.map(heroCard).join('')}</div>` : ''}`;
}
const heroesPanel = () => `<div class="panel">${partyBody()}</div>`;
// go home or go deeper: the safe choice first, and each says what it means
const diveChoices = () => `<div class="choices">${btn(`Go home<small>Collect ${fmt(S.day.haul || 0)} renown</small>`, 'rest', 'big rest pix')}${btn('Go deeper!<small>And risk it all?</small>', 'dive', 'big adventure pix', '', !D.partyFor(S).length)}</div>`;
// Once the day is over (home safe, or the party lost), today's quest gives way to how the day went, until the reset.
function resultPanel(q) {
  const d = S.day, lost = d.choice === 'lost', e = S.history.find(x => x.day === d.key) || {}, fl = D.LOCATIONS[q.loc - 1];
  const others = D.leaderboardToday(S).filter(x => !x.you);
  const score = lost ? 0 : d.renown || 0, below = others.filter(x => x.score < score).length, above = others.filter(x => x.score > score).length;
  const vs = !others.length ? '' : below >= above ? `higher than ${Math.round(below / others.length * 100)}% of players` : `lower than ${Math.round(above / others.length * 100)}% of players`;
  const stat = (label, val, sub, cls = '') => `<div class="r-stat"><small>${label}</small><b class="${cls}">${val}</b>${sub ? `<span>${sub}</span>` : ''}</div>`;
  return `<div class="panel quest day-result">
    <h2>Today's result</h2>
    <div class="q-place"><div data-canvas="place"></div><div class="q-name">${fl.name}</div></div>
    <div class="r-head ${lost ? 'death' : 'good'}">${lost ? `☠ Your party was lost in room ${e.lostAt || d.floor + 1}` : `Home safe after room ${d.floor}`}</div>
    <div class="r-score">Your score today is <b class="${lost ? 'death' : 'loot'}">${fmt(score)}</b>${vs ? `, ${vs}` : ''}.</div>
    <div class="r-stats">
      ${lost ? stat('Renown lost', e.lost ? `−${fmt(e.lost)}` : '0', 'everything carried', 'death') : stat('Renown gained', `+${fmt(score)}`, 'banked today', 'good')}
      ${stat('Total renown', fmt(S.renown), 'all time')}
      ${stat('Deepest room', d.floor || '–', 'today')}
    </div>
    ${countdown(false)}
  </div>`;
}
function questPanel(q) {
  const fl = D.LOCATIONS[q.loc - 1], d = S.day, ad = S.adv && S.adv.quest.key === d.key ? S.adv : null;
  // the day: Adventure! (blind) -> the roll is revealed -> watch -> go deeper or rest, until rested or lost
  let action;
  if (d.pending) action = winds();
  else if (S.adv && !S.adv.done) action = `<div class="done-note">Your heroes are in room ${D.floorNo(S.adv.depth || 1, Math.min(S.adv.room, D.DAILY.floors - 1))}.</div>`;
  else if (!d.choice) action = `<div class="choices">${btn('Adventure!', 'dive', 'big adventure pix', '', !D.partyFor(S).length)}</div>`;
  else if (d.choice === 'adventure') action = `${dayLine()}<div class="risk">Will you risk going deeper?</div>
      ${diveChoices()}
      <div class="hint-line">Going home banks what you carry and keeps your heroes safe until tomorrow's reset, but no risk, no reward!</div>`;
  else if (d.choice === 'rest') action = `${dayLine()}<div class="done-note">Your heroes went home after room ${d.depth === 1 ? 4 : D.floorNo(d.depth)} and rest by the fire.</div>${countdown()}`;
  else action = `${dayLine()}<div class="done-note"><span class="death">Your party was lost in room ${ad && ad.result ? ad.result.lastFloor : nextDepth()}</span>, and everything it carried with it.</div>${countdown()}`;
  // one panel, top to bottom: where (a live picture of the place), who (today's party), then the day's choice
  return `<div class="panel quest">
    <h2>Today's quest</h2>
    <div class="q-place"><div data-canvas="place"></div><div class="q-name">${fl.name}</div></div>
    <div class="q-title">${q.title}</div>
    <div class="q-party">${partyBody()}</div>
    <div class="decide">${action}</div>
  </div>`;
}
function lists() {
  const histLine = e => e.outcome === 'lost' ? `<span class="death">☠ Lost in room ${e.lostAt || 1}${e.lost ? `, −${fmt(e.lost)} lost` : ''}</span>`
    : `<span class="${e.depth ? 'good' : 'info'}">${e.depth ? `✓ Through room ${e.floor || e.depth * 4}` : 'No rooms'}, +${fmt(e.renown || 0)}${e.fallen ? `, ☠${e.fallen}` : ''}${e.outcome === 'rest' ? ', went home' : ''}</span>`;
  const hist = S.history.length ? S.history.slice(0, 8).map(e => `<div class="hist"><span class="d">${e.day}</span>${histLine(e)}</div>`).join('') : '<div class="empty">Your story starts today.</div>';
  return `<div class="panel"><h2>Recent days</h2>${hist}</div>`;   // the leaderboard has its own screen
}
// the leaderboard, on its own screen: today, this week (since Monday) or all time
const BOARD_TABS = [
  ['today', 'Today', ['Party score', 'Deepest room cleared', 'Renown gained']],
  ['week', 'This week', ['Weekly total party score', 'Deepest room cleared', 'Weekly total renown gained']],
  ['all', 'All time', ['All‑time total party score', 'Deepest room cleared', 'All‑time renown gained']],
  ['deep', 'Deepest adventures', [null, 'Deepest room cleared', 'Day']]];   // no party score here
const shortDate = key => new Date(key + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
function boardView() {
  const tab = BOARD_TABS.find(t => t[0] === ui.boardTab) || BOARD_TABS[0], deep = tab[0] === 'deep';
  const rows = deep ? D.deepestAdventures(S) : D.board(S, tab[0]);
  const tabs = BOARD_TABS.map(t => btn(t[1], 'btab', `pix sm ${t === tab ? 'adventure' : ''}`, `data-tab="${t[0]}"`)).join('');
  const cells = (a, b, c) => `${deep ? '' : `<span class="ps">${a}</span>`}<span class="dp">${b}</span><span class="rn">${c}</span>`;
  const row = (r, i) => `<div class="b-row ${r.you ? 'you' : ''}"><span class="n">${i + 1}.</span><span class="who">${r.name}</span>${cells(fmt(r.party), r.deepest || '–', deep ? (r.day && r.deepest ? shortDate(r.day) : '–') : fmt(r.score))}</div>`;
  return `<div class="stack"><div class="panel board">
    <h2>Leaderboard</h2>
    <div class="b-tabs">${tabs}</div>
    <div class="b-table ${deep ? 'two' : ''}"><div class="b-row b-top"><span class="n"></span><span class="who">Player</span>${cells(...tab[2])}</div>${rows.map(row).join('')}</div>
    <small class="b-note">Prototype: rivals are simulated.</small>
  </div></div>`;
}
// home screen, in the order you use it: today's quest (roll the winds, then Adventure! or Rest), then your party
// (the town scene, drawTown, is no longer shown here)
function hubView() {
  const q = D.questFor(S.day.key);
  if (D.starterLeft(S)) return `<div class="stack">${heroesPanel()}</div>`;
  if (S.day.choice === 'rest' || S.day.choice === 'lost') return `<div class="stack">${resultPanel(q)}</div>`;   // the day is over: just how it went   // each day starts with only the summoning circle
  return `<div class="stack">
    ${questPanel(q)}
    ${lists()}
  </div>`;
}
const hms = sec => [Math.floor(sec / 3600), Math.floor(sec / 60) % 60, sec % 60].map(n => String(n).padStart(2, '0')).join(':');
const countdown = (note = true) => `<div class="next">Next roll in <b>${hms(D.secondsToReset())}</b>${note ? '<br><small>A new day begins at 00:00 Swedish time</small>' : ''}</div>`;
// the daily summary: what happened, where the renown came from, how you stand today and all time, and when to come back
// The card over the dungeon when a run ends: kept short, the decision is the point. The full breakdown is one tap away
// at camp ("Show last floor").
function summary(ad) {
  if (ui.fullSummary) return summaryFull(ad);
  const r = ad.result, won = r.outcome === 'cleared', d = S.day;
  const deciding = won && d.choice === 'adventure' && !d.pending && ad === S.adv;
  const title = won ? (r.depth === 1 ? 'Rooms 1–4 cleared' : `Room ${r.lastFloor} cleared`) : `Party lost in room ${r.lastFloor}`;
  return `<div class="panel summary short">
    <h2 class="${won ? 'good' : 'death'}">${title}</h2>
    ${won ? `<div class="s-haul"><b>+${fmt(d.choice === 'rest' ? d.renown : d.haul || 0)}</b><span>renown ${d.choice === 'rest' ? 'banked' : 'carried'}</span></div>`
      : `<div class="s-haul lost"><b>−${fmt(r.lostHaul || 0)}</b><span>renown lost</span></div>`}
    ${won ? r.fallen.map(f => `<div class="line death">☠ ${f} has fallen</div>`).join('') : ''}
    ${deciding ? `${diveChoices()}`
      : btn('Back to camp', 'seen', 'big pix')}
  </div>`;
}
function summaryFull(ad) {
  const r = ad.result, today = D.leaderboardToday(S), all = D.leaderboard(S);
  const tRank = today.findIndex(x => x.you) + 1, aRank = all.findIndex(x => x.you) + 1, best = today[0];
  const won = r.outcome === 'cleared', depth = r.depth || 1, deep = D.deepestToday(S), d = S.day;
  const deciding = won && d.choice === 'adventure' && !d.pending && ad === S.adv;
  const partyRows = D.partyFor(S).length || !won ? S.heroes.map(h => `<div class="s-hero ${h.dead ? 'dead' : ''}"><b>${h.name}</b>${h.dead ? '<span class="dead-tag">Dead</span>' : vitals(h)}</div>`).join('') : '';
  return `<div class="panel summary">
    <h2 class="${won ? 'good' : 'death'}">${won ? (depth === 1 ? 'Rooms 1–4 cleared' : `Room ${r.lastFloor} cleared`) : `Party lost in room ${r.lastFloor || D.floorNo(depth, 0)}`}</h2>
    ${r.clock ? `<div class="s-clock"><span class="sw sw-${r.clock.word.toLowerCase()}">${r.clock.word}</span><b>⏱ ${D.clock(r.clock.secs)}</b><small>par ${D.clock(r.clock.par)}${r.clock.bonus ? ` · <b class="good">+${r.clock.bonus} renown</b>` : ''}</small></div>` : ''}
    ${won ? '' : `<div class="line death">Everything the party carried today is lost${r.lostHaul ? `: <b>−${fmt(r.lostHaul)}</b> renown` : ''}.</div>`}
    ${r.parts.length ? `<div class="breakdown">${r.parts.map(([l, n]) => `<span>${l}</span><b>+${n}</b>`).join('')}<span class="tot">Found in these rooms</span><b class="tot">+${r.renown}</b></div>` : ''}
    <div class="standings">
      ${won && d.choice === 'adventure' ? `<div><small>Carried today</small><b>+${fmt(d.haul || 0)}</b><span>#${today.filter(x => !x.you && x.score > (d.haul || 0)).length + 1} of ${today.length} if banked${best && !best.you ? ` · best: ${best.name} +${fmt(best.score)}` : ''}</span></div>`
      : `<div><small>Today</small><b>+${fmt(d.renown || 0)}</b><span>#${tRank} of ${today.length}${best && !best.you ? ` · best: ${best.name} +${fmt(best.score)}` : ' · best today!'}</span></div>`}
      <div><small>All time</small><b>${fmt(S.renown)}</b><span>#${aRank} of ${all.length}</span></div>
    </div>
    ${deep && deep.deepest ? `<div class="line">Deepest today: <b>room ${deep.deepest}</b> ${deep.you ? '(you!)' : `(${deep.name})`}</div>` : ''}
    ${r.fallen.map(f => `<div class="line death">☠ ${f} has fallen</div>`).join('')}
    ${partyRows ? `<div class="s-party">${partyRows}</div>` : ''}
    ${deciding ? `<div class="risk">Go deeper, or go home?</div>
      ${diveChoices()}`
    : `${d.choice === 'adventure' ? '' : countdown(false)}${btn('Back to camp', 'seen', 'big pix')}`}
  </div>`;
}
// The result appears as a card over the dungeon (its own element outside #app), so nothing on the page moves when
// the adventure ends. It waits a moment first, so the last frame of the dungeon can land.
const RESULT_DELAY = 1400;
let rEl = null, rHtml = '';
function resultOverlay(ad) {
  if (!rEl) { rEl = document.createElement('div'); rEl.className = 'r-overlay'; rEl.innerHTML = '<div class="r-card"></div>'; document.body.appendChild(rEl); }
  if (!ad) ui.doneAt = null; else if (ui.doneAt == null) ui.doneAt = performance.now();
  const show = !!ad && performance.now() - ui.doneAt > RESULT_DELAY;
  if (show) { const h = summary(ad); if (h !== rHtml) { rHtml = h; rEl.firstChild.innerHTML = h; } }
  if (show !== rEl.classList.contains('open')) { rEl.classList.toggle('open', show); document.body.classList.toggle('no-scroll', show); rEl.firstChild.scrollTop = 0; }
}
// the dice box: over the dungeon while the stretch is held, so the whole dive stays in one scene
let wEl = null, wHtml = '';
function rollOverlay(show) {
  if (!wEl) { wEl = document.createElement('div'); wEl.className = 'r-overlay rolling'; wEl.innerHTML = '<div class="r-card"><div class="panel roll-card"></div></div>'; document.body.appendChild(wEl); }
  if (show) {
    const h = winds();
    if (h !== wHtml) { wHtml = h; const card = wEl.querySelector('.roll-card'); card.innerHTML = h; card.querySelectorAll('[data-canvas]').forEach(slot => slot.appendChild(getCanvas(slot.dataset.canvas))); }
  }
  if (show !== wEl.classList.contains('open')) { wEl.classList.toggle('open', show); if (!show) wHtml = ''; }
}
function watchView(ad) {
  return `<div class="panel watch">
    <div class="top"><h3>${ad.quest.title}</h3><span class="rollbadge floorbadge">Room ${D.floorNo(ad.depth || 1, Math.min(ad.room, D.DAILY.floors - 1))}</span><span class="rollbadge ${verdictClass(ad.odds)}">Fate ${ad.roll}</span>
      <span class="clock ${ad.clearSteps != null ? 'stopped' : ''}" title="Clear time: the faster the rooms are cleared, the more renown">⏱ ${D.clock(D.elapsed(ad))}</span></div>
    <div class="stage"><div data-canvas="dun"></div></div>
    <div class="log">${(ad.log || []).slice(0, 40).map(l => `<div class="${l.c}">${l.s}</div>`).join('')}</div>
  </div>`;
}
function render(force) {
  if (pointerDown && !force && performance.now() - pointerAt < 1500) return;   // hold redraws during a tap, never longer
  const ad = S.adv, watching = ad && !ad.seen;
  resultOverlay(watching && ad.done ? ad : null);
  rollOverlay(!!(watching && ad.hold));
  const html = header() + (watching ? watchView(ad) : ui.screen === 'board' ? boardView() : hubView());
  if (html === lastHtml) return;
  lastHtml = html;
  const app = document.getElementById('app');
  app.innerHTML = html;
  app.querySelectorAll('[data-canvas]').forEach(slot => slot.appendChild(getCanvas(slot.dataset.canvas)));
  fitLog();
}
// while exploring, the combat log runs from under the dungeon down to just above the bottom of the screen
const LOG_GAP = 14;
function fitLog() {
  const log = document.querySelector('.watch .log'); if (!log) return;
  const panel = log.closest('.panel'), top = log.getBoundingClientRect().top + window.scrollY;
  const below = panel.getBoundingClientRect().bottom - log.getBoundingClientRect().bottom;   // the panel's own padding under the log
  log.style.height = Math.max(140, Math.floor(window.innerHeight - top - below - LOG_GAP)) + 'px';
}
window.addEventListener('resize', fitLog);
function getCanvas(key) {
  let c = canvases.get(key);
  if (!c) {
    c = document.createElement('canvas');
    if (key === 'die') { c.className = 'die'; c.width = DBW * DK; c.height = DBH * DK; }
    else {
      const town = key === 'town', k = town ? 2 : 4;
      c.className = 'scene'; c.width = (town ? TOWN_W : DUN_W) * k; c.height = (town ? TOWN_H : key === 'place' ? PLACE_H : DUN_H) * k;
      const x = c.getContext('2d'); x.scale(k, k); x.imageSmoothingEnabled = false;
    }
    canvases.set(key, c);
  }
  return c;
}

// ---- banners over the dungeon: the location during the descent, then "ROOM N" as each room is entered ----
function drawBanner(x, ad, now) {
  if (ad.done) return;
  let text = null, sub = '';
  if (ad.room === 0 && ad.phase === 'enter' && (ad.depth || 1) === 1) { text = D.LOCATIONS[ad.quest.loc - 1].name.toUpperCase(); sub = 'The party enters…'; ui.bannerRoom = -1; }
  else if (ad.phase !== 'enter' && ad.phase !== 'outro' && ui.bannerRoom !== ad.room) { ui.bannerRoom = ad.room; ui.bannerAt = now; }
  let a = 1;
  if (!text) {
    const age = now - (ui.bannerAt || 0);
    if (ad.phase === 'outro') { text = `ROOM ${D.floorNo(ad.depth || 1, D.DAILY.floors - 1)} CLEARED`; sub = 'The way leads deeper…'; }
    else if (age < 1800) { text = `ROOM ${D.floorNo(ad.depth || 1, ad.room)}`; a = age < 200 ? age / 200 : age > 1300 ? (1800 - age) / 500 : 1; }
    else return;
  }
  const W = DUN_W, y = 40;
  x.save(); x.globalAlpha = Math.max(0, a);
  const g = x.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(10,8,20,0)'); g.addColorStop(0.5, 'rgba(10,8,20,.7)'); g.addColorStop(1, 'rgba(10,8,20,0)');
  x.fillStyle = g; x.fillRect(0, y - 16, W, sub ? 30 : 22);
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = "700 13px Cinzel, Georgia, serif"; x.lineWidth = 3; x.strokeStyle = '#120c1a'; x.strokeText(text, W / 2, y - 5); x.fillStyle = '#f2d98a'; x.fillText(text, W / 2, y - 5);
  if (sub) { x.font = "600 7px Nunito, sans-serif"; x.fillStyle = '#e8e0cc'; x.fillText(sub, W / 2, y + 7); }
  x.restore();
}

// ---- the summon (gacha) ----------------------------------------------------------------------------
// A full-screen overlay with its own pixel canvas: a summoning circle and a sealed card. While it charges, the glow
// climbs the rarity ladder (white, green, blue, purple, gold) one step at a time and stops at the rank you really got,
// so the better the hero, the longer the suspense. Each step flashes and shakes harder; then a burst, and the card flips.
const LADDER = [['E', '#efe6d0'], ['C', '#7ddf8a'], ['B', '#5aa2f0'], ['A', '#c07be8'], ['S', '#ffd23a']];
const STEP_MS = 700, BURST_MS = 380, FLIP_MS = 520;
const rankStep = rk => ({ E: 0, D: 0, C: 1, B: 2, A: 3, S: 4 })[rk];
// 5x7 pixel letters for the rank in the corner of a revealed card
const RANK_GLYPH = { S: '01111100001000001110000010000111110', A: '01110100011000111111100011000110001', B: '11110100011000111110100011000111110',
  C: '01110100011000010000100001000101110', D: '11110100011000110001100011000111110', E: '11111100001000011110100001000011111' };
const GW = 120, GH = 132, GK = 3;
const G_GAP = 25, G_FLEX = 8;   // the even gap on the summon screen; G_FLEX is .g-inner's own flex gap (css: .g-head, .g-actions use the same 25px)
let gEl = null;
function gachaShell() {
  if (gEl) return gEl;
  gEl = document.createElement('div'); gEl.id = 'gacha'; gEl.className = 'gacha';
  gEl.innerHTML = '<div class="g-inner"><div class="g-title"></div><canvas class="g-canvas"></canvas><div class="g-info"></div><div class="g-actions"></div></div>';
  const c = gEl.querySelector('canvas'); c.width = GW * GK; c.height = GH * GK;
  document.body.appendChild(gEl);
  return gEl;
}
function openGacha() {
  gachaShell();
  ui.g = { open: true, phase: 'ready', parts: [], first: !S.firstPartyDone };
  gEl.classList.add('open'); document.body.classList.add('no-scroll');
  gachaDom();
}
function closeGacha() { ui.g.open = false; if (gEl) gEl.classList.remove('open'); document.body.classList.remove('no-scroll'); }
function startSummon() {
  const r = D.summon(S);
  if (typeof r === 'string') return r;
  Object.assign(ui.g, { phase: 'charge', hero: r.hero, starter: r.starter, t0: performance.now(), steps: rankStep(r.hero.rank) + 1, parts: [] });
  save(); gachaDom();
}
function gachaDom() {
  const g = ui.g, h = g.hero, left = D.starterLeft(S);
  gEl.querySelector('.g-title').textContent = g.first ? 'Summon your first three heroes' : "Summon today's party";
  const info = gEl.querySelector('.g-info'), act = gEl.querySelector('.g-actions');
  if (g.phase === 'ready') { info.innerHTML = '<div class="g-hint">The circle hums. Who will answer?</div>'; act.innerHTML = btn('✦ Summon', 'gsummon', 'big adventure pix'); return; }
  if (g.phase !== 'result') { info.innerHTML = ''; act.innerHTML = ''; return; }
  const c = D.DCLASS[h.cls], U = h.unique && D.UNIQUES[h.unique], col = D.RANKS[h.rank].color;
  // the rank comes first and biggest: a pixel plate with the letter, beside the name
  info.innerHTML = `${U ? '<div class="g-legend">★ LEGENDARY ★</div>' : ''}
    <div class="g-head rk-${h.rank}" style="--rk:${col}"><i class="g-shield" style="background-image:var(--rk-shield-${h.rank})" aria-label="Rank ${h.rank}"></i>
      <div><div class="g-name ${U ? 'u' : ''}">${h.name}</div><div class="g-class"><b>Rank ${h.rank}</b> ${c.name}</div></div></div>
    ${U ? `<div class="g-sig">★ ${U.sig}: ${U.desc}</div>` : ''}<div class="g-abil">✦ ${c.ability}</div>`;
  // straight from one summon to the next until all three have answered
  act.innerHTML = btn(left ? '✦ Next summon' : "Meet today's party", 'gnext', 'big adventure pix');
}
function drawGacha(now) {
  const g = ui.g, c = gEl.querySelector('canvas'), out = c.getContext('2d'), buf = dieBufs.gacha || (dieBufs.gacha = Object.assign(document.createElement('canvas'), { width: GW, height: GH }));
  const x = buf.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, GW, GH);
  const p = (px, py, w, h, col) => { x.fillStyle = col; x.fillRect(Math.round(px), Math.round(py), w, h); };
  const t = now - (g.t0 || now), chargeMs = (g.steps || 1) * STEP_MS;
  let step = 0, phase = g.phase;
  if (phase === 'charge') { step = Math.min(g.steps - 1, Math.floor(t / STEP_MS)); if (t > chargeMs) { phase = g.phase = 'burst'; } }
  if (g.phase === 'burst' && t > chargeMs + BURST_MS) g.phase = 'flip';
  if (g.phase === 'flip' && t > chargeMs + BURST_MS + FLIP_MS) { g.phase = 'result'; gachaDom(); save(); }
  if (g.phase !== 'charge') step = g.hero ? rankStep(g.hero.rank) : 0;
  const col = g.phase === 'ready' ? '#c9b98a' : LADDER[step][1], cx = GW / 2, cy = 58, CW = 60, CH = 84;
  // the whole screen takes on the tier colour as the glow climbs (colour only: the rank itself is shown at the reveal)
  const tint = g.phase === 'ready' ? '' : g.phase === 'charge' ? (step ? LADDER[step][1] : '') : D.RANKS[g.hero.rank].color;
  if (tint !== g.tint) { g.tint = tint; gEl.style.setProperty('--g-col', tint || '#2a3556'); }
  // summoning circle on the floor; once the hero is revealed it fades back, so the nameplate over it reads clearly
  const spin = now / 900 * (g.phase === 'charge' ? 1 + step : 0.6);
  x.globalAlpha = g.phase === 'result' ? 0.3 : 1;
  for (let k = 0; k < 64; k++) { const a = (k / 64) * Math.PI * 2; p(cx + Math.cos(a) * 46, 112 + Math.sin(a) * 11, 1, 1, col); if (k % 2) p(cx + Math.cos(a) * 38, 112 + Math.sin(a) * 9, 1, 1, col); }
  for (let k = 0; k < 8; k++) { const a = spin + k * Math.PI / 4; p(cx + Math.cos(a) * 42 - 1, 112 + Math.sin(a) * 10 - 1, 3, 2, col); }
  x.globalAlpha = 1;
  // rising motes, faster and denser as the charge climbs
  if (g.phase === 'charge' || g.phase === 'ready') { const n = g.phase === 'ready' ? 0.15 : 0.5 + step * 0.4; if (Math.random() < n) g.parts.push({ x: cx + (Math.random() - 0.5) * 80, y: 114, v: 14 + Math.random() * 20 + step * 8, t0: now }); }
  g.parts = g.parts.filter(q => now - q.t0 < 1500);
  for (const q of g.parts) { const a = (now - q.t0) / 1000; x.globalAlpha = Math.max(0, 1 - a / 1.5); p(q.x + Math.sin(a * 6 + q.x) * 2, q.y - a * q.v, 1, 2, col); }
  x.globalAlpha = 1;
  // glow around the card: pixel rings in the current tier colour, pulsing
  const pulse = g.phase === 'charge' ? 0.55 + 0.45 * Math.sin(t / (90 - step * 12)) : g.phase === 'ready' ? 0.35 + 0.15 * Math.sin(now / 500) : 0.7;
  const shake = g.phase === 'charge' ? (1 + step * 1.2) * Math.min(1, (t % STEP_MS) / 200) : 0;
  const ox = Math.round((Math.random() - 0.5) * shake), oy = Math.round((Math.random() - 0.5) * shake);
  for (let r = 1; r <= 9; r++) { x.globalAlpha = pulse * (1 - r / 10) * 0.8; x.strokeStyle = col; x.lineWidth = 1; x.strokeRect(cx - CW / 2 - r + 0.5 + ox, cy - CH / 2 - r + 0.5 + oy, CW + r * 2 - 1, CH + r * 2 - 1); }
  x.globalAlpha = 1;
  // rays behind a revealed B or better: more, longer and brighter the higher the rank
  const rs = g.hero ? rankStep(g.hero.rank) : 0;
  if ((g.phase === 'result' || g.phase === 'flip') && rs >= 2) {
    const n = [0, 0, 6, 10, 14][rs], len = [0, 0, 50, 58, 64][rs], alpha = [0, 0, 0.25, 0.32, 0.4][rs];
    for (let k = 0; k < n; k++) { const a = now / 1600 * (rs >= 4 ? 1 : 0.6) + k * Math.PI * 2 / n; x.globalAlpha = alpha; for (let r = 30; r < len; r++) p(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1, 1, LADDER[rs][1]); x.globalAlpha = 1; }
  }
  // the card: face down (navy and gold with a ?) until the flip, then the hero on their rank colour
  const flipT = g.phase === 'flip' ? (t - chargeMs - BURST_MS) / FLIP_MS : g.phase === 'result' ? 1 : 0;
  const front = flipT >= 0.5, sx = Math.max(0.04, Math.abs(Math.cos(flipT * Math.PI))), w = Math.round(CW * sx), L = Math.round(cx - w / 2) + ox, T = cy - CH / 2 + oy;
  const rk = g.hero ? g.hero.rank : 'C', face = front ? D.RANKS[rk].color : '#2a3556';
  p(L, T, w, CH, '#1d1626'); p(L + 1, T + 1, w - 2, CH - 2, front ? '#fff3c4' : '#c9a03a'); p(L + 3, T + 3, w - 6, CH - 6, face);
  if (!front && w > 20) { const q = [[0, 1, 1, 1, 0], [1, 0, 0, 0, 1], [0, 0, 0, 1, 0], [0, 0, 1, 0, 0], [0, 0, 1, 0, 0], [0, 0, 0, 0, 0], [0, 0, 1, 0, 0]]; q.forEach((row, j) => row.forEach((b, i) => { if (b) p(cx - 7 + i * 3 + ox, T + 30 + j * 3, 3, 3, '#f0d070'); })); }
  if (front && w > 40 && g.hero) {
    p(L + 3, T + CH - 26, w - 6, 23, 'rgba(255,255,255,.35)'); { const hs = heroSprite(g.hero); x.drawImage(hs, Math.round(cx - hs.width / 2) + ox, T + 10); }
    x.drawImage(SHIELDS[g.hero.rank], L + 3, T + 3);   // the rank shield in the card's corner
  }
  // flash on each new step of the ladder, and the big burst
  let flash = 0;
  if (g.phase === 'charge') flash = Math.max(0, 0.6 - (t % STEP_MS) / 300) * (Math.floor(t / STEP_MS) > 0 ? 1 : 0);
  if (g.phase === 'burst') flash = 1 - (t - chargeMs) / BURST_MS * 0.6;
  if (g.phase === 'flip') flash = Math.max(0, 0.4 - flipT);
  if (flash > 0) { x.globalAlpha = Math.min(1, flash); p(0, 0, GW, GH, step >= 4 ? '#fff6cf' : '#ffffff'); x.globalAlpha = 1; }
  out.setTransform(1, 0, 0, 1, 0, 0); out.imageSmoothingEnabled = false; out.clearRect(0, 0, c.width, c.height); out.drawImage(buf, 0, 0, c.width, c.height);
  // Even spacing: title, card, nameplate, skill text and button are all G_GAP apart (the card measured by its own edges,
  // not the canvas around it). Once revealed, the nameplate floats up over the summoning circle.
  const s = c.clientHeight / GH, info = gEl.querySelector('.g-info');
  const ct = Math.round(G_GAP - G_FLEX - (cy - CH / 2) * s);
  const mt = g.phase === 'result' ? Math.round(G_GAP - G_FLEX - (GH - cy - CH / 2) * s) : 0;
  if (c._mt !== ct) { c._mt = ct; c.style.marginTop = `${ct}px`; }
  if (info._mt !== mt) { info._mt = mt; info.style.marginTop = `${mt}px`; }
}

// ---- pixel buttons --------------------------------------------------------------------------------
// The big buttons share the dice tray's look: a 12x12 pixel frame (dark outline, gold rim lit from the top-left,
// stepped corners, felt middle) used as a 9-slice border image at 3x, so every edge stays a crisp pixel.
function pixFrame(felt, rim) {
  const N = 12, c = document.createElement('canvas'); c.width = c.height = N;
  const x = c.getContext('2d'), inShape = (i, j) => i >= 0 && j >= 0 && i < N && j < N && !((i < 2 || i > N - 3) && (j < 2 || j > N - 3) && (Math.min(i, N - 1 - i) + Math.min(j, N - 1 - j) < 2));
  const sh = (hex, f) => { const n = parseInt(hex.slice(1), 16); return `rgb(${[16, 8, 0].map(b => Math.min(255, Math.round(((n >> b) & 255) * f))).join(',')})`; };
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    if (!inShape(i, j)) continue;
    let ring = 0; while (ring < 4 && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([a, b]) => inShape(i + a * (ring + 1), j + b * (ring + 1)))) ring++;
    const top = j < 4 || i < 4, bot = j > N - 5 || i > N - 5;
    x.fillStyle = ring === 0 ? '#1d1626' : ring === 1 ? (top && !bot ? sh(rim, 1.3) : bot && !top ? sh(rim, 0.68) : rim) : ring === 2 ? sh(felt, top && !bot ? 0.78 : 0.62) : felt;
    x.fillRect(i, j, 1, 1);
  }
  return `url(${c.toDataURL()})`;
}
const root = document.documentElement.style;
root.setProperty('--pix-adv', pixFrame('#b85e28', '#c9a03a'));
root.setProperty('--pix-rest', pixFrame('#2a3556', '#c9a03a'));
root.setProperty('--pix-off', pixFrame('#8f877a', '#b8ab92'));
root.setProperty('--pix-red', pixFrame('#a3302a', '#c9a03a'));     // letting a summoned hero go, erasing the save
root.setProperty('--pix-cream', pixFrame('#fbf3e0', '#c9a03a'));   // hero choices on the summon screen
root.setProperty('--pix-ash', pixFrame('#e1dcd2', '#b8ab92'));     // ...and a dead hero's choice
for (const [k, R] of Object.entries(D.RANKS)) root.setProperty(`--pix-rk-${k}`, pixFrame(R.color, k === 'S' ? '#fff3c4' : '#c9a03a'));   // rank badges
// The rank as a little pixel shield (15x17) in its colour with the letter on it, shown on hero cards and at the summon.
// A gold rim lit from the top-left; S gets a pale rim so the best rank stands apart.
const SHIELDS = {};
{
  const HW = [5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 5, 5, 4, 3, 2, 1, 0], W = 15, H = HW.length;
  const inS = (i, j) => j >= 0 && j < H && i >= 0 && i < W && Math.abs(i - 7) <= HW[j];
  const near = (i, j, f) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => f(i + a, j + b));
  const isEdge = (i, j) => inS(i, j) && near(i, j, (a, b) => !inS(a, b));
  const sh = (hex, f) => { const n = parseInt(hex.slice(1), 16); return `rgb(${[16, 8, 0].map(b => Math.min(255, Math.round(((n >> b) & 255) * f))).join(',')})`; };
  for (const [k, R] of Object.entries(D.RANKS)) {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d'), rim = k === 'S' ? ['#ffffff', '#fff3c4', '#c9a03a'] : ['#f0d070', '#c9a03a', '#8a6a1a'];
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      if (!inS(i, j)) continue;
      x.fillStyle = isEdge(i, j) ? '#1d1626' : near(i, j, isEdge) ? (j <= 2 || i <= 2 ? rim[0] : j >= 11 || i >= 12 ? rim[2] : rim[1]) : sh(R.color, j < 8 ? 1.1 : 0.86);
      x.fillRect(i, j, 1, 1);
    }
    x.fillStyle = 'rgba(255,255,255,.55)'; x.fillRect(3, 3, 2, 1); x.fillRect(3, 4, 1, 1);   // glint
    const px = [...RANK_GLYPH[k]].map((b, n) => b === '1' && [5 + (n % 5), 4 + Math.floor(n / 5)]).filter(Boolean);
    x.fillStyle = '#1d1626'; for (const [i, j] of px) x.fillRect(i, j + 1, 1, 1);   // the letter's shadow, then the letter
    x.fillStyle = '#ffffff'; for (const [i, j] of px) x.fillRect(i, j, 1, 1);
    SHIELDS[k] = c; root.setProperty(`--rk-shield-${k}`, `url(${c.toDataURL()})`);
  }
}

// ---- the d20 ------------------------------------------------------------------------------------
// Everything is drawn on a small pixel grid (112x84) and scaled up 3x without smoothing. The die is thrown into a
// felt tray from the left, tumbles and bounces three times (kicking up dust), squashes as it lands, then the result
// bursts in the colour of the verdict.
const DBW = 112, DBH = 84, DK = 3, GROUND = 71, DR = 19, DS = 48;   // DS: the die's own grid
const D57 = { 0: '01110100011001110101110011000101110', 1: '00100011000010000100001000010001110', 2: '01110100010000100010001000100011111',
  3: '11110000010000101110000010000111110', 4: '00010001100101010010111110001000010', 5: '11111100001111000001000011000101110',
  6: '00110010001000011110100011000101110', 7: '11111000010001000100010000100001000', 8: '01110100011000101110100011000101110', 9: '01110100011000101111000010001001100' };
const dieBufs = {};
const buf = (k, w, h) => { if (!dieBufs[k]) { const c = document.createElement('canvas'); c.width = w; c.height = h; dieBufs[k] = c; } return dieBufs[k]; };
const tierColor = r => (r >= 18 ? '#ffd23a' : r >= 14 ? '#8fe08a' : r >= 8 ? '#fff3c4' : r >= 3 ? '#ff9a5a' : '#ff4a4a');
function drawTray() {
  const c = buf('tray', DBW, DBH);
  if (c.done) return c;
  const x = c.getContext('2d'), p = (px, py, w, h, col) => { x.fillStyle = col; x.fillRect(px, py, w, h); };
  const L = 6, T = 40, R = DBW - 6, B = DBH - 2;
  p(L + 2, T, R - L - 4, B - T, '#8a6a1a'); p(L, T + 2, R - L, B - T - 4, '#8a6a1a'); p(L + 1, T + 1, R - L - 2, B - T - 2, '#8a6a1a');   // rounded rim
  p(L + 2, T + 1, R - L - 4, 1, '#f0d070'); p(L + 1, T + 2, 1, B - T - 4, '#d9b24a');                                                   // lit edges
  p(L + 2, T + 2, R - L - 4, B - T - 4, '#c9a03a'); p(L + 3, T + 3, R - L - 6, B - T - 6, '#2a3556');                                    // gold band, felt
  for (let y = T + 3; y < B - 3; y++) for (let xx = L + 3; xx < R - 3; xx++) { const v = hash(xx * 31 + y * 7); if (v > 0.93) p(xx, y, 1, 1, '#323e62'); else if (v < 0.05) p(xx, y, 1, 1, '#232d4a'); }
  p(L + 3, T + 3, R - L - 6, 3, 'rgba(0,0,0,.35)'); p(L + 3, T + 6, R - L - 6, 2, 'rgba(0,0,0,.15)');                                     // inner shadow under the rim
  c.done = true;
  return c;
}
const hash = n => { const v = Math.sin(n * 127.1) * 43758.5453; return v - Math.floor(v); };
// the die, rotated and squashed, on its own 48x48 grid with hard edges, a 1px outline and the number
function renderDie(num, nat, ang, sx, sy) {
  const S2 = DS, c = buf('die', S2, S2), x = c.getContext('2d', { willReadFrequently: true });
  x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, S2, S2);
  const ramp = nat === 20 ? ['#fff8d8', '#ffe9a0', '#f0cf6a', '#d4a83a', '#a8801f'] : nat === 1 ? ['#fbe2dc', '#f0b8ac', '#d88a7a', '#b8645a', '#8a3a34']
    : ['#fffaf0', '#f2e8cf', '#e0d2b0', '#c4b48e', '#9a8a68'];
  const H = [...Array(6)].map((_, i) => { const a = -Math.PI / 2 + i * Math.PI / 3; return [Math.cos(a) * DR, Math.sin(a) * DR]; });
  const T = [0, 1, 2].map(i => { const a = -Math.PI / 2 + i * 2 * Math.PI / 3; return [Math.cos(a) * DR * 0.58, Math.sin(a) * DR * 0.58]; });
  const faces = [[T[0], T[1], T[2]], [T[0], T[1], H[1]], [T[1], T[2], H[3]], [T[2], T[0], H[5]], [T[0], H[0], H[1]], [T[0], H[5], H[0]], [T[1], H[1], H[2]], [T[1], H[2], H[3]], [T[2], H[3], H[4]], [T[2], H[4], H[5]]];
  x.translate(S2 / 2, S2 / 2); x.scale(sx, sy); x.rotate(ang);
  faces.forEach((f, i) => {
    let tone = 0;
    if (i > 0) { const cxf = (f[0][0] + f[1][0] + f[2][0]) / 3, cyf = (f[0][1] + f[1][1] + f[2][1]) / 3, a = Math.atan2(cyf, cxf) + ang;
      const light = Math.cos(a - (-2.3));   // lit from the top-left
      tone = i < 4 ? (light > 0.3 ? 1 : light > -0.4 ? 2 : 3) : (light > 0.5 ? 1 : light > -0.2 ? 2 : light > -0.7 ? 3 : 4); }
    x.beginPath(); f.forEach(([px, py], j) => (j ? x.lineTo(px, py) : x.moveTo(px, py))); x.closePath(); x.fillStyle = ramp[tone]; x.fill();
    x.strokeStyle = ramp[4]; x.lineWidth = 0.9; x.stroke();
  });
  x.setTransform(1, 0, 0, 1, 0, 0);
  const img = x.getImageData(0, 0, S2, S2), d = img.data;
  for (let i = 3; i < d.length; i += 4) d[i] = d[i] >= 120 ? 255 : 0;
  // 1px dark outline around the silhouette
  const solid = i => d[i * 4 + 3] === 255, out = [];
  for (let yy = 0; yy < S2; yy++) for (let xx = 0; xx < S2; xx++) { const i = yy * S2 + xx; if (solid(i)) continue; if ((xx > 0 && solid(i - 1)) || (xx < S2 - 1 && solid(i + 1)) || (yy > 0 && solid(i - S2)) || (yy < S2 - 1 && solid(i + S2))) out.push(i); }
  for (const i of out) { d[i * 4] = 42; d[i * 4 + 1] = 30; d[i * 4 + 2] = 34; d[i * 4 + 3] = 255; }
  x.putImageData(img, 0, 0);
  // the number, engraved (dark ink with a light lip underneath)
  if (num) {
    const w = num.length * 6 - 1, x0 = Math.round(S2 / 2 - w / 2), y0 = Math.round(S2 / 2 - 3 + 1);
    const ink = nat === 20 ? '#6a3a00' : nat === 1 ? '#7a0a0a' : '#2a1a14';
    [...num].forEach((ch, k) => [...D57[ch]].forEach((bit, j) => {
      if (bit !== '1') return;
      const px = x0 + k * 6 + (j % 5), py = y0 + Math.floor(j / 5);
      x.fillStyle = ramp[0]; x.fillRect(px, py + 1, 1, 1); x.fillStyle = ink; x.fillRect(px, py, 1, 1);
    }));
  }
  if (!num || sx > 0.98) { x.fillStyle = '#ffffff'; x.fillRect(S2 / 2 - 9, S2 / 2 - 9, 2, 1); x.fillRect(S2 / 2 - 10, S2 / 2 - 8, 1, 2); }   // glint
  return c;
}
function drawDie(c, now) {
  const out = c.getContext('2d'), d = S.day, main = buf('main', DBW, DBH), x = main.getContext('2d');
  x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, DBW, DBH); x.drawImage(drawTray(), 0, 0);
  const roll = rolling(), p = roll ? (now - ui.rollAt) / ROLL_MS : 1, settledFor = d.roll && ui.rollAt ? now - ui.rollAt - ROLL_MS : 1e9;
  // where the die is: thrown in from the left, bouncing three times on the felt
  const BOUNCES = [0, 0.34, 0.6, 0.8, 1], HEIGHT = [30, 13, 6, 2];
  let h = 0, seg = 3, u = 1;
  if (roll) {
    seg = BOUNCES.findIndex((b, i) => p >= b && p < BOUNCES[i + 1]); u = (p - BOUNCES[seg]) / (BOUNCES[seg + 1] - BOUNCES[seg]);
    h = seg === 0 ? HEIGHT[0] * (1 - u * u) : HEIGHT[seg] * 4 * u * (1 - u);
    if (seg !== ui.dieSeg) { ui.dieSeg = seg; if (seg > 0) for (let k = 0; k < 7; k++) ui.dust.push({ x: 0, y: GROUND, vx: (Math.random() - 0.5) * 30, vy: -Math.random() * 14, t0: now, at: seg }); }
  } else ui.dieSeg = -1;
  const cx = roll ? 20 + 36 * (1 - Math.pow(1 - p, 2)) : DBW / 2, ease = 1 - p;
  let ang = roll ? ease * ease * 13 + Math.sin(now / 50) * 0.3 * ease : (!d.roll ? Math.sin(now / 900) * 0.06 : 0), sx = 1, sy = 1;
  if (roll) { const tumble = Math.abs(Math.sin(now / 70)) * 0.22 * ease; sx = 1 - tumble * 0.4; sy = 1 - tumble; if (seg > 0 && u < 0.1) { sx *= 1.14; sy *= 0.84; } }
  else if (settledFor >= 0 && settledFor < 140) { sx = 1.1; sy = 0.88; }
  // shadow on the felt: smaller and lighter while the die is in the air
  const sw = Math.round(DR * (1 - h / 40));
  x.fillStyle = `rgba(0,0,0,${0.4 - h / 90})`;
  for (let yy = -1; yy <= 1; yy++) { const hw = Math.round(sw * Math.sqrt(1 - (yy * yy) / 3)); x.fillRect(Math.round(cx - hw), GROUND + 2 + yy, hw * 2, 1); }
  // dust from each landing
  ui.dust = ui.dust.filter(q => now - q.t0 < 450);
  for (const q of ui.dust) { const t = (now - q.t0) / 1000; x.fillStyle = `rgba(214,196,160,${0.9 * (1 - t / 0.45)})`; x.fillRect(Math.round(cx + q.vx * t * 1.4 - 4 * Math.sign(q.vx)), Math.round(q.y + 1 + q.vy * t + 30 * t * t), 1, 1); }
  // the number: flickers while tumbling, blank before the first roll
  if (roll && now - ui.flickAt > 45 + p * 170) { ui.flick = String(1 + Math.floor(Math.random() * 20)); ui.flickAt = now; }
  const num = !d.roll ? '' : roll ? ui.flick : String(d.roll), nat = d.roll && !roll ? d.roll : 0;
  const die = renderDie(num, nat, ang, sx, sy);
  x.drawImage(die, Math.round(cx - DS / 2), Math.round(GROUND - DR * sy - h - DS / 2));   // resting on the felt at GROUND
  // the result bursts in the verdict's colour
  if (d.roll && !roll && settledFor >= 0 && settledFor < 1100) {
    const t = settledFor / 1100, col = tierColor(d.roll), n = d.roll >= 18 || d.roll <= 2 ? 16 : d.roll >= 14 || d.roll <= 6 ? 10 : 6;
    for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2 + k, dist = 6 + t * (22 + (k % 3) * 6); x.globalAlpha = 1 - t; x.fillStyle = k % 2 ? col : '#ffffff';
      x.fillRect(Math.round(cx + Math.cos(a) * dist * 1.3), Math.round(GROUND - DR + Math.sin(a) * dist * 0.8), k % 3 ? 1 : 2, k % 3 ? 1 : 2); }
    if (d.roll >= 18) for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + t; x.globalAlpha = 0.6 * (1 - t); x.fillStyle = col; for (let r = 21; r < 21 + 10 * (1 - t); r++) x.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(GROUND - DR + Math.sin(a) * r * 0.7), 1, 1); }
    x.globalAlpha = 1;
  }
  out.setTransform(1, 0, 0, 1, 0, 0); out.imageSmoothingEnabled = false; out.clearRect(0, 0, c.width, c.height);
  out.drawImage(main, 0, 0, c.width, c.height);
}

// ---- actions ---------------------------------------------------------------------------------
let toastTimer;
function toast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2400); }
const actions = {
  // Adventure! / Go deeper!: the d20 is rolled now (you go in blind); the odds are read while it tumbles
  dive: () => {
    const e = D.rollFate(S); if (e) return e;
    S.day.odds = D.shownOdds(S);   // a few hundredths of a second, read before the party moves (1-99%, 100% only on a 20)
    const ad = D.startAdventure(S); if (typeof ad === 'string') return ad;
    ad.hold = true; ad.seen = false; ad.odds = S.day.odds; ui.rollAt = performance.now(); ui.doneAt = null; window.scrollTo(0, 0);
  },
  rest: () => { const e = D.rest(S); if (e) return e; if (S.adv) S.adv.seen = true; window.scrollTo(0, 0); },
  seen: () => { S.adv.seen = true; ui.fullSummary = false; window.scrollTo(0, 0); },
  gopen: () => { const e = D.canSummon(S); if (e) return e; openGacha(); return startSummon(); },   // the home button already asked to summon: start the first one at once
  gsummon: () => startSummon(),
  gnext: () => { if (D.starterLeft(S)) return startSummon(); closeGacha(); window.scrollTo(0, 0); toast('Your party is ready. Adventure awaits!'); },
  board: () => { ui.screen = 'board'; window.scrollTo(0, 0); },
  home: () => { ui.screen = null; window.scrollTo(0, 0); },
  btab: d => { ui.boardTab = d.tab; },
  nextday: () => { if (S.adv && !S.adv.done) return 'Wait until the adventure is over.'; if (S.adv) S.adv.seen = true; S.dayOffset++; D.ensureDay(S, D.currentDayKey(S)); ui.rollAt = 0; },
  reset: () => { if (confirm('Erase your heroes and renown and start over?')) { const off = S.dayOffset; S = D.newState(); S.dayOffset = off; D.ensureDay(S, D.currentDayKey(S)); ui.rollAt = 0; } },
};
document.addEventListener('pointerdown', () => { pointerDown = true; pointerAt = performance.now(); });
window.addEventListener('blur', () => { pointerDown = false; });
document.addEventListener('pointerup', () => { pointerDown = false; });
document.addEventListener('pointercancel', () => { pointerDown = false; });
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]');
  if (!el || el.disabled) return;
  const err = actions[el.dataset.a](el.dataset);
  if (typeof err === 'string') toast(err);
  save(); render(true);
});

// ---- loops -------------------------------------------------------------------------------------
let last = performance.now(), saveAt = 0;
setInterval(() => {
  const now = performance.now(), dt = Math.min(1, (now - last) / 1000);
  last = now;
  const key = D.currentDayKey(S);
  if (S.day.key !== key && !(S.adv && !S.adv.done)) { if (S.adv) S.adv.seen = true; D.ensureDay(S, key); ui.rollAt = 0; }
  if (S.adv && S.adv.hold && (!ui.rollAt || now - ui.rollAt > ROLL_MS + REVEAL_MS)) { S.adv.hold = false; ui.rollAt = 0; }   // revealed: off they go
  const ev = D.update(S, dt), t0 = performance.now();
  for (const e of ev) floaters.push({ ...e, t0, jx: (Math.random() - 0.5) * 8 });
  while (floaters.length && t0 - floaters[0].t0 > 1000) floaters.shift();
  if (S.adv && (!anim || anim.n !== S.adv.actN)) anim = { n: S.adv.actN, t: now };
  if (now - saveAt > 1000) { saveAt = now; save(); }
  render();
}, 100);
function frame() {
  const now = performance.now(), t = now / 1000;
  const town = canvases.get('town'), dun = canvases.get('dun'), die = canvases.get('die'), place = canvases.get('place');
  if (place && place.isConnected) {
    if (ui.placeDay !== S.day.key) { ui.placeDay = S.day.key; ui.place = D.LOCATIONS[D.questFor(S.day.key).loc - 1]; place._done = false; }
    if (!place._done) place._done = drawPlace(place.getContext('2d'), ui.place);   // a still picture: drawn once
  }
  if (town && town.isConnected) {
    const q = D.questFor(S.day.key);
    drawTown(town.getContext('2d'), { heroes: D.alive(S), graveyard: [], expeditions: [], accent: D.LOCATIONS[q.loc - 1].pal.accent }, t);
  }
  if (dun && dun.isConnected && S.adv) { const x = dun.getContext('2d'); drawDungeon(x, { heroes: D.alive(S) }, S.adv, t, anim, floaters); drawBanner(x, S.adv, now); }
  if (die && die.isConnected) drawDie(die, now);
  if (ui.g.open) drawGacha(now);
  requestAnimationFrame(frame);
}
render(true);
requestAnimationFrame(frame);
window.__daily = { get S() { return S; }, D, ui }; // handy for debugging in the console
