export type RagDocument = {
  sourceFile: string;
  chunkCount: number;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  preview?: string;
};

export type RagDocumentsResponse = {
  total: number;
  documents: RagDocument[];
};

export type RagSeedResponse = {
  seeded: boolean;
  skipped: boolean;
  message: string;
  chunkCount?: number;
  sourceFile?: string;
};

export type RagRetrievalChunk = {
  id?: number;
  sourceFile?: string;
  source_file?: string;
  similarity?: number;
  snippet?: string;
};

export type RagRetrievalResult = {
  query?: string;
  count?: number;
  chunks?: RagRetrievalChunk[];
};
