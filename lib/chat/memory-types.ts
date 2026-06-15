export type MemoryItem = {
  id: number;
  content: string;
  category: string;
  date: string;
};

export type MemoriesResponse = {
  userId: string;
  total: number;
  memories: MemoryItem[];
};
