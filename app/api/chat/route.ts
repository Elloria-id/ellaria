import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/auth";
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const otherUserId = searchParams.get("userId");
    const conversationId = searchParams.get("conversationId");

    if (conversationId) {
      const conversation = await prisma.conversation.findUnique({
        where: {
          id: conversationId,
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
              createdAt: "asc",
            },
            include: {
              sender: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                },
              },
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
        conversation.userOneId === session.user.id ||
        conversation.userTwoId === session.user.id;

      if (!isParticipant) {
        return NextResponse.json(
          { error: "Forbidden" },
          { status: 403 }
        );
      }

      return NextResponse.json({
        conversation,
      });
    }

    if (!otherUserId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    if (otherUserId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot chat with yourself" },
        { status: 400 }
      );
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          {
            userOneId: session.user.id,
            userTwoId: otherUserId,
          },
          {
            userOneId: otherUserId,
            userTwoId: session.user.id,
          },
        ],
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
            createdAt: "asc",
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({
        conversation: null,
        messages: [],
      });
    }

    return NextResponse.json({
      conversation,
      messages: conversation.messages,
    });
  } catch (error) {
    console.error("GET /api/chat error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const { userId, conversationId, content } = body;

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    const trimmedContent = content.trim();

    if (!trimmedContent) {
      return NextResponse.json(
        { error: "Message cannot be empty" },
        { status: 400 }
      );
    }

    if (trimmedContent.length > 5000) {
      return NextResponse.json(
        { error: "Message is too long" },
        { status: 400 }
      );
    }

    let conversation;

    if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: {
          id: conversationId,
        },
      });

      if (!conversation) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }

      const isParticipant =
        conversation.userOneId === session.user.id ||
        conversation.userTwoId === session.user.id;

      if (!isParticipant) {
        return NextResponse.json(
          { error: "Forbidden" },
          { status: 403 }
        );
      }
    } else {
      if (!userId || typeof userId !== "string") {
        return NextResponse.json(
          { error: "userId is required" },
          { status: 400 }
        );
      }

      if (userId === session.user.id) {
        return NextResponse.json(
          { error: "You cannot chat with yourself" },
          { status: 400 }
        );
      }

      const targetUser = await prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
          isBanned: true,
        },
      });

      if (!targetUser) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      if (targetUser.isBanned) {
        return NextResponse.json(
          { error: "This user is banned" },
          { status: 403 }
        );
      }

      conversation = await prisma.conversation.findFirst({
        where: {
          OR: [
            {
              userOneId: session.user.id,
              userTwoId: userId,
            },
            {
              userOneId: userId,
              userTwoId: session.user.id,
            },
          ],
        },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            userOneId: session.user.id,
            userTwoId: userId,
          },
        });
      }
    }

    const message = await prisma.$transaction(async (tx) => {
      const createdMessage = await tx.message.create({
        data: {
          conversationId: conversation.id,
          senderId: session.user.id,
          content: trimmedContent,
        },
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

      await tx.conversation.update({
        where: {
          id: conversation.id,
        },
        data: {
          updatedAt: new Date(),
        },
      });

      return createdMessage;
    });

    return NextResponse.json(
      {
        success: true,
        conversationId: conversation.id,
        message,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/chat error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
