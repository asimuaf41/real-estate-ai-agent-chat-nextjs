import fs from "fs";
import { ensureDir, resolveDataPath } from "../utils/dataPaths.js";

/**
 * Sends an email. No SMTP/provider is configured in this learning project,
 * so delivery is simulated: the message is persisted to data/outbox/ and a
 * success receipt is returned. On Vercel this uses /tmp (ephemeral).
 */
export async function sendEmail({ to, subject, body }) {
  const recipient = (to || "").trim() || "client@example.com";
  const outboxDir = resolveDataPath("outbox");
  ensureDir(outboxDir);

  const timestamp = Date.now();
  const safeSubject = (subject || "real-estate-report")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .slice(0, 60);
  const filename = `${timestamp}-${safeSubject}.md`;
  const filepath = resolveDataPath("outbox", filename);

  const message = `To: ${recipient}\nSubject: ${subject}\nDate: ${new Date(timestamp).toISOString()}\n\n${body}`;
  fs.writeFileSync(filepath, message, "utf8");

  return {
    success: true,
    simulated: true,
    to: recipient,
    subject,
    savedTo: `data/outbox/${filename}`,
    message: `Report emailed to ${recipient} (simulated, saved to data/outbox/${filename}).`,
  };
}
