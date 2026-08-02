import { NextResponse } from "next/server";
import { listDocuments } from "@/lib/server/services/rag.service.js";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  try {
    const documents = await listDocuments();
    return NextResponse.json({
      total: documents.length,
      documents,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
