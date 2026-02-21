export const KEYS = {
  UP: "UP",
  DOWN: "DOWN",
  LEFT: "LEFT",
  RIGHT: "RIGHT",
  ESC: 0x1b,
  BACKSPACE: 0x7f,
  CR: 0x0d,
  NEW_LINE: 0x0a,
  NAK: 0x15,
  d: 0x64,
  h: 0x68,
  i: 0x69,
  j: 0x6a,
  k: 0x6b,
  l: 0x6c,
  u: 0x75,
  ":": 0x3a,
  "[": 0x5b,
  A: 0x41,
  B: 0x42,
  C: 0x43,
  D: 0x44,
  0: 0x30,
  $: 0x24,
};

export const MODES = {
  NORMAL: "-- NORMAL --",
  INSERT: "-- INSERT --",
  CLI: "-- COMMAND LINE --",
};

export const compassNavigationKey = {
  [KEYS.A]: KEYS.UP,
  [KEYS.B]: KEYS.DOWN,
  [KEYS.C]: KEYS.RIGHT,
  [KEYS.D]: KEYS.LEFT,
};

export const quitOptions = {
  ":qa!": () => ({ shouldReturn: true, shouldWrite: false }),
  ":qa": () => ({ shouldReturn: true, shouldWrite: false }),
  ":q": () => ({ shouldReturn: true, shouldWrite: false }),
  ":wq!": (bytes) => ({
    shouldReturn: true,
    shouldWrite: true,
    data: bytes,
  }),
  ":wq": (bytes) => ({
    shouldReturn: true,
    shouldWrite: true,
    data: bytes,
  }),
};

export const arrowKeyCursorMovement = {
  [KEYS.LEFT]: "moveLeft",
  [KEYS.RIGHT]: "moveRight",
  [KEYS.UP]: "moveUp",
  [KEYS.DOWN]: "moveDown",
};

export const normalModeCursorMovement = {
  [KEYS.h]: "moveLeft",
  [KEYS.l]: "moveRight",
  [KEYS.j]: "moveDown",
  [KEYS.k]: "moveUp",
  [KEYS["0"]]: "moveToFirst",
  [KEYS.$]: "moveToLast",
};
