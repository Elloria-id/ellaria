import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/auth";

type RouteContext = {
  params: Promise<{
    conversationId: string;
  }>;
};

export async function POST(
  req: Request,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { conversationId } = await context.params;

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId is required" },
        { status: 400 }
      );
    }

    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
      },
      select: {
        id: true,
        userOneId: true,
        userTwoId: true,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const isUserOne = conversation.userOneId === userId;
    const isUserTwo = conversation.userTwoId === userId;

    if (!isUserOne && !isUserTwo) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const now = new Date();

    const updatedConversation =
      await prisma.conversation.update({
        where: {
          id: conversationId,
        },
        data: isUserOne
          ? {
              lastReadAtOne: now,
            }
          : {
              lastReadAtTwo: now,
            },
        select: {
          id: true,
          lastReadAtOne: true,
          lastReadAtTwo: true,
        },
      });

    return NextResponse.json({
      success: true,
      conversation: updatedConversation,
    });
  } catch (error) {
    console.error(
      "POST /api/chat/[conversationId]/read error:",
      error
    );

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
