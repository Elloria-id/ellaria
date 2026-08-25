import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          {
            userOneId: userId,
          },
          {
            userTwoId: userId,
          },
        ],
      },
      select: {
        id: true,
        userOneId: true,
        userTwoId: true,
        lastReadAtOne: true,
        lastReadAtTwo: true,
      },
    });

    const unreadByConversation = await Promise.all(
      conversations.map(async (conversation) => {
        const isUserOne =
          conversation.userOneId === userId;

        const lastReadAt = isUserOne
          ? conversation.lastReadAtOne
          : conversation.lastReadAtTwo;

        const unreadCount =
          await prisma.message.count({
            where: {
              conversationId: conversation.id,
              senderId: {
                not: userId,
              },
              ...(lastReadAt
                ? {
                    createdAt: {
                      gt: lastReadAt,
                    },
                  }
                : {}),
            },
          });

        return {
          conversationId: conversation.id,
          unreadCount,
        };
      })
    );

    const totalUnread = unreadByConversation.reduce(
      (total, conversation) =>
        total + conversation.unreadCount,
      0
    );

    return NextResponse.json({
      totalUnread,
      conversations: unreadByConversation,
    });
  } catch (error) {
    console.error(
      "GET /api/chat/unread error:",
      error
    );

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
