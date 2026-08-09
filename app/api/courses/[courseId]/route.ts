import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const courseId = resolvedParams.courseId;

    if (!courseId || typeof courseId !== "string") {
      return NextResponse.json(
        { error: "Invalid course ID" },
        { status: 400 }
      );
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          where: { isActive: true },
          orderBy: { order: "asc" },
          include: {
            lessons: {
              where: { isActive: true },
              orderBy: { order: "asc" },
              select: {
                id: true,
                title: true,
                content: true,
                type: true,
                order: true,
                duration: true,
                isActive: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ course });
  } catch (error) {
    console.error("Course detail API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
