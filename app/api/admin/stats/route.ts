import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ADMIN_CLERK_IDS } from "@/lib/constants";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId || !ADMIN_CLERK_IDS.includes(userId)) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    const [totalUsers, activeToday, totalTrades, journalEntries, communityPosts, coursesCount] = await Promise.all([
      prisma.profile.count(),
      prisma.profile.count({ where: { updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
      prisma.simulatorTrade.count(),
      prisma.journal.count(),
      prisma.communityPost.count(),
      prisma.course.count(),
    ]);

    return NextResponse.json({
      totalUsers,
      activeToday,
      totalTrades,
      journalEntries,
      communityPosts,
      coursesCount,
    });
  } catch (error) {
    console.error("Admin stats API error:", error);
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
