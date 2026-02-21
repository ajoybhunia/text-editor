export const KEYS = {
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

export const cursorNavigationMap = {
  [KEYS.A]: "up",
  [KEYS.B]: "down",
  [KEYS.C]: "right",
  [KEYS.D]: "left",
};

export const arrowKeyMovementMap = {
  up: "moveUp",
  down: "moveDown",
  right: "moveRight",
  left: "moveLeft",
};

export const normalModeMovementMap = {
  [KEYS.h]: "moveLeft",
  [KEYS.l]: "moveRight",
  [KEYS.j]: "moveDown",
  [KEYS.k]: "moveUp",
  [KEYS["0"]]: "moveToFirst",
  [KEYS.$]: "moveToLast",
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
