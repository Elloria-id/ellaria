import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/auth";

type RouteContext = {
  params: Promise<{
    conversationId: string;
  }>;
};

export async function GET(
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
        createdAt: true,
        updatedAt: true,
        userOne: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        userTwo: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const isParticipant =
      conversation.userOneId === userId ||
      conversation.userTwoId === userId;

    if (!isParticipant) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);

    const limitParam = Number(
      searchParams.get("limit") ?? "50"
    );

    const limit = Math.min(
      Math.max(Number.isNaN(limitParam) ? 50 : limitParam, 1),
      100
    );

    const before = searchParams.get("before");

    let beforeDate: Date | undefined;

    if (before) {
      const parsedDate = new Date(before);

      if (Number.isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid before date" },
          { status: 400 }
        );
      }

      beforeDate = parsedDate;
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        ...(beforeDate
          ? {
              createdAt: {
                lt: beforeDate,
              },
            }
          : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit + 1,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    const hasMore = messages.length > limit;

    const paginatedMessages = hasMore
      ? messages.slice(0, limit)
      : messages;

    const orderedMessages = paginatedMessages.reverse();

    const nextBefore =
      hasMore && orderedMessages.length > 0
        ? orderedMessages[0].createdAt.toISOString()
        : null;

    const otherUser =
      conversation.userOneId === userId
        ? conversation.userTwo
        : conversation.userOne;

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        otherUser,
      },
      messages: orderedMessages,
      pagination: {
        limit,
        hasMore,
        nextBefore,
      },
    });
  } catch (error) {
    console.error(
      "GET /api/chat/[conversationId] error:",
      error
    );

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
