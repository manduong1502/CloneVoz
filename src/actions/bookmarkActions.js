"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function toggleWatchThread(threadId) {
  const session = await auth();
  if (!session?.user) throw new Error("Chưa đăng nhập");

  const existing = await prisma.bookmark.findFirst({
    where: {
      userId: session.user.id,
      threadId: threadId
    }
  });

  if (existing) {
    // Unwatch
    await prisma.bookmark.delete({ where: { id: existing.id } });
  } else {
    // Watch
    await prisma.bookmark.create({
      data: {
        userId: session.user.id,
        threadId: threadId
      }
    });
  }

  revalidatePath(`/thread/${threadId}`);
  revalidatePath('/watched/threads');
  
  return { success: true, isWatching: !existing };
}

export async function toggleWatchNode(nodeId) {
  const session = await auth();
  if (!session?.user) throw new Error("Chưa đăng nhập");

  const existing = await prisma.bookmark.findFirst({
    where: {
      userId: session.user.id,
      nodeId: nodeId
    }
  });

  if (existing) {
    // Unwatch
    await prisma.bookmark.delete({ where: { id: existing.id } });
  } else {
    // Watch
    await prisma.bookmark.create({
      data: {
        userId: session.user.id,
        nodeId: nodeId
      }
    });
  }

  revalidatePath(`/category/${nodeId}`);
  revalidatePath('/watched/nodes');
  
  return { success: true, isWatching: !existing };
}
