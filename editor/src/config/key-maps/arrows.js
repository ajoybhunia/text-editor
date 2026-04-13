import { KEYS } from "../keys.js";

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

export const cliArrowKeyDelta = {
  right: 1,
  left: -1,
};
