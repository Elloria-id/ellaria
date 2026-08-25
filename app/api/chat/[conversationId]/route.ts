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

export async function GET(
  req: Request,
  context: { params: Promise<{ conversationId: string }> | { conversationId: string } }
) {
  try {
    const params = await context.params;
    const conversationId = params.conversationId;

    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: "conversationId diperlukan" },
        { status: 400 }
      );
    }

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

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        userOne: { select: USER_SELECT },
        userTwo: { select: USER_SELECT },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: "Percakapan tidak ditemukan" },
        { status: 404 }
      );
    }

    // Pastikan user adalah salah satu partisipan
    if (
      conversation.userOneId !== currentUserId &&
      conversation.userTwoId !== currentUserId
    ) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak: Anda bukan partisipan percakapan ini" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 50, 1), 100) : 50;

    const messages = await prisma.message.findMany({
      where: { conversationId },
      take: limit,
      orderBy: { createdAt: "asc" },
      include: {
        sender: { select: USER_SELECT },
      },
    });

    const isUserOne = conversation.userOneId === currentUserId;
    const opponent = isUserOne ? conversation.userTwo : conversation.userOne;

    return NextResponse.json({
      success: true,
      data: {
        conversation: {
          id: conversation.id,
          opponent,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
        },
        messages,
      },
    });
  } catch (error) {
    console.error("[GET_MESSAGES_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
