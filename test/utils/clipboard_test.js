import { assertEquals } from "@std/assert";
import { afterEach, describe, it } from "@std/testing/bdd";
import { stub } from "@std/testing/mock";
import { getClipboardText } from "../../src/utils/clipboard.js";

const stubs = [];

const reset = () => {
  while (stubs.length) stubs.pop().restore();
  stubs.length = 0;
};

afterEach(reset);

describe("Testing clipboard", () => {
  it("should fall back to the next candidate, when the first clipboard command fails", async () => {
    let calls = 0;
    stubs.push(stub(Deno, "Command", function (cmd) {
      calls++;
      if (calls === 1) throw new Error("command not found");
      return {
        output: () => Promise.resolve({
          stdout: new TextEncoder().encode("from-second"),
          success: true,
        }),
      };
    }));

    assertEquals(await getClipboardText(), "from-second");
  });

  it("should return an empty string, when every clipboard candidate fails", async () => {
    stubs.push(stub(Deno, "Command", function () {
      throw new Error("command not found");
    }));

    assertEquals(await getClipboardText(), "");
  });
});