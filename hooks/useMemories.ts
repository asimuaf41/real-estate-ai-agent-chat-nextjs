"use client";

import { useCallback, useEffect, useState } from "react";
import { apiEndpoints } from "@/lib/api";
import type { MemoriesResponse, MemoryItem } from "@/lib/chat/memory-types";

const DEFAULT_USER_ID = "asim-ali-001";

function buildMemoriesUrl(userId: string) {
  return `${apiEndpoints.webSearchMemories}?userId=${encodeURIComponent(userId)}`;
}

export function useMemories(userId = DEFAULT_USER_ID) {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);

      try {
        const response = await fetch(buildMemoriesUrl(userId), {
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
  }, [userId, refreshKey]);

  const refetchMemories = useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  const deleteMemory = useCallback(
    async (memoryId: number) => {
      const response = await fetch(
        `${apiEndpoints.webSearchMemories}/${memoryId}?userId=${encodeURIComponent(userId)}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        throw new Error(`Failed to delete memory (${response.status})`);
      }

      setMemories((previous) =>
        previous.filter((memory) => memory.id !== memoryId),
      );
    },
    [userId],
  );

  return {
    memories,
    isLoading,
    error,
    refetchMemories,
    deleteMemory,
  };
}

export { DEFAULT_USER_ID };
