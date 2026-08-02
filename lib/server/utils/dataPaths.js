import fs from "fs";
import os from "os";
import path from "path";

/**
 * Persistent local data lives under ./data.
 * On Vercel the filesystem is ephemeral — use /tmp and document that
 * weather reports / markdown outbox are not durable across invocations.
 */
export function getDataRoot() {
  if (process.env.VERCEL) {
    return path.join(os.tmpdir(), "chat-ai-agent-data");
  }

  return path.join(/*turbopackIgnore: true*/ process.cwd(), "data");
}

export function resolveDataPath(...segments) {
  return path.join(getDataRoot(), ...segments);
}

export function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}
