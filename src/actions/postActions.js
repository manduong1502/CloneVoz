"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { pusherServer } from '@/lib/pusher.server';
import { deleteCache } from '@/lib/redis';
import { checkNodePermission } from '@/lib/permissions';
import { checkRateLimit } from '@/lib/antispam';

export async function createReply(threadId, formData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Chưa đăng nhập");
  const content = formData.get("content");
  if (!content || typeof content !== 'string' || content.trim() === '') throw new Error("Nội dung trống");

  const spamCheck = await checkRateLimit();
  if (!spamCheck.passed) throw new Error(spamCheck.reason);

  const thread = await prisma.thread.findUnique({
     where: { id: threadId },
     select: { nodeId: true, isLocked: true, authorId: true }
  });

  if (!thread) throw new Error("Thread không tồn tại");
  if (thread.isLocked) throw new Error("Thread đã bị khóa, không thể bình luận.");

  const perm = await checkNodePermission(thread.nodeId);
  if (!perm.granted) throw new Error(perm.reason);

  // Đếm số post hiện tại để lấy position cuối
  const currentPostCount = await prisma.post.count({ where: { threadId }});

  // Tạo post
  const newPost = await prisma.post.create({
    data: {
      content: content,
      position: currentPostCount + 1,
      threadId,
      authorId: session.user.id
    }
  });

  // PHÂN TÍCH VÀ GỬI THÔNG BÁO (Mentions / Quote / Watched Thread / Thread Author)
  const mentionedUsernames = [...content.matchAll(/@([a-zA-Z0-9_]+)/g)].map(m => m[1]);
  const uniqueMentions = [...new Set(mentionedUsernames)].filter(name => name !== session.user.username);
  
  const mentionedUserIds = [];
  if (uniqueMentions.length > 0) {
    const usersToNotify = await prisma.user.findMany({ where: { username: { in: uniqueMentions } } });
    usersToNotify.forEach(u => mentionedUserIds.push(u.id));
  }

  // Lấy người theo dõi chủ đề
  const watchers = await prisma.bookmark.findMany({ where: { threadId } });
  
  const userIdsToNotify = new Set();
  mentionedUserIds.forEach(id => userIdsToNotify.add(id));
  if (thread.authorId) userIdsToNotify.add(thread.authorId);
  watchers.forEach(w => userIdsToNotify.add(w.userId));
  
  // Xóa chính mình ra khỏi danh sách nhận
  userIdsToNotify.delete(session.user.id);

  // Bắn thông báo và Pusher
  for (const uid of userIdsToNotify) {
      let type = "reply";
      let text = `${session.user.name} đã bình luận vào bài viết bạn đang theo dõi.`;
      
      if (uid === thread.authorId) {
          text = `${session.user.name} đã bình luận vào bài viết của bạn.`;
      }
      if (mentionedUserIds.includes(uid)) {
          type = "quote";
          text = `${session.user.name} đã nhắc đến bạn trong một bài viết.`;
      }
      
      const notif = await prisma.notification.create({
          data: {
             userId: uid,
             senderId: session.user.id,
             type,
             content: text,
             link: `/thread/${threadId}#post-${newPost.id}`
          },
          include: { sender: { select: { username: true, avatar: true } } }
      });
      
      if (pusherServer) {
         pusherServer.trigger(`user-${uid}`, 'new-notification', notif).catch(e => console.error(e));
      }
  }

  // Cập nhật số liệu Thread
  await prisma.thread.update({
    where: { id: threadId },
    data: { replyCount: { increment: 1 }, updatedAt: new Date() }
  });

  // Cập nhật số liệu User
  await prisma.user.update({
    where: { id: session.user.id },
    data: { messageCount: { increment: 1 } }
  });

  // Xóa rác Cache để Data mới nổi lên
  await deleteCache('voz_homepage_data');
  await deleteCache(`voz_node_${thread.nodeId}_page_1_prefix_none`);

  revalidatePath(`/thread/${threadId}`);
  revalidatePath(`/`);
  
  return { success: true, post: newPost };
}
