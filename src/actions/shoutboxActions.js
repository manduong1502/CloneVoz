"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { pusherServer } from '@/lib/pusher.server';
import { checkRateLimit } from '@/lib/antispam';

export async function getRecentShouts() {
  try {
    const messages = await prisma.shoutboxMessage.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: { 
        author: { select: { id: true, username: true, avatar: true, customTitle: true } },
        reactions: true
      }
    });
    return { success: true, messages: messages.reverse() };
  } catch (err) {
    return { error: "Không thể tải tin nhắn" };
  }
}

export async function postShout(content) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Vui lòng đăng nhập để chat.");
  if (!content || typeof content !== 'string' || content.trim() === '') throw new Error("Tin nhắn không hợp lệ.");
  if (content.length > 500) throw new Error("Tin nhắn quá dài (tối đa 500 ký tự).");

  // Xóa giới hạn spam chat theo yêu cầu của Sếp (không giới hạn thời gian chat)
  // const spamCheck = await checkRateLimit(); // Tắt Spam Check
  
  try {
    const newShout = await prisma.shoutboxMessage.create({
      data: {
        content: content.trim(),
        authorId: session.user.id
      },
      include: { author: { select: { id: true, username: true, avatar: true, customTitle: true } } }
    });

    // Kích nổ Pusher để bắn tin nhắn cho toàn cõi server
    await pusherServer.trigger('global-chat', 'new-shout', newShout);

    return { success: true, shout: { ...newShout, reactions: [] } };
  } catch (err) {
    console.error(err);
    throw new Error("Lỗi máy chủ.");
  }
}

export async function toggleShoutboxReaction(messageId, type) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Chưa đăng nhập.");

  try {
    const existingReaction = await prisma.shoutboxReaction.findUnique({
      where: {
        shoutboxMessageId_userId: {
          shoutboxMessageId: messageId,
          userId: session.user.id
        }
      }
    });

    let newReaction = null;
    let action = 'removed';

    if (existingReaction) {
      if (existingReaction.type === type) {
        // Tắt reaction
        await prisma.shoutboxReaction.delete({
          where: { id: existingReaction.id }
        });
      } else {
        // Đổi reaction
        newReaction = await prisma.shoutboxReaction.update({
          where: { id: existingReaction.id },
          data: { type }
        });
        action = 'updated';
      }
    } else {
      // Thêm mới
      newReaction = await prisma.shoutboxReaction.create({
        data: {
          shoutboxMessageId: messageId,
          userId: session.user.id,
          type
        }
      });
      action = 'added';
    }

    // Lấy lại danh sách reactions mới nhất của message này để bắn realtime
    const messageReactions = await prisma.shoutboxReaction.findMany({
      where: { shoutboxMessageId: messageId }
    });

    await pusherServer.trigger('global-chat', 'shout-reaction', {
      messageId,
      reactions: messageReactions
    });

    return { success: true, action, reactions: messageReactions };
  } catch (error) {
    console.error(error);
    throw new Error("Lỗi hệ thống khi thả cảm xúc");
  }
}
