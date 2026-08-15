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
    const page = parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10);
    const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "50", 10);
    const skip = (page - 1) * limit;

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

    const [entries, total] = await Promise.all([
      prisma.journal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          profile: {
            select: {
              clerkId: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.journal.count({ where }),
    ]);

    const moods = await prisma.journal.findMany({
      select: { mood: true },
      distinct: ["mood"],
    });

    return NextResponse.json({
      entries,
      total,
      page,
      limit,
      moods: moods.map((m) => m.mood),
      stats: {
        total,
        withAiFeedback: entries.filter((e) => !!e.aiFeedback).length,
        withoutAiFeedback: entries.filter((e) => !e.aiFeedback).length,
      },
    });
  } catch (error) {
    console.error("Admin journal API error:", error);
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
