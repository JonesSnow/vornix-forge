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
    const flaggedOnly = req.nextUrl.searchParams.get("flagged") === "true";

    const where: any = {};
    if (search) {
      where.content = { contains: search, mode: "insensitive" };
    }
    if (flaggedOnly) {
      where.reports = { gt: 0 };
    }

    const posts = await prisma.communityPost.findMany({
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

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Admin community API error:", error);
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId || !ADMIN_CLERK_IDS.includes(userId)) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    const body = await req.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json({ error: "postId required", code: "VALIDATION_ERROR" }, { status: 400 });
    }

    await prisma.communityPost.delete({ where: { id: postId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin delete post API error:", error);
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
