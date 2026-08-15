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

    const activities: { type: string; message: string; timestamp: string; userName?: string }[] = [];

    const recentProfiles = await prisma.profile.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { firstName: true, lastName: true, createdAt: true },
    });
    for (const p of recentProfiles) {
      const name = `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || "Unknown";
      activities.push({ type: "signup", message: `New user signed up: ${name}`, timestamp: p.createdAt.toISOString(), userName: name });
    }

    const recentTrades = await prisma.simulatorTrade.findMany({
      orderBy: { openedAt: "desc" },
      take: 5,
      include: { profile: { select: { firstName: true, lastName: true } } },
    });
    for (const t of recentTrades) {
      const name = `${t.profile.firstName ?? ""} ${t.profile.lastName ?? ""}`.trim() || "Unknown";
      activities.push({ type: "trade", message: `Trade placed: ${t.symbol} ${t.side}`, timestamp: t.openedAt.toISOString(), userName: name });
    }

    const recentProgress = await prisma.progress.findMany({
      orderBy: { completedAt: "desc" },
      take: 5,
      where: { completed: true },
      include: { module: true },
    });

    if (recentProgress.length > 0) {
      const clerkIds = [...new Set(recentProgress.map((p) => p.clerkId))];
      const profiles = await prisma.profile.findMany({
        where: { clerkId: { in: clerkIds } },
        select: { clerkId: true, firstName: true, lastName: true },
      });
      const profileMap = new Map(profiles.map((p) => [p.clerkId, p]));

      for (const p of recentProgress) {
        const prof = profileMap.get(p.clerkId);
        const name = `${prof?.firstName ?? ""} ${prof?.lastName ?? ""}`.trim() || "Unknown";
        activities.push({ type: "lesson", message: `Completed module: ${p.module.title}`, timestamp: p.completedAt!.toISOString(), userName: name });
      }
    }

    const recentJournals = await prisma.journal.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { profile: { select: { firstName: true, lastName: true } } },
    });
    for (const j of recentJournals) {
      const name = `${j.profile.firstName ?? ""} ${j.profile.lastName ?? ""}`.trim() || "Unknown";
      activities.push({ type: "journal", message: `Journal entry: ${j.title}`, timestamp: j.createdAt.toISOString(), userName: name });
    }

    const recentPosts = await prisma.communityPost.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { profile: { select: { firstName: true, lastName: true } } },
    });
    for (const post of recentPosts) {
      const name = `${post.profile.firstName ?? ""} ${post.profile.lastName ?? ""}`.trim() || "Unknown";
      activities.push({ type: "community", message: `Community post by ${name}`, timestamp: post.createdAt.toISOString(), userName: name });
    }

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const top10 = activities.slice(0, 10);

    return NextResponse.json({ activities: top10 });
  } catch (error) {
    console.error("Admin activity API error:", error);
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
