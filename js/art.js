// Raw pixel matrices. Letters map to palette colours in sprites.js.
// Enemies: a = body, b = dark, c = light, d = accent, s = pale, e/w = white, k = near-black.
export const SHAPES = {
  blob: ['............', '............', '....aaaa....', '...accaaa...', '..acaaaaaa..', '..aaaaaaaa..', '.aaekaaekaa.', '.aaaaaaaaaa.', '.abaakkaaba.', 'abbaaaaaabba', 'abbbbbbbbbba', '.bbbbbbbbbb.'],
  beast: ['............', '............', '..a.a.......', '..aaaa......', '.aekaaaaaa..', 'kaaaaaaaaaa.', '.aaaaaaaaaab', '..aaaaaaaa.b', '..abaabaab.b', '..ab.ab.ab..', '..b..b..b...', '............'],
  rat: ['............', '............', '............', '.a.a........', '.aaaa.......', 'aekaaaaaa...', 'kaaaaaaaaa..', '.aaaaaaaaab.', '..aaaaaaa..b', '..b.b.b.b..b', '..........bb', '............'],
  humanoid: ['....aaaa....', '..aaaaaaaa..', '..aekaaeka..', '..aaaaaaaa..', '...aakkaa...', '..bbbbbbbb..', '.abbbbbbbba.', '.abbbbbbbba.', '.a.bbbbbb.a.', '...bb..bb...', '...aa..aa...', '..aaa..aaa..'],
  skeleton: ['....aaaa....', '...aaaaaa...', '...akaaka...', '...aaaaaa...', '....akka....', '.....aa.....', '..aaaaaaaa..', '..a.abba.a..', '..a..aa..a..', '....aaaa....', '....a..a....', '...aa..aa...'],
  flyer: ['............', 'a..........a', 'aa..a..a..aa', 'aaa.aaaa.aaa', 'aaaaaaaaaaaa', 'abaaekkeaaba', 'ab.aaaaaa.ba', 'b...akka...b', '.....aa.....', '............', '............', '............'],
  spider: ['............', '............', 'a..a....a..a', '.a..aaaa..a.', '..aaaaaaaa..', 'aaaekaaekaaa', '..aaaaaaaa..', '.a.abbbba.a.', 'a..a....a..a', 'a..........a', '............', '............'],
  ghost: ['....aaaa....', '...aaccaa...', '..aaaaaaaa..', '..akkaakka..', '..akkaakka..', '..aaaaaaaa..', '..aaakkaaa..', '..aaaaaaaa..', '..abaaaaba..', '..aaaaaaaa..', '..a.aa.aa.a.', '....a..a....'],
  golem: ['...bbbbbb...', '...baaaab...', '...aekeka...', '..aaaaaaaa..', 'aaaabccbaaaa', 'aaaabccbaaaa', 'aa.aaaaaa.aa', 'aa.aaaaaa.aa', 'bb.aaaaaa.bb', '...aa..aa...', '...aa..aa...', '..bbb..bbb..'],
  mushroom: ['....cccc....', '..ccaaaacc..', '.caawaaaaac.', '.aaaaaawaaa.', '.aawaaaaaaa.', '..bbbbbbbb..', '...skssks...', '...ssssss...', '...sskkss...', '...ssssss...', '..ss.ss.ss..', '............'],
  turtle: ['............', '............', '.....bbbb...', '...bbaaaabb.', '..baacaacaab', '..baaaaaaaab', 'sssbacaacaab', 'seksbbbbbbbb', 'sss.ssssss..', '....ss..ss..', '....ss..ss..', '............'],
  eel: ['............', '..aaaa......', '.aekaaa.....', '.aaaaaa.....', '..kk.aaa....', '......aaa...', '.......aaa..', '..aaa...aaa.', '.aaaaaaaaa..', '.aa.aaaaa...', '..a.........', '............'],
  imp: ['.a........a.', '.aa.aaaa.aa.', '..aaaaaaaa..', '..awkaawka..', '..aaaaaaaa..', '...akwwka...', 'b..bbbbbb..b', 'bb.abbbba.bb', '.bbabbbbabb.', '...bb..bb...', '...aa..aa..a', '..aa....aaa.'],
  yeti: ['...aaaaaa...', '..aaaaaaaa..', '..abkaakba..', '..aaaaaaaa..', '.aaawkkwaaa.', 'aaaaaaaaaaaa', 'aaacaaaacaaa', 'aaaaaaaaaaaa', 'aa.aaaaaa.aa', 'bb.aaaaaa.bb', '...aaa.aaa..', '..bbbb.bbbb.'],
  knight: ['....bbbb...c', '...baaaab..c', '...akkkka..c', '...baaaab..c', '....bddb...c', '..aaaaaaaa.c', '.aabaddabaac', '.aabaaaab.b.', '.a.baaaab...', '...ab..ba...', '...aa..aa...', '..bbb..bbb..'],
  eye: ['............', '....aaaa....', '..aaaaaaaa..', '.aawwwwwwaa.', '.awwwkkwwwa.', '.awwkddkwwa.', '.awwwkkwwwa.', '.aawwwwwwaa.', '..aaaaaaaa..', '...a.aa.a...', '..a..a...a..', '.....a......'],
  plant: ['............', '..d.....d...', '.dcd...dcd..', '..d..a..d...', '..a.aaa.a...', '..aaekeaa...', '...aaaaa....', '.a.akkka.a..', '.aa.aaa.aa..', '..aabbbaa...', '...bbbbb....', '..b.b.b.b...'],
  boss: ['...c.c.cc.c.c...', '...cccccccccc...', '...aaaaaaaaaa...', '..aaeeaaaaeeaa..', '..aaekaaaakeaa..', '..aaaaaaaaaaaa..', '..aaakakakakaa..', '...aaaaaaaaaa...', '.bbbbbbbbbbbbbb.', 'abbbbbbccbbbbbba', 'abbbbbbccbbbbbba', 'aabbbbbbbbbbbbaa', 'aa.bbbbbbbbbb.aa', '...bbbbbbbbbb...', '...bbb....bbb...', '..aaaa....aaaa..'],
};
export const SHAPE_ACCENT = { knight: '#e0c14a', eye: '#ff4a6a', plant: '#ff8fb0' };

// Item icons: m = metal, n = dark metal, w = wood, r = rarity colour, c = shine, b = cloth, y = gold.
export const ICONS = {
  sword: ['.......mc.', '......mmm.', '.....mmn..', '....mmn...', '...mmn....', '.r.mn.....', '.rrn......', '..rr......', '.w.rr.....', 'w.........'],
  axe: ['....mmm...', '...mmmcm..', '...mmwmm..', '....nwn...', '.....w....', '....w.....', '...w......', '..w.......', '.r........', 'r.........'],
  dagger: ['..........', '......mc..', '.....mmn..', '....mmn...', '...mmn....', '.r.mn.....', '..rr......', '.wrr......', 'ww..r.....', '..........'],
  staff: ['......rr..', '.....rccr.', '.....rccr.', '......rr..', '.....w....', '....w.....', '....w.....', '...w......', '..w.......', '.w........'],
  mace: ['.....mmm..', '....mcmmm.', '....mmrmm.', '....mmmmn.', '....wnnn..', '...w......', '..w.......', '.w........', 'r.........', '..........'],
  bow: ['.wwww.....', '....ww....', 'c....ww...', '.c....w...', '..c...w...', '...c..w...', '....c.ww..', '.....c.w..', '......cw..', '.......r..'],
  plate: ['..........', '.mm.rr.mm.', 'mcmmrrmmmn', 'mmmmmmmmmn', '.mcmmmmmn.', '.mmmrrmmn.', '.mmmmmmmn.', '.mmmmmmmn.', '..nnnnnn..', '..........'],
  leather: ['..........', '.ww.rr.ww.', 'wwwwrrwwww', 'wwwwwwwwww', '.wwwwwwww.', '.wwyyyyww.', '.wwwwwwww.', '.wwwwwwww.', '..wwwwww..', '..........'],
  robe: ['...rrrr...', '..bbbbbb..', '.bbbrrbbb.', 'bbbbrrbbbb', 'bb.bbbb.bb', '...bbbb...', '..bbbbbb..', '..bbbbbb..', '.bbbbbbbb.', '.rrrrrrrr.'],
  trinket: ['...yyyy...', '..y....y..', '..y....y..', '...y..y...', '....yy....', '...rrrr...', '..rccrrr..', '..rcrrrr..', '...rrrr...', '....rr....'],
};
