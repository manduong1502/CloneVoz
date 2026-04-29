"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pusherServer } from '@/lib/pusher.server';
import { deleteCache } from '@/lib/redis';
import { checkNodePermission } from '@/lib/permissions';
import { checkRateLimit, verifyTurnstile } from '@/lib/antispam';

export async function createThread(nodeId, formData) {
  const session = await auth();
  if (!session?.user) throw new Error("Chưa đăng nhập");

  const spamCheck = await checkRateLimit();
  if (!spamCheck.passed) throw new Error(spamCheck.reason);

  const perm = await checkNodePermission(nodeId);
  if (!perm.granted) throw new Error(perm.reason);

  const title = formData.get("title");
  const content = formData.get("content");
  
  if (!title || !content) throw new Error("Vui lòng nhập đủ Tiêu đề và Nội dung");

  const turnstileToken = formData.get("turnstileToken");
  const tsCheck = await verifyTurnstile(turnstileToken);
  if (!tsCheck.success) throw new Error(tsCheck.error);

  // Kiểm tra xem user có quyền auto-approve không (Admin/Mod)
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { userGroups: true }
  });
  const autoApprove = currentUser?.userGroups.some(g => g.name === 'Admin' || g.name === 'Moderator' || g.canApprove) || false;

  const newThread = await prisma.thread.create({
    data: {
      title,
      nodeId,
      authorId: session.user.id,
      viewCount: 0,
      replyCount: 0,
      isApproved: true,
    }
  });

  await prisma.post.create({
    data: {
      content: content,
      position: 1,
      threadId: newThread.id,
      authorId: session.user.id
    }
  });

  // Cập nhật số liệu Box
  await prisma.node.update({
     where: { id: nodeId },
     data: { threadsCount: { increment: 1 }, postsCount: { increment: 1 } }
  });

  // Cập nhật User: +1 messageCount
  await prisma.user.update({
    where: { id: session.user.id },
    data: { messageCount: { increment: 1 } }
  });

  // Thông báo cho những người đang theo dõi Node
  const nodeWatchers = await prisma.bookmark.findMany({ where: { nodeId } });
  const watcherIds = new Set(nodeWatchers.map(w => w.userId));
  watcherIds.delete(session.user.id);
  
  const nodeName = await prisma.node.findUnique({ where: { id: nodeId }, select: { title: true }});
  
  const notificationsData = [];
  const pusherPromises = [];

  const safeName = (session.user.name || '').replace(/[<>"'&]/g, '');
  const safeNodeTitle = (nodeName?.title || 'bạn đang theo dõi').replace(/[<>"'&]/g, '');
  for (const uid of watcherIds) {
      notificationsData.push({
          userId: uid,
          senderId: session.user.id,
          type: "reply",
          content: `<strong>${safeName}</strong> đã tạo một chủ đề mới trong chuyên mục ${safeNodeTitle}.`,
          link: `/thread/${newThread.id}`
      });
  }

  if (notificationsData.length > 0) {
      // Lưu toàn bộ notification vào DB trong 1 Query
      await prisma.notification.createMany({
          data: notificationsData
      });

      if (pusherServer) {
         notificationsData.forEach(notif => {
             const payload = {
                 ...notif, 
                 id: Math.random().toString(36).substr(2, 9), 
                 sender: { username: session.user.username, avatar: session.user.avatar || null }
             };
             pusherPromises.push(pusherServer.trigger(`user-${notif.userId}`, 'new-notification', payload).catch(e => {}));
         });
         Promise.all(pusherPromises).catch(console.error);
      }
  }

  // Dọn Redis Cache
  await deleteCache('voz_homepage_data');
  await deleteCache(`voz_node_${nodeId}_page_1_prefix_none`);

  revalidatePath(`/category/${nodeId}`);
  revalidatePath(`/`);

  redirect(`/thread/${newThread.id}`);
}
