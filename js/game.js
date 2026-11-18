// Game rules. No DOM in here so it can also run headless (see tools/sim.mjs).
import { ATTRS, CLASSES, TRAITS, RARITY, TIER_NAMES, WEAPONS, ARMORS, TRINKETS, ENEMIES, FLOORS, UPGRADES, NAMES, EPITHETS, SKINS, HAIRS, HERO_ART } from './data.js';

// ---- tuning knobs -------------------------------------------------------
export const TUNE = {
  enemyGrowth: 1.27,   // enemy hp/atk multiplier per floor
  itemGrowth: 1.33,    // gear power multiplier per tier
  enemyHp: 26, enemyAtk: 11, enemyDef: 2.5,
  stepTime: 0.55,      // seconds per expedition action at 1x
  partyMax: 3,
  recruitRefresh: 150, marketRefresh: 200,
  fleeHits: 1,         // each enemy gets this many free attacks when you flee mid-fight
};

export const rnd = (a, b) => a + Math.random() * (b - a);
export const ri = (a, b) => Math.floor(rnd(a, b + 1));
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const floorMult = f => Math.pow(TUNE.enemyGrowth, f - 1);

// ---- state ---------------------------------------------------------------
export function newState() {
  const S = {
    v: 1, time: 0, gold: 160, speed: 1, nextId: 1,
    heroes: [], recruits: [], inventory: [], market: [],
    recruitTimer: 0, marketTimer: 0,
    upgrades: { barracks: 0, tavern: 0, infirmary: 0, charter: 0 },
    expeditions: [], maxFloor: 1, cleared: 0, won: false,
    graveyard: [], news: [],
    stats: { expeditions: 0, kills: 0, deaths: 0, goldEarned: 0 },
  };
  refreshRecruits(S);
  refreshMarket(S);
  addNews(S, 'You unlock the shutters of your shop at the edge of the Hole. Recruit some heroes.', 'info');
  return S;
}
export function addNews(S, s, c = '') {
  S.news.unshift({ s, c });
  if (S.news.length > 40) S.news.length = 40;
}
export const rosterCap = S => 4 + S.upgrades.barracks;
export const expeditionSlots = S => 1 + S.upgrades.charter;
export const activeExpeditions = S => S.expeditions.filter(e => !e.done);
export const upgradeCost = (S, k) => Math.round(UPGRADES[k].base * Math.pow(UPGRADES[k].growth, S.upgrades[k]));
export const findHero = (S, id) => S.heroes.find(h => h.id === id);

// ---- items ---------------------------------------------------------------
function rollRarity(luck = 0) {
  const r = Math.random() * 100 - luck;
  return r < 2 ? 3 : r < 12 ? 2 : r < 40 ? 1 : 0;
}
export function newItem(S, tier, o = {}) {
  tier = clamp(tier, 1, 10);
  const slot = o.slot || pick(['weapon', 'weapon', 'armor', 'armor', 'trinket']);
  const rar = o.rarity ?? rollRarity(o.luck);
  const rm = RARITY[rar].mul, g = Math.pow(TUNE.itemGrowth, tier - 1);
  const it = { id: S.nextId++, slot, tier, rar };
  if (slot === 'weapon') {
    it.kind = o.kind || pick(Object.keys(WEAPONS));
    it.atk = Math.round(3 * g * rm * WEAPONS[it.kind].atk);
    it.name = `${TIER_NAMES[tier - 1]} ${WEAPONS[it.kind].name}`;
  } else if (slot === 'armor') {
    it.kind = o.kind || pick(Object.keys(ARMORS));
    it.def = Math.round(4 * tier * rm * ARMORS[it.kind].def);
    it.hp = Math.round(9 * g * rm * ARMORS[it.kind].hp);
    it.name = `${TIER_NAMES[tier - 1]} ${ARMORS[it.kind].name}`;
  } else {
    it.kind = o.kind || pick(Object.keys(TRINKETS));
    it.hp = Math.round(4 * g * rm);
    it.name = TRINKETS[it.kind].name;
  }
  return it;
}
export function itemValue(it) {
  return Math.round(7 * Math.pow(1.42, it.tier - 1) * RARITY[it.rar].mul * RARITY[it.rar].mul * (it.slot === 'trinket' ? 1.3 : 1));
}
export const buyPrice = it => itemValue(it) * 3;
export function itemDesc(it) {
  if (it.slot === 'weapon') return `+${it.atk} attack`;
  if (it.slot === 'armor') return `+${it.def} armor, +${it.hp} health`;
  return `${TRINKETS[it.kind].desc(it.rar)}, +${it.hp} health`;
}
export function canEquip(h, it) {
  const c = CLASSES[h.cls];
  if (it.slot === 'weapon') return c.weapons.includes(it.kind);
  if (it.slot === 'armor') return c.armors.includes(it.kind);
  return true;
}
export function whoCanUse(it) {
  if (it.slot === 'trinket') return 'Anyone';
  const key = it.slot === 'weapon' ? 'weapons' : 'armors';
  return Object.values(CLASSES).filter(c => c[key].includes(it.kind)).map(c => c.name).join(', ');
}

// ---- heroes --------------------------------------------------------------
export function newHero(S, o = {}) {
  const cls = o.cls || pick(Object.keys(CLASSES));
  const c = CLASSES[cls], gender = o.gender || pick(Object.keys(HERO_ART[cls] || { m: 1, f: 1 }));
  const bonus = o.bonus ?? S.upgrades.tavern;
  const attrs = {};
  for (const a of ATTRS) attrs[a] = c.base[a] + ri(-1, 2) + (Math.random() < bonus * 0.25 ? 1 : 0);
  attrs[c.main] += Math.floor(bonus / 2);
  const tkeys = Object.keys(TRAITS);
  let trait = pick(tkeys);
  if (TRAITS[trait].bad && Math.random() < bonus * 0.15) trait = pick(tkeys.filter(k => !TRAITS[k].bad));
  const h = {
    id: S.nextId++, cls, gender,
    name: pick(NAMES[gender]) + (Math.random() < 0.45 ? ' ' + pick(EPITHETS) : ''),
    look: { skin: pick(SKINS), hair: pick(HAIRS), style: ri(0, 2) },
    attrs, lvl: 1, xp: 0, hp: 1, trait: o.trait || trait,
    gear: { weapon: newItem(S, 1, { slot: 'weapon', kind: c.weapons[0], rarity: 0 }), armor: null, trinket: null },
    busy: false, kills: 0, deepest: 0,
  };
  h.hp = heroStats(h).maxHp;
  return h;
}
function applyFx(st, fx) {
  if (!fx) return;
  for (const k in fx) {
    if (k === 'resist') st.resist[fx[k]] = true;
    else if (k === 'survivor') st.survivor = true;
    else st[k] += fx[k];
  }
}
export function heroStats(h) {
  const c = CLASSES[h.cls], a = h.attrs, g = h.gear;
  const st = { hpPct: 0, atkPct: 0, spd: 10 + a.agi * 0.6, dodge: a.agi * 0.7 + (c.dodge || 0), crit: 5 + a.agi * 0.8 + (c.crit || 0),
    def: a.vit * 0.3, gold: 0, xp: 0, ls: 0, resist: {}, survivor: false };
  applyFx(st, TRAITS[h.trait].fx);
  let hpFlat = 0, watk = 0;
  if (g.weapon) watk = g.weapon.atk;
  if (g.armor) { st.def += g.armor.def; hpFlat += g.armor.hp; }
  if (g.trinket) { hpFlat += g.trinket.hp; applyFx(st, TRINKETS[g.trinket.kind].fx(g.trinket.rar)); }
  if (h.cls === 'ranger') st.resist.dark = true;
  st.maxHp = Math.max(1, Math.round(((24 + a.vit * 5 + h.lvl * 3) * c.hpMul + hpFlat) * (1 + st.hpPct / 100)));
  st.atk = (2 + a[c.main] * 1.2 + h.lvl * 0.5 + watk) * (1 + st.atkPct / 100);
  st.def = Math.max(0, st.def);
  st.dodge = clamp(st.dodge, 0, 45);
  return st;
}
export const xpNeed = lvl => Math.round(30 * Math.pow(lvl, 1.7));
export function gainXp(h, amount) {
  h.xp += amount;
  let ups = 0;
  while (h.xp >= xpNeed(h.lvl)) {
    h.xp -= xpNeed(h.lvl);
    const before = heroStats(h).maxHp;
    h.lvl++; ups++;
    h.attrs[CLASSES[h.cls].main]++;
    h.attrs[pick(ATTRS)]++;
    h.hp += heroStats(h).maxHp - before;
  }
  return ups;
}
export function recruitCost(h, S) {
  const sum = ATTRS.reduce((s, a) => s + h.attrs[a], 0);
  const cost = Math.max(30, Math.round(35 + (sum - 21) * 5 + (TRAITS[h.trait].bad ? -8 : 6)));
  // Safety net: with an empty roster and an empty purse, someone will always work for free.
  if (S && S.heroes.length === 0 && S.gold < cost) return 0;
  return cost;
}
export function refreshRecruits(S) {
  const n = 3 + Math.min(3, Math.floor((S.upgrades.tavern + 1) / 2));
  // shuffle classes so every batch of recruits offers variety
  const cls = Object.keys(CLASSES).sort(() => Math.random() - 0.5);
  S.recruits = Array.from({ length: n }, (_, i) => newHero(S, { cls: cls[i % cls.length] }));
  S.recruitTimer = TUNE.recruitRefresh;
}
export function refreshMarket(S) {
  const top = Math.max(1, S.cleared);
  S.market = Array.from({ length: 6 }, (_, i) => newItem(S, Math.max(1, top - ri(0, 1)), { luck: -15, slot: i < 2 ? 'weapon' : i < 4 ? 'armor' : i < 5 ? 'trinket' : undefined }));
  S.marketTimer = TUNE.marketRefresh;
}

// ---- town actions (return an error string, or nothing on success) ---------
export function recruit(S, id) {
  const i = S.recruits.findIndex(h => h.id === id);
  if (i < 0) return 'Gone.';
  const h = S.recruits[i], cost = recruitCost(h, S);
  if (S.heroes.length >= rosterCap(S)) return 'Roster is full. Upgrade the Barracks.';
  if (S.gold < cost) return 'Not enough gold.';
  S.gold -= cost; S.recruits.splice(i, 1); S.heroes.push(h);
  addNews(S, `${h.name} the ${CLASSES[h.cls].name} signs on.`, 'good');
}
export function rerollRecruits(S) {
  const cost = 20 + 10 * S.upgrades.tavern;
  if (S.gold < cost) return 'Not enough gold.';
  S.gold -= cost; refreshRecruits(S);
}
export function dismiss(S, id) {
  const h = findHero(S, id);
  if (!h || h.busy) return 'That hero is in the Dungeon.';
  for (const s of ['weapon', 'armor', 'trinket']) if (h.gear[s]) S.inventory.push(h.gear[s]);
  S.heroes = S.heroes.filter(x => x !== h);
  addNews(S, `${h.name} leaves town.`);
}
export function equip(S, heroId, itemId) {
  const h = findHero(S, heroId), i = S.inventory.findIndex(x => x.id === itemId);
  if (!h || i < 0) return 'Missing.';
  if (h.busy) return 'That hero is in the Dungeon.';
  const it = S.inventory[i];
  if (!canEquip(h, it)) return `${CLASSES[h.cls].name}s cannot use that.`;
  const ratio = h.hp / heroStats(h).maxHp;
  S.inventory.splice(i, 1);
  if (h.gear[it.slot]) S.inventory.push(h.gear[it.slot]);
  h.gear[it.slot] = it;
  h.hp = Math.min(h.hp, heroStats(h).maxHp) || 1;
  if (ratio >= 1) h.hp = heroStats(h).maxHp;
}
export function unequip(S, heroId, slot) {
  const h = findHero(S, heroId);
  if (!h || !h.gear[slot]) return;
  if (h.busy) return 'That hero is in the Dungeon.';
  S.inventory.push(h.gear[slot]); h.gear[slot] = null;
  h.hp = Math.min(h.hp, heroStats(h).maxHp);
}
export function sellItem(S, itemId) {
  const i = S.inventory.findIndex(x => x.id === itemId);
  if (i < 0) return;
  S.gold += itemValue(S.inventory[i]); S.stats.goldEarned += itemValue(S.inventory[i]);
  S.inventory.splice(i, 1);
}
export function buyItem(S, itemId) {
  const i = S.market.findIndex(x => x.id === itemId);
  if (i < 0) return;
  const it = S.market[i];
  if (S.gold < buyPrice(it)) return 'Not enough gold.';
  S.gold -= buyPrice(it); S.market.splice(i, 1); S.inventory.push(it);
}
export function buyUpgrade(S, k) {
  if (S.upgrades[k] >= UPGRADES[k].max) return 'Fully upgraded.';
  const cost = upgradeCost(S, k);
  if (S.gold < cost) return 'Not enough gold.';
  S.gold -= cost; S.upgrades[k]++;
  addNews(S, `${UPGRADES[k].name} upgraded to level ${S.upgrades[k]}.`, 'good');
}
export function healCost(h) {
  const st = heroStats(h);
  return Math.ceil((st.maxHp - h.hp) * 0.25 * (1 + h.lvl * 0.15));
}
export function healHero(S, id) {
  const h = findHero(S, id);
  if (!h || h.busy) return;
  const cost = healCost(h);
  if (cost <= 0) return;
  if (S.gold < cost) return 'Not enough gold.';
  S.gold -= cost; h.hp = heroStats(h).maxHp;
}

// ---- expeditions ---------------------------------------------------------
function rollRooms(f) {
  const fl = FLOORS[f - 1], rooms = [];
  for (let i = 0; i < fl.rooms - 1; i++) {
    const r = Math.random();
    rooms.push(i === 0 ? 'combat' : r < 0.68 ? 'combat' : r < 0.80 ? 'treasure' : r < 0.91 ? 'trap' : 'shrine');
  }
  rooms.push(fl.boss ? 'boss' : 'guard');
  return rooms;
}
export function startExpedition(S, heroIds, floor, o = {}) {
  if (activeExpeditions(S).length >= expeditionSlots(S)) return 'No free expedition slot.';
  if (!heroIds.length) return 'Pick at least one hero.';
  if (heroIds.length > TUNE.partyMax) return `A party is at most ${TUNE.partyMax} heroes.`;
  if (floor < 1 || floor > S.maxFloor) return 'That floor is not unlocked.';
  const hs = heroIds.map(id => findHero(S, id));
  if (hs.some(h => !h || h.busy)) return 'A hero is unavailable.';
  const ex = {
    id: S.nextId++, heroIds: [...heroIds], floor, startFloor: floor, room: 0, rooms: rollRooms(floor),
    phase: 'enter', enemies: [], queue: [], bag: { gold: 0, items: [] }, log: [], cs: {},
    push: !!o.push, auto: o.auto || 0, acc: 0, actN: 0, act: null, done: false, outcome: null, fallen: [], roomsCleared: 0,
  };
  for (const h of hs) { h.busy = true; ex.cs[h.id] = { poison: 0, acts: 0, first: true, survivorUsed: false }; }
  S.expeditions.push(ex); S.stats.expeditions++;
  xlog(ex, `The party descends to floor ${floor}: ${FLOORS[floor - 1].name}.`, 'info');
  return ex;
}
export const party = (S, ex) => ex.heroIds.map(id => findHero(S, id)).filter(Boolean);
function xlog(ex, s, c = '') { ex.log.unshift({ s, c }); if (ex.log.length > 60) ex.log.length = 60; }
const short = h => h.name.split(' ')[0];

function spawnEnemy(key, f, o = {}) {
  const e = ENEMIES[key], m = floorMult(f);
  const hp = Math.round(TUNE.enemyHp * m * e.hp * (o.hp || 1));
  const atk = TUNE.enemyAtk * m * e.atk * (o.atk || 1);
  return {
    key, name: (o.prefix || '') + e.name, shape: e.shape, color: e.color, hp, maxHp: hp, atk,
    def: TUNE.enemyDef * f * e.def, spd: e.spd, dodge: e.dodge || 0, poison: e.poison ? Math.max(1, Math.round(atk * e.poison)) : 0,
    magic: !!e.magic, ls: e.ls || 0, undead: !!e.undead, boss: !!e.boss, elite: !!o.elite,
    xp: 5 * Math.pow(m, 0.95) * e.hp * (o.hp || 1) * (e.boss ? 0.6 : 1), gold: 3.5 * m * (e.boss ? 12 : o.elite ? 2.5 : 1),
  };
}
function spawnRoom(ex, type) {
  const fl = FLOORS[ex.floor - 1], f = ex.floor;
  if (type === 'boss') {
    ex.enemies = [spawnEnemy(fl.boss, f)];
    for (let i = 0; i < fl.minions; i++) ex.enemies.push(spawnEnemy(pick(fl.enemies), f));
  } else {
    const n = ri(fl.count[0], fl.count[1]);
    ex.enemies = Array.from({ length: n }, () => spawnEnemy(pick(fl.enemies), f));
    if (type === 'guard') ex.enemies[0] = spawnEnemy(pick(fl.enemies), f, { hp: 1.7, atk: 1.2, prefix: 'Elite ', elite: true });
  }
  ex.queue = [];
  for (const id of ex.heroIds) if (ex.cs[id]) ex.cs[id].first = true;
}

function killHero(S, ex, h, cause) {
  S.heroes = S.heroes.filter(x => x !== h);
  ex.fallen.push(h.name);
  S.graveyard.unshift({ name: h.name, cls: h.cls, gender: h.gender, look: h.look, lvl: h.lvl, floor: ex.floor, cause, kills: h.kills });
  S.stats.deaths++;
  xlog(ex, `☠ ${h.name} is slain by ${cause}.`, 'death');
  addNews(S, `☠ ${h.name}, level ${h.lvl} ${CLASSES[h.cls].name}, died on floor ${ex.floor} (${cause}).`, 'death');
}
// returns true if hero died
function hurtHero(S, ex, h, d, cause, ev, lethal = true) {
  d = Math.max(1, Math.round(d));
  const cs = ex.cs[h.id];
  if (!lethal) d = Math.min(d, Math.max(0, Math.floor(h.hp) - 1));
  h.hp -= d;
  ev.push({ ex: ex.id, side: 'h', id: h.id, n: d });
  if (h.hp <= 0) {
    if (heroStats(h).survivor && !cs.survivorUsed) {
      cs.survivorUsed = true; h.hp = 1;
      xlog(ex, `${short(h)} refuses to die!`, 'good');
      return false;
    }
    killHero(S, ex, h, cause);
    return true;
  }
  return false;
}
function enemyAttack(S, ex, e, ev) {
  const hs = party(S, ex);
  if (!hs.length) return;
  const pool = [];
  for (const h of hs) { pool.push(h); if (h.cls === 'warrior') pool.push(h, h); }
  const h = pick(pool), st = heroStats(h), fl = FLOORS[ex.floor - 1];
  ex.act = { side: 'e', i: ex.enemies.indexOf(e) }; ex.actN++;
  const chilled = fl.hazard === 'chill' && !st.resist.chill;
  if (!chilled && Math.random() * 100 < st.dodge) {
    xlog(ex, `${short(h)} dodges ${e.name}.`, 'dim');
    ev.push({ ex: ex.id, side: 'h', id: h.id, txt: 'dodge' });
    return;
  }
  let d = e.atk * rnd(0.85, 1.15);
  if (!e.magic) d *= 1 - st.def / (st.def + 50);
  d = Math.max(1, Math.round(d));
  xlog(ex, `${e.name} hits ${short(h)} for ${d}.`, 'bad');
  if (e.ls) e.hp = Math.min(e.maxHp, e.hp + Math.round(d * e.ls));
  const died = hurtHero(S, ex, h, d, e.name, ev);
  if (!died && e.poison && !st.resist.poison) {
    const cs = ex.cs[h.id];
    cs.poison = Math.min(cs.poison + e.poison, e.poison * 3);
  }
}
function killEnemy(S, ex, e, killer) {
  const hs = party(S, ex);
  killer.kills++; S.stats.kills++;
  const goldMul = 1 + hs.reduce((s, h) => s + heroStats(h).gold, 0) / 100;
  ex.bag.gold += Math.max(1, Math.round(e.gold * rnd(0.7, 1.3) * goldMul));
  for (const h of hs) {
    const ups = gainXp(h, (e.xp / hs.length) * (1 + heroStats(h).xp / 100));
    if (ups) xlog(ex, `★ ${short(h)} reaches level ${h.lvl}!`, 'good');
  }
  if (Math.random() < (e.boss ? 1 : e.elite ? 0.5 : 0.11)) {
    const it = newItem(S, ex.floor, { luck: e.boss ? 40 : e.elite ? 12 : 0 });
    ex.bag.items.push(it);
    xlog(ex, `Found: ${it.name} (${RARITY[it.rar].name}).`, 'loot');
  }
}
function heroAct(S, ex, h, ev) {
  const cs = ex.cs[h.id], fl = FLOORS[ex.floor - 1];
  if (cs.poison > 0 && hurtHero(S, ex, h, cs.poison, 'poison', ev)) return;
  const st = heroStats(h);
  cs.acts++;
  ex.act = { side: 'h', id: h.id }; ex.actN++;
  const foes = ex.enemies.filter(e => e.hp > 0);
  if (!foes.length) return;
  if (h.cls === 'cleric') {
    const hs = party(S, ex);
    let low = null, lr = 0.6;
    for (const a of hs) { const r = a.hp / heroStats(a).maxHp; if (r < lr) { lr = r; low = a; } }
    if (low) {
      const max = heroStats(low).maxHp;
      const amt = Math.round(Math.min(max - low.hp, (h.attrs.int * 0.8 + h.lvl + st.atk * 0.4) * rnd(0.9, 1.1)));
      low.hp += amt; ex.cs[low.id].poison = 0;
      xlog(ex, `${short(h)} mends ${low === h ? 'their own wounds' : short(low)} for ${amt}.`, 'heal');
      ev.push({ ex: ex.id, side: 'h', id: low.id, n: amt, heal: true });
      return;
    }
  }
  const magic = h.cls === 'mage' || h.cls === 'cleric';
  let targets, mul = 1, verb = 'hits';
  if (h.cls === 'mage' && cs.acts % 3 === 0) { targets = foes; mul = 0.7; verb = 'scorches'; }
  else if (h.cls === 'warrior' && cs.acts % 4 === 0) { targets = foes.slice(0, 2); mul = 0.85; verb = 'cleaves'; }
  else if (h.cls === 'ranger') { targets = [foes.reduce((a, b) => (b.hp < a.hp ? b : a))]; if (cs.first) { mul = 1.5; verb = 'snipes'; } }
  else if (h.cls === 'rogue' || h.cls === 'mage') targets = [pick(foes)];
  else targets = [foes[0]];
  cs.first = false;
  for (const t of targets) {
    const ti = ex.enemies.indexOf(t);
    if (fl.hazard === 'dark' && !st.resist.dark && Math.random() < 0.3) {
      xlog(ex, `${short(h)} swings blindly in the dark.`, 'dim'); ev.push({ ex: ex.id, side: 'e', i: ti, txt: 'miss' }); continue;
    }
    if (Math.random() * 100 < t.dodge) {
      xlog(ex, `${t.name} slips away from ${short(h)}.`, 'dim'); ev.push({ ex: ex.id, side: 'e', i: ti, txt: 'miss' }); continue;
    }
    let d = st.atk * rnd(0.85, 1.15) * mul;
    const crit = Math.random() * 100 < st.crit;
    if (crit) d *= h.cls === 'rogue' ? 2.5 : 1.75;
    if (h.cls === 'cleric' && t.undead) d *= 1.6;
    if (!magic) d *= 1 - t.def / (t.def + 50);
    d = Math.max(1, Math.round(d));
    t.hp -= d;
    if (st.ls) h.hp = Math.min(st.maxHp, h.hp + d * st.ls / 100);
    ev.push({ ex: ex.id, side: 'e', i: ti, n: d, crit });
    xlog(ex, `${short(h)} ${crit ? 'CRITS' : verb} ${t.name} for ${d}.${t.hp <= 0 ? ' It dies.' : ''}`, crit ? 'crit' : '');
    if (t.hp <= 0) { t.hp = 0; killEnemy(S, ex, t, h); }
  }
}
function fightStep(S, ex, ev) {
  const fl = FLOORS[ex.floor - 1];
  for (let guard = 0; guard < 50; guard++) {
    if (!ex.queue.length) {
      const order = [];
      for (const h of party(S, ex)) {
        const st = heroStats(h);
        order.push({ k: st.spd * (fl.hazard === 'chill' && !st.resist.chill ? 0.6 : 1) * rnd(0.8, 1.2), h: h.id });
      }
      ex.enemies.forEach((e, i) => { if (e.hp > 0) order.push({ k: e.spd * rnd(0.8, 1.2), e: i }); });
      order.sort((a, b) => b.k - a.k);
      ex.queue = order;
    }
    const a = ex.queue.shift();
    if (a.h !== undefined) { const h = findHero(S, a.h); if (!h) continue; heroAct(S, ex, h, ev); }
    else { const e = ex.enemies[a.e]; if (!e || e.hp <= 0) continue; enemyAttack(S, ex, e, ev); }
    break;
  }
  if (!party(S, ex).length) return;
  if (ex.enemies.every(e => e.hp <= 0)) {
    xlog(ex, 'The room falls silent.', 'info');
    ex.phase = 'between'; ex.roomsCleared++;
  }
}
function enterRoom(S, ex, ev) {
  const type = ex.rooms[ex.room], fl = FLOORS[ex.floor - 1], hs = party(S, ex), m = floorMult(ex.floor);
  const tag = `Room ${ex.room + 1}/${ex.rooms.length}`;
  ex.enemies = [];
  if (fl.hazard === 'burn') {
    for (const h of hs) {
      const st = heroStats(h);
      if (!st.resist.burn) hurtHero(S, ex, h, st.maxHp * 0.06, 'the forge heat', ev, false);
    }
    xlog(ex, 'The heat of the forges sears the party.', 'bad');
  }
  if (type === 'combat' || type === 'guard' || type === 'boss') {
    spawnRoom(ex, type);
    const names = ex.enemies.map(e => e.name).join(', ');
    xlog(ex, type === 'boss' ? `${tag} — ${ex.enemies[0].name} rises from the dark!` : type === 'guard' ? `${tag} — the stairs down are guarded: ${names}.` : `${tag} — ${names}.`, type === 'combat' ? 'info' : 'boss');
    ex.phase = 'fight';
    return;
  }
  if (type === 'treasure') {
    const goldMul = 1 + hs.reduce((s, h) => s + heroStats(h).gold, 0) / 100;
    const g = Math.round(18 * m * rnd(0.8, 1.3) * goldMul);
    ex.bag.gold += g;
    let s = `${tag} — a forgotten cache! +${g} gold.`;
    if (Math.random() < 0.6) { const it = newItem(S, ex.floor, { luck: 8 }); ex.bag.items.push(it); s += ` Found: ${it.name} (${RARITY[it.rar].name}).`; }
    xlog(ex, s, 'loot');
  } else if (type === 'trap') {
    const rogue = hs.find(h => h.cls === 'rogue');
    if (rogue && Math.random() < 0.7) {
      const g = Math.round(5 * m); ex.bag.gold += g;
      xlog(ex, `${tag} — ${short(rogue)} disarms a trap and pockets its mechanism (+${g} gold).`, 'good');
    } else {
      const h = pick(hs), d = heroStats(h).maxHp * rnd(0.15, 0.25);
      xlog(ex, `${tag} — a trap! ${short(h)} is caught in it.`, 'bad');
      hurtHero(S, ex, h, d, 'a trap', ev, false);
    }
  } else if (type === 'shrine') {
    for (const h of hs) {
      const max = heroStats(h).maxHp, amt = Math.round(Math.min(max - h.hp, max * 0.25));
      h.hp += amt; ex.cs[h.id].poison = 0;
      if (amt > 0) ev.push({ ex: ex.id, side: 'h', id: h.id, n: amt, heal: true });
    }
    xlog(ex, `${tag} — a quiet shrine. The party rests and is cleansed.`, 'heal');
  }
  ex.phase = 'between'; ex.roomsCleared++;
}
function finish(S, ex, outcome) {
  const hs = party(S, ex);
  for (const h of hs) { h.busy = false; h.deepest = Math.max(h.deepest, ex.floor); }
  ex.done = true; ex.outcome = outcome; ex.enemies = []; ex.phase = 'done';
  const names = hs.map(short).join(', ');
  if (outcome === 'wiped') {
    xlog(ex, 'No one returns. Everything they carried is lost to the Dungeon.', 'death');
    addNews(S, `An expedition to floor ${ex.floor} was wiped out. Nothing came back.`, 'death');
    ex.bag = { gold: 0, items: [] };
    return;
  }
  S.gold += ex.bag.gold; S.stats.goldEarned += ex.bag.gold;
  S.inventory.push(...ex.bag.items);
  const haul = `${ex.bag.gold} gold${ex.bag.items.length ? ` and ${ex.bag.items.length} item${ex.bag.items.length > 1 ? 's' : ''}` : ''}`;
  xlog(ex, `${names} climb${hs.length === 1 ? 's' : ''} out of the Hole with ${haul}.`, 'good');
  addNews(S, `${names} returned from floor ${ex.floor} with ${haul}${ex.fallen.length ? `, but without ${ex.fallen.join(', ')}` : ''}.`, ex.fallen.length ? 'bad' : 'good');
}
export function recall(S, ex, ev = []) {
  if (ex.done) return;
  if (ex.phase === 'fight') {
    xlog(ex, 'The party turns and runs!', 'bad');
    for (const e of ex.enemies) {
      if (e.hp <= 0) continue;
      for (let i = 0; i < TUNE.fleeHits; i++) if (party(S, ex).length) enemyAttack(S, ex, e, ev);
    }
    if (!party(S, ex).length) return finish(S, ex, 'wiped');
  }
  finish(S, ex, 'retreat');
}
function stepExpedition(S, ex, ev) {
  if (!party(S, ex).length) return finish(S, ex, 'wiped');
  if (ex.phase === 'enter') enterRoom(S, ex, ev);
  else if (ex.phase === 'fight') fightStep(S, ex, ev);
  else if (ex.phase === 'between') {
    ex.room++;
    if (ex.room < ex.rooms.length) ex.phase = 'enter';
    else {
      const f = ex.floor;
      xlog(ex, `Floor ${f} cleared!`, 'good');
      if (f > S.cleared) {
        S.cleared = f;
        addNews(S, `Floor ${f}, ${FLOORS[f - 1].name}, has been cleared for the first time!`, 'good');
        if (f >= FLOORS.length) { S.won = true; addNews(S, 'The Hollow King is dead. The Dungeon is quiet... for now.', 'good'); }
      }
      S.maxFloor = Math.min(FLOORS.length, Math.max(S.maxFloor, f + 1));
      if (ex.push && f < FLOORS.length) {
        ex.floor++; ex.room = 0; ex.rooms = rollRooms(ex.floor); ex.phase = 'enter';
        xlog(ex, `The party takes the stairs down to floor ${ex.floor}: ${FLOORS[ex.floor - 1].name}.`, 'info');
      } else return finish(S, ex, 'cleared');
    }
  }
  if (!party(S, ex).length) return finish(S, ex, 'wiped');
  if (ex.auto && !ex.done) {
    const hurt = party(S, ex).some(h => h.hp / heroStats(h).maxHp < ex.auto / 100);
    if (hurt) { xlog(ex, `A hero is badly hurt — standing orders are to pull out.`, 'info'); recall(S, ex, ev); }
  }
}
export function dismissExpedition(S, id) {
  S.expeditions = S.expeditions.filter(e => !(e.id === id && e.done));
}

// ---- main tick -----------------------------------------------------------
export function update(S, realDt) {
  const dt = realDt * S.speed, ev = [];
  S.time += dt;
  S.recruitTimer -= dt; if (S.recruitTimer <= 0) refreshRecruits(S);
  S.marketTimer -= dt; if (S.marketTimer <= 0) refreshMarket(S);
  const rate = 0.008 + 0.006 * S.upgrades.infirmary;
  for (const h of S.heroes) {
    if (h.busy) continue;
    const max = heroStats(h).maxHp;
    if (h.hp < max) h.hp = Math.min(max, h.hp + max * rate * dt);
  }
  for (const ex of S.expeditions) {
    if (ex.done) continue;
    ex.acc += dt;
    let n = 0;
    while (ex.acc >= TUNE.stepTime && !ex.done && n++ < 20) { ex.acc -= TUNE.stepTime; stepExpedition(S, ex, ev); }
  }
  return ev;
}
