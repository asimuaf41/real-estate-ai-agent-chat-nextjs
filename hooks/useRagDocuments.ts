"use client";

import { useCallback, useEffect, useState } from "react";
import { apiEndpoints } from "@/lib/api";
import type {
  RagDocument,
  RagDocumentsResponse,
  RagSeedResponse,
} from "@/lib/chat/document-types";

type SeedStatus = "idle" | "seeding" | "deleting";

export function useRagDocuments() {
  const [documents, setDocuments] = useState<RagDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<SeedStatus>("idle");
  const [seedNotice, setSeedNotice] = useState<string>("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);

      try {
        const response = await fetch(apiEndpoints.realEstateDocuments, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to load documents (${response.status})`);
        }

        const data = (await response.json()) as RagDocumentsResponse;

        if (controller.signal.aborted) return;
        setDocuments(data.documents ?? []);
        setError("");
      } catch (fetchError) {
        if (controller.signal.aborted) return;
        console.error("Documents fetch error:", fetchError);
        setError("Could not load property database.");
        setDocuments([]);
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

  const refetchDocuments = useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  const clearSeedNotice = useCallback(() => setSeedNotice(""), []);

  const seedDocuments = useCallback(
    async (force = false): Promise<RagSeedResponse> => {
      setStatus("seeding");
      setError("");
      setSeedNotice("");

      try {
        const response = await fetch(
          `${apiEndpoints.realEstateSeed}${force ? "?force=true" : ""}`,
          { method: "POST" },
        );

        const data = (await response.json()) as RagSeedResponse & {
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error || "Failed to seed property database.");
        }

        setSeedNotice(data.message);
        refetchDocuments();
        return data;
      } catch (seedError) {
        const message =
          seedError instanceof Error
            ? seedError.message
            : "Failed to seed property database.";
        setError(message);
        throw seedError;
      } finally {
        setStatus("idle");
      }
    },
    [refetchDocuments],
  );

  const deleteDocument = useCallback(async (sourceFile: string) => {
    setStatus("deleting");
    setError("");

    try {
      const response = await fetch(
        `${apiEndpoints.realEstateDocuments}/${encodeURIComponent(sourceFile)}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
          body.error || `Failed to delete document (${response.status})`,
        );
      }

      setDocuments((previous) =>
        previous.filter((doc) => doc.sourceFile !== sourceFile),
      );
      setSeedNotice("");
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete document.";
      setError(message);
      throw deleteError;
    } finally {
      setStatus("idle");
    }
  }, []);

  return {
    documents,
    isLoading,
    error,
    status,
    seedNotice,
    refetchDocuments,
    clearSeedNotice,
    seedDocuments,
    deleteDocument,
  };
}
