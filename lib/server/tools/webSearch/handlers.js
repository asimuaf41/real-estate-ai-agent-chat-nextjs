import fs from "fs";
import { createMemoryToolRunner } from "../memory/handlers.js";
import { readUrl, searchWeb } from "../../services/tavily.service.js";
import { ensureDir, resolveDataPath } from "../../utils/dataPaths.js";

function searchYoutube(query, maxResults = 5) {
  const count = Math.min(Math.max(maxResults, 1), 8);
  const slug = query.toLowerCase().replace(/\s+/g, "-").slice(0, 40);

  const videos = Array.from({ length: count }, (_, index) => ({
    title: `${query} — ${["Complete Guide", "Deep Dive", "Tutorial", "Explained", "Best Practices"][index % 5]} ${2024 + (index % 2)}`,
    channel: ["Tech Insights", "Dev Academy", "Code Masters", "Learn Fast", "Build Better"][index % 5],
    url: `https://www.youtube.com/watch?v=${slug}-${index + 1}`,
    duration: `${8 + index * 3}:${String(10 + index * 7).padStart(2, "0")}`,
    views: `${(index + 1) * 125}K views`,
  }));

  return { query, videos };
}

function saveReport(filename, content) {
  const reportsDir = resolveDataPath("reports");
  ensureDir(reportsDir);

  const safeName = filename.replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 80);
  const filepath = resolveDataPath("reports", `${safeName}.md`);

  fs.writeFileSync(filepath, content, "utf8");

  return {
    success: true,
    filepath,
    message: `Report saved to data/reports/${safeName}.md`,
  };
}

const MEMORY_TOOLS = new Set([
  "save_memory",
  "search_memory",
  "get_all_memories",
  "delete_memory",
]);

export function createWebSearchToolRunner(userId) {
  const runMemoryTool = createMemoryToolRunner(userId);

  return async function runWebSearchTool(toolName, toolInput) {
    if (MEMORY_TOOLS.has(toolName)) {
      return runMemoryTool(toolName, toolInput);
    }

    switch (toolName) {
      case "search_web":
        return searchWeb(toolInput.query, toolInput.max_results ?? 5);

      case "read_url":
        return readUrl(toolInput.url);

      case "search_youtube":
        return searchYoutube(toolInput.query, toolInput.max_results ?? 5);

      case "save_report":
        return saveReport(toolInput.filename, toolInput.content);

      default:
        throw new Error(`Unsupported web search tool: ${toolName}`);
    }
  };
}
