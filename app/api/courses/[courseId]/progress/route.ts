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
    const { courseId } = resolvedParams;

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
              select: { id: true },
            },
            progress: {
              where: { clerkId: userId },
              select: { completed: true },
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

    const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
    const completedModules = course.modules.filter((m) => m.progress.some((p) => p.completed)).length;

    const moduleProgress = course.modules.map((module) => ({
      id: module.id,
      title: module.title,
      completed: module.progress.some((p) => p.completed),
      totalLessons: module.lessons.length,
    }));

    return NextResponse.json({
      courseId,
      totalModules: course.modules.length,
      completedModules,
      totalLessons,
      moduleProgress,
    });
  } catch (error) {
    console.error("Course progress API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
