import { NextResponse } from "next/server";
import { getAllMemories } from "@/lib/server/services/memory.service.js";
import { resolveUserId } from "@/lib/server/utils/request";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = resolveUserId({}, searchParams);
    const memories = await getAllMemories(userId);

    return NextResponse.json({
      userId,
      total: memories.length,
      memories: memories.map(
        (memory: {
          id: number;
          content: string;
          metadata?: { category?: string };
          created_at: string;
        }) => ({
          id: memory.id,
          content: memory.content,
          category: memory.metadata?.category ?? "research",
          date: memory.created_at,
        }),
      ),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
