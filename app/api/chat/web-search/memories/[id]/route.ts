import { NextResponse } from "next/server";
import { deleteMemory } from "@/lib/server/services/memory.service.js";
import { resolveRequestUserId } from "@/lib/server/utils/request";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const userId = await resolveRequestUserId();
    const memoryId = Number(id);

    if (!Number.isFinite(memoryId)) {
      return NextResponse.json({ error: "Invalid memory id" }, { status: 400 });
    }

    await deleteMemory(userId, memoryId);
    return NextResponse.json({ success: true, id: memoryId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
