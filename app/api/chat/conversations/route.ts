import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const USER_SELECT = {
  id: true,
  username: true,
  avatar: true,
  bio: true,
  role: true,
};

// GET: Ambil daftar conversation milik user yang sedang login
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email && !session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    let currentUserId = (session.user as { id?: string }).id;
    if (!currentUserId && session.user.email) {
      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      currentUserId = dbUser?.id;
    }

    if (!currentUserId) {
      return NextResponse.json(
        { success: false, error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { userOneId: currentUserId },
          { userTwoId: currentUserId },
        ],
      },
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        userOne: { select: USER_SELECT },
        userTwo: { select: USER_SELECT },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: { sender: { select: USER_SELECT } },
        },
      },
    });

    const formattedConversations = conversations.map((conv) => {
      const isUserOne = conv.userOneId === currentUserId;
      const opponent = isUserOne ? conv.userTwo : conv.userOne;
      const lastMessage = conv.messages[0] || null;

      return {
        id: conv.id,
        opponent,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              senderId: lastMessage.senderId,
              sender: lastMessage.sender,
              createdAt: lastMessage.createdAt,
            }
          : null,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedConversations,
    });
  } catch (error) {
    console.error("[GET_CONVERSATIONS_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST: Cari conversation existing atau buat baru dengan user tujuan
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email && !session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    let currentUserId = (session.user as { id?: string }).id;
    if (!currentUserId && session.user.email) {
      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      currentUserId = dbUser?.id;
    }

    if (!currentUserId) {
      return NextResponse.json(
        { success: false, error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    const body = await req.json().catch(() => null);
    const targetUserId = body?.userId;

    if (!targetUserId || typeof targetUserId !== "string") {
      return NextResponse.json(
        { success: false, error: "userId tujuan wajib diisi" },
        { status: 400 }
      );
    }

    if (targetUserId === currentUserId) {
      return NextResponse.json(
        { success: false, error: "Tidak dapat membuat percakapan dengan diri sendiri" },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: USER_SELECT,
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "User tujuan tidak ditemukan" },
        { status: 404 }
      );
    }

    // Urutkan ID secara alfabetis untuk keunikan composite key [userOneId, userTwoId]
    const [userOneId, userTwoId] =
      currentUserId < targetUserId
        ? [currentUserId, targetUserId]
        : [targetUserId, currentUserId];

    let conversation = await prisma.conversation.findUnique({
      where: {
        userOneId_userTwoId: {
          userOneId,
          userTwoId,
        },
      },
      include: {
        userOne: { select: USER_SELECT },
        userTwo: { select: USER_SELECT },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: { sender: { select: USER_SELECT } },
        },
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userOneId,
          userTwoId,
        },
        include: {
          userOne: { select: USER_SELECT },
          userTwo: { select: USER_SELECT },
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
            include: { sender: { select: USER_SELECT } },
          },
        },
      });
    }

    const isUserOne = conversation.userOneId === currentUserId;
    const opponent = isUserOne ? conversation.userTwo : conversation.userOne;

    return NextResponse.json({
      success: true,
      data: {
        id: conversation.id,
        opponent,
        lastMessage: conversation.messages[0] || null,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
    });
  } catch (error) {
    console.error("[POST_CONVERSATION_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
