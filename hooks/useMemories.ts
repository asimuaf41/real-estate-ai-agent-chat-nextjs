"use client";

import { useCallback, useEffect, useState } from "react";
import { apiEndpoints } from "@/lib/api";
import type { MemoriesResponse, MemoryItem } from "@/lib/chat/memory-types";

/**
 * Loads memories for the current Supabase session user (or anonymous guest).
 * Identity is resolved server-side from cookies — never pass a client userId.
 */
export function useMemories() {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);

      try {
        const response = await fetch(apiEndpoints.webSearchMemories, {
          credentials: "include",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to load memories (${response.status})`);
        }

        const data = (await response.json()) as MemoriesResponse;

        if (controller.signal.aborted) return;
        setMemories(data.memories ?? []);
        setError("");
      } catch (fetchError) {
        if (controller.signal.aborted) return;
        console.error("Memory fetch error:", fetchError);
        setError("Could not load saved memories.");
        setMemories([]);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      controller.abort();
    };
  }, [refreshKey]);

  const refetchMemories = useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  const deleteMemory = useCallback(async (memoryId: number) => {
    const response = await fetch(
      `${apiEndpoints.webSearchMemories}/${memoryId}`,
      { method: "DELETE", credentials: "include" },
    );

    if (!response.ok) {
      throw new Error(`Failed to delete memory (${response.status})`);
    }

    setMemories((previous) =>
      previous.filter((memory) => memory.id !== memoryId),
    );
  }, []);

  return {
    memories,
    isLoading,
    error,
    refetchMemories,
    deleteMemory,
  };
}
