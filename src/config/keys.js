export const KEYS = {
  SPACE: 0x20,
  DELETE: 0x7f,
  
  // C0 control codes
  NUL: 0x00,
  TAB: 0x09,
  NEW_LINE: 0x0a, // LF
  SOH: 0x01, // Ctrl+A (Start of Heading)
  STX: 0x02, // Ctrl+B (Start of Text)
  ETX: 0x03, // Ctrl+C (End of Text)
  EOT: 0x04, // Ctrl+D (End of Transmission)
  ENQ: 0x05, // Ctrl+E (Enquiry)
  ACK: 0x06, // Ctrl+F (Acknowledge)
  BEL: 0x07, // Ctrl+G (Bell)
  BS:  0x08, // Ctrl+H (Backspace)
  HT:  0x09, // Ctrl+I (Horizontal Tab)
  LF:  0x0A, // Ctrl+J (Line Feed)
  VT:  0x0B, // Ctrl+K (Vertical Tab)
  FF:  0x0C, // Ctrl+L (Form Feed)
  CR:  0x0D, // Ctrl+M (Carriage Return) / Enter
  SO:  0x0E, // Ctrl+N (Shift Out)
  SI:  0x0F, // Ctrl+O (Shift In)
  DLE: 0x10, // Ctrl+P (Data Link Escape)
  DC1: 0x11, // Ctrl+Q (Device Control 1 / XON)
  DC2: 0x12, // Ctrl+R (Device Control 2)
  DC3: 0x13, // Ctrl+S (Device Control 3 / XOFF)
  DC4: 0x14, // Ctrl+T (Device Control 4)
  NAK: 0x15, // Ctrl+U (Negative Acknowledge)
  SYN: 0x16, // Ctrl+V (Synchronous Idle)
  ETB: 0x17, // Ctrl+W (End of Transmission Block)
  CAN: 0x18, // Ctrl+X (Cancel)
  EM:  0x19, // Ctrl+Y (End of Medium)
  SUB: 0x1A, // Ctrl+Z (Substitute)
  ESC: 0x1B, // Ctrl+[ (Escape)
  FS:  0x1C, // Ctrl+\ (File Separator)
  GS:  0x1D, // Ctrl+] (Group Separator)
  RS:  0x1E, // Ctrl+^ (Record Separator)
  US:  0x1F, // Ctrl+_ (Unit Separator)

  // Digits
  "0": 0x30,
  "1": 0x31,
  "2": 0x32,
  "3": 0x33,
  "4": 0x34,
  "5": 0x35,
  "6": 0x36,
  "7": 0x37,
  "8": 0x38,
  "9": 0x39,

  // Uppercase letters
  A: 0x41,
  B: 0x42,
  C: 0x43,
  D: 0x44,
  E: 0x45,
  F: 0x46,
  G: 0x47,
  H: 0x48,
  I: 0x49,
  J: 0x4a,
  K: 0x4b,
  L: 0x4c,
  M: 0x4d,
  N: 0x4e,
  O: 0x4f,
  P: 0x50,
  Q: 0x51,
  R: 0x52,
  S: 0x53,
  T: 0x54,
  U: 0x55,
  V: 0x56,
  X: 0x58,
  Y: 0x59,
  Z: 0x5a,

  // Lowercase letters
  a: 0x61,
  b: 0x62,
  c: 0x63,
  d: 0x64,
  e: 0x65,
  f: 0x66,
  g: 0x67,
  h: 0x68,
  i: 0x69,
  j: 0x6a,
  k: 0x6b,
  l: 0x6c,
  m: 0x6d,
  n: 0x6e,
  o: 0x6f,
  p: 0x70,
  q: 0x71,
  r: 0x72,
  s: 0x73,
  t: 0x74,
  u: 0x75,
  v: 0x76,
  w: 0x77,
  x: 0x78,
  y: 0x79,
  z: 0x7a,

  // Symbols
  "!": 0x21,
  '"': 0x22,
  "#": 0x23,
  "$": 0x24,
  "%": 0x25,
  "&": 0x26,
  "'": 0x27,
  "(": 0x28,
  ")": 0x29,
  "*": 0x2a,
  "+": 0x2b,
  ",": 0x2c,
  "-": 0x2d,
  ".": 0x2e,
  "/": 0x2f,
  ":": 0x3a,
  ";": 0x3b,
  "<": 0x3c,
  "=": 0x3d,
  ">": 0x3e,
  "?": 0x3f,
  "@": 0x40,
  "[": 0x5b,
  "\\": 0x5c,
  "]": 0x5d,
  "^": 0x5e,
  "_": 0x5f,
  "`": 0x60,
  "{": 0x7b,
  "|": 0x7c,
  "}": 0x7d,
  "~": 0x7e,
};


/*
export const ESC_SEQUENCES = {
  ARROW_UP: "\x1b[A",
  ARROW_DOWN: "\x1b[B",
  ARROW_RIGHT: "\x1b[C",
  ARROW_LEFT: "\x1b[D",
  HOME: "\x1b[H",
  END: "\x1b[F",
  DELETE: "\x1b[3~",
  PAGE_UP: "\x1b[5~",
  PAGE_DOWN: "\x1b[6~",
};
*/
