const decoder = new TextDecoder();

export async function getClipboardText() {
  const candidates = [
    ["pbpaste"],
    ["xclip", "-o", "-selection", "clipboard"],
    ["wl-paste"],
    ["powershell", "-NoProfile", "-Command", "Get-Clipboard"],
  ];

  for (const args of candidates) {
    try {
      const cmd = new Deno.Command(args[0], { args: args.slice(1) });
      const { stdout, success } = await cmd.output();
      if (success) return decoder.decode(stdout);
    } catch {
      continue;
    }
  }

  return "";
}
