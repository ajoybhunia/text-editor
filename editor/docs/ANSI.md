## ANSI / ASCII Control Characters

| Name                   | Decimal | Hex  | Escape Sequence | Notes                           |
| ---------------------- | ------- | ---- | --------------- | ------------------------------- |
| NUL                    | 0       | 0x00 | `\0`            | Null byte                       |
| SOH (Start of Heading) | 1       | 0x01 | `\x01`          | Ctrl-A                          |
| STX (Start of Text)    | 2       | 0x02 | `\x02`          | Ctrl-B                          |
| ETX (End of Text)      | 3       | 0x03 | `\x03`          | Ctrl-C                          |
| EOT (End of Transmit)  | 4       | 0x04 | `\x04`          | Ctrl-D                          |
| ENQ (Enquiry)          | 5       | 0x05 | `\x05`          | Ctrl-E                          |
| ACK (Acknowledge)      | 6       | 0x06 | `\x06`          | Ctrl-F                          |
| BEL (Bell)             | 7       | 0x07 | `\a` / `\x07`   | Beep                            |
| BS (Backspace)         | 8       | 0x08 | `\b`            | Moves cursor back               |
| TAB                    | 9       | 0x09 | `\t`            | Horizontal tab                  |
| LF (Line Feed)         | 10      | 0x0A | `\n`            | New line                        |
| VT (Vertical Tab)      | 11      | 0x0B | `\v` / `\x0B`   | Vertical tab                    |
| FF (Form Feed)         | 12      | 0x0C | `\f` / `\x0C`   | Clears screen in some terminals |
| CR (Carriage Return)   | 13      | 0x0D | `\r`            | Return to beginning of line     |
| SO (Shift Out)         | 14      | 0x0E | `\x0E`          | Rarely used                     |
| SI (Shift In)          | 15      | 0x0F | `\x0F`          | Rarely used                     |
| DLE (Data Link Escape) | 16      | 0x10 | `\x10`          | Rarely used                     |
| DC1 (XON)              | 17      | 0x11 | `\x11`          | Start transmission              |
| DC2                    | 18      | 0x12 | `\x12`          | Rarely used                     |
| DC3 (XOFF)             | 19      | 0x13 | `\x13`          | Stop transmission               |
| DC4                    | 20      | 0x14 | `\x14`          | Rarely used                     |
| NAK (Negative Ack)     | 21      | 0x15 | `\x15`          | Rarely used                     |
| SYN (Synchronous Idle) | 22      | 0x16 | `\x16`          | Rarely used                     |
| ETB (End of Block)     | 23      | 0x17 | `\x17`          | Rarely used                     |
| CAN (Cancel)           | 24      | 0x18 | `\x18`          | Rarely used                     |
| EM (End of Medium)     | 25      | 0x19 | `\x19`          | Rarely used                     |
| SUB (Substitute)       | 26      | 0x1A | `\x1A`          | Ctrl-Z                          |
| ESC (Escape)           | 27      | 0x1B | `\x1B`          | Start ANSI sequences            |
| FS (File Separator)    | 28      | 0x1C | `\x1C`          | Rarely used                     |
| GS (Group Separator)   | 29      | 0x1D | `\x1D`          | Rarely used                     |
| RS (Record Separator)  | 30      | 0x1E | `\x1E`          | Rarely used                     |
| US (Unit Separator)    | 31      | 0x1F | `\x1F`          | Rarely used                     |
| SPACE                  | 32      | 0x20 | `' '`           | Printable                       |
| DEL (Delete)           | 127     | 0x7F | `\x7F`          | Backspace in some terminals     |

## Common Printable ASCII Characters

| Char  | Decimal | Hex       | Escape Sequence |
| ----- | ------- | --------- | --------------- |
| `' '` | 32      | 0x20      | `' '`           |
| `'!'` | 33      | 0x21      | `'!'`           |
| `'"'` | 34      | 0x22      | `'"'`           |
| `'#'` | 35      | 0x23      | `'#'`           |
| `$`   | 36      | 0x24      | `$`             |
| `%`   | 37      | 0x25      | `%`             |
| `&`   | 38      | 0x26      | `&`             |
| `'`   | 39      | 0x27      | `'`             |
| `(`   | 40      | 0x28      | `(`             |
| `)`   | 41      | 0x29      | `)`             |
| `*`   | 42      | 0x2A      | `*`             |
| `+`   | 43      | 0x2B      | `+`             |
| `,`   | 44      | 0x2C      | `,`             |
| `-`   | 45      | 0x2D      | `-`             |
| `.`   | 46      | 0x2E      | `.`             |
| `/`   | 47      | 0x2F      | `/`             |
| `0–9` | 48–57   | 0x30–0x39 | `'0'–'9'`       |
| `A–Z` | 65–90   | 0x41–0x5A | `'A'–'Z'`       |
| `a–z` | 97–122  | 0x61–0x7A | `'a'–'z'`       |

## ANSI Escape Sequences (for cursor, color, screen)

| Action                  | Sequence            | Notes                 |
| ----------------------- | ------------------- | --------------------- |
| Cursor Up               | `\x1b[A`            | ESC + [ + A           |
| Cursor Down             | `\x1b[B`            | ESC + [ + B           |
| Cursor Right            | `\x1b[C`            | ESC + [ + C           |
| Cursor Left             | `\x1b[D`            | ESC + [ + D           |
| Move to row,col         | `\x1b[<row>;<col>H` | e.g., `\x1b[10;5H`    |
| Clear Screen            | `\x1b[2J`           | Clears entire screen  |
| Clear Line              | `\x1b[2K`           | Clears current line   |
| Hide Cursor             | `\x1b[?25l`         | Terminal hides cursor |
| Show Cursor             | `\x1b[?25h`         | Terminal shows cursor |
| Save Cursor Position    | `\x1b[s`            | ESC + s               |
| Restore Cursor Position | `\x1b[u`            | ESC + u               |
