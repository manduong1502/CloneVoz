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

  const newThread = await prisma.thread.create({
    data: {
      title,
      nodeId,
      authorId: session.user.id,
      viewCount: 0,
      replyCount: 0,
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

  // Cập nhật User
  await prisma.user.update({
    where: { id: session.user.id },
    data: { messageCount: { increment: 1 } }
  });

  // Thông báo cho những người đang theo dõi Node
  const nodeWatchers = await prisma.bookmark.findMany({ where: { nodeId } });
  const watcherIds = new Set(nodeWatchers.map(w => w.userId));
  watcherIds.delete(session.user.id);
  
  const nodeName = await prisma.node.findUnique({ where: { id: nodeId }, select: { title: true }});
  
  for (const uid of watcherIds) {
      const notif = await prisma.notification.create({
          data: {
             userId: uid,
             senderId: session.user.id,
             type: "reply",
             content: `${session.user.name} đã tạo một chủ đề mới trong chuyên mục ${nodeName?.title || 'bạn đang theo dõi'}.`,
             link: `/thread/${newThread.id}`
          },
          include: { sender: { select: { username: true, avatar: true } } }
      });
      
      if (pusherServer) {
         pusherServer.trigger(`user-${uid}`, 'new-notification', notif).catch(e => console.error(e));
      }
  }

  // Dọn Redis Cache
  await deleteCache('voz_homepage_data');
  await deleteCache(`voz_node_${nodeId}_page_1_prefix_none`);

  revalidatePath(`/category/${nodeId}`);
  revalidatePath(`/`);

  redirect(`/thread/${newThread.id}`);
}
