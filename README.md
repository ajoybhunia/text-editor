# Terminal Text Editor (ted)

A lightweight, vi-like terminal text editor built entirely in JavaScript using
[Deno](https://deno.land/).

This project demonstrates handling raw terminal I/O, manipulating text buffers
efficiently (using a Piece Table data structure), and implementing a modal
editing experience similar to vim.

## Features

- **Modal Editing**:
  - **Normal Mode**: For navigating and manipulating text.
  - **Insert Mode**: For typing and inserting text.
  - **Command Line Mode**: For saving, quitting, and file operations.
- **Efficient Text Manipulation**: Uses a Piece Table under the hood for
  performant text insertion and deletion.
- **Undo / Redo Support**: Full undo and redo history for text changes.
- **Word Movement**: Navigate by words with `w` and `b` in Normal Mode.
- **File Mode Handling**: Respects file permissions, distinguishing between
  standard writes and force writes (e.g. for read-only files).
- **Clipboard Paste**: Paste via terminal paste shortcut (Cmd+V) in Insert Mode using bracketed paste detection, or press `p` in Normal Mode for system clipboard access (macOS/Linux/Windows).
- **Zero Dependencies**: Built solely with standard Deno APIs (`Deno.stdin`,
  `Deno.stdout`).

## Prerequisites

- [Deno](https://deno.land/) installed on your machine.

## Usage

To launch the editor and open a file, run the `ted.js` script:

```bash
./ted.js <path-to-file>
```

Alternatively, you can run it directly with Deno:

```bash
deno run --allow-read --allow-write ted.js <path-to-file>
```

_(Note: The editor will create an empty file buffer if the file does not exist,
but it will only save if explicitly told to do so via Command Line mode.)_

_Note: `p` in Normal Mode requires `--allow-run` permission for clipboard access. Start with:_
```bash
deno run --allow-read --allow-write --allow-run ted.js <path-to-file>
```

## Keybindings

### Normal Mode (Default)

| Key                 | Action                                          |
| ------------------- | ----------------------------------------------- |
| `i`                 | Switch to **Insert Mode**                       |
| `:`                 | Switch to **Command Line Mode**                 |
| `h` / `Left Arrow`  | Move cursor left                                |
| `l` / `Right Arrow` | Move cursor right                               |
| `k` / `Up Arrow`    | Move cursor up                                  |
| `j` / `Down Arrow`  | Move cursor down                                |
| `w`                 | Move cursor to the next word                    |
| `b`                 | Move cursor to the previous word                |
| `0`                 | Move cursor to the beginning of the line        |
| `$`                 | Move cursor to the end of the line              |
| `u`                 | Undo                                            |
| `Ctrl + r`          | Redo                                            |
| `dd`                | Delete the current line                         |
| `d0`                | Delete from cursor to the beginning of the line |
| `d$`                | Delete from cursor to the end of the line       |
| `p`                 | Paste clipboard content after cursor             |

### Insert Mode

| Key              | Action                         |
| ---------------- | ------------------------------ |
| `ESC`            | Switch back to **Normal Mode** |
| `Backspace`      | Delete previous character      |
| `Enter`          | Insert new line                |
| `Ctrl + u`       | Delete to beginning of line    |
| Arrow Keys       | Move cursor                    |
| `Ctrl + V` / Cmd+V | Paste clipboard content at cursor            |

### Command Line Mode

Press `:` in Normal Mode to enter Command Line Mode.

| Command                    | Action                                                                   |
| -------------------------- | ------------------------------------------------------------------------ |
| `:w`                       | Save changes (without quitting)                                          |
| `:w!`                      | Force save changes (without quitting)                                    |
| `:wq`                      | Save changes and quit                                                    |
| `:wq!`                     | Force save changes (modifies read-only permissions temporarily) and quit |
| `:q`, `:q!`, `:qa`, `:qa!` | Quit without saving                                                      |
| `ESC`                      | Cancel and return to **Normal Mode**                                     |

## Development

The project includes tasks defined in `deno.json`.

- **Run in Watch Mode**:
  ```bash
  deno task dev <path-to-file>
  ```
- **Run Tests**:
  ```bash
  deno task test
  ```
- **Run Tests in Watch Mode**:
  ```bash
  deno task watch
  ```
- **Run Tests with Coverage**:
  ```bash
  deno task coverage
  ```
- **Detailed Coverage Report**:
  ```bash
  deno task detailed
  ```

## Architecture Overview

```
├── ted.js                          CLI entry point — parses args,
│                                   checks permissions, reads file
├── ds/
│   └── piece_table.js              Piece Table data structure
│                                   (O(1) append, no O(n) shifts)
├── src/
│   ├── bin/
│   │   └── launch_editor.js        Bootstraps TextBuffer, Cursor,
│   │                               Editor; runs and cleans up
│   ├── core/
│   │   ├── editor.js               Main event loop, mode state
│   │   │                           machine (Normal/Insert/CLI),
│   │   │                           key dispatch
│   │   └── command_line.js         Command-line input handler
│   │                               (separate TextBuffer for input)
│   ├── domain/
│   │   ├── text_buffer.js          Text storage via Piece Table +
│   │   │                           undo/redo stacks
│   │   └── cursor.js               Cursor position tracking and
│   │                               movement logic
│   ├── terminal/
│   │   ├── terminal.js             Low-level I/O: readKey(), write(),
│   │   │                           clear(), placeCursor()
│   │   └── terminal_renderer.js    Screen rendering — viewport,
│   │                               status bar, cursor placement
│   ├── config/
│   │   ├── keys.js                 All key code byte constants
│   │   ├── modes.js                Mode labels (NORMAL, INSERT, CLI)
│   │   ├── key-maps/
│   │   │   ├── normal.js           Vi keystrokes → Cursor methods
│   │   │   └── arrows.js           ANSI escapes → arrow actions
│   │   └── commands/
│   │       └── quit_options.js     :wq/:q/:w → context objects
│   ├── fs/
│   │   ├── read_file.js            Deno.readFile wrapper
│   │   ├── write_file.js           Deno.writeFile wrapper
│   │   └── write_with_permission.js Permission-aware writes
│   │                               with force-write fallback
│   ├── utils/
│   │   ├── utility.js              Cursor row/col, line boundary
│   │   │                           helpers (prevLineFeed, etc.)
│   │   └── clipboard.js            Cross-platform clipboard access
│   │                               via Deno.Command (pbpaste/xclip/...)
├── test/
│   └── piece_table_test.js         Unit tests for PieceTable
└── deno.json                       Task definitions & dependencies
```

### Data Flow

1. **Startup**: `ted.js` → `editAndPersist()` → new `TextBuffer` + `Cursor` + `Editor`
2. **Main Loop** (`Editor.run`):
   - `render()` the current state (viewport, status bar, cursor)
   - `Terminal.readKey()` to get input
   - Dispatch based on current mode:
     - **NORMAL**: movements via key-maps, `i`→INSERT, `:`→CLI, `u`/`Ctrl+r`→undo/redo, `d`→delete prefix, `p`→paste clipboard
     - **INSERT**: raw byte insertion + bracketed paste detection, backspace, Enter, Ctrl+U, arrow keys, ESC→NORMAL
     - **CLI**: `handleCommandLine()` — builds command, ESC cancels, Enter resolves via `quitOptions`
3. **Save / Quit**: Context objects `{shouldReturn, shouldWrite, forceWrite, data}` propagate back to `run()`, which calls `writeFileWithPermission()` if needed and exits.

### Key Design Decisions

- **Piece Table**: O(1) append via separate `#add` buffer; no O(n) array shifts on insertion/deletion
- **Undo / Redo**: Full piece list snapshots stored as arrays — efficient since pieces are small descriptors
- **Zero Dependencies**: Only standard Deno APIs (`Deno.stdin`, `Deno.stdout`, `Deno.readFile`, `Deno.writeFile`, `Deno.chmod`, `Deno.stat`, `Deno.consoleSize`)
- **Backward Delete**: `delete(position, length)` removes `length` bytes before `position`, matching backspace semantics
