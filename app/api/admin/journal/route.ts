import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ADMIN_CLERK_IDS } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId || !ADMIN_CLERK_IDS.includes(userId)) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    const mood = req.nextUrl.searchParams.get("mood") ?? "";
    const search = req.nextUrl.searchParams.get("search")?.toLowerCase() ?? "";

    const where: any = {};
    if (mood) {
      where.mood = mood;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    const entries = await prisma.journal.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        profile: {
          select: {
            clerkId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Admin journal API error:", error);
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
