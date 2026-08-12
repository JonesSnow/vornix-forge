import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const entryId = resolvedParams.entryId;

    if (!entryId || typeof entryId !== "string") {
      return NextResponse.json(
        { error: "Invalid entry ID" },
        { status: 400 }
      );
    }

    const entry = await prisma.journal.findUnique({
      where: { id: entryId },
      select: { clerkId: true },
    });

    if (!entry || entry.clerkId !== userId) {
      return NextResponse.json(
        { error: "Entry not found" },
        { status: 404 }
      );
    }

    await prisma.journal.delete({
      where: { id: entryId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Journal delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
