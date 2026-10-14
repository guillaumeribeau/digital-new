export async function hiddenPassword(prompt: string) {
  if (!process.stdin.isTTY) throw new Error("INTERACTIVE_TERMINAL_REQUIRED");
  process.stdout.write(prompt);
  process.stdin.setRawMode(true); process.stdin.resume();
  return new Promise<string>((resolvePassword, reject) => {
    let value = "";
    const finish = () => { process.stdin.off("data", read); process.stdin.setRawMode(false); process.stdin.pause(); process.stdout.write("\n"); };
    const read = (data: Buffer) => {
      for (const char of data.toString("utf8")) {
        if (char === "\u0003") { finish(); reject(new Error("CANCELLED")); return; }
        if (char === "\r" || char === "\n") { finish(); resolvePassword(value); return; }
        if (char === "\u007f" || char === "\b") { value = value.slice(0, -1); continue; }
        if (char >= " " && value.length < 129) value += char;
      }
    };
    process.stdin.on("data", read);
  });
}
