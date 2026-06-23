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
  - **Command Line Mode**: For saving and quitting.
- **Efficient Text Manipulation**: Uses a Piece Table under the hood for
  performant text insertion and deletion.
- **Undo Support**: Ability to undo changes made to the text buffer.
- **File Mode Handling**: Respects file permissions, distinguishing between
  standard writes and force writes (e.g. for read-only files).
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
| `0`                 | Move cursor to the beginning of the line        |
| `$`                 | Move cursor to the end of the line              |
| `u`                 | Undo                                            |
| `dd`                | Delete the current line                         |
| `d0`                | Delete from cursor to the beginning of the line |
| `d$`                | Delete from cursor to the end of the line       |

### Insert Mode

| Key         | Action                         |
| ----------- | ------------------------------ |
| `ESC`       | Switch back to **Normal Mode** |
| `Backspace` | Delete previous character      |
| `Enter`     | Insert new line                |
| Arrow Keys  | Move cursor                    |

### Command Line Mode

Press `:` in Normal Mode to enter Command Line Mode.

| Command                    | Action                                                                   |
| -------------------------- | ------------------------------------------------------------------------ |
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

- **`ted.js`**: The executable entry point. Handles file resolution and
  initializes the editor.
- **`src/bin/launch_editor.js` & `edit_file.js`**: Bootstrapping scripts to
  initialize and persist the editor session.
- **`src/core/editor.js`**: Core editor loop, mode handling (Normal, Insert,
  CLI), and dispatching user inputs.
- **`src/domain/text_buffer.js`**: Manages the current text, cursor interactions
  with the text, and maintains the undo history.
- **`src/domain/cursor.js`**: Encapsulates cursor state and movement logic.
- **`src/terminal/terminal.js` & `terminal_renderer.js`**: Abstractions over raw
  terminal I/O (handling ANSI escape codes, cursor placement, rendering the
  buffer, and reading keys).
- **`src/config/`**: Configuration files mapping modes, keys, and commands.
- **`ds/piece_table.js`**: The underlying data structure for performant text
  manipulation.
