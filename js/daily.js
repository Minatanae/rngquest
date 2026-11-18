// RNG Quest: The Daily Adventure rules. Once a day everyone gets the same quest (seeded by the date): a place and a story,
// no difficulty. The dungeon is a stack of floors (one room each). Press Adventure!: the d20 Winds of Fate are rolled and
// the party fights down floors 1-4 (most parties make it). Then push your luck one floor at a time: a new roll per floor,
// tougher enemies the deeper you go and a bigger bonus; or go home and bank today's haul.
// Floor 15 takes extreme luck. If the party falls,
// everything carried today (renown) is lost: that is the price of greed. Wounds, deaths and healers' mana
// carry over until dawn. The dice and your heroes decide everything. Heroes die for good and are replaced.
// Numbers grow linearly, never exponentially. Internally `depth` counts runs: depth 1 is floors 1-4, depth 2 is floor 5,
// depth 3 is floor 6, and so on (one roll each).
// No DOM in here, so tools/daily-sim.mjs can run thousands of adventures headless.
import { ATTRS, CLASSES, ENEMIES, FLOORS, NAMES, PLACE_ENEMIES, PLACE_TUNING } from './data.js';

export const DAILY = {
  party: 3,   // three heroes are the party, summoned fresh every day (heroes have no levels)
  stepTime: 0.7,                               // seconds per combat action at 1x
  // pacing beats (in steps) so even a short run lasts 30+ seconds: the descent, walking between rooms, a pause at events
  introSteps: 5, walkSteps: 3, eventSteps: 3, minClearSecs: 30,
  // enemy power by the d20 (the big factor). Every number counts: on floors 1-4 an average party clears about 5% on a 1,
  // 30% on a 3, 75% on a 7, 90% on a 10, and only the mid-teens and up are near-certain
  fate: [0, 3.1, 2.3, 1.9, 1.62, 1.46, 1.36, 1.28, 1.21, 1.15, 1.1, 1.05, 0.99, 0.92, 0.85, 0.77, 0.69, 0.61, 0.53, 0.46, 0.4],   // high rolls count too: a streak of 17+ after floor 6 carries A+A+C past the boss ~70% (sim lucky)
    // with `swing`: floors 1-4 ~1% on a 1, ~56% on a 5, ~90% on a 9, certain only on a 20
  enemyHp: 25, enemyAtk: 9.6, enemyDef: 3.25,
  floors: 4,                                   // the first run: a fight, two floors of fights or events, a guardian
  bossFloor: 10,                               // the boss waits here (reached by about one party in two hundred)
  reward: 60, floorReward: 25,                 // renown for floors 1-4, and for each floor deeper (before time, finds, kills, bonus)
  firstPower: 0.55,                           // floors 1-4: about 90% of real parties clear them (most of the misses are natural 1s)
  // Going deeper (tuned with `node tools/daily-sim.mjs 365 dive`, rank C level 1 parties pushing until wiped): a balanced
  // party reaches floor 2 about half the time, floor 3 about a quarter, floor 5 about 5%; three clerics land level with it.
  // tuned with `node tools/daily-sim.mjs 800 dive` (rank C level 1, the user's targets): floors 1-4 cleared by ~75% of
  // parties, floor 5 by ~65%, floor 6 by ~45%, floor 8 by ~7%, the floor 10 boss beaten by ~0.3% (reaching it ~0.5-1%).
  // Going home after floor 6 banks the most on average; anything deeper is a lottery ticket.
  doom: 15, doomLuck: 0.01,                    // a natural 1 is a critical failure: 99 times in 100 the enemies are 15 times as strong (not even three S's survive that); 1 in 100 it is an ordinary fight
  swing: 0.5,                                  // each floor's enemy strength varies by about ±50% (one spread), at random
  deepPower: 1.7,                             // floors 5 and deeper: a big step up, the first real wall (three rank E's clear floor 5 ~30%)
  bossFateK: 1, bossFateC: 0.33,              // the floor-10 boss: fate[roll]^K x C. Three S's win on any 2+, S+E+E needs ~5, a lucky (17+) A+A+C ~99%
  champHp: 2.5, champAtk: 1.25,                  // the champion of a place's strongest kind on floor 10 (when it has no boss of its own)
  depthGrowth: 0.05, depthBonus: 1,            // each floor below 5: enemies +5% stronger (the ten-kind rosters also bring stronger kinds deeper), renown x2 on floor 5, x3 on floor 6, x5 on floor 8
  breather: 0.5,                               // on the stairs down to each floor every hero recovers half their max health, so a lucky streak can go deep
  focus: 0.35,                                 // chance an enemy goes for the most wounded hero: heroes can fall while the party wins
  // healing budget per day (refills at dawn), one pool shared by the party's healers (see spendMana): enough for a long
  // floor, not for endless dives. Smaller budgets made long 9-room days near-impossible for every party.
  mana: { cleric: 12, druid: 18 },
  mend: 1,                                     // strength of a cleric's mend
};
// Every new hero rolls a rank. S is always a unique, named hero with a signature ability (one of each at a time).
export const RANKS = {
  // mul = health and damage. Heroes matter: an S (a legend) carries two rank E's to floor 6 about 85% of the time (tools/daily-sim.mjs ranks)
  S: { mul: 2.5, odds: 1, color: '#e0a82e' }, A: { mul: 1.3, odds: 9, color: '#a65fd0' }, B: { mul: 1.12, odds: 14, color: '#3f7fd0' },
  C: { mul: 1.0, odds: 22, color: '#4f9a5a' }, D: { mul: 0.8, odds: 26, color: '#8a8478' }, E: { mul: 0.6, odds: 28, color: '#9a6a4a' },
};
// Hero classes for RNG Quest: the original five plus eleven newer ones. `art` names the sprite folder per gender
// (new classes use recoloured placeholder sprites from tools/recolor_hero.py until real PixelLab art exists).
export const DCLASS = {
  warrior: { ...CLASSES.warrior, art: { m: 'warrior_m' }, taunt: true, ability: 'Guard & Cleave: draws enemy attacks; every 4th action hits two foes.' },
  rogue: { ...CLASSES.rogue, art: { f: 'rogue_f' }, ability: 'Backstab: brutal critical hits.' },
  mage: { ...CLASSES.mage, hpMul: 0.88, art: { m: 'mage_m' }, magic: true, ability: 'Fireball: every 3rd action scorches every foe.' },
  cleric: { ...CLASSES.cleric, art: { f: 'cleric_f' }, magic: true, ability: 'Mend: heals the most wounded ally. Smites the undead.' },
  ranger: { ...CLASSES.ranger, art: { m: 'ranger_m' }, ability: 'Snipe: opens each fight with a heavy shot and picks off the weakest foe.' },
  paladin: { name: 'Paladin', main: 'str', hpMul: 1.25, base: { str: 6, agi: 3, int: 4, vit: 7 }, art: { m: 'paladin_m' }, taunt: true, ability: 'Smite: +60% damage to the undead and heals himself for some of the damage he deals. Draws enemy attacks.' },
  berserker: { name: 'Berserker', main: 'str', hpMul: 1.15, base: { str: 8, agi: 5, int: 1, vit: 6 }, art: { m: 'berserker_m' }, ability: 'Rage: deals up to +60% damage as his health drops.' },
  darkknight: { name: 'Dark Knight', main: 'str', hpMul: 1.2, base: { str: 7, agi: 3, int: 3, vit: 7 }, art: { m: 'darkknight_m' }, taunt: true, ability: 'Life Drain: heals for 20% of the damage he deals. Draws enemy attacks.' },
  assassin: { name: 'Assassin', main: 'agi', hpMul: 0.8, base: { str: 4, agi: 8, int: 2, vit: 4 }, crit: 6, dodge: 6, art: { f: 'assassin_f' }, ability: 'Execute: finishes any foe (not bosses) below 15% health, and opens every fight with a critical strike.' },
  monk: { name: 'Monk', main: 'agi', hpMul: 1.0, base: { str: 5, agi: 8, int: 3, vit: 5 }, dodge: 12, art: { f: 'monk_f' }, ability: 'Flurry: strikes twice every action. Hard to hit.' },
  bard: { name: 'Bard', main: 'int', hpMul: 1.0, base: { str: 3, agi: 6, int: 7, vit: 5 }, magic: true, art: { f: 'bard_f' }, ability: 'Inspire: every 3rd action the whole party deals +20% damage for the rest of the fight (stacks three times).' },
  necromancer: { name: 'Necromancer', main: 'int', hpMul: 0.8, base: { str: 2, agi: 4, int: 9, vit: 5 }, magic: true, art: { m: 'necromancer_m' }, ability: 'Siphon: every bolt heals the most wounded ally for a quarter of its damage.' },
  cryomancer: { name: 'Frost Mage', main: 'int', hpMul: 0.9, base: { str: 2, agi: 4, int: 9, vit: 5 }, magic: true, art: { m: 'cryomancer_m' }, ability: 'Frost Nova: every 3rd action hits every foe and slows them for the rest of the fight.' },
  warlock: { name: 'Warlock', main: 'int', hpMul: 0.92, base: { str: 2, agi: 4, int: 9, vit: 5 }, magic: true, art: { m: 'warlock_m' }, ability: 'Hex: each bolt curses its target to take +30% damage from everyone (stacks twice).' },
  druid: { name: 'Druid', main: 'int', hpMul: 0.95, base: { str: 3, agi: 4, int: 8, vit: 6 }, magic: true, art: { f: 'druid_f' }, ability: 'Rejuvenate: heals the whole party a little every action.' },
  hunter: { name: 'Hunter', main: 'agi', hpMul: 0.95, base: { str: 4, agi: 8, int: 3, vit: 5 }, crit: 5, art: { m: 'hunter_m' }, ability: 'Wolf Companion: his wolf bites a random foe every action.' },
};
export const UNIQUES = {
  ada: { art: 'u_ada', name: 'Ada', cls: 'rogue', gender: 'f', sig: 'Keen Eye', desc: '+18% crit chance, +10% damage', fx: { crit: 18, atkPct: 10 } },
  nova: { art: 'u_nova', name: 'Nova', cls: 'necromancer', gender: 'f', sig: 'Soulbinder', desc: '+15% damage, heals for 10% of the damage she deals', fx: { atkPct: 15, ls: 10 } },
  // the user's grey and white bearded collie: a real four-legged dog (drawn at 80% in the dungeon, see HERO_SCALE)
  jallie: { art: 'u_jallie', name: 'Jallie', cls: 'warrior', gender: 'f', sig: 'Shaggy Coat', desc: '+20% max health, +8% dodge: blows get lost in the fur', fx: { hpPct: 20, dodge: 8 } },
};
function rollRank() {
  let r = Math.random() * 100;
  for (const [k, v] of Object.entries(RANKS)) { if ((r -= v.odds) < 0) return k; }
  return 'E';
}
export const FATE_WORDS = [null, 'Doomed', 'Dire', 'Dire', 'Grim', 'Grim', 'Ominous', 'Ominous', 'Uncertain', 'Uncertain', 'Uncertain',
  'Fair', 'Fair', 'Fair', 'Favourable', 'Favourable', 'Bright', 'Bright', 'Blessed', 'Blessed', 'Perfect'];

// ---- randomness ------------------------------------------------------------------
// Shared things (the quest) use a seeded generator so every player gets the same one; dice and combat use Math.random.
export function seeded(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const rnd = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(rnd(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---- the quest of the day ---------------------------------------------------------
const JOBS = ['Recover a lost relic from', 'Clear the nest in', 'Escort a cartographer through', 'Hunt the beast of',
  "Retrieve a fallen knight's sword from", 'Rescue a missing miner from', 'Seal the breach in', 'Map the depths of'];
// ---- locations: the ten original dungeon floors plus twenty more. `style` picks one of the ten scenery sets in
// sprites.js (vines, burrows, mushrooms, water, niches, lava, ice, galleries, thorns, void); `pal` recolours it.
const P = (bg, wall, wall2, floor, accent) => ({ bg, wall, wall2, floor, accent });
export const LOCATIONS = [
  ...FLOORS.map((f, i) => ({ name: f.name, style: i + 1, pal: f.pal, enemies: f.enemies, count: f.count, boss: f.boss, minions: f.minions })),
  { name: 'Goblin Tunnels', style: 2, pal: P('#1b1410', '#5a3f2a', '#4a3322', '#6a5038', '#e0904a'), enemies: ['goblin', 'kobold', 'toad'], count: [2, 3] },
  { name: 'Bandit Hideout', style: 1, pal: P('#171310', '#4a3a2c', '#3a2d22', '#5a4a38', '#e0b060'), enemies: ['bandit', 'bandit', 'kobold', 'rat'], count: [2, 3] },
  { name: 'Sunken Temple', style: 4, pal: P('#0d1a1a', '#2a5a52', '#1f4740', '#3a6a5a', '#5fe0c0'), enemies: ['naga', 'crab', 'serpent'], count: [2, 3], boss: 'drownedqueen', minions: 1 },
  { name: 'Sandstone Tombs', style: 5, pal: P('#1d1710', '#8a6a42', '#74583a', '#a08458', '#f0c060'), enemies: ['mummy', 'scorpion', 'sandworm'], count: [2, 3], boss: 'sandking', minions: 2 },
  { name: 'Cultist Sanctum', style: 8, pal: P('#140a0e', '#3a1a24', '#2a1018', '#4a2430', '#e04a5a'), enemies: ['cultist', 'cultist', 'imp', 'shade'], count: [2, 3] },
  { name: 'Haunted Chapel', style: 5, pal: P('#10121a', '#4a5064', '#3a4052', '#5a6274', '#b0c8f0'), enemies: ['wraith', 'banshee', 'skeleton'], count: [2, 3] },
  { name: 'Overgrown Ruins', style: 9, pal: P('#0e160e', '#3a5a32', '#2c4626', '#4a6a3a', '#9ae070'), enemies: ['treant', 'creeper', 'toad'], count: [2, 3] },
  { name: 'Windswept Galleries', style: 7, pal: P('#121820', '#5a6a7a', '#4a5868', '#6a7a88', '#d0e8ff'), enemies: ['harpy', 'gargoyle', 'wisp'], count: [2, 3] },
  { name: 'Clockwork Vault', style: 6, pal: P('#16120c', '#6a5232', '#574228', '#7a6040', '#ffc04a'), enemies: ['clockwork', 'gargoyle', 'fgolem'], count: [2, 3], boss: 'colossus', minions: 1 },
  { name: 'Witchwood Hollow', style: 9, pal: P('#120e18', '#3a2a4a', '#2c2038', '#4a3a52', '#c08aff'), enemies: ['wisp', 'toad', 'creeper'], count: [2, 3], boss: 'thornwitch', minions: 2 },
  { name: 'Frozen Catacombs', style: 7, pal: P('#0e141c', '#3a4a5a', '#2c3a4a', '#4a5a6a', '#9fe0ff'), enemies: ['fspider', 'skeleton', 'fwraith'], count: [2, 3] },
  { name: 'Lizardfolk Marsh', style: 4, pal: P('#0e1410', '#3a4a2a', '#2c3a20', '#4a5a34', '#c0e060'), enemies: ['lizardman', 'serpent', 'toad'], count: [2, 3] },
  { name: "Vampire's Crypt", style: 5, pal: P('#140a0e', '#4a2028', '#3a181e', '#5a2a32', '#ff5a6a'), enemies: ['vampire', 'bbat', 'ghoul'], count: [2, 3] },
  { name: 'Ogre Den', style: 2, pal: P('#15110c', '#4a3a24', '#3a2c1a', '#5a4630', '#d0a050'), enemies: ['ogre', 'goblin', 'kobold'], count: [2, 3] },
  { name: 'Spider Nest', style: 3, pal: P('#100c14', '#2e2438', '#22192c', '#3a2e44', '#d0b0ff'), enemies: ['spider', 'fspider', 'stalker'], count: [2, 3] },
  { name: 'Bell Tower', style: 8, pal: P('#12121a', '#4a4a58', '#3a3a48', '#58586a', '#e0d0a0'), enemies: ['gargoyle', 'bbat', 'harpy'], count: [2, 3] },
  { name: 'Ember Caves', style: 6, pal: P('#180a08', '#4a1e14', '#3a160e', '#5a2a1a', '#ff7a2a'), enemies: ['imp', 'magma', 'kobold'], count: [2, 3] },
  { name: 'Crystal Grotto', style: 3, pal: P('#0a1418', '#1f4a58', '#163a46', '#2a5a68', '#7ff0ff'), enemies: ['wisp', 'myconid', 'puff'], count: [2, 3] },
  { name: 'Bone Pits', style: 2, pal: P('#16140e', '#6a6250', '#585040', '#7a7260', '#f0e6c0'), enemies: ['skeleton', 'ghoul', 'rat'], count: [2, 3] },
  { name: 'Void Breach', style: 10, pal: P('#08050f', '#22184a', '#18103a', '#2a1f58', '#c08aff'), enemies: ['vspawn', 'watcher', 'banshee'], count: [2, 3], boss: 'hollowking', minions: 2 },
];
// every place has its own ten kinds of enemy (data.js); several of one kind can share a floor
for (const L of LOCATIONS) if (PLACE_ENEMIES[L.name]) L.enemies = PLACE_ENEMIES[L.name];
// Places are evened out a little, not made identical (data.js, tuned by tools/place-tune.mjs): `power` scales its enemies on
// floors 1-4, `deep` again on the floors below; `reward` is its renown for floors 1-4 and `deepPay` scales each floor
// below (tougher places pay more).
for (const L of LOCATIONS) Object.assign(L, PLACE_TUNING[L.name] || {});
export const placePower = (L, depth) => (L.power || 1) * (depth > 1 ? L.deep || 1 : 1);
const placeReward = L => L.reward || DAILY.reward;


const the = name => (name.startsWith('The ') ? 'the ' + name.slice(4) : 'the ' + name);
// Each place has its own enemy types, weakest to most dangerous. Floors 1-3 are mostly the weakest, floors 4-7 mostly the
// middle one, and from floor 8 the most dangerous dominates. The same type can turn up several times in one room.
const foeStrength = k => ENEMIES[k].hp * ENEMIES[k].atk;
function pickFoe(R, fl, floor) {
  const types = [...new Set(fl.enemies)].sort((a, b) => foeStrength(a) - foeStrength(b)), n = types.length;
  const at = clamp((floor - 1) / 7, 0, 1) * (n - 1), w = types.map((_, i) => Math.exp(-((i - at) ** 2) / 2.88));   // about three neighbouring kinds per floor
  let r = R() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < n; i++) if ((r -= w[i]) < 0) return types[i];
  return types[n - 1];
}
// Floors 1-4 (depth 1): a fight, two floors of fights or events, then a guardian. Every floor deeper is a single fight;
// floors 8, 12, 16 ... have a guardian, and floor 10 the boss: the place's own, or a champion of its strongest kind.
function genRooms(R, fl, depth) {
  const count = () => Math.min(4, fl.count[0] + Math.floor(R() * (fl.count[1] - fl.count[0] + 1)));
  const foes = floor => Array.from({ length: count() }, () => pickFoe(R, fl, floor));
  if (depth > 1) {
    const f = floorNo(depth, 0);
    if (f === DAILY.bossFloor) {
      if (fl.boss) return [{ type: 'boss', enemies: [fl.boss, ...Array.from({ length: fl.minions }, () => pickFoe(R, fl, f))] }];
      const top = [...new Set(fl.enemies)].sort((a, b) => foeStrength(b) - foeStrength(a))[0];
      return [{ type: 'champion', enemies: [top, pickFoe(R, fl, f), pickFoe(R, fl, f)] }];
    }
    return [{ type: isGuardianFloor(f) ? 'guard' : 'combat', enemies: foes(f) }];
  }
  const rooms = [{ type: 'combat', enemies: foes(1) }];
  for (let i = 1; i < DAILY.floors - 1; i++) {
    const r = R(), type = r < 0.6 ? 'combat' : r < 0.75 ? 'treasure' : r < 0.88 ? 'trap' : 'shrine';
    rooms.push(type === 'combat' ? { type, enemies: foes(i + 1) } : { type });
  }
  rooms.push({ type: 'guard', enemies: foes(DAILY.floors) });
  return rooms;
}
// floor number of room i (0-based) in run `depth`: floors 1-4, then 5, 6, 7 ...
export const floorNo = (depth, i = 0) => (depth === 1 ? i + 1 : depth + DAILY.floors - 1);
export const isGuardianFloor = f => f % DAILY.floors === 0;
export function questFor(dayKey) {
  const R = seeded(`quest:${dayKey}`), rp = a => a[Math.floor(R() * a.length)];
  const loc = 1 + Math.floor(R() * LOCATIONS.length), fl = LOCATIONS[loc - 1];
  const title = `${rp(JOBS)} ${the(fl.name)}`, rooms = genRooms(R, fl, 1);
  return { key: dayKey, loc, rooms, title, renown: placeReward(fl), depth: 1 };
}
// run `depth` of today's quest: floors 1-4, or the single floor deeper; the same for every player that day.
export function floorQuest(dayKey, depth) {
  const q = questFor(dayKey);
  if (depth <= 1) return q;
  const f = floorNo(depth), rooms = genRooms(seeded(`quest:${dayKey}:floor${f}`), LOCATIONS[q.loc - 1], depth);
  return { ...q, rooms, depth, renown: Math.round(DAILY.floorReward * (LOCATIONS[q.loc - 1].deepPay || 1)) };
}
// every floor below 4 pays more: floor 5 x2, floor 6 x3, floor 8 x5 (the risk climbs steeply, so must the reward)
export const depthBonus = depth => 1 + DAILY.depthBonus * (floorNo(depth) - DAILY.floors) * (depth > 1 ? 1 : 0);

// ---- days -----------------------------------------------------------------------------
// The day turns over at 00:00 Swedish time (Europe/Stockholm) for every player, wherever they are.
const TZ = 'Europe/Stockholm';
const tzParts = date => Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
  .formatToParts(date).filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
export function dayKeyOf(date) { const p = tzParts(date); return `${p.year}-${p.month}-${p.day}`; }
export function currentDayKey(S, now = new Date()) { return dayKeyOf(new Date(now.getTime() + (S.dayOffset || 0) * 86400000)); }
// seconds until the next 00:00 in Stockholm
export function secondsToReset(now = new Date()) { const p = tzParts(now); return 86400 - (+p.hour * 3600 + +p.minute * 60 + +p.second); }
const dayIndex = key => Math.round(Date.UTC(+key.slice(0, 4), +key.slice(5, 7) - 1, +key.slice(8, 10)) / 86400000);
export const dayNumber = S => (S.day ? dayIndex(S.day.key) - dayIndex(S.startKey) + 1 : 1); // "Day 1" is the day you started
export function ensureDay(S, key) {
  if (!S.startKey) S.startKey = key;
  if (S.day && S.day.key === key) {   // a save from before the dive rules: give today the new fields
    const d = S.day;
    if (d.depth == null) {
      const old = S.adv && S.adv.done && S.adv.result && S.adv.quest && S.adv.quest.key === key ? S.adv.result : null;
      d.depth = old && old.outcome === 'cleared' ? 1 : 0; d.renown = old ? old.renown : 0; d.pending = false;
      d.choice = !old ? (d.choice === 'rest' ? 'rest' : null) : old.outcome === 'cleared' ? (d.choice === 'rest' ? 'rest' : 'adventure') : 'lost';
      if (!d.choice) d.roll = null;
    }
    if (d.floor == null) d.floor = (d.depth || 0) * DAILY.floors;
    if (d.haul == null) d.haul = 0;
    for (const h of S.heroes) if (h.mana == null) h.mana = maxMana(h);
    S.history = S.history.filter(e => 'depth' in e);   // old per-adventure lines do not fit the per-day log
    return;
  }
  // a party left standing at the stairs when the day turned made it out alive: bank what it carried
  if (S.day && S.day.choice === 'adventure' && S.day.haul) {
    const d = S.day; d.renown = d.haul; S.renown += d.haul;
    const e = S.history.find(x => x.day === d.key); if (e) { e.outcome = 'rest'; e.renown = d.renown; }
  }
  // choice: null (not out yet), 'adventure' (diving), 'rest' (stopped for the day), 'lost' (the party was wiped)
  // haul: renown carried today (lost if the party falls); renown: what was banked by going home
  S.day = { key, roll: null, pending: false, choice: null, depth: 0, floor: 0, haul: 0, renown: 0 };
  // at dawn yesterday's heroes leave, alive or not: every day starts by summoning three new ones
  if (S.heroes.length) S.firstPartyDone = true;
  S.heroes = [];
}
export const maxMana = h => DAILY.mana[h.cls] || 0;
const LEGEND_NAMES = ['Ada', 'Nova', 'Jallie'];
export const alive = S => S.heroes.filter(h => !h.dead);

// ---- the gacha summon ---------------------------------------------------------------------------
// Every day starts with summoning three new heroes, kept automatically: what you get is what you get.
export const starterLeft = S => Math.max(0, DAILY.party - S.heroes.length);
export function canSummon(S) {
  if (S.adv && !S.adv.done) return 'Your heroes are in the Dungeon.';
  if (S.day.pending) return 'The winds are already rolled: your party is setting off.';
  if (!starterLeft(S)) return "Today's party is complete. New heroes are summoned after the reset.";
  return null;
}
export function summon(S) {
  const err = canSummon(S); if (err) return err;
  // each day's three are three different classes; the very first party a player ever summons also has one rank B
  // (a random one of the three), the rest roll at the normal odds
  if (!S.firstPartyDone && S.starterB == null) S.starterB = Math.floor(Math.random() * DAILY.party);
  const h = newHero(S, { rank: !S.firstPartyDone && S.heroes.length === S.starterB ? 'B' : undefined, avoidCls: S.heroes.map(x => x.cls) });
  S.heroes.push(h);
  if (!starterLeft(S)) { S.firstPartyDone = true; S.day.party = todayPartyScore(S); S.partyTotal = (S.partyTotal || 0) + S.day.party; }
  return { hero: h, starter: true };
}

// ---- the daily decision ---------------------------------------------------------------------
// the d20 is rolled the moment you commit (Adventure! or Go deeper!), never before: you go in blind
export function canDive(S) {
  const d = S.day;
  if (S.adv && !S.adv.done) return 'Your heroes are already out.';
  if (starterLeft(S)) return "Summon today's party first.";
  if (d.choice === 'rest') return 'Your heroes are resting until tomorrow.';
  if (d.choice === 'lost') return 'Your party was lost today. New heroes are summoned at dawn.';
  if (!partyFor(S).length) return 'You have no living heroes today.';
  return null;
}
export function rollFate(S) {
  const err = canDive(S); if (err) return err;
  const d = S.day;
  if (d.pending) return 'The winds are already rolled.';
  d.roll = ri(1, 20); d.pending = true;
}
// stop for the day after at least one cleared floor (the renown is already banked)
export function rest(S) {
  const d = S.day;
  if (S.adv && !S.adv.done) return 'Your heroes are in the Dungeon.';
  if (d.choice !== 'adventure' || d.pending) return 'Nothing to rest from.';
  d.choice = 'rest'; S.stats.rests++;
  // home safe: bank the haul
  d.renown = d.haul; S.renown += d.haul;
  const e = dayEntry(S); e.outcome = 'rest'; e.renown = d.renown;
}
// one history line per day: floors cleared, renown, how it ended
function dayEntry(S) {
  let e = S.history.find(x => x.day === S.day.key);
  if (!e) { e = { day: S.day.key, depth: 0, renown: 0, outcome: 'open', fallen: 0 }; S.history.unshift(e); trimHistory(S); }
  if (e.party == null) e.party = S.day.party ?? todayPartyScore(S);
  return e;
}

// ---- heroes -------------------------------------------------------------------------
// first names only; legends' names are reserved, and no two heroes in your party share a name
function pickName(S, gender) {
  const ok = NAMES[gender].filter(n => !LEGEND_NAMES.includes(n));
  const unused = ok.filter(n => !S.heroes.some(h => h.name === n));
  return pick(unused.length ? unused : ok);
}
export function newHero(S, o = {}) {
  let rank = o.rank || rollRank(), unique = null;
  const avoid = o.avoidCls || [], classes = Object.keys(DCLASS).filter(k => !avoid.includes(k));   // avoidCls: classes already taken
  if (rank === 'S') {
    const free = Object.keys(UNIQUES).filter(k => !S.heroes.some(h => h.unique === k) && !avoid.includes(UNIQUES[k].cls));
    if (free.length) unique = pick(free); else rank = 'A';
  }
  const U = unique && UNIQUES[unique];
  const cls = U ? U.cls : o.cls || pick(classes.length ? classes : Object.keys(DCLASS)), c = DCLASS[cls];
  const gender = U ? U.gender : o.gender || pick(Object.keys(c.art));
  const attrs = {};
  for (const a of ATTRS) attrs[a] = c.base[a] + (U ? 1 : ri(-1, 2));
  const h = {
    id: S.nextId++, cls, gender, rank, unique, volunteer: !!o.volunteer, art: U ? U.art : c.art[gender], name: U ? U.name : pickName(S, gender),
    attrs, hp: 1, kills: 0, adventures: 0, born: S.day ? dayNumber(S) : 1,
  };
  h.maxHp = stats(h).maxHp; h.hp = h.maxHp; h.mana = maxMana(h);
  return h;
}
function applyFx(st, fx) {
  for (const k in fx) {
    if (k === 'resist') st.resist[fx[k]] = true;
    else st[k] += fx[k];
  }
}
export function stats(h) {
  const c = DCLASS[h.cls], a = h.attrs;
  const st = { hpPct: 0, atkPct: 0, spd: 10 + a.agi * 0.6, dodge: a.agi * 0.7 + (c.dodge || 0), crit: 5 + a.agi * 0.8 + (c.crit || 0),
    def: a.vit * 0.3, ls: 0, resist: {} };
  if (h.unique && UNIQUES[h.unique]) applyFx(st, UNIQUES[h.unique].fx);   // heroes have no traits; only legends carry a signature ability
  const rm = RANKS[h.rank || 'C'].mul;
  st.maxHp = Math.max(1, Math.round((30 + a.vit * 5) * c.hpMul * rm * (1 + st.hpPct / 100)));
  st.atk = (5 + a[c.main] * 1.25) * rm * (1 + st.atkPct / 100);
  st.def = Math.max(0, st.def);
  st.dodge = clamp(st.dodge, 0, 45);
  return st;
}

// ---- state ----------------------------------------------------------------------------
export function newState() {
  return { v: 4, nextId: 1, dayOffset: 0, startKey: null, renown: 0, speed: 1, heroes: [], history: [], adv: null, day: null,
    playerName: 'You', stats: { adventures: 0, cleared: 0, wipes: 0, deaths: 0, rests: 0 } };   // heroes come from the first summons
}
export const findHero = (S, id) => S.heroes.find(h => h.id === id);
const party = (S, ad) => ad.heroIds.map(id => findHero(S, id)).filter(h => h && !h.dead);
const short = h => h.name.split(' ')[0];
function alog(ad, s, c = '') { ad.log.unshift({ s, c }); if (ad.log.length > 80) ad.log.length = 80; }
function trimHistory(S) { if (S.history.length > 30) S.history.length = 30; }

// ---- clear time ---------------------------------------------------------------------------------
// The faster your party clears the rooms, the more renown. Fight length tracks the total health of the quest's enemies
// at today's strength, so par is that health times what an average party (three rank C heroes) needs per point.
// Measured (scratch timing sim, 600 runs per cell): rank E needs ~7% longer than C, rank A ~10% less, rank S ~25% less.
// The walk between rooms is the same for everyone and is left out of the comparison (but shown in the clock).
export const CLEAR_TIME = { parK: 0.118, from: 0.7, slope: 2.2, cap: 1.5 };   // bonus = quest reward x clamp((speed - from) x slope, 0, cap)
function parFightSteps(ad) {
  let hp = 0;
  for (const r of ad.quest.rooms) if (r.enemies) r.enemies.forEach((k, i) => { hp += DAILY.enemyHp * ad.power * ENEMIES[k].hp * (r.type === 'guard' && i === 0 ? 1.7 : 1); });
  return hp * CLEAR_TIME.parK;
}
export const SPEED_WORDS = [[1.35, 'Blazing'], [1.1, 'Swift'], [0.9, 'Steady'], [0, 'Slow']];
export const speedWord = speed => SPEED_WORDS.find(([min]) => speed >= min)[1];
export const clock = secs => { const s = Math.round(secs); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
// seconds since the party set off, frozen once the last room is cleared (the climb out does not count)
export const elapsed = ad => ((ad.clearSteps ?? ad.steps ?? 0) + (ad.clearSteps == null ? ad.acc / DAILY.stepTime : 0)) * DAILY.stepTime;

// ---- the odds shown after a roll ------------------------------------------------------------------
// Play the coming floor many times on a copy of the game (same party, wounds, mana, roll and depth) and count the clears.
// About 120 quick runs take a few hundredths of a second, and the number is honest for any party, not a lookup table.
// the chance to clear as the player sees it: never a sure thing except on a natural 20, never hopeless
export function shownOdds(S) { return S.day.roll === 20 ? 100 : S.day.roll === 1 ? 1 : Math.max(1, Math.min(99, estimateClear(S))); }   // 1 is always 1%, only a 20 shows 100% (the user's rule); otherwise the real odds, at most 99%
export function estimateClear(S, runs = 120) {
  const base = JSON.stringify({ ...S, adv: null, history: [] });
  let won = 0;
  for (let i = 0; i < runs; i++) {
    const c = JSON.parse(base);
    c.day.pending = true; c.day.choice = c.day.choice === 'adventure' ? 'adventure' : null;
    if (typeof startAdventure(c) === 'string') return 0;
    for (let g = 0; g < 20000 && !c.adv.done; g++) stepAdventure(c, []);
    if (c.adv.outcome === 'cleared') won++;
  }
  return Math.round(won / runs * 100);
}

// today's party: your living heroes (you have three; the dead stay dead until dawn)
export const partyFor = S => alive(S).slice(0, DAILY.party);
export function startAdventure(S, forcedQuest) {
  const err = canDive(S); if (err) return err;
  const d = S.day;
  if (!d.pending) return 'Roll the Winds of Fate first.';
  d.pending = false; d.choice = 'adventure';
  const depth = d.depth + 1, quest = forcedQuest ? { ...forcedQuest, depth } : floorQuest(d.key, depth);
  const hs = partyFor(S);
  for (const h of hs) {   // wounds carry over; on the stairs down the party catches its breath a little
    h.maxHp = stats(h).maxHp; h.hp = Math.min(h.hp ?? h.maxHp, h.maxHp); if (h.mana == null) h.mana = maxMana(h);
    if (depth > 1) h.hp = Math.min(h.maxHp, h.hp + Math.round(h.maxHp * DAILY.breather));
  }
  const ad = {
    id: S.nextId++, quest, depth, roll: d.roll, floor: LOCATIONS[quest.loc - 1].style, place: LOCATIONS[quest.loc - 1], heroIds: hs.map(h => h.id), room: 0, rooms: quest.rooms, phase: 'enter', wait: DAILY.introSteps,
    enemies: [], queue: [], log: [], cs: {}, act: null, actN: 0, acc: 0, done: false, outcome: null, fallen: [],
    power: (floorNo(depth) === 10 ? DAILY.bossFateC * DAILY.fate[d.roll] ** DAILY.bossFateK : DAILY.fate[d.roll]) * (depth === 1 ? DAILY.firstPower : DAILY.deepPower * (1 + DAILY.depthGrowth * (depth - 1))) * placePower(LOCATIONS[quest.loc - 1], depth) * (d.roll === 1 && Math.random() >= DAILY.doomLuck ? DAILY.doom : 1),
    bonus: 0, kills: 0, roomsCleared: 0, result: null,
  };
  for (const h of hs) ad.cs[h.id] = { poison: 0, acts: 0, first: true };
  ad.parFight = parFightSteps(ad);
  S.adv = ad; S.stats.adventures++;
  alog(ad, `${quest.title}. The Winds of Fate roll ${d.roll}. ${depth > 1 ? `The party presses on to room ${floorNo(depth, 0)}…` : `The party enters ${the(LOCATIONS[quest.loc - 1].name)}…`}`, 'info');
  return ad;
}

// ---- combat -------------------------------------------------------------------------------
function spawnEnemy(ad, key, o = {}) {
  const e = ENEMIES[key], P = ad.power;
  const sw = o.sw || 1, hp = Math.max(1, Math.round(DAILY.enemyHp * P * e.hp * (o.hp || 1) * sw)), atk = DAILY.enemyAtk * P * e.atk * (o.atk || 1) * sw;
  return {
    key, name: (o.prefix || '') + e.name, shape: e.shape, color: e.color, hp, maxHp: hp, atk,
    def: DAILY.enemyDef * e.def, spd: e.spd, dodge: e.dodge || 0, poison: e.poison ? Math.max(1, Math.round(atk * e.poison)) : 0,
    magic: !!e.magic, ls: e.ls || 0, undead: !!e.undead, boss: !!e.boss || !!o.boss, elite: !!o.elite,
  };
}
function killHero(S, ad, h, cause) {
  h.dead = true; h.hp = 0; h.cause = cause;   // stays on the roster, marked fallen, until the next dawn
  ad.fallen.push(h.name);
  S.stats.deaths++;
  alog(ad, `☠ ${h.name} is slain by ${cause}.`, 'death');
}
// returns true if the hero died
function hurtHero(S, ad, h, d, cause, ev, lethal = true) {
  d = Math.max(1, Math.round(d));
  const cs = ad.cs[h.id];
  if (!lethal) d = Math.min(d, Math.max(0, Math.floor(h.hp) - 1));
  h.hp -= d;
  ev.push({ ex: ad.id, side: 'h', id: h.id, n: d });
  if (h.hp > 0) return false;
  // a natural 20: the winds of fate will not let the whole party fall on this stretch (the others still can)
  if (ad.roll === 20 && party(S, ad).length === 1) { h.hp = 1; alog(ad, `✦ The winds of fate shield ${h.name}!`, 'loot'); return false; }
  killHero(S, ad, h, cause);
  return true;
}
function enemyAttack(S, ad, e, ev) {
  const hs = party(S, ad);
  if (!hs.length) return;
  const pool = [];
  for (const h of hs) { pool.push(h); if (DCLASS[h.cls].taunt) pool.push(h, h); }
  // sometimes enemies gang up on whoever is hurt worst: a hero can fall while the party still wins
  const h = Math.random() < DAILY.focus ? hs.reduce((a, b) => (b.hp / b.maxHp < a.hp / a.maxHp ? b : a)) : pick(pool), st = stats(h);
  ad.act = { side: 'e', i: ad.enemies.indexOf(e) }; ad.actN++;
  if (Math.random() * 100 < st.dodge) { alog(ad, `${short(h)} dodges ${e.name}.`, 'dim'); ev.push({ ex: ad.id, side: 'h', id: h.id, txt: 'dodge' }); return; }
  let d = e.atk * rnd(0.85, 1.15);
  if (!e.magic) d *= 1 - st.def / (st.def + 50);
  d = Math.max(1, Math.round(d));
  alog(ad, `${e.name} hits ${short(h)} for ${d}.`, 'bad');
  if (e.ls) e.hp = Math.min(e.maxHp, e.hp + Math.round(d * e.ls));
  const died = hurtHero(S, ad, h, d, e.name, ev);
  if (!died && e.poison && !st.resist.poison) { const cs = ad.cs[h.id]; cs.poison = Math.min(cs.poison + e.poison, e.poison * 3); }
}
// Healers draw on one shared pool: every heal costs each healer in the party a point of mana, so a party heals about as
// often as its best healer alone. Stacking healers adds their fighting, not endless healing (three clerics outlasted all).
function spendMana(allies) { for (const a of allies) if (a.mana > 0) a.mana--; }
function heroAct(S, ad, h, ev) {
  const cs = ad.cs[h.id], C = DCLASS[h.cls];
  if (cs.poison > 0 && hurtHero(S, ad, h, cs.poison, 'poison', ev)) return;
  const st = stats(h);
  cs.acts++;
  ad.act = { side: 'h', id: h.id }; ad.actN++;
  const foes = ad.enemies.filter(e => e.hp > 0);
  if (!foes.length) return;
  const allies = party(S, ad), heal = (who, amt) => { amt = Math.round(Math.min(who.maxHp - who.hp, amt)); if (amt > 0) { who.hp += amt; ev.push({ ex: ad.id, side: 'h', id: who.id, n: amt, heal: true }); } return amt; };
  if (h.cls === 'cleric') {
    let low = null, lr = 0.6;
    for (const a of allies) { const r = a.hp / a.maxHp; if (r < lr) { lr = r; low = a; } }
    if (low && h.mana > 0) {   // a mend costs one mana from every healer (they share one pool); out of mana, the cleric fights
      spendMana(allies);
      const amt = heal(low, (h.attrs.int * 0.9 + 1 + st.atk * 0.45) * DAILY.mend * rnd(0.9, 1.1)); ad.cs[low.id].poison = 0;
      alog(ad, `${short(h)} mends ${low === h ? 'their own wounds' : short(low)} for ${amt}.`, 'heal');
      return;
    }
  }
  if (h.cls === 'druid' && h.mana > 0 && allies.some(a => a.hp < a.maxHp)) {   // a rejuvenation costs one mana from every healer
    spendMana(allies);
    let total = 0;
    for (const a of allies) total += heal(a, a.maxHp * 0.03 + st.atk * 0.12);
    if (total > 0) { alog(ad, `${short(h)}'s rejuvenation mends the party for ${total}.`, 'heal'); if (allies.some(a => a.hp / a.maxHp < 0.7)) return; }
  }
  let targets, mul = 1, verb = 'hits';
  if (h.cls === 'mage' && cs.acts % 3 === 0) { targets = foes; mul = 0.7; verb = 'scorches'; }
  else if (h.cls === 'cryomancer' && cs.acts % 3 === 0) { targets = foes; mul = 0.6; verb = 'freezes'; for (const f of foes) f.slow = true; }
  else if (h.cls === 'warrior' && cs.acts % 4 === 0) { targets = foes.slice(0, 2); mul = 0.85; verb = 'cleaves'; }
  else if (h.cls === 'ranger') { targets = [foes.reduce((a, b) => (b.hp < a.hp ? b : a))]; if (cs.first) { mul = 1.5; verb = 'snipes'; } }
  else if (h.cls === 'monk') { const t = pick(foes); targets = [t, t]; mul = 0.6; verb = 'strikes'; }
  else if (h.cls === 'bard' && cs.acts % 3 === 0) { ad.inspire = Math.min(3, (ad.inspire || 0) + 1); alog(ad, `♪ ${short(h)}'s song inspires the party! (+${20 * ad.inspire}% damage)`, 'good'); targets = [pick(foes)]; verb = 'strums at'; }
  else if (['rogue', 'mage', 'assassin', 'bard', 'necromancer', 'cryomancer', 'warlock', 'druid', 'hunter'].includes(h.cls)) targets = [pick(foes)];
  else targets = [foes[0]];
  if (h.cls === 'berserker') { mul *= 1 + 0.6 * (1 - h.hp / h.maxHp); if (h.hp / h.maxHp < 0.5) verb = 'rages at'; }
  const forceCrit = h.cls === 'assassin' && cs.first;
  cs.first = false;
  for (const t of targets) {
    if (t.hp <= 0) continue;
    const ti = ad.enemies.indexOf(t);
    if (Math.random() * 100 < t.dodge) { alog(ad, `${t.name} slips away from ${short(h)}.`, 'dim'); ev.push({ ex: ad.id, side: 'e', i: ti, txt: 'miss' }); continue; }
    let d = st.atk * rnd(0.85, 1.15) * mul * (1 + 0.25 * (t.hex || 0)) * (1 + 0.2 * (ad.inspire || 0));
    const crit = forceCrit || Math.random() * 100 < st.crit;
    if (crit) d *= h.cls === 'rogue' || (h.cls === 'assassin' && !forceCrit) ? 2.5 : 1.75;
    if ((h.cls === 'cleric' || h.cls === 'paladin') && t.undead) d *= 1.6;
    if (!C.magic) d *= 1 - t.def / (t.def + 50);
    d = Math.max(1, Math.round(d));
    t.hp -= d;
    if (st.ls) h.hp = Math.min(h.maxHp, h.hp + d * st.ls / 100);
    if (h.cls === 'paladin') heal(h, d * 0.15);
    if (h.cls === 'darkknight') heal(h, d * 0.2);
    if (h.cls === 'necromancer') { const low = allies.reduce((a, b) => (b.hp / b.maxHp < a.hp / a.maxHp ? b : a)); heal(low, d * 0.18); }
    if (h.cls === 'warlock' && t.hp > 0) t.hex = Math.min(2, (t.hex || 0) + 1.2);
    ev.push({ ex: ad.id, side: 'e', i: ti, n: d, crit });
    let note = '';
    if (h.cls === 'assassin' && t.hp > 0 && !t.boss && t.hp / t.maxHp < 0.15) { t.hp = 0; note = ' Executed!'; }
    alog(ad, `${short(h)} ${crit ? 'CRITS' : verb} ${t.name} for ${d}.${t.hp <= 0 ? (note || ' It dies.') : ''}`, crit ? 'crit' : '');
    if (t.hp <= 0) { t.hp = 0; h.kills++; ad.kills++; }
  }
  if (h.cls === 'hunter') {
    const live = ad.enemies.filter(e => e.hp > 0);
    if (live.length) {
      const t = pick(live), ti = ad.enemies.indexOf(t), d = Math.max(1, Math.round(st.atk * 0.5 * rnd(0.85, 1.15) * (1 - t.def / (t.def + 50))));
      t.hp -= d; ev.push({ ex: ad.id, side: 'e', i: ti, n: d });
      alog(ad, `${short(h)}'s wolf bites ${t.name} for ${d}.${t.hp <= 0 ? ' It dies.' : ''}`);
      if (t.hp <= 0) { t.hp = 0; h.kills++; ad.kills++; }
    }
  }
}
function fightStep(S, ad, ev) {
  ad.fightSteps = (ad.fightSteps || 0) + 1;
  for (let guard = 0; guard < 50; guard++) {
    if (!ad.queue.length) {
      const order = [];
      for (const h of party(S, ad)) { const st = stats(h); order.push({ k: st.spd * rnd(0.8, 1.2), h: h.id }); }
      ad.enemies.forEach((e, i) => { if (e.hp > 0) order.push({ k: e.spd * (e.slow ? 0.6 : 1) * rnd(0.8, 1.2), e: i }); });
      order.sort((a, b) => b.k - a.k);
      ad.queue = order;
    }
    const a = ad.queue.shift();
    if (a.h !== undefined) { const h = findHero(S, a.h); if (!h) continue; heroAct(S, ad, h, ev); }
    else { const e = ad.enemies[a.e]; if (!e || e.hp <= 0) continue; enemyAttack(S, ad, e, ev); }
    break;
  }
  if (!party(S, ad).length) return;
  if (ad.enemies.every(e => e.hp <= 0)) { alog(ad, 'The room falls silent.', 'info'); ad.phase = 'between'; clearedFloor(S, ad); ad.wait = DAILY.walkSteps; }
}
// a floor is behind the party: it counts toward today's deepest floor, banked or not
function clearedFloor(S, ad) {
  ad.roomsCleared++;
  const f = floorNo(ad.depth || 1, ad.roomsCleared - 1);
  if (S.day && f > (S.day.floor || 0)) S.day.floor = f;
  if (S.day && f > ((S.best || bestFromHistory(S)).room || 0)) S.best = { room: f, party: S.day.party ?? todayPartyScore(S), day: S.day.key };   // your deepest adventure ever
}
function enterRoom(S, ad, ev) {
  const room = ad.rooms[ad.room], hs = party(S, ad), tag = `Room ${floorNo(ad.depth || 1, ad.room)}`;
  ad.enemies = [];
  if (room.enemies) {
    // every floor's enemies get a random swing in strength, so no fight is ever a sure thing either way
    const z = Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random()), sw = Math.exp(DAILY.swing * z / 2);
    ad.enemies = room.enemies.map((k, i) => room.type === 'guard' && i === 0 ? spawnEnemy(ad, k, { hp: 1.7, atk: 1.2, prefix: 'Elite ', elite: true, sw })
      : room.type === 'champion' && i === 0 ? spawnEnemy(ad, k, { hp: DAILY.champHp, atk: DAILY.champAtk, prefix: 'Champion ', elite: true, boss: true, sw }) : spawnEnemy(ad, k, { sw }));
    ad.queue = []; ad.inspire = 0;
    for (const id of ad.heroIds) if (ad.cs[id]) ad.cs[id].first = true;
    const names = ad.enemies.map(e => e.name).join(', ');
    alog(ad, room.type === 'boss' || room.type === 'champion' ? `${tag} — ${ad.enemies[0].name} rises from the dark!` : room.type === 'guard' ? `${tag} — the way is guarded: ${names}.` : `${tag} — ${names}.`, room.type === 'combat' ? 'info' : 'boss');
    ad.phase = 'fight';
    return;
  }
  if (room.type === 'treasure') { const b = 16; ad.bonus += b; alog(ad, `${tag} — a forgotten cache! +${b} renown.`, 'loot'); }
  else if (room.type === 'trap') {
    const rogue = hs.find(h => h.cls === 'rogue');
    if (rogue && Math.random() < 0.7) { ad.bonus += 3; alog(ad, `${tag} — ${short(rogue)} disarms a trap (+3 renown).`, 'good'); }
    else { const h = pick(hs); alog(ad, `${tag} — a trap! ${short(h)} is caught in it.`, 'bad'); hurtHero(S, ad, h, h.maxHp * rnd(0.15, 0.25), 'a trap', ev, false); }
  } else if (room.type === 'shrine') {
    for (const h of hs) { const amt = Math.round(Math.min(h.maxHp - h.hp, h.maxHp * 0.25)); h.hp += amt; ad.cs[h.id].poison = 0; if (amt > 0) ev.push({ ex: ad.id, side: 'h', id: h.id, n: amt, heal: true }); }
    alog(ad, `${tag} — a quiet shrine. The party rests and is cleansed.`, 'heal');
  }
  ad.phase = 'between'; clearedFloor(S, ad); ad.wait = DAILY.eventSteps + DAILY.walkSteps;
}
function finish(S, ad, outcome) {
  const hs = party(S, ad), q = ad.quest;
  ad.done = true; ad.outcome = outcome; ad.enemies = []; ad.phase = 'done';
  // Renown varies with how well the run went, so the daily leaderboard is not a tie: the quest's reward, how fast the rooms
  // were cleared, finds along the way, every enemy slain, and every hero who makes it home. A wipe brings back nothing.
  let speed = null;
  if (outcome === 'cleared') {
    const fs = Math.max(1, ad.fightSteps || 0), walk = ad.clearSteps - fs;
    speed = (ad.parFight || fs) / fs;
    ad.clock = { secs: ad.clearSteps * DAILY.stepTime, par: (walk + (ad.parFight || fs)) * DAILY.stepTime, speed, word: speedWord(speed),
      bonus: Math.round(q.renown * clamp((speed - CLEAR_TIME.from) * CLEAR_TIME.slope, 0, CLEAR_TIME.cap)) };
  }
  const depth = ad.depth || 1;
  const parts = outcome === 'cleared' ? [[depth === 1 ? 'Reward, rooms 1-4' : `Reward, room ${floorNo(depth)}`, q.renown], [`Clear time ${clock(ad.clock.secs)} (${ad.clock.word})`, ad.clock.bonus], ['Finds along the way', ad.bonus],
    [`Enemies slain (${ad.kills})`, ad.kills * 5], [`Heroes standing (${hs.length})`, hs.length * (depth === 1 ? 10 : 3)]].filter(p => p[1] > 0) : [];
  // deeper floors pay more: floor 2 adds half again, floor 3 doubles ...
  const sub = parts.reduce((a, p) => a + p[1], 0);
  if (parts.length && depth > 1) parts.push([`Depth bonus, room ${floorNo(depth)} (×${depthBonus(depth)})`, Math.round(sub * (depthBonus(depth) - 1))]);
  const renown = parts.reduce((a, p) => a + p[1], 0);
  for (const h of hs) { h.adventures++; h.hp = Math.min(h.maxHp, Math.max(1, Math.round(h.hp))); }   // wounds stay until dawn
  if (outcome === 'cleared') S.stats.cleared++; else S.stats.wipes++;
  const d = S.day, e = dayEntry(S);
  let lostHaul = 0;
  // carry it: today's haul grows until the party goes home (banked) or falls (lost)
  e.fallen += ad.fallen.length; e.floor = d.floor;
  if (outcome === 'cleared') { d.haul += renown; d.depth = depth; e.depth = depth; }
  else { lostHaul = d.haul; d.haul = 0; d.choice = 'lost'; e.outcome = 'lost'; e.lostAt = floorNo(depth, ad.room); e.lost = lostHaul; e.renown = 0; }
  ad.result = { outcome, depth, lastFloor: floorNo(depth, outcome === 'cleared' ? ad.rooms.length - 1 : ad.room), renown, parts, fallen: [...ad.fallen], empty: ad.fallen.length, clock: ad.clock || null, haul: d.haul, lostHaul };
  alog(ad, outcome === 'cleared' ? `+${renown} renown carried.` : 'No one returns.', outcome === 'cleared' ? 'good' : 'death');
}
export function stepAdventure(S, ev) {
  const ad = S.adv;
  if (!ad || ad.done) return;
  if (!party(S, ad).length) return finish(S, ad, 'wiped');
  ad.steps = (ad.steps || 0) + 1;
  if (ad.wait > 0) { ad.wait--; return; }          // a pacing beat: the party walks on (the renderer shows walking)
  if (ad.phase === 'enter') enterRoom(S, ad, ev);
  else if (ad.phase === 'fight') fightStep(S, ad, ev);
  else if (ad.phase === 'between') {
    ad.room++;
    if (ad.room < ad.rooms.length) ad.phase = 'enter';
    else {   // the climb back out: at least a few steps, longer if the run was short, so every clear lasts 30+ seconds
      ad.phase = 'outro'; ad.clearSteps = ad.steps;
      ad.wait = Math.max(3, Math.ceil((ad.depth > 1 ? 0 : DAILY.minClearSecs) / DAILY.stepTime) - ad.steps);   // a single floor needs no padding
      alog(ad, `Room ${floorNo(ad.depth || 1, ad.rooms.length - 1)} is clear. The way leads deeper into the dark…`, 'good');
    }
  } else if (ad.phase === 'outro') return finish(S, ad, 'cleared');
  if (!party(S, ad).length) finish(S, ad, 'wiped');
}
export function update(S, realDt) {
  const ev = [], ad = S.adv;
  if (!ad || ad.done || ad.hold) return ev;   // held while the dice are being revealed over the dungeon
  ad.acc += realDt * S.speed;
  let n = 0;
  while (ad.acc >= DAILY.stepTime && !ad.done && n++ < 20) { ad.acc -= DAILY.stepTime; stepAdventure(S, ev); }
  return ev;
}

// ---- leaderboard (prototype: simulated rivals until there is a server) ---------------------
const RIVALS = ['Brannoc', 'Ysolde', 'Tamsin_K', 'oldmoss', 'Quillon', 'Hettie', 'Varga', 'Pellam', 'NightOwl', 'Corvid', 'Ludo', 'Saffi', 'grimbeard', 'Elowen', 'Dace', 'Marrow', 'TheSlowBlade', 'Fenwick', 'Ansa', 'Ketterly'];
// today's renown only: who had the best run today (rivals simulated from today's quest until there is a server)
export function todayRenown(S) { return S.day ? S.day.renown || 0 : 0; }
// the deepest floor anyone reached today (rivals included)
export const deepestToday = S => leaderboardToday(S).reduce((b, r) => (r.deepest > (b ? b.deepest : 0) ? r : b), null);
// one rival's day: the party they summoned and the renown they banked (they dive too: some fall on floors 1-4, most stop
// after a floor or two, a few go deep, and a fall loses the whole haul)
function rivalDay(name, key) {
  const base = questFor(key).renown, R = seeded(name + ':' + key), a = R(), b = R(), party = rivalParty(name, key);
  if (a < 0.15) return { name, party, score: 0, deepest: Math.floor(R() * DAILY.floors) };
  const SURVIVE = [0.8, 0.6, 0.35, 0.2, 0.15, 0.12];
  let floor = DAILY.floors, score = base * (1.7 + b * 1.9);
  while (floor < 15 && R() < 0.6) {
    if (R() > (SURVIVE[floor - DAILY.floors] ?? 0.1)) return { name, party, score: 0, deepest: floor };
    floor++; score += DAILY.floorReward * 2.2 * (1.7 + b * 1.9) * depthBonus(floor - DAILY.floors + 1);
  }
  return { name, party, score: Math.round(score), deepest: floor };
}
// a rival's party that day: three heroes at the real rank odds
function rivalParty(name, key) {
  const ranks = Object.keys(RANKS), w = ranks.map(k => RANKS[k].odds), tot = w.reduce((x, y) => x + y, 0), R = seeded(`${name}:party:${key}`);
  let n = 0;
  for (let i = 0; i < DAILY.party; i++) { let r = R() * tot, k = 0; while (r > w[k]) r -= w[k++]; n += heroScore({ rank: ranks[k] }); }
  return n;
}
// your party today: all three summoned heroes, fallen or not
export const todayPartyScore = S => S.heroes.reduce((n, h) => n + heroScore(h), 0);
const keyOf = idx => new Date(idx * 86400000).toISOString().slice(0, 10);
const weekStart = idx => idx - ((idx + 3) % 7);   // weeks start on Monday (day 0, 1970-01-01, was a Thursday)
export function leaderboardToday(S) {
  const rows = RIVALS.map(n => rivalDay(n, S.day.key));
  rows.push({ name: S.playerName || 'You', party: S.day.party ?? todayPartyScore(S), score: todayRenown(S), deepest: S.day.floor || 0, you: true });
  return rows.sort((a, b) => b.score - a.score);
}
// span: 'today', 'week' (since Monday) or 'all' (since you started). score = renown gained, party = party scores added up
export function board(S, span = 'today') {
  if (span === 'today') return leaderboardToday(S);
  const today = dayIndex(S.day.key), from = span === 'week' ? weekStart(today) : dayIndex(S.startKey);
  const rows = RIVALS.map(name => {
    let party = 0, score = 0, deepest = 0;
    for (let i = from; i <= today; i++) { const r = rivalDay(name, keyOf(i)); party += r.party; score += r.score; deepest = Math.max(deepest, r.deepest); }
    return { name, party, score, deepest };
  });
  const mine = S.history.filter(e => dayIndex(e.day) >= from && e.day !== S.day.key);
  const pastParty = S.history.filter(e => e.day !== S.day.key).reduce((n, e) => n + (e.party || 0), 0), todayParty = S.day.party ?? todayPartyScore(S);
  const me = span === 'all' ? { party: S.partyTotal || pastParty + todayParty, score: S.renown, deepest: (S.best || bestFromHistory(S)).room || 0 }   // older saves: no running totals yet
    : { party: mine.reduce((n, e) => n + (e.party || 0), 0) + todayParty, score: mine.reduce((n, e) => n + (e.renown || 0), 0) + todayRenown(S),
      deepest: Math.max(S.day.floor || 0, ...mine.map(e => e.floor || 0)) };
  rows.push({ name: S.playerName || 'You', ...me, you: true });
  return rows.sort((a, b) => b.score - a.score);
}
// your deepest adventure from the day log (older saves, before S.best was kept)
function bestFromHistory(S) {
  let b = { room: S.day.floor || 0, party: S.day.party ?? todayPartyScore(S), day: S.day.key };
  for (const e of S.history) if ((e.floor || 0) > b.room) b = { room: e.floor, party: e.party || 0, day: e.day };
  return b;
}
// the deepest adventures ever: each player's deepest room cleared, the party that did it and the day (the first time counts)
export function deepestAdventures(S) {
  const today = dayIndex(S.day.key), from = dayIndex(S.startKey);
  const rows = RIVALS.map(name => {
    let best = { name, deepest: -1 };
    for (let i = from; i <= today; i++) { const r = rivalDay(name, keyOf(i)); if (r.deepest > best.deepest) best = { name, deepest: r.deepest, party: r.party, day: keyOf(i) }; }
    return best;
  });
  const b = S.best || bestFromHistory(S);
  rows.push({ name: S.playerName || 'You', deepest: b.room || 0, party: b.party || 0, day: b.day, you: true });
  return rows.sort((a, b) => b.deepest - a.deepest || (a.day < b.day ? -1 : a.day > b.day ? 1 : 0));
}
export const leaderboard = S => board(S, 'all');

// ---- party score: on the d20's own scale, about 15 for an average party. Points follow how far each mix really gets
// (tools/daily-sim.mjs ranks), so a higher score always means better odds: S+E+E (26) beats A+A+A (24) beats C+C+C (15).
export const RANK_POINTS = { E: 3, D: 4, C: 5, B: 7, A: 8, S: 20 };
export const heroScore = h => RANK_POINTS[h.rank || 'C'] || 5;
export const partyScore = S => S.heroes.filter(h => !h.dead).reduce((n, h) => n + heroScore(h), 0);
// rivals' party scores today (the plate compares yours with these)
export const rivalPartyScores = S => RIVALS.map(n => rivalParty(n, S.day.key));
