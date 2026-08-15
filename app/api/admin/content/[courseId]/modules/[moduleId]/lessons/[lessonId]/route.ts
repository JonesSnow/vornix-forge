import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ADMIN_CLERK_IDS } from "@/lib/constants";

export async function PUT(_req: NextRequest, { params }: { params: Promise<{ courseId: string; moduleId: string; lessonId: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId || !ADMIN_CLERK_IDS.includes(userId)) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    const { lessonId } = await params;

    const body = await _req.json();
    const { title, content, type, order, duration, isActive } = body;

    const lesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(type !== undefined && { type }),
        ...(order !== undefined && { order: Number(order) }),
        ...(duration !== undefined && { duration: Number(duration) }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ lesson });
  } catch (error) {
    console.error("Admin update lesson API error:", error);
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ courseId: string; moduleId: string; lessonId: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId || !ADMIN_CLERK_IDS.includes(userId)) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    const { lessonId } = await params;

    await prisma.lesson.delete({ where: { id: lessonId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin delete lesson API error:", error);
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
