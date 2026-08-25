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

export async function POST(
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

    const body = await req.json().catch(() => null);
    const rawContent = body?.content;

    if (!rawContent || typeof rawContent !== "string") {
      return NextResponse.json(
        { success: false, error: "Pesan tidak boleh kosong" },
        { status: 400 }
      );
    }

    const trimmedContent = rawContent.trim();
    if (trimmedContent.length === 0) {
      return NextResponse.json(
        { success: false, error: "Pesan tidak boleh hanya berisi spasi" },
        { status: 400 }
      );
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        userOneId: true,
        userTwoId: true,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: "Percakapan tidak ditemukan" },
        { status: 404 }
      );
    }

    // Pastikan user adalah partisipan
    if (
      conversation.userOneId !== currentUserId &&
      conversation.userTwoId !== currentUserId
    ) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak: Anda bukan partisipan percakapan ini" },
        { status: 403 }
      );
    }

    const [newMessage] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId,
          senderId: currentUserId,
          content: trimmedContent,
        },
        include: {
          sender: { select: USER_SELECT },
        },
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);

    return NextResponse.json(
      { success: true, data: newMessage },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST_MESSAGE_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
