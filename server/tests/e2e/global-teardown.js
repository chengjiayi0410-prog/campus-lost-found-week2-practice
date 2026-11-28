import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function stopProcess(pid) {
  if (!Number.isInteger(pid) || !isProcessRunning(pid)) {
    return;
  }

  process.kill(pid);

  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (!isProcessRunning(pid)) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  process.kill(pid, "SIGKILL");
}

export default async function globalTeardown() {
  const serverDirectory = fileURLToPath(new URL("../../", import.meta.url));
  const pidFile = `${serverDirectory}.e2e-server-pids.json`;
  const content = await fs.readFile(pidFile, "utf8").catch(() => "[]");
  const pids = JSON.parse(content);

  for (const pid of pids) {
    await stopProcess(pid);
  }

  await fs.unlink(pidFile).catch(() => {});
}
