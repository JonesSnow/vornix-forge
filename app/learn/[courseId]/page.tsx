import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import CourseClient from "./CourseClient";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { courseId } = await params;

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
              moduleId: true,
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
    notFound();
  }

  const serializedCourse = {
    ...course,
    createdAt: course.createdAt.toISOString(),
    modules: course.modules.map((module) => ({
      ...module,
      createdAt: module.createdAt.toISOString(),
      lessons: module.lessons.map((lesson) => ({
        ...lesson,
        createdAt: lesson.createdAt.toISOString(),
      })),
    })),
  };

  return <CourseClient courseId={courseId} initialCourse={serializedCourse} />;
}
