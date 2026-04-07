// Genere par build_spritesheets.py v3
// Colle dans pvp.html a la place de CLASS_SPRITES
const CLASS_SPRITES = {
  bloody_alchemist: {
    idle: { file:'bloody_alchemist/Idle.png', frames:18, fw:256, fps:7 },
    run: { file:'bloody_alchemist/Run.png', frames:12, fw:256, fps:13 },
    attack1: { file:'bloody_alchemist/Slashing.png', frames:12, fw:256, fps:10 },
    attack2: { file:'bloody_alchemist/Run_Slashing.png', frames:12, fw:256, fps:10 },
    hurt: { file:'bloody_alchemist/Hurt.png', frames:12, fw:256, fps:10 },
    dead: { file:'bloody_alchemist/Dead.png', frames:15, fw:256, fps:7 },
    walk: { file:'bloody_alchemist/Walk.png', frames:24, fw:256, fps:10 },
  },
  dark_oracle: {
    idle: { file:'dark_oracle/Idle.png', frames:18, fw:256, fps:7 },
    run: { file:'dark_oracle/Run.png', frames:12, fw:256, fps:13 },
    attack1: { file:'dark_oracle/Slashing.png', frames:12, fw:256, fps:10 },
    attack2: { file:'dark_oracle/Run_Slashing.png', frames:12, fw:256, fps:10 },
    hurt: { file:'dark_oracle/Hurt.png', frames:12, fw:256, fps:10 },
    dead: { file:'dark_oracle/Dead.png', frames:15, fw:256, fps:7 },
    walk: { file:'dark_oracle/Walk.png', frames:24, fw:256, fps:10 },
  },
  fallen_angels: {
    idle: { file:'fallen_angels/Idle.png', frames:18, fw:256, fps:7 },
    run: { file:'fallen_angels/Run.png', frames:12, fw:256, fps:13 },
    attack1: { file:'fallen_angels/Slashing.png', frames:12, fw:256, fps:10 },
    attack2: { file:'fallen_angels/Run_Slashing.png', frames:12, fw:256, fps:10 },
    hurt: { file:'fallen_angels/Hurt.png', frames:12, fw:256, fps:10 },
    dead: { file:'fallen_angels/Dead.png', frames:15, fw:256, fps:7 },
    walk: { file:'fallen_angels/Walk.png', frames:24, fw:256, fps:10 },
  },
  forest_ranger: {
    idle: { file:'forest_ranger/Idle.png', frames:18, fw:256, fps:7 },
    run: { file:'forest_ranger/Run.png', frames:12, fw:256, fps:13 },
    attack1: { file:'forest_ranger/Throwing.png', frames:12, fw:256, fps:10 },
    attack2: { file:'forest_ranger/Kicking.png', frames:12, fw:256, fps:10 },
    hurt: { file:'forest_ranger/Hurt.png', frames:12, fw:256, fps:10 },
    dead: { file:'forest_ranger/Dead.png', frames:15, fw:256, fps:7 },
    walk: { file:'forest_ranger/Walk.png', frames:24, fw:256, fps:10 },
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
  minotaur: {
    idle: { file:'minotaur/Idle.png', frames:18, fw:256, fps:7 },
    run: { file:'minotaur/Run.png', frames:12, fw:256, fps:13 },
    attack1: { file:'minotaur/Slashing.png', frames:12, fw:256, fps:10 },
    attack2: { file:'minotaur/Run_Slashing.png', frames:12, fw:256, fps:10 },
    hurt: { file:'minotaur/Hurt.png', frames:12, fw:256, fps:10 },
    dead: { file:'minotaur/Dead.png', frames:15, fw:256, fps:7 },
    walk: { file:'minotaur/Walk.png', frames:24, fw:256, fps:10 },
  },
  reaper_man: {
    idle: { file:'reaper_man/Idle.png', frames:18, fw:256, fps:7 },
    run: { file:'reaper_man/Run.png', frames:12, fw:256, fps:13 },
    attack1: { file:'reaper_man/Slashing.png', frames:12, fw:256, fps:10 },
    attack2: { file:'reaper_man/Run_Slashing.png', frames:12, fw:256, fps:10 },
    hurt: { file:'reaper_man/Hurt.png', frames:12, fw:256, fps:10 },
    dead: { file:'reaper_man/Dead.png', frames:15, fw:256, fps:7 },
    walk: { file:'reaper_man/Walk.png', frames:24, fw:256, fps:10 },
  },
  valkyrie: {
    idle: { file:'valkyrie/Idle.png', frames:18, fw:256, fps:7 },
    run: { file:'valkyrie/Run.png', frames:12, fw:256, fps:13 },
    attack1: { file:'valkyrie/Slashing.png', frames:12, fw:256, fps:10 },
    attack2: { file:'valkyrie/Run_Slashing.png', frames:12, fw:256, fps:10 },
    hurt: { file:'valkyrie/Hurt.png', frames:12, fw:256, fps:10 },
    dead: { file:'valkyrie/Dead.png', frames:15, fw:256, fps:7 },
    walk: { file:'valkyrie/Walk.png', frames:24, fw:256, fps:10 },
  },
};

// ══ PARAMETRES A CHANGER DANS pvp.html ══
// const SPRITE_PX   = 320;
// const SPRITE_PX_W = Math.round(SPRITE_PX * (256 + 16) / 256);
// Dans initArena  : const FRAME_W = 256, FRAME_H = 256, CANVAS_PAD = 8;
// Dans tickAndDraw: const FRAME_W = a.fw || 256;