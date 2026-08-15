import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ADMIN_CLERK_IDS } from "@/lib/constants";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId || !ADMIN_CLERK_IDS.includes(userId)) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    const { courseId } = await params;

    const body = await req.json();
    const { title, description, level, order, isActive } = body;

    const course = await prisma.course.update({
      where: { id: courseId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(level !== undefined && { level: Number(level) }),
        ...(order !== undefined && { order: Number(order) }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ course });
  } catch (error) {
    console.error("Admin update course API error:", error);
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId || !ADMIN_CLERK_IDS.includes(userId)) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    const { courseId } = await params;

    await prisma.course.delete({ where: { id: courseId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin delete course API error:", error);
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
