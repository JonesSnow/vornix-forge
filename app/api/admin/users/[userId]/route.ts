import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ADMIN_CLERK_IDS } from "@/lib/constants";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId || !ADMIN_CLERK_IDS.includes(userId)) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    const { userId: targetUserId } = await params;

    const [profile, assessment, progress, portfolio] = await Promise.all([
      prisma.profile.findUnique({
        where: { clerkId: targetUserId },
        include: {
          simulatorPortfolio: { include: { trades: { orderBy: { openedAt: "desc" } } } },
          journals: { orderBy: { createdAt: "desc" } },
          communityPosts: { orderBy: { createdAt: "desc" } },
        },
      }),
      prisma.assessment.findUnique({ where: { clerkId: targetUserId } }),
      prisma.progress.findMany({ where: { clerkId: targetUserId }, include: { module: true } }),
      prisma.simulatorPortfolio.findUnique({ where: { clerkId: targetUserId } }),
    ]);

    if (!profile) {
      return NextResponse.json({ error: "User not found", code: "NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ profile, assessment, progress, portfolio });
  } catch (error) {
    console.error("Admin user detail API error:", error);
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId || !ADMIN_CLERK_IDS.includes(userId)) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    const { userId: targetUserId } = await params;

    await prisma.assessment.deleteMany({ where: { clerkId: targetUserId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin reset assessment API error:", error);
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
