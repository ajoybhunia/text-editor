# Implementing a Viewport-Aware Editor with a Sticky Status Bar

The technique to display the editor mode at the bottom of the screen and make
the content scrollable involves transforming the editor from a simple content
renderer to a viewport-aware application. This requires three main concepts:
**knowing the terminal size**, **managing a viewport**, and **revising the
rendering process**.

Here is a step-by-step breakdown of the technique:

### 1. Determine Terminal Dimensions

The application must first know the size of the terminal window it's running in.

- **How:** Use Deno's built-in `Deno.consoleSize()` API. This function returns
  the number of `columns` and `rows` available in the terminal.
- **When:** This check should be performed before every render to gracefully
  handle terminal window resizing.

### 2. Implement a Viewport (or "Camera")

A viewport represents the visible portion of the file's content. Instead of
drawing the entire file, you only draw what fits within this viewport.

- **State Management:** The `Editor` class (`src/domain/editor.js`) needs to
  manage the state of the viewport. The most important piece of state is the
  line number of the file that is at the very top of the screen. Let's call it
  `viewportTop`.
- **Scrolling:** Scrolling is simply the act of changing `viewportTop`.
  - When the user's cursor moves up past the top of the visible area, you
    decrement `viewportTop` (scrolling up).
  - When the cursor moves down past the bottom of the visible area, you
    increment `viewportTop` (scrolling down). This logic would be added to the
    key-handling functions in `editor.js` after the cursor's position is
    updated.

### 3. Overhaul the Rendering Pipeline

The current rendering logic writes the entire file buffer at once. The new logic
will be more sophisticated, using **ANSI escape codes** to control cursor
placement and draw different parts of the UI independently.

The new rendering cycle in the `Editor`'s `#render` method would be:

1. **Get Terminal Size:** Get the current `rows` and `columns` from
   `Deno.consoleSize()`. The content area will have a height of `rows - 1`.
2. **Clear the Screen:** Use an ANSI escape code like `\x1b[2J` to clear the
   entire terminal, ensuring no artifacts from the previous render remain.
3. **Calculate Visible Content:**
   - Get all lines from the `TextBuffer`.
   - Slice this array of lines based on the viewport:
     `visibleLines = allLines.slice(viewportTop, viewportTop + rows - 1)`.
4. **Draw Visible Content:** Write the `visibleLines` to the terminal. They will
   naturally fill the screen from the top.
5. **Draw the Status Bar:**
   - Use an ANSI escape code to move the cursor to the last line (e.g.,
     `\x1b[${rows};1H`).
   - Clear the line to remove any previous status text.
   - Write the mode indicator (`-- NORMAL --`), filename, and other status
     information. It's common to use inverse video (`\x1b[7m...\x1b[0m`) for the
     status bar to make it distinct.
6. **Place the Cursor:**
   - Calculate the cursor's absolute `(row, col)` position in the file.
   - Translate the absolute row to a screen-relative row:
     `screenRow = absoluteRow - viewportTop`.
   - Use an ANSI escape code to move the terminal's physical cursor to
     `(screenRow, col)`.

By following this technique, the editor will always draw the status bar at the
last line, and the content area above it will show the correct, scrollable
portion of the file.
