"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkNodePermission } from '@/lib/permissions';
import { checkRateLimit } from '@/lib/antispam';

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
      content: `<p>${content}</p>`,
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

  revalidatePath(`/category/${nodeId}`);
  revalidatePath(`/`);

  redirect(`/thread/${newThread.id}`);
}
