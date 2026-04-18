"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { pusherServer } from '@/lib/pusher.server';

export async function createConversation(formData) {
  const session = await auth();
  if (!session?.user) throw new Error("Chưa đăng nhập");

  const toUsername = formData.get("toUsername");
  const title = formData.get("title");
  const content = formData.get("content");

  if (!toUsername || !title || !content) {
    throw new Error("Thiếu thông tin");
  }

  // Lấy User nhận
  const targetUser = await prisma.user.findUnique({
    where: { username: toUsername }
  });

  if (!targetUser) {
    throw new Error("Không tìm thấy người dùng này");
  }

  if (targetUser.id === session.user.id) {
    throw new Error("Không thể tự nhắn cho chính mình");
  }

  // Tạo Conversation, gắn cả 2 vào participants
  const conversation = await prisma.conversation.create({
    data: {
      title,
      participants: {
        connect: [{ id: session.user.id }, { id: targetUser.id }]
      },
      messages: {
        create: {
          content,
          authorId: session.user.id
        }
      }
    },
    include: {
      messages: true
    }
  });

  // Cập nhật lastMessageId
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageId: conversation.messages[0].id }
  });

  // (Optional) Bắn Notification cho người nhận là có tin nhắn mới
  const notif = await prisma.notification.create({
    data: {
      type: "pm",
      content: `${session.user.name} đã gửi cho bạn một tin nhắn cá nhân: "${title}".`,
      userId: targetUser.id,
      senderId: session.user.id,
      link: `/conversations/${conversation.id}`
    },
    include: { sender: { select: { username: true, avatar: true } } }
  });

  if (pusherServer) {
    pusherServer.trigger(`user-${targetUser.id}`, 'new-notification', notif).catch(e => console.error(e));
  }

  revalidatePath('/conversations');
  return { success: true, conversationId: conversation.id };
}

export async function replyToConversation(conversationId, formData) {
  const session = await auth();
  if (!session?.user) throw new Error("Chưa đăng nhập");

  const content = formData.get("content");
  if (!content) throw new Error("Nội dung trống");

  // Đảm bảo user có trong conversation này
  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { participants: true }
  });

  if (!conv) throw new Error("Không tìm thấy cuộc trò chuyện");
  const isParticipant = conv.participants.some(p => p.id === session.user.id);
  if (!isParticipant) throw new Error("Bạn không có quyền chat ở đây");

  const newMessage = await prisma.conversationMessage.create({
    data: {
      content,
      conversationId,
      authorId: session.user.id
    }
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageId: newMessage.id, updatedAt: new Date() }
  });

  revalidatePath(`/conversations/${conversationId}`);
  revalidatePath('/conversations');

  // Gửi thông báo cho TẤT CẢ các bên còn lại
  const others = conv.participants.filter(p => p.id !== session.user.id);
  for (const u of others) {
      const notif = await prisma.notification.create({
          data: {
              userId: u.id,
              senderId: session.user.id,
              type: "pm_reply",
              content: `${session.user.name} đã trả lời trong hộp thư: "${conv.title}".`,
              link: `/conversations/${conversationId}#msg-${newMessage.id}`
          },
          include: { sender: { select: { username: true, avatar: true } } }
      });

      if (pusherServer) {
          pusherServer.trigger(`user-${u.id}`, 'new-notification', notif).catch(e => console.error(e));
      }
  }

  return { success: true };
}
