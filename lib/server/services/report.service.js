import fs from "fs";
import { ensureDir, resolveDataPath } from "../utils/dataPaths.js";

export async function saveReport(title, content) {
  const reportsDir = resolveDataPath("reports");
  ensureDir(reportsDir);

  const safeName = (title || "report")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .slice(0, 80);
  const filename = `${Date.now()}-${safeName}.md`;
  const filepath = resolveDataPath("reports", filename);

  fs.writeFileSync(filepath, content, "utf8");

  return {
    success: true,
    filepath,
    savedTo: `data/reports/${filename}`,
    message: `Report saved to data/reports/${filename}`,
  };
}
