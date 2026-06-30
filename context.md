# Text Editor Codebase Overview

## Project Summary

**Terminal Text Editor (ted)** - A lightweight, vi-like terminal text editor built entirely in JavaScript using Deno. This project implements modal editing similar to vim, efficient text manipulation via a Piece Table data structure, and full raw terminal I/O handling without any external dependencies.

### Key Features
- **Modal Editing**: Normal Mode (navigation/manipulation), Insert Mode (typing), Command Line Mode (:wq, :quit)
- **Piece Table Storage**: O(1) append operations with efficient text management via `ds/piece_table.js`
- **Undo Support**: Full undo history through the TextBuffer class
- **File Permission Handling**: Respects read-only files and supports force writes

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ENTRY POINT & INITIALIZATION                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    ted.js ────────────────────▶ editAndPersist()                            │
│   (CLI Entry)                          │                                   │
│         │        Check permissions     ▼                                   │
│    Parse args              ┌──────────────────────┐                         │
│      Load file             │ src/bin/launch_editor│                         │
│      Handle NotFound       │       bootstrapper   │                         │
│                            └───────────┬─────────┘                         │
│                                        │                                    │
└────────────────────────────────────────┼────────────────────────────────────┘
                                         ▼
                    ┌──────────────────────────────────────────────────┐
                    │          src/core/editor.js (Main Loop)           │
                    ├──────────────────────────────────────────────────┤
                    │                                                   │
                    │  Mode State Machine:                              │
                    │    NORMAL ◄─────► INSERT                           │
                    │      ▲            ▲                                │
                    │      │            ▼                                │
                    │      └─────► CLI MODE                             │
                    │                                                   │
                    │  Input Dispatcher:                                │
                    │   readKey() → dispatch by mode & key-maps         │
                    └────────────────┬──────────────────────────────────┘
                                     │
              ┌──────────────────────┼───────────────────────┐
              ▼                      ▼                       ▼
    ┌──────────────────┐  ┌────────────────────┐ ┌────────────────────┐
    │ Domain Layer     │  │   Terminal I/O     │ │      Config        │
    ├──────────────────┤  ├────────────────────┤ ├────────────────────┴─┐
    │                  │  │                    │ │                       │
    │ text_buffer.js   │◀►│ terminal/terminal. │ │ modes.js              │
    │ ┌──────────────┐ │  │ js                 │ │ ├── NORMAL mode     │
    │ │ TextBuffer   │─│─►│ ├── readKey()      │ │ ├── INSERT mode     │
    │ ├──────────────┤ │  │ ├── write()        │ │ ├── CLI MODE        │
    │ │ · insert()   │-┴  │ └──────────────────┘ │ Key Configs:          │
    │ │ delete()     │                                    - keys.js      │
    │ │ undo()/save│                            │ ├── key-maps/       │
    │ │ [Piece Table]                              │   normal.js         │
    │ └──────▲───────┘                                  ├── arrows.js     │
    │        ▲                                        │ Commands:           │
    │        │                                    │  - :wq/:quit          │
    │ cursor.js│                                    └─────────────────────┤
    ├────────┴                                      src/config/commands/   │
    │ · pos, prevCol                            ├── quit_options.js       │
    │ · movement methods                        └──────────────────────────┘
    │  [left/right/up/down]                                          ▲
    └────────────▲───────────────────────────────────────────────────┴│
                 │                                                     │
            Cursor State                                            Key Mapping
          (row, col, visibility)                                [ESC→i/:/d/u/etc.]
                                                                 ▼
        ┌────────────────────────────────────────────────────────────────────┐
        │                     DISPLAY LAYER                                   │
        ├────────────────────────────────────────────────────────────────────┤
        │                                                                        │
        │   terminal_renderer.js                                               │
        │   ───────────────────                                                │
        │                                                                        │
        │       render(bytes, pos, mode)                                        │
        │            │                                                          │
        │         Compute cursor (row,col)                                      │
        │            │                                                            │
        │      [ANSI Escapes]                                                   │
        │   - Clear screen (\x1b[2J\x1b[H)                                     │
        │   - Place cursor (\x1b[row;colH)                                       │
        │   - Status bar display                                               │
        │                                                                        │
        └───────────────────────┬───────────────────────────────────────────────┘
                               ▼
                     Terminal Screen Display

```

## Component Breakdown

### Entry Point (`ted.js`)
- Handles CLI argument parsing for file paths
- Checks file permissions (read/write mode)
- Calls `editAndPersist()` to initialize the editor

### Bootstrap Layer (`src/bin/launch_editor.*`)
- Bootstraps the editing session
- Manages persistence when saving/quitting files

### Editor Core (`src/core/editor.js`)
**Main responsibility**: Mode state management and input dispatching

```javascript
Modes (MODES.NORMAL | INSERT | CLI):
  - NORMAL: Navigation & manipulation keys
    * Movements/jkl, $, 0
    * Deletion/dd, d$, d0
    * Undo/u
  
  - INSERT: Text insertion mode  
    * ESC exits to NORMAL
    * Raw byte input to buffer
  
  - CLI Command Line Mode (activated by :)
    *:wq (save & quit)
    :q/:qa (quit without save)
```

### Domain Layer Components

**`src/domain/text_buffer.js`**: Piece Table storage implementation with undo support. Stores text in `pieces[]`: `{source, start: number, length}`, where source is either original data or added text buffer (`#add`). Also maintains history via `_records[]`.

- **insert(position)** - Creates new pieces appended to #add space
- **delete(position, len)** - Splices out overlapping ranges in piece list  
- **save()** - Pushes snapshot for undo stack
- **undo()** - Restores previous state from records

**`src/domain/cursor.js`**: Tracks cursor position:
- `pos`: byte offset into buffer
- `prevCol`: column before last movement event (for deletion operations)
- Movement methods update both pos and prevCol based on current content boundaries. Cursor row computation happens via helper functions (`computeCursorPos`, etc.)

### Terminal Layer 

**`src/terminal/terminal.js`**: Low-level I/O abstractions:
```javascript
Terminal.write(bytes, clearPosition, move()...etc. readKey()) reads 3-byte sequences handling ANSI escape codes (ESC [+ X) → maps to navigation keys via cursorNavigationMap
```

### Configuration Layer (`src/config/{modes|keys}.*`)
- modes.js defines state labels for rendering status bar  
   - KEYS constant: ESC, CR/enter, I/i, d/u, :, etc. 
     keymap files (normal.js/arrows): Maps actual keystrokes to action names the editor understands

### Utils Layer (`src/utils/utility.js`):
- Compute cursor position from byte offset using `computeCursorPos(bytes, pos)` and navigation functions: NAKPos(prevLineFeed) are all helpers that translate between visual rows/cols versus linear buffer positions. Also provide boundary queries like prevLinefeed() nextline_feed().

### File I/O (src/fs/*):
- **read_file.js**: Loads initial file contents into TextBuffer 
   write_with_permission.js: Handles save operations respecting permissions, supporting force writes (! suffix in :wq!)

## Data Flow

1. User enters CLI command → ted.js starts execution and checks `Deno.args[0]` as target filepath
2. File check performed if exists (`stat.mode & 0o2`) read via fs/read_file() then pass to buffer constructor (empty[]) for new files  
3. Editor.run(filePath, hasWritePermission): initializes with TextBuffer containing file bytes + piece table; sets mode=NORMAL and begins infinite loop:
   
   **Loop iterations per keypress:** 
4. Render current state (clear screen → display text viewport → position cursor at pos based on rows/cols calculation)  
5. Block for input via readKey() which decodes raw stdin bytes into logical keys handling escape sequences properly

6. dispatch action: check mode+key combination against configured maps
7. If edit operation update buffer + modify piece table accordingly; track state in records[] stack (for undo capability); update internal position variables as needed viewport scrolling logic adjusts if movement goes beyond visible area
   
8. Command operations trigger transitions between NORMAL vs INSERT or CLI submodes where separate command parsing loops happen before returning back to normal flow

## Testing Structure
- Full suite available via `deno task test` covering core domain classes (Buffer/Text manipulation, Cursor interactions)  
   Tests live in [/test/test_files.ts](file:///Users/ajoy/workspace/js/text-editor/test/test-files.js), [ds/piece_table.test.js] to ensure piece table edge cases handle correctly insertion/deletion sequences.

---
This project prioritizes no external dependencies while delivering full Vi-like functionality using pure Deno std APIs across file system, terminal I/O layers and custom data structures all written in JavaScript ES modules format. 