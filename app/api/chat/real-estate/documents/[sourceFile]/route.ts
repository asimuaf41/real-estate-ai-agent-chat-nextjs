import { NextResponse } from "next/server";
import { deleteDocument } from "@/lib/server/services/rag.service.js";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ sourceFile: string }> },
) {
  try {
    const { sourceFile: rawSourceFile } = await context.params;
    const sourceFile = decodeURIComponent(rawSourceFile ?? "");

    if (!sourceFile) {
      return NextResponse.json(
        { error: "sourceFile is required" },
        { status: 400 },
      );
    }

    await deleteDocument(sourceFile);
    return NextResponse.json({ success: true, sourceFile });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
