// Static game data: classes, traits, gear, floors, enemies.
// Everything here is tuning/content — safe to edit without touching the rules in game.js.

export const ATTRS = ['str', 'agi', 'int', 'vit'];
export const ATTR_NAMES = { str: 'Strength', agi: 'Agility', int: 'Intellect', vit: 'Vitality' };

export const CLASSES = {
  warrior: {
    name: 'Warrior', main: 'str', hpMul: 1.3, base: { str: 7, agi: 4, int: 2, vit: 7 },
    weapons: ['sword', 'axe'], armors: ['plate'],
    skill: 'Guard & Cleave', skillDesc: 'Draws enemy attacks. Every 4th action hits two enemies.',
  },
  rogue: {
    name: 'Rogue', main: 'agi', hpMul: 0.9, base: { str: 4, agi: 8, int: 3, vit: 5 }, crit: 10, dodge: 8,
    weapons: ['dagger', 'sword'], armors: ['leather'],
    skill: 'Backstab & Disarm', skillDesc: 'Brutal critical hits. Usually disarms traps.',
  },
  mage: {
    name: 'Mage', main: 'int', hpMul: 0.75, base: { str: 2, agi: 4, int: 9, vit: 5 },
    weapons: ['staff'], armors: ['robe'],
    skill: 'Fireball', skillDesc: 'Magic ignores armor. Every 3rd action burns all enemies.',
  },
  cleric: {
    name: 'Cleric', main: 'int', hpMul: 1.05, base: { str: 4, agi: 3, int: 7, vit: 6 },
    weapons: ['mace', 'staff'], armors: ['plate', 'robe'],
    skill: 'Mend & Smite', skillDesc: 'Heals wounded allies and cures poison. Extra damage to undead.',
  },
  ranger: {
    name: 'Ranger', main: 'agi', hpMul: 1.0, base: { str: 4, agi: 7, int: 4, vit: 5 },
    weapons: ['bow', 'dagger'], armors: ['leather'],
    skill: 'Aimed Shot', skillDesc: 'Picks off the weakest enemy. Opening shot hits hard. Sees in the dark.',
  },
};

// fx keys: hpPct atkPct spd dodge def gold xp ls resist survivor
export const TRAITS = {
  tough: { name: 'Tough', desc: '+15% health', fx: { hpPct: 15 } },
  quick: { name: 'Quick', desc: '+3 speed, +5% dodge', fx: { spd: 3, dodge: 5 } },
  brutal: { name: 'Brutal', desc: '+12% damage', fx: { atkPct: 12 } },
  lucky: { name: 'Lucky', desc: '+20% gold found', fx: { gold: 20 } },
  learner: { name: 'Fast Learner', desc: '+25% experience', fx: { xp: 25 } },
  stomach: { name: 'Iron Stomach', desc: 'Immune to poison', fx: { resist: 'poison' } },
  survivor: { name: 'Survivor', desc: 'Once per expedition, survives a killing blow', fx: { survivor: 1 } },
  thick: { name: 'Thick-Skinned', desc: '+6 armor', fx: { def: 6 } },
  frail: { name: 'Frail', desc: '-12% health', fx: { hpPct: -12 }, bad: true },
  reckless: { name: 'Reckless', desc: '+18% damage, -8 armor', fx: { atkPct: 18, def: -8 }, bad: true },
  greedy: { name: 'Greedy', desc: '+30% gold found, -6% dodge', fx: { gold: 30, dodge: -6 }, bad: true },
  clumsy: { name: 'Clumsy', desc: '-2 speed', fx: { spd: -2 }, bad: true },
};

export const RARITY = [
  { name: 'Common', mul: 1.0, color: '#b8b3a7' },
  { name: 'Fine', mul: 1.25, color: '#6fbf73' },
  { name: 'Rare', mul: 1.55, color: '#5aa2e0' },
  { name: 'Epic', mul: 1.9, color: '#c07be8' },
];

// Gear tier == the floor it comes from.
export const TIER_NAMES = ['Rusty', 'Iron', 'Sporewood', 'Coral', 'Bonecarved', 'Emberforged', 'Frostbound', 'Shadowed', 'Bloodthorn', 'Abyssal'];

export const WEAPONS = {
  sword: { name: 'Sword', atk: 1.0 },
  axe: { name: 'Axe', atk: 1.1 },
  dagger: { name: 'Dagger', atk: 0.95 },
  staff: { name: 'Staff', atk: 1.0 },
  mace: { name: 'Mace', atk: 1.0 },
  bow: { name: 'Bow', atk: 1.0 },
};
export const ARMORS = {
  plate: { name: 'Plate', def: 1.3, hp: 1.0 },
  leather: { name: 'Leathers', def: 0.9, hp: 1.0 },
  robe: { name: 'Robe', def: 0.6, hp: 0.9 },
};
// r = rarity index (0-3)
export const TRINKETS = {
  antivenom: { name: 'Antivenom Charm', fx: () => ({ resist: 'poison' }), desc: () => 'Immune to poison' },
  emberward: { name: 'Emberward Amulet', fx: () => ({ resist: 'burn' }), desc: () => 'Immune to forge heat' },
  lantern: { name: 'Wayfinder Lantern', fx: () => ({ resist: 'dark' }), desc: () => 'Sees in the dark' },
  furs: { name: 'Furlined Talisman', fx: () => ({ resist: 'chill' }), desc: () => 'Immune to chill' },
  coin: { name: 'Lucky Coin', fx: r => ({ gold: 20 + 10 * r }), desc: r => `+${20 + 10 * r}% gold found` },
  whetstone: { name: 'Whetstone', fx: r => ({ atkPct: 8 + 4 * r }), desc: r => `+${8 + 4 * r}% damage` },
  ring: { name: 'Vitality Ring', fx: r => ({ hpPct: 10 + 5 * r }), desc: r => `+${10 + 5 * r}% health` },
  anklet: { name: 'Swift Anklet', fx: r => ({ spd: 2 + r, dodge: 3 + 2 * r }), desc: r => `+${2 + r} speed, +${3 + 2 * r}% dodge` },
  fang: { name: 'Vampiric Fang', fx: r => ({ ls: 6 + 3 * r }), desc: r => `Heals for ${6 + 3 * r}% of damage dealt` },
};

// Enemy stats are multipliers on the floor's baseline. shape = sprite silhouette.
export const ENEMIES = {
  rat: { name: 'Cellar Rat', shape: 'rat', color: '#8a7a6a', hp: 0.7, atk: 0.8, def: 0.5, spd: 14 },
  slime: { name: 'Moss Slime', shape: 'blob', color: '#6fae54', hp: 1.3, atk: 0.7, def: 1, spd: 6 },
  goblin: { name: 'Goblin Scavenger', shape: 'humanoid', color: '#7d9a4a', hp: 1, atk: 1, def: 1, spd: 10 },

  wrat: { name: 'Warren Rat', shape: 'rat', color: '#6b5b53', hp: 0.55, atk: 0.75, def: 0.5, spd: 15 },
  prat: { name: 'Plague Rat', shape: 'rat', color: '#7f8a4a', hp: 0.6, atk: 0.6, def: 0.5, spd: 13, poison: 0.2 },
  brute: { name: 'Rat Brute', shape: 'humanoid', color: '#7a5f52', hp: 1.3, atk: 1.05, def: 1.2, spd: 8 },

  puff: { name: 'Spore Puff', shape: 'blob', color: '#b07cc6', hp: 0.9, atk: 0.6, def: 0.6, spd: 7, poison: 0.35 },
  myconid: { name: 'Myconid', shape: 'mushroom', color: '#c9a36b', hp: 1.2, atk: 0.9, def: 1, spd: 8, poison: 0.25 },
  spider: { name: 'Cave Spider', shape: 'spider', color: '#5e5470', hp: 0.8, atk: 0.9, def: 0.8, spd: 15, poison: 0.3 },

  shell: { name: 'Shellback', shape: 'turtle', color: '#4f8f8a', hp: 1.2, atk: 0.9, def: 5, spd: 6 },
  sailor: { name: 'Drowned Sailor', shape: 'skeleton', color: '#7fa7a0', hp: 1, atk: 1.05, def: 2.5, spd: 9, undead: true },
  eel: { name: 'Hall Eel', shape: 'eel', color: '#3f6f9f', hp: 0.7, atk: 1.1, def: 1, spd: 15 },

  skeleton: { name: 'Skeleton', shape: 'skeleton', color: '#d8d2bd', hp: 0.9, atk: 1, def: 1.5, spd: 10, undead: true },
  ghoul: { name: 'Ghoul', shape: 'humanoid', color: '#7f9a86', hp: 1.3, atk: 1.05, def: 1, spd: 11, undead: true, ls: 0.3 },
  wraith: { name: 'Wraith', shape: 'ghost', color: '#9fb4d6', hp: 0.8, atk: 1, def: 0.5, spd: 12, undead: true, magic: true, dodge: 15 },
  gravewarden: { name: 'The Gravewarden', shape: 'boss', color: '#cfc6a4', hp: 7, atk: 1.5, def: 2.5, spd: 9, undead: true, boss: true },

  imp: { name: 'Cinder Imp', shape: 'imp', color: '#e0703a', hp: 0.8, atk: 1.1, def: 0.8, spd: 14, magic: true },
  magma: { name: 'Magma Slime', shape: 'blob', color: '#d9532b', hp: 1.4, atk: 0.9, def: 1.5, spd: 6 },
  fgolem: { name: 'Forge Golem', shape: 'golem', color: '#8a5a44', hp: 1.5, atk: 1.1, def: 4, spd: 5 },

  wolf: { name: 'Ice Wolf', shape: 'beast', color: '#bfd6e6', hp: 0.9, atk: 1.15, def: 1, spd: 16 },
  fwraith: { name: 'Frost Wraith', shape: 'ghost', color: '#8fd0e8', hp: 0.9, atk: 1.05, def: 0.5, spd: 12, magic: true, dodge: 15 },
  yeti: { name: 'Yeti', shape: 'yeti', color: '#e6eef2', hp: 1.8, atk: 1.2, def: 1.5, spd: 7 },

  shade: { name: 'Shade', shape: 'ghost', color: '#5b4f7a', hp: 0.9, atk: 1.1, def: 0.5, spd: 13, magic: true, dodge: 25 },
  gbat: { name: 'Gloom Bat', shape: 'flyer', color: '#4a4560', hp: 0.7, atk: 1, def: 0.8, spd: 17, dodge: 15 },
  stalker: { name: 'Gallery Stalker', shape: 'spider', color: '#3d3a52', hp: 1.2, atk: 1.25, def: 1.5, spd: 12 },

  creeper: { name: 'Thorn Creeper', shape: 'plant', color: '#8c2f45', hp: 1.4, atk: 0.9, def: 2, spd: 6, poison: 0.25 },
  bbat: { name: 'Blood Bat', shape: 'flyer', color: '#b03048', hp: 0.8, atk: 1.05, def: 0.8, spd: 16, ls: 0.5 },
  rknight: { name: 'Rose Knight', shape: 'knight', color: '#c2506a', hp: 1.4, atk: 1.2, def: 4, spd: 9, ls: 0.3 },

  vspawn: { name: 'Void Spawn', shape: 'blob', color: '#6a3fb0', hp: 1.1, atk: 1.1, def: 1.5, spd: 10, magic: true },
  aknight: { name: 'Abyss Knight', shape: 'knight', color: '#4b3f8a', hp: 1.5, atk: 1.25, def: 4.5, spd: 9 },
  watcher: { name: 'Watcher', shape: 'eye', color: '#8f5fd0', hp: 0.9, atk: 1.2, def: 1, spd: 15, magic: true, dodge: 15 },
  hollowking: { name: 'The Hollow King', shape: 'boss', color: '#7b4fd6', hp: 9, atk: 1.6, def: 4, spd: 10, boss: true, magic: true },

  // added for RNG Quest's extra locations (code-drawn until they get PixelLab art)
  kobold: { name: 'Kobold Sapper', shape: 'humanoid', color: '#b5653a', hp: 0.8, atk: 0.9, def: 0.8, spd: 13 },
  bandit: { name: 'Cutthroat', shape: 'humanoid', color: '#6a5a7a', hp: 1, atk: 1.1, def: 1, spd: 12 },
  cultist: { name: 'Hooded Cultist', shape: 'humanoid', color: '#7a2a3a', hp: 0.9, atk: 1.1, def: 0.8, spd: 10, magic: true },
  harpy: { name: 'Harpy', shape: 'flyer', color: '#c99a5a', hp: 0.8, atk: 1, def: 0.8, spd: 16, dodge: 15 },
  scorpion: { name: 'Tomb Scorpion', shape: 'spider', color: '#c98a3a', hp: 1, atk: 1, def: 2, spd: 11, poison: 0.3 },
  mummy: { name: 'Mummy', shape: 'skeleton', color: '#d9c99a', hp: 1.4, atk: 1, def: 1.2, spd: 7, undead: true },
  sandworm: { name: 'Sandworm', shape: 'eel', color: '#b89a6a', hp: 1.3, atk: 1.15, def: 1, spd: 9 },
  treant: { name: 'Treant', shape: 'golem', color: '#5a7a3a', hp: 1.7, atk: 1, def: 3, spd: 5 },
  wisp: { name: 'Will-o-Wisp', shape: 'ghost', color: '#9fe6c0', hp: 0.7, atk: 1, def: 0.5, spd: 14, magic: true, dodge: 20 },
  crab: { name: 'Reef Crab', shape: 'turtle', color: '#c0503a', hp: 1.1, atk: 0.9, def: 4, spd: 7 },
  naga: { name: 'Naga', shape: 'eel', color: '#3a9a8a', hp: 1.1, atk: 1.1, def: 1, spd: 12, magic: true },
  gargoyle: { name: 'Gargoyle', shape: 'golem', color: '#7a7a8a', hp: 1.3, atk: 1.05, def: 4, spd: 8 },
  vampire: { name: 'Vampire Spawn', shape: 'humanoid', color: '#5a1a2a', hp: 1.2, atk: 1.15, def: 1, spd: 13, undead: true, ls: 0.4 },
  lizardman: { name: 'Lizardman', shape: 'humanoid', color: '#4a8a4a', hp: 1.2, atk: 1.05, def: 1.5, spd: 10 },
  fspider: { name: 'Frost Spider', shape: 'spider', color: '#9fd0e8', hp: 0.9, atk: 1, def: 1, spd: 14 },
  clockwork: { name: 'Clockwork Sentry', shape: 'golem', color: '#b08a4a', hp: 1.3, atk: 1.1, def: 4, spd: 8 },
  banshee: { name: 'Banshee', shape: 'ghost', color: '#d0c0e8', hp: 0.8, atk: 1.2, def: 0.5, spd: 13, magic: true, dodge: 15, undead: true },
  toad: { name: 'Bloated Toad', shape: 'blob', color: '#6a8a3a', hp: 1.2, atk: 0.9, def: 1, spd: 8, poison: 0.2 },
  ogre: { name: 'Ogre', shape: 'yeti', color: '#8a9a5a', hp: 2, atk: 1.25, def: 1.5, spd: 6 },
  serpent: { name: 'Marsh Serpent', shape: 'eel', color: '#6a8a2a', hp: 1, atk: 1, def: 1, spd: 13, poison: 0.3 },
  sandking: { name: 'The Sand King', shape: 'boss', color: '#c9a35a', hp: 7.5, atk: 1.5, def: 3, spd: 9, boss: true },
  drownedqueen: { name: 'The Drowned Queen', shape: 'boss', color: '#3a8a9a', hp: 7, atk: 1.5, def: 2.5, spd: 10, boss: true, magic: true },
  thornwitch: { name: 'The Witch of Thorns', shape: 'boss', color: '#6a3a5a', hp: 7, atk: 1.55, def: 2.5, spd: 10, boss: true, magic: true, poison: 0.2 },
  colossus: { name: 'The Iron Colossus', shape: 'boss', color: '#8a8a9a', hp: 8.5, atk: 1.45, def: 4, spd: 7, boss: true },
};

export const HAZARDS = {
  poison: { name: 'Poison', desc: 'Enemies poison your heroes. Bring a Cleric or Antivenom Charms.' },
  swarm: { name: 'Swarms', desc: 'Lots of weak enemies. Area attacks shine here.' },
  armor: { name: 'Armored foes', desc: 'Thick shells shrug off blades. Magic ignores armor.' },
  undead: { name: 'Undead', desc: 'The dead hit hard and feed on the living. Clerics smite them.' },
  burn: { name: 'Forge heat', desc: 'Every room scorches heroes without an Emberward Amulet.' },
  chill: { name: 'Bitter chill', desc: 'Heroes are slowed and cannot dodge without a Furlined Talisman.' },
  dark: { name: 'Darkness', desc: 'Heroes miss often. Rangers and Wayfinder Lanterns see through it.' },
  blood: { name: 'Bloodthirst', desc: 'Enemies heal by wounding you. Kill fast or not at all.' },
  abyss: { name: 'The Abyss', desc: 'Everything you have learned. All of it at once.' },
};

export const FLOORS = [
  { name: 'Mossy Cellars', rooms: 5, count: [1, 2], enemies: ['rat', 'slime', 'goblin'], hazard: null,
    pal: { bg: '#141d18', wall: '#2b3f31', wall2: '#22332a', floor: '#3c5a44', accent: '#7fbf6a' } },
  { name: 'Rat Warrens', rooms: 5, count: [3, 4], enemies: ['wrat', 'wrat', 'prat', 'brute'], hazard: 'swarm',
    pal: { bg: '#1a1512', wall: '#4a3a2e', wall2: '#3a2d24', floor: '#5c4a3a', accent: '#c9a36b' } },
  { name: 'Fungal Grotto', rooms: 6, count: [2, 3], enemies: ['puff', 'myconid', 'spider'], hazard: 'poison',
    pal: { bg: '#17121f', wall: '#3b2f52', wall2: '#2e2440', floor: '#4a3d63', accent: '#b07cc6' } },
  { name: 'Drowned Halls', rooms: 6, count: [2, 3], enemies: ['shell', 'sailor', 'eel'], hazard: 'armor',
    pal: { bg: '#0f1a1f', wall: '#24454d', wall2: '#1b363d', floor: '#2f5a63', accent: '#5fc7c0' } },
  { name: 'Bone Crypt', rooms: 6, count: [2, 3], enemies: ['skeleton', 'ghoul', 'wraith'], hazard: 'undead', boss: 'gravewarden', minions: 1,
    pal: { bg: '#18171a', wall: '#4a4741', wall2: '#3a3833', floor: '#5e5a50', accent: '#d8d2bd' } },
  { name: 'Ember Forges', rooms: 6, count: [2, 3], enemies: ['imp', 'magma', 'fgolem'], hazard: 'burn',
    pal: { bg: '#1f100c', wall: '#5a2a1c', wall2: '#451f15', floor: '#6e3a26', accent: '#ff8a3a' } },
  { name: 'Frost Hollows', rooms: 7, count: [2, 3], enemies: ['wolf', 'fwraith', 'yeti'], hazard: 'chill',
    pal: { bg: '#101820', wall: '#3a5568', wall2: '#2d4454', floor: '#587a8e', accent: '#bfe6f5' } },
  { name: 'Shadow Gallery', rooms: 7, count: [2, 3], enemies: ['shade', 'gbat', 'stalker'], hazard: 'dark',
    pal: { bg: '#0a0910', wall: '#221f33', wall2: '#191727', floor: '#2d2942', accent: '#7a6fb0' } },
  { name: 'Blood Gardens', rooms: 7, count: [2, 3], enemies: ['creeper', 'bbat', 'rknight'], hazard: 'blood',
    pal: { bg: '#1a0b10', wall: '#4d1c2a', wall2: '#3b1520', floor: '#63283a', accent: '#e05a78' } },
  { name: 'The Abyssal Throne', rooms: 7, count: [2, 3], enemies: ['vspawn', 'aknight', 'watcher'], hazard: 'abyss', boss: 'hollowking', minions: 2,
    pal: { bg: '#08060f', wall: '#2a1f4d', wall2: '#1f173a', floor: '#3a2c66', accent: '#a57bff' } },
];

export const UPGRADES = {
  barracks: { name: 'Barracks', desc: 'Room for one more hero on your roster.', max: 6, base: 120, growth: 1.9 },
  tavern: { name: 'Tavern Notice Board', desc: 'Better recruits show up, and more of them.', max: 5, base: 150, growth: 2.1 },
  infirmary: { name: 'Infirmary', desc: 'Heroes recover faster between expeditions.', max: 6, base: 100, growth: 1.9 },
  charter: { name: 'Guild Charter', desc: 'Run one more expedition at the same time.', max: 2, base: 600, growth: 5 },
};

export const NAMES = {
  m: ['Aldric', 'Bram', 'Cedric', 'Doran', 'Edmund', 'Finn', 'Garrick', 'Hakon', 'Ivo', 'Joss', 'Kell', 'Leoric', 'Magnus', 'Nils', 'Osric', 'Perrin', 'Rurik', 'Soren', 'Tobin', 'Ulf', 'Varek', 'Wendel', 'Yorick', 'Bjorn', 'Emil', 'Gustav', 'Halvar', 'Torsten'],
  f: ['Astrid', 'Brynn', 'Cora', 'Dagny', 'Elin', 'Freya', 'Greta', 'Hilde', 'Ingrid', 'Juna', 'Kara', 'Liv', 'Maren', 'Nessa', 'Odette', 'Petra', 'Runa', 'Sigrid', 'Thora', 'Una', 'Vesna', 'Wren', 'Ylva', 'Signe', 'Tove', 'Saga', 'Embla', 'Alva'],
};
export const EPITHETS = ['the Bold', 'the Quiet', 'Ironfoot', 'of the Marsh', 'the Younger', 'Redhand', 'the Unlucky', 'Longstride', 'the Pale', 'Oakheart', 'the Sly', 'Half-Ear', 'the Devout', 'Stormborn', 'the Patient', 'Coppertooth', 'of the Hole', 'the Stubborn'];

export const SKINS = ['#f1c9a5', '#e0ac7e', '#c68642', '#8d5524', '#f6d7c3', '#a9714b'];
export const HAIRS = ['#2b1d14', '#5a3a1e', '#a8672a', '#d9b25f', '#b7b7b7', '#8c2f1f', '#1c1c24', '#e8e0d0'];

// Hero sprite folders under assets/heroes/, per class and gender. Recruits only roll genders that have art.
// Add a folder here (e.g. warrior: { m: 'warrior_m', f: 'warrior_f' }) when new art is generated.
export const HERO_ART = {
  warrior: { m: 'warrior_m' }, rogue: { f: 'rogue_f' }, mage: { m: 'mage_m' },
  cleric: { f: 'cleric_f' }, ranger: { m: 'ranger_m' },
};
// Enemy keys (from ENEMIES) with a PixelLab sprite at assets/enemies/<key>.png, facing left. Since 2026-11-12 that is every
// enemy; one left out of this list falls back to its code-drawn sprite from enemy-art.js.
export const ENEMY_ART = ['rat', 'slime', 'goblin', 'wrat', 'prat', 'brute', 'puff', 'myconid', 'spider', 'shell',
  'sailor', 'eel', 'skeleton', 'ghoul', 'wraith', 'gravewarden', 'imp', 'magma', 'fgolem', 'wolf', 'fwraith', 'yeti',
  'shade', 'gbat', 'stalker', 'creeper', 'bbat', 'rknight', 'vspawn', 'aknight', 'watcher', 'hollowking', 'kobold',
  'bandit', 'cultist', 'harpy', 'scorpion', 'mummy', 'sandworm', 'treant', 'wisp', 'crab', 'naga', 'gargoyle',
  'vampire', 'lizardman', 'fspider', 'clockwork', 'banshee', 'toad', 'ogre', 'serpent', 'sandking', 'drownedqueen',
  'thornwitch', 'colossus'];
// Drawing scale for enemy art in the dungeon (default 1). Heroes stand ~62px tall; small creatures were drawn nearly
// that big, so they are shown at 3/4 (the wisp at 1/2). The dungeon canvas renders at 4x, so 3/4 and 1/2 stay crisp.
// Drawing scale for hero art in the dungeon, by art folder (default 1). Jallie is a dog: the user asked for her 20% smaller.
export const HERO_SCALE = { u_jallie: 0.8 };
export const ENEMY_SCALE = {
  rat: 0.75, wrat: 0.75, slime: 0.75, puff: 0.75, imp: 0.75, watcher: 0.75, magma: 0.75, vspawn: 0.75, toad: 0.75, crab: 0.75,
  kobold: 0.75, gbat: 0.75, bbat: 0.75, spider: 0.75, scorpion: 0.75, goblin: 0.75, wisp: 0.5,
};

// PixelLab parallax environments (assets/env/<slug>/: far, wall, floor and foreground props). Places not listed here
// keep the scenery drawn in code. fg: [file, 'top' (hangs from above) | 'bottom' (stands up from below)];
// pillars: true adds the optional pillar layer (wall.png; wallDrop: how far its base reaches onto the floor; spaced: re-lay it unevenly).
export const ENV_ART = {
  'bandit-hideout': { fg: [['fg1', 'bottom']] },
  'bell-tower': { fg: [['fg1', 'bottom']] },
  'blood-gardens': { fg: [['fg1', 'bottom']] },
  'bone-crypt': { fg: [['fg1', 'bottom']] },
  'bone-pits': { fg: [['fg1', 'bottom']] },
  'clockwork-vault': { fg: [['fg1', 'bottom']] },
  'crystal-grotto': { fg: [['fg1', 'bottom']] },
  'cultist-sanctum': { fg: [['fg1', 'bottom']] },
  'drowned-halls': { fg: [['fg1', 'bottom']] },
  'ember-caves': { fg: [['fg1', 'bottom']] },
  'ember-forges': { fg: [['fg1', 'bottom']] },
  'frost-hollows': { fg: [['fg1', 'bottom']] },
  'frozen-catacombs': { fg: [['fg1', 'bottom']] },
  'fungal-grotto': { fg: [['fg1', 'bottom']] },
  'goblin-tunnels': { fg: [['fg1', 'bottom']] },
  'haunted-chapel': { fg: [['fg1', 'bottom']] },
  'lizardfolk-marsh': { fg: [['fg1', 'bottom']] },
  'mossy-cellars': { fg: [['fg1', 'bottom']] },
  'ogre-den': { fg: [['fg1', 'bottom']] },
  'overgrown-ruins': { fg: [['fg1', 'bottom']] },
  'rat-warrens': { fg: [['fg1', 'bottom']] },
  'sandstone-tombs': { fg: [['fg1', 'bottom']] },
  'shadow-gallery': { fg: [['fg1', 'bottom']] },
  'spider-nest': { fg: [['fg1', 'bottom']] },
  'sunken-temple': { fg: [['fg1', 'bottom']] },
  'the-abyssal-throne': { fg: [['fg1', 'bottom']] },
  'vampire-s-crypt': { fg: [['fg1', 'bottom'], ['fg2', 'top']] },
  'void-breach': { fg: [['fg1', 'bottom']] },
  'windswept-galleries': { fg: [['fg1', 'bottom']] },
  'witchwood-hollow': { fg: [['fg1', 'bottom']] },
};

// ---- the big roster (2026-11-13): 146 more enemies with PixelLab sprites, so every place has ten kinds -----------------
// Stats are relative (1 = a goblin). The deeper the floor, the stronger the kinds that turn up (pickFoe in daily.js).
Object.assign(ENEMIES, {
  beetle: { name: "Giant Beetle", shape: 'beast', color: '#653e56', hp: 0.8, atk: 0.75, def: 2, spd: 9 },
  gobshaman: { name: "Goblin Hexer", shape: 'humanoid', color: '#936c5b', hp: 0.9, atk: 1.2, def: 0.8, spd: 11, magic: true },
  moldman: { name: "Mold Shambler", shape: 'humanoid', color: '#93a948', hp: 1.4, atk: 0.9, def: 1, spd: 6, poison: 0.25 },
  gobbrute: { name: "Goblin Brute", shape: 'humanoid', color: '#cb835f', hp: 1.5, atk: 1.1, def: 1.5, spd: 9 },
  mimic: { name: "Cellar Mimic", shape: 'blob', color: '#c58156', hp: 1.6, atk: 1.2, def: 3, spd: 8 },
  ratarcher: { name: "Ratkin Archer", shape: 'humanoid', color: '#cb8163', hp: 0.7, atk: 1.1, def: 0.8, spd: 13 },
  ratshaman: { name: "Rat Shaman", shape: 'humanoid', color: '#947c63', hp: 0.8, atk: 1.2, def: 0.8, spd: 11, magic: true },
  direrat: { name: "Dire Rat", shape: 'rat', color: '#976663', hp: 1.2, atk: 1.05, def: 1, spd: 14 },
  ratknight: { name: "Ratkin Knight", shape: 'humanoid', color: '#9f5f63', hp: 1.4, atk: 1.1, def: 3, spd: 9 },
  ratogre: { name: "Rat Ogre", shape: 'humanoid', color: '#ba7555', hp: 2, atk: 1.15, def: 1.5, spd: 8 },
  sporeling: { name: "Sporeling", shape: 'mushroom', color: '#b14b45', hp: 0.6, atk: 0.7, def: 0.6, spd: 10, poison: 0.2 },
  glowworm: { name: "Glow Worm", shape: 'eel', color: '#9882fc', hp: 0.9, atk: 0.65, def: 0.8, spd: 8 },
  shrieker: { name: "Shrieker", shape: 'mushroom', color: '#bf8b5d', hp: 1, atk: 0.85, def: 1, spd: 7, magic: true },
  mosswidow: { name: "Moss Widow", shape: 'spider', color: '#979548', hp: 1.1, atk: 1.15, def: 1, spd: 14, poison: 0.35 },
  mycolord: { name: "Myconid Elder", shape: 'mushroom', color: '#b1524c', hp: 1.5, atk: 1.05, def: 1.2, spd: 8, magic: true, poison: 0.3 },
  fungalhulk: { name: "Fungal Hulk", shape: 'golem', color: '#cd896d', hp: 2, atk: 1.1, def: 2, spd: 6, poison: 0.3 },
  jelly: { name: "Drift Jelly", shape: 'ghost', color: '#77a2c7', hp: 0.7, atk: 0.85, def: 0.5, spd: 9, poison: 0.3, magic: true },
  gpirate: { name: "Ghost Pirate", shape: 'ghost', color: '#55a3bf', hp: 0.9, atk: 1.1, def: 0.5, spd: 12, undead: true, magic: true, dodge: 15 },
  fishman: { name: "Fishfolk Raider", shape: 'humanoid', color: '#8f8078', hp: 1.1, atk: 1.1, def: 1.2, spd: 11 },
  squid: { name: "Hall Squid", shape: 'eel', color: '#39385a', hp: 1.2, atk: 1.1, def: 1, spd: 10 },
  captain: { name: "Drowned Captain", shape: 'skeleton', color: '#776169', hp: 1.5, atk: 1.2, def: 2.5, spd: 10, undead: true },
  tentacle: { name: "Kraken Arm", shape: 'eel', color: '#968c92', hp: 1.9, atk: 1.15, def: 1.5, spd: 9 },
  crawler: { name: "Bone Crawler", shape: 'skeleton', color: '#be8e72', hp: 0.6, atk: 0.8, def: 1, spd: 9, undead: true },
  zombie: { name: "Zombie", shape: 'humanoid', color: '#7c9044', hp: 1.2, atk: 0.75, def: 0.8, spd: 6, undead: true },
  skelarcher: { name: "Skeleton Archer", shape: 'skeleton', color: '#52495f', hp: 0.8, atk: 1.2, def: 1.2, spd: 11, undead: true },
  bonedog: { name: "Bone Hound", shape: 'beast', color: '#cebda9', hp: 0.9, atk: 1.15, def: 1.2, spd: 15, undead: true },
  bonepriest: { name: "Bone Priest", shape: 'skeleton', color: '#8f686f', hp: 1.1, atk: 1.35, def: 1, spd: 10, undead: true, magic: true },
  graveknight: { name: "Grave Knight", shape: 'knight', color: '#717059', hp: 1.5, atk: 1.25, def: 4, spd: 9, undead: true },
  abom: { name: "Flesh Abomination", shape: 'golem', color: '#d38472', hp: 2.2, atk: 1.1, def: 1.5, spd: 6, undead: true },
  ember: { name: "Living Ember", shape: 'ghost', color: '#f05f55', hp: 0.6, atk: 0.85, def: 0.6, spd: 13, magic: true },
  salamander: { name: "Fire Salamander", shape: 'beast', color: '#f06b41', hp: 1, atk: 1, def: 1, spd: 12 },
  forgethrall: { name: "Forge Thrall", shape: 'humanoid', color: '#a96f5e', hp: 1.1, atk: 1.05, def: 2, spd: 8 },
  hellhound: { name: "Hellhound", shape: 'beast', color: '#ee5c2c', hp: 1.1, atk: 1.3, def: 1, spd: 16 },
  efreet: { name: "Efreet", shape: 'ghost', color: '#f88837', hp: 1.6, atk: 1.3, def: 1.5, spd: 11, magic: true },
  firedrake: { name: "Fire Drake", shape: 'flyer', color: '#f8822d', hp: 1.7, atk: 1.35, def: 2, spd: 13 },
  snowsprite: { name: "Snow Sprite", shape: 'ghost', color: '#94d7e8', hp: 0.55, atk: 0.9, def: 0.5, spd: 14, magic: true },
  icebat: { name: "Frost Bat", shape: 'flyer', color: '#518297', hp: 0.7, atk: 0.9, def: 0.8, spd: 17, dodge: 15 },
  frostgoblin: { name: "Frost Goblin", shape: 'humanoid', color: '#627f92', hp: 0.9, atk: 1, def: 1, spd: 11 },
  winteralpha: { name: "Winter Alpha", shape: 'beast', color: '#707489', hp: 1.2, atk: 1.25, def: 1.2, spd: 16 },
  icegolem: { name: "Ice Golem", shape: 'golem', color: '#4b94b6', hp: 1.6, atk: 1.05, def: 3.5, spd: 5 },
  icetroll: { name: "Ice Troll", shape: 'yeti', color: '#5e90a3', hp: 1.8, atk: 1.15, def: 1.5, spd: 7 },
  frostgiant: { name: "Frost Giant", shape: 'yeti', color: '#5ba9c4', hp: 2.1, atk: 1.25, def: 2, spd: 7 },
  portrait: { name: "Haunted Portrait", shape: 'ghost', color: '#e3af5f', hp: 0.8, atk: 1, def: 1, spd: 10, magic: true, dodge: 10 },
  shadowcat: { name: "Shadow Cat", shape: 'beast', color: '#847785', hp: 0.8, atk: 1.1, def: 0.8, spd: 18, dodge: 25 },
  doppel: { name: "Doppelganger", shape: 'humanoid', color: '#535063', hp: 1.1, atk: 1.15, def: 1, spd: 13, dodge: 15 },
  animarmor: { name: "Animated Armor", shape: 'knight', color: '#64677c', hp: 1.3, atk: 1.05, def: 5, spd: 7 },
  nightmare: { name: "Nightmare", shape: 'beast', color: '#a56090', hp: 1.6, atk: 1.2, def: 1.5, spd: 16, magic: true },
  umbral: { name: "Umbral Fiend", shape: 'ghost', color: '#74697a', hp: 1.7, atk: 1.3, def: 1, spd: 13, magic: true, dodge: 20 },
  thornsprite: { name: "Thorn Sprite", shape: 'flyer', color: '#c04f40', hp: 0.55, atk: 0.9, def: 0.8, spd: 15 },
  gardener: { name: "Mad Gardener", shape: 'humanoid', color: '#d0956a', hp: 1, atk: 0.95, def: 1, spd: 10 },
  bloodbloom: { name: "Blood Bloom", shape: 'plant', color: '#bd515b', hp: 1.1, atk: 1, def: 1.5, spd: 6, ls: 0.4 },
  bloodhound: { name: "Blood Hound", shape: 'beast', color: '#af4a42', hp: 1, atk: 1.15, def: 1, spd: 16, ls: 0.3 },
  thornmaiden: { name: "Thorn Maiden", shape: 'humanoid', color: '#b55c62', hp: 1.3, atk: 1.2, def: 1.5, spd: 10, magic: true, poison: 0.25 },
  vinegolem: { name: "Vine Golem", shape: 'golem', color: '#da5d7c', hp: 2, atk: 1.1, def: 2.5, spd: 5 },
  voidmite: { name: "Void Mite", shape: 'spider', color: '#623e93', hp: 0.6, atk: 0.85, def: 0.8, spd: 15 },
  voidwisp: { name: "Void Wisp", shape: 'ghost', color: '#8a2495', hp: 0.7, atk: 0.95, def: 0.5, spd: 13, magic: true, dodge: 15 },
  abysspriest: { name: "Abyss Priest", shape: 'humanoid', color: '#514d6b', hp: 1, atk: 1.25, def: 0.8, spd: 10, magic: true },
  voidhound: { name: "Void Hound", shape: 'beast', color: '#51376a', hp: 1.2, atk: 1.2, def: 1, spd: 16 },
  horror: { name: "Tentacled Horror", shape: 'blob', color: '#9c61ba', hp: 1.9, atk: 1.2, def: 1.5, spd: 8, magic: true },
  abysslord: { name: "Abyss Lord", shape: 'knight', color: '#a85474', hp: 2.1, atk: 1.35, def: 4, spd: 9, magic: true },
  gobarcher: { name: "Goblin Archer", shape: 'humanoid', color: '#a99353', hp: 0.7, atk: 1.1, def: 0.8, spd: 13 },
  gobrider: { name: "Goblin Wolf Rider", shape: 'beast', color: '#756856', hp: 1.2, atk: 1.15, def: 1.2, spd: 16 },
  gobchief: { name: "Goblin Warchief", shape: 'humanoid', color: '#a1634d', hp: 1.7, atk: 1.2, def: 3, spd: 10 },
  pickpocket: { name: "Pickpocket", shape: 'humanoid', color: '#7c7374', hp: 0.65, atk: 0.9, def: 0.7, spd: 16, dodge: 20 },
  warhound: { name: "Guard Dog", shape: 'beast', color: '#a96b3c', hp: 0.9, atk: 1, def: 1, spd: 16 },
  banditarcher: { name: "Bandit Archer", shape: 'humanoid', color: '#968b51', hp: 0.8, atk: 1.15, def: 1, spd: 12 },
  banditmage: { name: "Hedge Mage", shape: 'humanoid', color: '#b47953', hp: 0.8, atk: 1.3, def: 0.7, spd: 10, magic: true },
  thug: { name: "Bandit Thug", shape: 'humanoid', color: '#d0886f', hp: 1.4, atk: 0.95, def: 1.2, spd: 9 },
  mercenary: { name: "Mercenary", shape: 'knight', color: '#845c4c', hp: 1.4, atk: 1.15, def: 3, spd: 10 },
  banditlord: { name: "Bandit Lord", shape: 'humanoid', color: '#a0453c', hp: 1.7, atk: 1.25, def: 2, spd: 13 },
  siren: { name: "Siren", shape: 'ghost', color: '#578fa8', hp: 1, atk: 1.1, def: 0.8, spd: 12, magic: true, dodge: 15 },
  tidecaller: { name: "Naga Tidecaller", shape: 'eel', color: '#978c7c', hp: 1.3, atk: 1.2, def: 1.5, spd: 11, magic: true },
  coralgolem: { name: "Coral Golem", shape: 'golem', color: '#d47478', hp: 1.9, atk: 1.1, def: 3.5, spd: 5 },
  scarab: { name: "Scarab Swarm", shape: 'beast', color: '#f1bb63', hp: 0.6, atk: 0.8, def: 1, spd: 13 },
  cobra: { name: "Giant Cobra", shape: 'eel', color: '#a19a5e', hp: 0.9, atk: 1.1, def: 1, spd: 14, poison: 0.35 },
  dustdevil: { name: "Dust Devil", shape: 'ghost', color: '#bb5f51', hp: 0.9, atk: 1, def: 0.5, spd: 14, magic: true, dodge: 20 },
  jackal: { name: "Jackal Warrior", shape: 'humanoid', color: '#a97d61', hp: 1.2, atk: 1.15, def: 1.5, spd: 13 },
  tombguard: { name: "Tomb Guardian", shape: 'golem', color: '#b6997b', hp: 1.8, atk: 1.1, def: 4, spd: 5 },
  sphinx: { name: "Sphinx", shape: 'beast', color: '#dda774', hp: 2.1, atk: 1.3, def: 2.5, spd: 11, magic: true },
  acolyte: { name: "Cult Acolyte", shape: 'humanoid', color: '#ad5e4e', hp: 0.7, atk: 0.85, def: 0.7, spd: 10, magic: true },
  fanatic: { name: "Cult Fanatic", shape: 'humanoid', color: '#7d7a87', hp: 1, atk: 1.2, def: 0.8, spd: 13 },
  summoner: { name: "Cult Summoner", shape: 'humanoid', color: '#b6644b', hp: 0.9, atk: 1.4, def: 0.8, spd: 10, magic: true },
  bloodpriest: { name: "Blood Priest", shape: 'humanoid', color: '#c7824c', hp: 1.3, atk: 1.25, def: 1.2, spd: 10, magic: true, ls: 0.3 },
  fleshgolem: { name: "Flesh Golem", shape: 'golem', color: '#c36b61', hp: 2.1, atk: 1.05, def: 2, spd: 5 },
  demon: { name: "Horned Demon", shape: 'humanoid', color: '#eb5821', hp: 1.9, atk: 1.4, def: 2, spd: 12, magic: true },
  poltergeist: { name: "Poltergeist", shape: 'ghost', color: '#de8f5a', hp: 0.7, atk: 0.95, def: 0.5, spd: 14, magic: true, dodge: 20 },
  specter: { name: "Specter", shape: 'ghost', color: '#4c495e', hp: 1.2, atk: 1.2, def: 0.5, spd: 12, magic: true, undead: true, dodge: 15 },
  fallenpaladin: { name: "Fallen Paladin", shape: 'knight', color: '#e3b463', hp: 1.6, atk: 1.2, def: 4, spd: 9, undead: true },
  faerie: { name: "Wild Faerie", shape: 'flyer', color: '#b2c749', hp: 0.5, atk: 0.95, def: 0.5, spd: 17, magic: true, dodge: 25 },
  snail: { name: "Giant Snail", shape: 'blob', color: '#c07b65', hp: 1.1, atk: 0.65, def: 3, spd: 4 },
  boar: { name: "Wild Boar", shape: 'beast', color: '#90745d', hp: 1.1, atk: 1, def: 1.2, spd: 14 },
  ruinape: { name: "Ruin Ape", shape: 'beast', color: '#998352', hp: 1.3, atk: 1.05, def: 1.2, spd: 12 },
  ruinguardian: { name: "Ruin Guardian", shape: 'golem', color: '#8e9550', hp: 1.9, atk: 1.15, def: 4, spd: 5 },
  windsprite: { name: "Wind Sprite", shape: 'ghost', color: '#a1e1f1', hp: 0.5, atk: 0.95, def: 0.5, spd: 18, magic: true, dodge: 30 },
  stormhawk: { name: "Storm Hawk", shape: 'flyer', color: '#7c7f8d', hp: 0.8, atk: 1.1, def: 0.8, spd: 18, dodge: 15 },
  harpymatriarch: { name: "Harpy Matriarch", shape: 'flyer', color: '#c58d54', hp: 1.3, atk: 1.2, def: 1, spd: 16, dodge: 15 },
  griffon: { name: "Griffon", shape: 'flyer', color: '#d1a582', hp: 1.6, atk: 1.2, def: 1.5, spd: 16 },
  thunderbird: { name: "Thunderbird", shape: 'flyer', color: '#3e8ec1', hp: 1.7, atk: 1.3, def: 1.5, spd: 17, magic: true },
  stormelemental: { name: "Storm Elemental", shape: 'ghost', color: '#6c94ce', hp: 1.8, atk: 1.35, def: 1, spd: 14, magic: true, dodge: 15 },
  cogmite: { name: "Cog Mite", shape: 'spider', color: '#ddad5f', hp: 0.6, atk: 0.8, def: 2, spd: 14 },
  gearspider: { name: "Gear Spider", shape: 'spider', color: '#ecb862', hp: 0.8, atk: 0.95, def: 2, spd: 15 },
  turret: { name: "Arrow Turret", shape: 'golem', color: '#b07648', hp: 0.9, atk: 1.1, def: 3, spd: 8 },
  tinkerer: { name: "Mad Tinkerer", shape: 'humanoid', color: '#b9774d', hp: 0.9, atk: 1.15, def: 1.2, spd: 11 },
  automaton: { name: "Brass Automaton", shape: 'golem', color: '#d0a666', hp: 1.2, atk: 1.05, def: 3, spd: 9 },
  steamknight: { name: "Steam Knight", shape: 'knight', color: '#855c57', hp: 1.7, atk: 1.2, def: 4.5, spd: 7 },
  warengine: { name: "War Engine", shape: 'golem', color: '#b88e62', hp: 2.2, atk: 1.25, def: 5, spd: 4 },
  blackcat: { name: "Witch's Cat", shape: 'beast', color: '#a49561', hp: 0.6, atk: 0.95, def: 0.6, spd: 18, dodge: 25 },
  crow: { name: "Crow", shape: 'flyer', color: '#464765', hp: 0.6, atk: 0.9, def: 0.6, spd: 18, dodge: 15 },
  scarecrow: { name: "Scarecrow", shape: 'humanoid', color: '#cea56a', hp: 1.1, atk: 1, def: 1, spd: 9 },
  hag: { name: "Swamp Hag", shape: 'humanoid', color: '#869c44', hp: 1.2, atk: 1.3, def: 1, spd: 9, magic: true, poison: 0.3 },
  werewolf: { name: "Werewolf", shape: 'beast', color: '#554d5f', hp: 1.7, atk: 1.3, def: 1.5, spd: 15, ls: 0.2 },
  frostknight: { name: "Frost Knight", shape: 'knight', color: '#6b7991', hp: 1.5, atk: 1.2, def: 4, spd: 8, undead: true },
  frostlich: { name: "Frost Lich", shape: 'skeleton', color: '#5da4be', hp: 1.6, atk: 1.45, def: 2, spd: 10, undead: true, magic: true },
  mosquito: { name: "Giant Mosquito", shape: 'flyer', color: '#d9af66', hp: 0.5, atk: 0.9, def: 0.5, spd: 18, ls: 0.4, dodge: 20 },
  lizardscout: { name: "Lizard Skirmisher", shape: 'humanoid', color: '#aeaa54', hp: 0.8, atk: 1, def: 1, spd: 14 },
  lizardshaman: { name: "Lizard Shaman", shape: 'humanoid', color: '#cf9d5d', hp: 1, atk: 1.15, def: 1, spd: 11, magic: true },
  croc: { name: "Marsh Crocodile", shape: 'beast', color: '#d0a35f', hp: 1.5, atk: 1.15, def: 2.5, spd: 9 },
  bogbeast: { name: "Bog Beast", shape: 'golem', color: '#c28855', hp: 2, atk: 1.1, def: 2, spd: 6, poison: 0.25 },
  hydra: { name: "Marsh Hydra", shape: 'beast', color: '#b7ad58', hp: 2.2, atk: 1.25, def: 2, spd: 9, poison: 0.25 },
  thrall: { name: "Vampire Thrall", shape: 'humanoid', color: '#7b6067', hp: 1, atk: 0.95, def: 1, spd: 12, ls: 0.3 },
  vampknight: { name: "Vampire Knight", shape: 'knight', color: '#9c3f3b', hp: 1.6, atk: 1.25, def: 4, spd: 10, ls: 0.3 },
  vampirelord: { name: "Vampire Lord", shape: 'humanoid', color: '#ad5c53', hp: 1.9, atk: 1.4, def: 2.5, spd: 13, ls: 0.4, magic: true },
  ogrewhelp: { name: "Ogre Whelp", shape: 'humanoid', color: '#9bad4a', hp: 1.3, atk: 0.9, def: 1.2, spd: 8 },
  ogremage: { name: "Ogre Mage", shape: 'humanoid', color: '#968a75', hp: 1.7, atk: 1.2, def: 1.5, spd: 9, magic: true },
  troll: { name: "Cave Troll", shape: 'yeti', color: '#6b773f', hp: 1.9, atk: 1.15, def: 1.5, spd: 7, ls: 0.2 },
  ettin: { name: "Ettin", shape: 'humanoid', color: '#8d594a', hp: 2.3, atk: 1.25, def: 2, spd: 6 },
  spiderling: { name: "Spiderling", shape: 'spider', color: '#d58f7c', hp: 0.5, atk: 0.7, def: 0.5, spd: 16, poison: 0.2 },
  leaper: { name: "Leaping Spider", shape: 'spider', color: '#e3a556', hp: 0.7, atk: 1.1, def: 0.8, spd: 18, dodge: 15 },
  webweaver: { name: "Web Weaver", shape: 'spider', color: '#6b87a2', hp: 1, atk: 1, def: 1, spd: 13, magic: true, poison: 0.25 },
  phasespider: { name: "Phase Spider", shape: 'spider', color: '#4173c0', hp: 1, atk: 1.25, def: 1, spd: 16, dodge: 30 },
  drider: { name: "Drider", shape: 'spider', color: '#8a6764', hp: 1.6, atk: 1.25, def: 2, spd: 13, poison: 0.3 },
  broodmother: { name: "Brood Mother", shape: 'spider', color: '#b06869', hp: 2.2, atk: 1.2, def: 2, spd: 9, poison: 0.4 },
  bellringer: { name: "Bell-Ringer", shape: 'humanoid', color: '#825043', hp: 1.3, atk: 1, def: 1.2, spd: 9 },
  bellwraith: { name: "Bell Wraith", shape: 'ghost', color: '#928f95', hp: 1.1, atk: 1.25, def: 0.5, spd: 12, magic: true, undead: true, dodge: 15 },
  belfryfiend: { name: "Belfry Fiend", shape: 'flyer', color: '#d87e68', hp: 1.8, atk: 1.3, def: 3, spd: 13 },
  firebeetle: { name: "Fire Beetle", shape: 'beast', color: '#e8a145', hp: 0.8, atk: 0.9, def: 2, spd: 10 },
  lavaworm: { name: "Lava Worm", shape: 'eel', color: '#ce3745', hp: 1.3, atk: 1.1, def: 2, spd: 8 },
  lavagolem: { name: "Lava Golem", shape: 'golem', color: '#c36552', hp: 2, atk: 1.2, def: 3.5, spd: 5 },
  shardbat: { name: "Crystal Bat", shape: 'flyer', color: '#3cb1b2', hp: 0.7, atk: 0.95, def: 1.5, spd: 17, dodge: 15 },
  gemcrab: { name: "Gem Crab", shape: 'turtle', color: '#9856a8', hp: 1, atk: 0.95, def: 4, spd: 7 },
  crystalspider: { name: "Crystal Spider", shape: 'spider', color: '#f477ae', hp: 1.1, atk: 1.1, def: 2.5, spd: 13 },
  crystalgolem: { name: "Crystal Golem", shape: 'golem', color: '#3299d4', hp: 1.8, atk: 1.1, def: 4, spd: 5 },
  crystalwyrm: { name: "Crystal Wyrm", shape: 'eel', color: '#5a96a6', hp: 2, atk: 1.3, def: 3, spd: 11, magic: true },
  vulture: { name: "Carrion Vulture", shape: 'flyer', color: '#916159', hp: 0.8, atk: 0.9, def: 0.8, spd: 16 },
  bonegolem: { name: "Bone Golem", shape: 'golem', color: '#cbad84', hp: 2.1, atk: 1.1, def: 3, spd: 5, undead: true },
  riftstalker: { name: "Rift Stalker", shape: 'humanoid', color: '#ba7fe9', hp: 1.2, atk: 1.25, def: 1, spd: 16, magic: true, dodge: 25 },
});
ENEMY_ART.push('beetle', 'gobshaman', 'moldman', 'gobbrute', 'mimic', 'ratarcher', 'ratshaman', 'direrat', 'ratknight', 'ratogre', 'sporeling', 'glowworm', 'shrieker', 'mosswidow', 'mycolord', 'fungalhulk', 'jelly', 'gpirate', 'fishman', 'squid', 'captain', 'tentacle', 'crawler', 'zombie', 'skelarcher', 'bonedog', 'bonepriest', 'graveknight', 'abom', 'ember', 'salamander', 'forgethrall', 'hellhound', 'efreet', 'firedrake', 'snowsprite', 'icebat', 'frostgoblin', 'winteralpha', 'icegolem', 'icetroll', 'frostgiant', 'portrait', 'shadowcat', 'doppel', 'animarmor', 'nightmare', 'umbral', 'thornsprite', 'gardener', 'bloodbloom', 'bloodhound', 'thornmaiden', 'vinegolem', 'voidmite', 'voidwisp', 'abysspriest', 'voidhound', 'horror', 'abysslord', 'gobarcher', 'gobrider', 'gobchief', 'pickpocket', 'warhound', 'banditarcher', 'banditmage', 'thug', 'mercenary', 'banditlord', 'siren', 'tidecaller', 'coralgolem', 'scarab', 'cobra', 'dustdevil', 'jackal', 'tombguard', 'sphinx', 'acolyte', 'fanatic', 'summoner', 'bloodpriest', 'fleshgolem', 'demon', 'poltergeist', 'specter', 'fallenpaladin', 'faerie', 'snail', 'boar', 'ruinape', 'ruinguardian', 'windsprite', 'stormhawk', 'harpymatriarch', 'griffon', 'thunderbird', 'stormelemental', 'cogmite', 'gearspider', 'turret', 'tinkerer', 'automaton', 'steamknight', 'warengine', 'blackcat', 'crow', 'scarecrow', 'hag', 'werewolf', 'frostknight', 'frostlich', 'mosquito', 'lizardscout', 'lizardshaman', 'croc', 'bogbeast', 'hydra', 'thrall', 'vampknight', 'vampirelord', 'ogrewhelp', 'ogremage', 'troll', 'ettin', 'spiderling', 'leaper', 'webweaver', 'phasespider', 'drider', 'broodmother', 'bellringer', 'bellwraith', 'belfryfiend', 'firebeetle', 'lavaworm', 'lavagolem', 'shardbat', 'gemcrab', 'crystalspider', 'crystalgolem', 'crystalwyrm', 'vulture', 'bonegolem', 'riftstalker');
// each place's ten kinds of enemy; daily.js uses these for its LOCATIONS
export const PLACE_ENEMIES = {
  "Mossy Cellars": ['rat', 'beetle', 'wrat', 'spider', 'slime', 'goblin', 'gobshaman', 'moldman', 'gobbrute', 'mimic'],
  "Rat Warrens": ['prat', 'wrat', 'rat', 'beetle', 'ratarcher', 'ratshaman', 'direrat', 'brute', 'ratknight', 'ratogre'],
  "Fungal Grotto": ['sporeling', 'puff', 'glowworm', 'spider', 'beetle', 'shrieker', 'myconid', 'mosswidow', 'mycolord', 'fungalhulk'],
  "Drowned Halls": ['jelly', 'eel', 'crab', 'gpirate', 'sailor', 'shell', 'fishman', 'squid', 'captain', 'tentacle'],
  "Bone Crypt": ['crawler', 'wraith', 'zombie', 'skeleton', 'skelarcher', 'bonedog', 'ghoul', 'bonepriest', 'graveknight', 'abom'],
  "Ember Forges": ['ember', 'kobold', 'imp', 'salamander', 'forgethrall', 'magma', 'hellhound', 'fgolem', 'efreet', 'firedrake'],
  "Frost Hollows": ['snowsprite', 'icebat', 'frostgoblin', 'fwraith', 'wolf', 'winteralpha', 'icegolem', 'icetroll', 'yeti', 'frostgiant'],
  "Shadow Gallery": ['gbat', 'spider', 'portrait', 'shadowcat', 'shade', 'doppel', 'animarmor', 'stalker', 'nightmare', 'umbral'],
  "Blood Gardens": ['thornsprite', 'bbat', 'gardener', 'bloodbloom', 'bloodhound', 'creeper', 'vampire', 'thornmaiden', 'rknight', 'vinegolem'],
  "The Abyssal Throne": ['voidmite', 'voidwisp', 'shade', 'watcher', 'vspawn', 'abysspriest', 'voidhound', 'aknight', 'horror', 'abysslord'],
  "Goblin Tunnels": ['rat', 'kobold', 'beetle', 'gobarcher', 'goblin', 'toad', 'gobshaman', 'gobrider', 'gobbrute', 'gobchief'],
  "Bandit Hideout": ['rat', 'pickpocket', 'kobold', 'warhound', 'banditarcher', 'bandit', 'banditmage', 'thug', 'mercenary', 'banditlord'],
  "Sunken Temple": ['jelly', 'eel', 'crab', 'serpent', 'siren', 'fishman', 'naga', 'squid', 'tidecaller', 'coralgolem'],
  "Sandstone Tombs": ['scarab', 'skeleton', 'dustdevil', 'cobra', 'scorpion', 'jackal', 'mummy', 'sandworm', 'tombguard', 'sphinx'],
  "Cultist Sanctum": ['acolyte', 'imp', 'cultist', 'shade', 'fanatic', 'summoner', 'hellhound', 'bloodpriest', 'fleshgolem', 'demon'],
  "Haunted Chapel": ['crawler', 'poltergeist', 'wraith', 'portrait', 'zombie', 'skeleton', 'banshee', 'animarmor', 'specter', 'fallenpaladin'],
  "Overgrown Ruins": ['faerie', 'thornsprite', 'snail', 'toad', 'boar', 'creeper', 'ruinape', 'treant', 'vinegolem', 'ruinguardian'],
  "Windswept Galleries": ['windsprite', 'wisp', 'gbat', 'harpy', 'stormhawk', 'gargoyle', 'harpymatriarch', 'griffon', 'thunderbird', 'stormelemental'],
  "Clockwork Vault": ['cogmite', 'gearspider', 'turret', 'tinkerer', 'automaton', 'gargoyle', 'clockwork', 'fgolem', 'steamknight', 'warengine'],
  "Witchwood Hollow": ['faerie', 'crow', 'blackcat', 'wisp', 'snail', 'toad', 'scarecrow', 'creeper', 'hag', 'werewolf'],
  "Frozen Catacombs": ['crawler', 'icebat', 'zombie', 'fspider', 'skeleton', 'skelarcher', 'fwraith', 'icegolem', 'frostknight', 'frostlich'],
  "Lizardfolk Marsh": ['mosquito', 'snail', 'lizardscout', 'serpent', 'toad', 'lizardshaman', 'lizardman', 'croc', 'bogbeast', 'hydra'],
  "Vampire's Crypt": ['gbat', 'bbat', 'zombie', 'thrall', 'bloodhound', 'ghoul', 'vampire', 'gargoyle', 'vampknight', 'vampirelord'],
  "Ogre Den": ['kobold', 'gobarcher', 'warhound', 'goblin', 'ogrewhelp', 'gobbrute', 'ogremage', 'troll', 'ogre', 'ettin'],
  "Spider Nest": ['spiderling', 'spider', 'leaper', 'fspider', 'webweaver', 'mosswidow', 'phasespider', 'stalker', 'drider', 'broodmother'],
  "Bell Tower": ['crow', 'gbat', 'harpy', 'bbat', 'stormhawk', 'bellringer', 'bellwraith', 'gargoyle', 'clockwork', 'belfryfiend'],
  "Ember Caves": ['ember', 'firebeetle', 'kobold', 'imp', 'salamander', 'magma', 'lavaworm', 'hellhound', 'lavagolem', 'firedrake'],
  "Crystal Grotto": ['puff', 'sporeling', 'glowworm', 'wisp', 'shardbat', 'gemcrab', 'myconid', 'crystalspider', 'crystalgolem', 'crystalwyrm'],
  "Bone Pits": ['rat', 'crawler', 'vulture', 'zombie', 'skeleton', 'skelarcher', 'bonedog', 'ghoul', 'abom', 'bonegolem'],
  "Void Breach": ['voidmite', 'voidwisp', 'banshee', 'watcher', 'vspawn', 'riftstalker', 'voidhound', 'aknight', 'horror', 'abysslord'],
};

// per-place evening out (tools/place-tune.mjs writes this): power on floors 1-4, deep below them, reward for floors 1-4
export const PLACE_TUNING = {
  "Mossy Cellars": { power: 1.5, deep: 0.95, reward: 50, deepPay: 0.96 },   // rolls 2-4 floors 1-4 82%, floor 6 25% (real summons)
  "Rat Warrens": { power: 0.95, deep: 0.86, reward: 65, deepPay: 1.05 },   // rolls 2-4 floors 1-4 74%, floor 6 19% (real summons)
  "Fungal Grotto": { power: 1.07, deep: 0.97, reward: 55, deepPay: 1.06 },   // rolls 2-4 floors 1-4 80%, floor 6 27% (real summons)
  "Drowned Halls": { power: 0.99, deep: 1.06, reward: 65, deepPay: 0.96 },   // rolls 2-4 floors 1-4 73%, floor 6 29% (real summons)
  "Bone Crypt": { power: 1, deep: 0.99, reward: 60, deepPay: 1.0 },   // rolls 2-4 floors 1-4 79%, floor 6 31% (real summons)
  "Ember Forges": { power: 1, deep: 0.98, reward: 60, deepPay: 1.11 },   // rolls 2-4 floors 1-4 74%, floor 6 26% (real summons)
  "Frost Hollows": { power: 1.02, deep: 0.93, reward: 55, deepPay: 1.05 },   // rolls 2-4 floors 1-4 77%, floor 6 20% (real summons)
  "Shadow Gallery": { power: 0.91, deep: 1, reward: 65, deepPay: 1.05 },   // rolls 2-4 floors 1-4 70%, floor 6 28% (real summons)
  "Blood Gardens": { power: 0.98, deep: 0.91, reward: 60, deepPay: 1.05 },   // rolls 2-4 floors 1-4 77%, floor 6 24% (real summons)
  "The Abyssal Throne": { power: 0.93, deep: 0.93, reward: 60, deepPay: 1.12 },   // rolls 2-4 floors 1-4 72%, floor 6 24% (real summons)
  "Goblin Tunnels": { power: 1.05, deep: 1.02, reward: 55, deepPay: 0.96 },   // rolls 2-4 floors 1-4 81%, floor 6 29% (real summons)
  "Bandit Hideout": { power: 1, deep: 1.04, reward: 60, deepPay: 1.02 },   // rolls 2-4 floors 1-4 76%, floor 6 29% (real summons)
  "Sunken Temple": { power: 0.94, deep: 1.07, reward: 65, deepPay: 1.06 },   // rolls 2-4 floors 1-4 74%, floor 6 29% (real summons)
  "Sandstone Tombs": { power: 0.97, deep: 0.97, reward: 65, deepPay: 1.06 },   // rolls 2-4 floors 1-4 76%, floor 6 25% (real summons)
  "Cultist Sanctum": { power: 0.99, deep: 0.96, reward: 65, deepPay: 1.06 },   // rolls 2-4 floors 1-4 76%, floor 6 23% (real summons)
  "Haunted Chapel": { power: 1.07, deep: 0.98, reward: 60, deepPay: 1.01 },   // rolls 2-4 floors 1-4 80%, floor 6 26% (real summons)
  "Overgrown Ruins": { power: 0.95, deep: 0.98, reward: 55, deepPay: 0.99 },   // rolls 2-4 floors 1-4 73%, floor 6 26% (real summons)
  "Windswept Galleries": { power: 0.99, deep: 0.87, reward: 55, deepPay: 1.1 },   // rolls 2-4 floors 1-4 75%, floor 6 22% (real summons)
  "Clockwork Vault": { power: 1.04, deep: 0.86, reward: 60, deepPay: 1.04 },   // rolls 2-4 floors 1-4 81%, floor 6 21% (real summons)
  "Witchwood Hollow": { power: 0.97, deep: 1.02, reward: 65, deepPay: 1.05 },   // rolls 2-4 floors 1-4 75%, floor 6 27% (real summons)
  "Frozen Catacombs": { power: 1.04, deep: 1.01, reward: 55, deepPay: 1.0 },   // rolls 2-4 floors 1-4 82%, floor 6 28% (real summons)
  "Lizardfolk Marsh": { power: 0.94, deep: 0.97, reward: 65, deepPay: 1.12 },   // rolls 2-4 floors 1-4 71%, floor 6 27% (real summons)
  "Vampire's Crypt": { power: 0.92, deep: 0.99, reward: 55, deepPay: 0.98 },   // rolls 2-4 floors 1-4 71%, floor 6 24% (real summons)
  "Ogre Den": { power: 1.02, deep: 0.94, reward: 55, deepPay: 0.99 },   // rolls 2-4 floors 1-4 76%, floor 6 22% (real summons)
  "Spider Nest": { power: 0.85, deep: 0.97, reward: 60, deepPay: 1.08 },   // rolls 2-4 floors 1-4 66%, floor 6 24% (real summons)
  "Bell Tower": { power: 1.01, deep: 0.94, reward: 60, deepPay: 1.08 },   // rolls 2-4 floors 1-4 80%, floor 6 25% (real summons)
  "Ember Caves": { power: 1.15, deep: 0.95, reward: 55, deepPay: 1.08 },   // rolls 2-4 floors 1-4 82%, floor 6 22% (real summons)
  "Crystal Grotto": { power: 1.07, deep: 0.94, reward: 55, deepPay: 1.02 },   // rolls 2-4 floors 1-4 81%, floor 6 25% (real summons)
  "Bone Pits": { power: 1.15, deep: 0.97, reward: 55, deepPay: 0.93 },   // rolls 2-4 floors 1-4 85%, floor 6 26% (real summons)
  "Void Breach": { power: 0.95, deep: 0.83, reward: 60, deepPay: 1.17 },   // rolls 2-4 floors 1-4 74%, floor 6 22% (real summons)
};
