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
  if (!session?.user?.id) return { error: "Vui lòng đăng nhập để chat." };
  if (!content || typeof content !== 'string' || content.trim() === '') return { error: "Tin nhắn không hợp lệ." };
  if (content.length > 500) return { error: "Tin nhắn quá dài (tối đa 500 ký tự)." };

  // Xóa giới hạn spam chat theo yêu cầu của Sếp (không giới hạn thời gian chat)
  // const spamCheck = await checkRateLimit(); // Tắt Spam Check
  
  // Chống spam: không cho chèn link bậy (block mọi URL để an toàn)
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/|\b))/i;
  if (urlRegex.test(content)) {
    return { error: "Không được chèn link vào kênh chat chung." };
  }

  // Chống spam: không cho gửi nội dung giống hệt tin nhắn vừa gửi
  const lastUserMessage = await prisma.shoutboxMessage.findFirst({
    where: { authorId: session.user.id },
    orderBy: { createdAt: 'desc' }
  });

  if (lastUserMessage && lastUserMessage.content === content.trim()) {
    return { error: "Bạn vừa gửi nội dung này rồi, vui lòng không spam." };
  }
  
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
    return { error: "Lỗi máy chủ." };
  }
}

export async function deleteShout(messageId) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Vui lòng đăng nhập." };

  const message = await prisma.shoutboxMessage.findUnique({
    where: { id: messageId },
    include: { author: true }
  });

  if (!message) return { error: "Không tìm thấy tin nhắn." };

  // Quyền xóa: chính chủ, hoặc là Admin/Mod
  const isOwner = message.authorId === session.user.id;
  const isAdminOrMod = session.user.isAdmin || session.user.isMod;

  if (!isOwner && !isAdminOrMod) {
    return { error: "Bạn không có quyền xóa tin nhắn này." };
  }

  await prisma.shoutboxMessage.delete({
    where: { id: messageId }
  });

  // Bắn Pusher để client tự động xóa
  await pusherServer.trigger('global-chat', 'delete-shout', { messageId });

  return { success: true };
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
