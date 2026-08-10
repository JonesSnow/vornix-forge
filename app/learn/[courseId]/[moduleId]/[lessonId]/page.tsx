import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import LessonClient from "./LessonClient";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; moduleId: string; lessonId: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { courseId, moduleId, lessonId } = await params;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId, isActive: true },
    include: {
      module: {
        select: {
          id: true,
          title: true,
          createdAt: true,
          courseId: true,
          course: {
            select: {
              id: true,
              title: true,
            },
          },
          lessons: {
            where: { isActive: true },
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              type: true,
              order: true,
              duration: true,
            },
          },
        },
      },
    },
  });

  if (!lesson || lesson.module.courseId !== courseId || lesson.module.id !== moduleId) {
    notFound();
  }

  const serializedLesson = {
    ...lesson,
    createdAt: lesson.createdAt.toISOString(),
    module: {
      ...lesson.module,
      createdAt: lesson.module.createdAt.toISOString(),
      course: {
        ...lesson.module.course,
      },
      lessons: lesson.module.lessons.map((l) => ({
        ...l,
      })),
    },
  };

  return (
    <LessonClient
      courseId={courseId}
      moduleId={moduleId}
      lessonId={lessonId}
      initialLesson={serializedLesson}
    />
  );
}
