import { assertEquals, assertRejects } from "@std/assert";
import { afterEach, describe, it } from "@std/testing/bdd";
import { spy, stub } from "@std/testing/mock";
import { readFile } from "../../src/fs/read_file.js";
import { writeFile } from "../../src/fs/write_file.js";
import { writeFileWithPermission } from "../../src/fs/write_with_permission.js";

const stubs = [];

const reset = () => {
  while (stubs.length) stubs.pop().restore();
  stubs.length = 0;
};

const noop = () => Promise.resolve();

const stubDenoRead = (bytes) => {
  stubs.push(stub(Deno, "readFile", () => Promise.resolve(bytes)));
};

const stubDenoWrite = () => {
  const s = spy(noop);
  stubs.push(stub(Deno, "writeFile", s));
  return s;
};

const stubDenoChmod = () => {
  const s = spy(noop);
  stubs.push(stub(Deno, "chmod", s));
  return s;
};

afterEach(reset);

describe("Testing file read and write", () => {
  const ctx = (data = "hello", forceWrite = false) => ({ data, forceWrite });

  describe("testing readFile", () => {
    it("should return the bytes, when reading an existing file", async () => {
      const bytes = new TextEncoder().encode("hello");
      stubDenoRead(bytes);
      assertEquals(await readFile("file.txt"), bytes);
    });
  });

  describe("testing writeFile", () => {
    it("should write the data to the file path, when writing a file", async () => {
      const writeSpy = stubDenoWrite();
      const data = new TextEncoder().encode("hello");
      await writeFile("file.txt", data);
      assertEquals(writeSpy.calls.length, 1);
      assertEquals(writeSpy.calls[0].args[0], "file.txt");
      assertEquals(new TextDecoder().decode(writeSpy.calls[0].args[1]), "hello");
    });
  });

  describe("testing writeFileWithPermission", () => {
    it("should write the data, when write permission is present", async () => {
      const writeSpy = stubDenoWrite();
      const chmodSpy = stubDenoChmod();

      await writeFileWithPermission(ctx("hello"), "file.txt", true, 0o100644);

      assertEquals(writeSpy.calls.length, 1);
      assertEquals(writeSpy.calls[0].args[0], "file.txt");
      assertEquals(writeSpy.calls[0].args[1], "hello");
      assertEquals(chmodSpy.calls.length, 0);
    });

    it("should write via the normal path, when write permission is present even with the force flag", async () => {
      const writeSpy = stubDenoWrite();
      const chmodSpy = stubDenoChmod();

      await writeFileWithPermission(ctx("hello", true), "file.txt", true, 0o100644);

      assertEquals(chmodSpy.calls.length, 0);
      assertEquals(writeSpy.calls.length, 1);
    });

    it("should chmod, write, and restore the mode, when force writing without permission", async () => {
      const writeSpy = stubDenoWrite();
      const chmodSpy = stubDenoChmod();

      await writeFileWithPermission(ctx("hello", true), "file.txt", false, 0o100644);

      assertEquals(chmodSpy.calls.map((c) => c.args), [
        ["file.txt", 0o600],
        ["file.txt", 0o644],
      ]);
      assertEquals(writeSpy.calls.length, 1);
    });

    it("should deny the write, when no permission and no force flag", async () => {
      stubDenoWrite();
      stubDenoChmod();

      await assertRejects(
        () => writeFileWithPermission(ctx("hello"), "file.txt", false, 0o100644),
        Error,
        "permission denied: file.txt",
      );
    });

    it("should deny without touching the file, when no permission and no force flag", async () => {
      const writeSpy = stubDenoWrite();
      const chmodSpy = stubDenoChmod();

      await assertRejects(
        () => writeFileWithPermission(ctx("hello"), "file.txt", false, 0o100644),
      );
      assertEquals(writeSpy.calls.length, 0);
      assertEquals(chmodSpy.calls.length, 0);
    });
  });
});