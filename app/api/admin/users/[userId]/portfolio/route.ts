import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ADMIN_CLERK_IDS } from "@/lib/constants";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId || !ADMIN_CLERK_IDS.includes(userId)) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    const { userId: targetUserId } = await params;

    await prisma.simulatorTrade.deleteMany({ where: { clerkId: targetUserId } });
    await prisma.simulatorPortfolio.delete({ where: { clerkId: targetUserId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin reset portfolio API error:", error);
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
