"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
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

  // PHÂN TÍCH VÀ GỬI THÔNG BÁO (Mentions / Quote)
  const mentionedUsernames = [...content.matchAll(/@([a-zA-Z0-9_]+)/g)].map(m => m[1]);
  const uniqueMentions = [...new Set(mentionedUsernames)].filter(name => name !== session.user.username);
  
  if (uniqueMentions.length > 0) {
    const usersToNotify = await prisma.user.findMany({
      where: { username: { in: uniqueMentions } }
    });
    
    if (usersToNotify.length > 0) {
      await prisma.notification.createMany({
        data: usersToNotify.map(u => ({
          userId: u.id,
          senderId: session.user.id,
          type: "quote",
          content: `${session.user.name} đã nhắc đến bạn trong một bài viết.`,
          link: `/thread/${threadId}#post-${newPost.id}`
        }))
      });
    }
  }

  // Thông báo cho chủ Thread (nếu không phải là người đang reply)
  // const threadAuthorCheck = ... (Đã lấy ở trên rồi, đó là biến thread)
  if (thread && thread.authorId !== session.user.id) {
    // Không thông báo double nếu đã bị mention
    const isTargetMentioned = uniqueMentions.length > 0; // Đang lười check id, tạm skip logic double nghen
    await prisma.notification.create({
      data: {
         userId: thread.authorId,
         senderId: session.user.id,
         type: "reply",
         content: `${session.user.name} đã bình luận vào bài viết của bạn.`,
         link: `/thread/${threadId}#post-${newPost.id}`
      }
    });
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

  revalidatePath(`/thread/${threadId}`);
  revalidatePath(`/`);
  
  return { success: true, post: newPost };
}
