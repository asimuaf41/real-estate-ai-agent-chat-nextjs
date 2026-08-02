import fs from "fs";
import { env } from "../../config/env.js";
import { ensureDir, resolveDataPath } from "../../utils/dataPaths.js";

const REPORTS_FILE = () => resolveDataPath("weather-reports.json");

function ensureReportsFile() {
  const filepath = REPORTS_FILE();
  ensureDir(resolveDataPath());
  if (!fs.existsSync(filepath)) {
    fs.writeFileSync(filepath, "[]", "utf8");
  }
}

function readReports() {
  ensureReportsFile();
  return JSON.parse(fs.readFileSync(REPORTS_FILE(), "utf8"));
}

function writeReports(reports) {
  ensureReportsFile();
  fs.writeFileSync(REPORTS_FILE(), JSON.stringify(reports, null, 2), "utf8");
}

async function fetchLiveWeather(city) {
  if (!env.weatherApiKey) {
    throw new Error("WEATHER_API_KEY is not configured");
  }

  const url = new URL("https://api.openweathermap.org/data/2.5/weather");
  url.searchParams.set("q", city);
  url.searchParams.set("appid", env.weatherApiKey);
  url.searchParams.set("units", "metric");

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    const message = data?.message || `Weather API error (${response.status})`;
    throw new Error(message);
  }

  return {
    city: data.name,
    country: data.sys?.country,
    temperature: `${data.main.temp}°C`,
    feels_like: `${data.main.feels_like}°C`,
    condition: data.weather?.[0]?.description ?? "Unknown",
    humidity: `${data.main.humidity}%`,
    wind: `${data.wind?.speed ?? 0} m/s`,
  };
}

function saveWeatherReport(title, content) {
  const reports = readReports();
  const report = {
    id: Date.now(),
    title,
    content,
    savedAt: new Date().toISOString(),
  };

  reports.push(report);
  writeReports(reports);

  return {
    success: true,
    message: `Weather report "${title}" saved`,
    report,
  };
}

function getWeatherReports() {
  const reports = readReports();

  if (reports.length === 0) {
    return { count: 0, reports: [], message: "No weather reports saved yet" };
  }

  return { count: reports.length, reports };
}

export async function runWeatherTool(toolName, toolInput) {
  switch (toolName) {
    case "get_weather":
      return fetchLiveWeather(toolInput.city);

    case "save_weather_report":
      return saveWeatherReport(toolInput.title, toolInput.content);

    case "get_weather_reports":
      return getWeatherReports();

    default:
      throw new Error(`Unsupported weather tool: ${toolName}`);
  }
}
