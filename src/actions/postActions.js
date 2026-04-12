"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function createReply(threadId, formData) {
  const session = await auth();
  if (!session?.user) throw new Error("Chưa đăng nhập");

  const content = formData.get("content");
  if (!content) throw new Error("Nội dung trống");

  // Đếm số post hiện tại để lấy position cuối
  const currentPostCount = await prisma.post.count({ where: { threadId }});

  // Tạo post
  const newPost = await prisma.post.create({
    data: {
      content: `<p>${content}</p>`,
      position: currentPostCount + 1,
      threadId,
      authorId: session.user.id
    }
  });

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
