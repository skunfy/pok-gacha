// Genere par build_spritesheets.py v3
// Colle dans pvp.html a la place de CLASS_SPRITES
const CLASS_SPRITES = {
  goblin: {
    idle: { file:'goblin/Idle.png', frames:18, fw:256, fps:7 },
    run: { file:'goblin/Run.png', frames:12, fw:256, fps:13 },
    attack1: { file:'goblin/Slashing.png', frames:12, fw:256, fps:10 },
    attack2: { file:'goblin/Run_Slashing.png', frames:12, fw:256, fps:10 },
    hurt: { file:'goblin/Hurt.png', frames:12, fw:256, fps:10 },
    dead: { file:'goblin/Dead.png', frames:15, fw:256, fps:7 },
    walk: { file:'goblin/Walk.png', frames:24, fw:256, fps:10 },
  },
  golem: {
    idle: { file:'golem/Idle.png', frames:18, fw:256, fps:7 },
    run: { file:'golem/Run.png', frames:12, fw:256, fps:13 },
    attack1: { file:'golem/Slashing.png', frames:12, fw:256, fps:10 },
    attack2: { file:'golem/Run_Slashing.png', frames:12, fw:256, fps:10 },
    hurt: { file:'golem/Hurt.png', frames:12, fw:256, fps:10 },
    dead: { file:'golem/Dead.png', frames:15, fw:256, fps:7 },
    walk: { file:'golem/Walk.png', frames:24, fw:256, fps:10 },
  },
  ogre: {
    idle: { file:'ogre/Idle.png', frames:18, fw:256, fps:7 },
    run: { file:'ogre/Run.png', frames:12, fw:256, fps:13 },
    attack1: { file:'ogre/Slashing.png', frames:12, fw:256, fps:10 },
    attack2: { file:'ogre/Run_Slashing.png', frames:12, fw:256, fps:10 },
    hurt: { file:'ogre/Hurt.png', frames:12, fw:256, fps:10 },
    dead: { file:'ogre/Dead.png', frames:15, fw:256, fps:7 },
    walk: { file:'ogre/Walk.png', frames:24, fw:256, fps:10 },
  },
  orc: {
    idle: { file:'orc/Idle.png', frames:18, fw:256, fps:7 },
    run: { file:'orc/Run.png', frames:12, fw:256, fps:13 },
    attack1: { file:'orc/Slashing.png', frames:12, fw:256, fps:10 },
    attack2: { file:'orc/Run_Slashing.png', frames:12, fw:256, fps:10 },
    hurt: { file:'orc/Hurt.png', frames:12, fw:256, fps:10 },
    dead: { file:'orc/Dead.png', frames:15, fw:256, fps:7 },
    walk: { file:'orc/Walk.png', frames:24, fw:256, fps:10 },
  },
  skeleton_warrior: {
    idle: { file:'skeleton_warrior/Idle.png', frames:18, fw:256, fps:7 },
    run: { file:'skeleton_warrior/Run.png', frames:12, fw:256, fps:13 },
    attack1: { file:'skeleton_warrior/Slashing.png', frames:12, fw:256, fps:10 },
    attack2: { file:'skeleton_warrior/Run_Slashing.png', frames:12, fw:256, fps:10 },
    hurt: { file:'skeleton_warrior/Hurt.png', frames:12, fw:256, fps:10 },
    dead: { file:'skeleton_warrior/Dead.png', frames:15, fw:256, fps:7 },
    walk: { file:'skeleton_warrior/Walk.png', frames:24, fw:256, fps:10 },
  },
  necromancer_of_the_shadow: {
    idle: { file:'necromancer_of_the_shadow/Idle.png', frames:18, fw:256, fps:7 },
    run: { file:'necromancer_of_the_shadow/Run.png', frames:12, fw:256, fps:13 },
    attack1: { file:'necromancer_of_the_shadow/Slashing.png', frames:12, fw:256, fps:10 },
    attack2: { file:'necromancer_of_the_shadow/Run_Slashing.png', frames:12, fw:256, fps:10 },
    hurt: { file:'necromancer_of_the_shadow/Hurt.png', frames:12, fw:256, fps:10 },
    dead: { file:'necromancer_of_the_shadow/Dead.png', frames:15, fw:256, fps:7 },
    walk: { file:'necromancer_of_the_shadow/Walk.png', frames:24, fw:256, fps:10 },
  },
  zombie_villager: {
    idle: { file:'zombie_villager/Idle.png', frames:18, fw:256, fps:7 },
    run: { file:'zombie_villager/Run.png', frames:12, fw:256, fps:13 },
    attack1: { file:'zombie_villager/Slashing.png', frames:12, fw:256, fps:10 },
    attack2: { file:'zombie_villager/Run_Slashing.png', frames:12, fw:256, fps:10 },
    hurt: { file:'zombie_villager/Hurt.png', frames:12, fw:256, fps:10 },
    dead: { file:'zombie_villager/Dead.png', frames:15, fw:256, fps:7 },
    walk: { file:'zombie_villager/Walk.png', frames:24, fw:256, fps:10 },
  },
};


// ══ PARAMETRES A CHANGER DANS pvp.html ══
// const SPRITE_PX   = 320;
// const SPRITE_PX_W = Math.round(SPRITE_PX * (256 + 16) / 256);
// Dans initArena  : const FRAME_W = 256, FRAME_H = 256, CANVAS_PAD = 8;
// Dans tickAndDraw: const FRAME_W = a.fw || 256;
