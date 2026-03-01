import { KEYS } from "./keys.js";

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
