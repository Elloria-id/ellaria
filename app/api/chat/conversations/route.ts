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
      orderBy: {
        updatedAt: "desc",
      },
      include: {
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
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            id: true,
            content: true,
            senderId: true,
            createdAt: true,
          },
        },
      },
    });

    const result = conversations.map((conversation) => {
      const otherUser =
        conversation.userOneId === userId
          ? conversation.userTwo
          : conversation.userOne;

      const lastMessage = conversation.messages[0] ?? null;

      return {
        id: conversation.id,
        user: otherUser,
        lastMessage,
        updatedAt: conversation.updatedAt,
      };
    });

    return NextResponse.json({
      conversations: result,
    });
  } catch (error) {
    console.error("GET /api/chat/conversations error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
