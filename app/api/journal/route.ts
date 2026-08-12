import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const entries = await prisma.journal.findMany({
      where: { clerkId: userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        content: true,
        mood: true,
        aiFeedback: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Journal API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const MAX_CONTENT_LENGTH = 5000;
const MOODS = ["Confident", "Neutral", "Anxious", "Frustrated", "Excited"];

function sanitizeString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/[<>]/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const title = sanitizeString(body.title);
    const content = sanitizeString(body.content);
    const mood = sanitizeString(body.mood);

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!content || content.length < 100) {
      return NextResponse.json(
        { error: "Content must be at least 100 characters" },
        { status: 400 }
      );
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: `Content must be less than ${MAX_CONTENT_LENGTH} characters` },
        { status: 400 }
      );
    }

    if (!MOODS.includes(mood)) {
      return NextResponse.json(
        { error: "Invalid mood" },
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

    const entry = await prisma.journal.create({
      data: {
        clerkId: userId,
        title,
        content,
        mood,
      },
    });

    let aiFeedback = null;

    try {
      const anthropicKey = process.env.ANTHROPIC_API_KEY;

      if (!anthropicKey) {
        console.error("ANTHROPIC_API_KEY not set");
      } else {
        console.log("Calling Claude API for journal entry:", entry.id);

        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-6",
            max_tokens: 500,
            messages: [
              {
                role: "user",
                content: `You are a professional trading coach. A trader has written this journal entry: "${content}". Give them specific, actionable feedback in 3-4 sentences. Focus on mindset, risk management, and improvement areas. Be direct and constructive.`,
              },
            ],
          }),
        });

        console.log("Claude response status:", response.status);

        const responseText = await response.text();

        if (!response.ok) {
          console.error("Claude API error response:", responseText);
          throw new Error("Claude API failed: " + response.status);
        }

        const data = JSON.parse(responseText);
        console.log("Claude response body:", JSON.stringify(data));

        const feedback = data.content?.[0]?.text ?? null;
        if (feedback) {
          aiFeedback = feedback;
          await prisma.journal.update({
            where: { id: entry.id },
            data: { aiFeedback: feedback },
          });
        } else {
          console.error("Claude response missing content.text:", JSON.stringify(data));
        }
      }
    } catch (aiError) {
      console.error("Claude API error:", aiError);
    }

    return NextResponse.json(
      { entry: { ...entry, aiFeedback } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Journal creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
