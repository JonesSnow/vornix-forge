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

    const search = req.nextUrl.searchParams.get("search")?.toLowerCase() ?? "";
    const page = parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10);
    const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "20", 10);
    const sort = req.nextUrl.searchParams.get("sort") ?? "createdAt";
    const order = req.nextUrl.searchParams.get("order") === "asc" ? "asc" : "desc";
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const orderBy: any = { [sort]: order };

    const [profiles, total] = await Promise.all([
      prisma.profile.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          simulatorPortfolio: { include: { trades: true } },
          journals: true,
        },
      }),
      prisma.profile.count({ where }),
    ]);

    const clerkIds = profiles.map((p) => p.clerkId);

    const [assessments, progress] = await Promise.all([
      prisma.assessment.findMany({ where: { clerkId: { in: clerkIds } } }),
      prisma.progress.findMany({ where: { clerkId: { in: clerkIds } } }),
    ]);

    const assessmentMap = new Map(assessments.map((a) => [a.clerkId, a]));
    const progressMap = new Map<string, { completed: number; total: number }>();
    for (const p of progress) {
      const existing = progressMap.get(p.clerkId) ?? { completed: 0, total: 0 };
      existing.total += 1;
      if (p.completed) existing.completed += 1;
      progressMap.set(p.clerkId, existing);
    }

    const users = profiles.map((p) => {
      const a = assessmentMap.get(p.clerkId);
      const prog = progressMap.get(p.clerkId) ?? { completed: 0, total: 0 };
      const trades = p.simulatorPortfolio?.trades ?? [];
      const pnl = trades.reduce((acc, t) => acc + (t.pnl ?? 0), 0);
      return {
        clerkId: p.clerkId,
        name: `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || "Unknown",
        email: p.clerkId,
        level: p.experienceLevel ?? "N/A",
        assessmentScore: a?.score ?? 0,
        modulesCompleted: prog.completed,
        tradesMade: trades.length,
        pnl,
        journalEntries: p.journals.length,
        joinedDate: p.createdAt,
        lastActive: p.updatedAt,
      };
    });

    return NextResponse.json({ users, total, page, limit });
  } catch (error) {
    console.error("Admin users API error:", error);
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
