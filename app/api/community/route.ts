import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { sanitizeString } from "@/lib/utils/sanitize";
import { checkRateLimit } from "@/lib/utils/rateLimit";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const posts = await prisma.communityPost.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
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
    console.error("Community API error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

const MAX_CONTENT_LENGTH = 1000;

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    if (!checkRateLimit(`community:${userId}`, 5, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Max 5 posts per hour.", code: "RATE_LIMIT_EXCEEDED" },
        { status: 429 }
      );
    }

    const body = await req.json();
    const content = sanitizeString(body.content);

    if (!content) {
      return NextResponse.json(
        { error: "Content is required", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: `Content must be less than ${MAX_CONTENT_LENGTH} characters`, code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    if (content.length < 10) {
      return NextResponse.json(
        { error: "Content must be at least 10 characters", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    await prisma.profile.upsert({
      where: { clerkId: userId },
      create: {
        clerkId: userId,
        onboardingDone: false,
      },
      update: {},
    });

    const post = await prisma.communityPost.create({
      data: {
        clerkId: userId,
        content,
      },
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

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("Community post creation error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
