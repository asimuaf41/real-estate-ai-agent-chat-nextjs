import type { ToolEvent } from "@/lib/chat/types";

function WeatherResultCard({ result }: { result: Record<string, unknown> }) {
  return (
    <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-xs text-violet-100">
      <p className="font-semibold text-violet-50">
        {String(result.city ?? "City")}
        {result.country ? `, ${String(result.country)}` : ""}
      </p>
      <p className="mt-1 capitalize text-zinc-300">
        {String(result.condition ?? "")}
      </p>
      <p className="mt-1 text-zinc-300">
        {String(result.temperature ?? "")} · feels like{" "}
        {String(result.feels_like ?? "")}
      </p>
      <p className="mt-1 text-zinc-400">
        Humidity {String(result.humidity ?? "")} · Wind{" "}
        {String(result.wind ?? "")}
      </p>
    </div>
  );
}

export function WeatherToolEvents({ events }: { events: ToolEvent[] }) {
  if (events.length === 0) return null;

  return (
    <div className="mb-3 space-y-2">
      {events.map((event, index) => {
        if (event.type === "tool_use") {
          return (
            <p
              key={`tool-use-${index}`}
              className="text-[11px] font-medium uppercase tracking-wide text-violet-300/80"
            >
              Running {event.tool}
              {event.input?.city ? ` · ${String(event.input.city)}` : ""}
            </p>
          );
        }

        if (event.tool === "get_weather" && event.result) {
          return (
            <WeatherResultCard
              key={`tool-result-${index}`}
              result={event.result}
            />
          );
        }

        if (event.tool === "save_weather_report" && event.result) {
          return (
            <p
              key={`tool-result-${index}`}
              className="text-xs text-emerald-300"
            >
              {String(event.result.message ?? "Report saved")}
            </p>
          );
        }

        if (event.tool === "get_weather_reports" && event.result) {
          const count = Number(event.result.count ?? 0);
          return (
            <p key={`tool-result-${index}`} className="text-xs text-amber-200">
              {count === 0
                ? "No saved weather reports yet."
                : `Loaded ${count} saved weather report${count === 1 ? "" : "s"}.`}
            </p>
          );
        }

        return null;
      })}
    </div>
  );
}
