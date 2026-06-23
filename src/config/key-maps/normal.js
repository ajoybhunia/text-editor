import { KEYS } from "../keys.js";

export const normalModeMovementMap = {
  [KEYS.h]: "moveLeft",
  [KEYS.l]: "moveRight",
  [KEYS.j]: "moveDown",
  [KEYS.k]: "moveUp",
  [KEYS["0"]]: "moveToFirst",
  [KEYS.$]: "moveToLast",
};
