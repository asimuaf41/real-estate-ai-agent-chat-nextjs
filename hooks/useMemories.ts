"use client";

import { useCallback, useEffect, useState } from "react";
import type { MemoryItem, MemoriesResponse } from "@/lib/chat/memory-types";

const DEFAULT_USER_ID = "asim-ali-001";
const MEMORIES_API = "http://localhost:3001/api/chat/web-search/memories";

export function useMemories(userId = DEFAULT_USER_ID) {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMemories = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${MEMORIES_API}?userId=${encodeURIComponent(userId)}`,
      );

      if (!response.ok) {
        throw new Error(`Failed to load memories (${response.status})`);
      }

      const data = (await response.json()) as MemoriesResponse;
      setMemories(data.memories ?? []);
    } catch (fetchError) {
      console.error("Memory fetch error:", fetchError);
      setError("Could not load saved memories.");
      setMemories([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const deleteMemory = useCallback(
    async (memoryId: number) => {
      const response = await fetch(
        `${MEMORIES_API}/${memoryId}?userId=${encodeURIComponent(userId)}`,
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

  useEffect(() => {
    void fetchMemories();
  }, [fetchMemories]);

  return {
    memories,
    isLoading,
    error,
    refetchMemories: fetchMemories,
    deleteMemory,
  };
}

export { DEFAULT_USER_ID };
