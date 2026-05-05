"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function toggleFollow(targetUserId) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Chưa đăng nhập");
  if (session.user.id === targetUserId) throw new Error("Không thể tự theo dõi chính mình");

  const existing = await prisma.userFollow.findUnique({
    where: {
      followerId_followingId: {
        followerId: session.user.id,
        followingId: targetUserId
      }
    }
  });

  if (existing) {
    // Bỏ theo dõi
    await prisma.userFollow.delete({ where: { id: existing.id } });
    return { success: true, isFollowing: false };
  } else {
    // Theo dõi
    await prisma.userFollow.create({
      data: {
        followerId: session.user.id,
        followingId: targetUserId
      }
    });

    // Gửi thông báo cho người được theo dõi
    const safeName = (session.user.name || '').replace(/[<>"'&]/g, '');
    const notification = await prisma.notification.create({
      data: {
        userId: targetUserId,
        senderId: session.user.id,
        type: "follow",
        content: `<strong>${safeName}</strong> đã theo dõi bạn.`,
        link: `/profile/${encodeURIComponent(session.user.username || session.user.name)}`
      }
    });

    try {
      const { pusherServer } = await import('@/lib/pusher');
      if (pusherServer) {
        pusherServer.trigger(`user-${targetUserId}`, 'new-notification', {
          ...notification,
          id: notification.id,
          createdAt: new Date().toISOString(),
          sender: { username: session.user.username || session.user.name, avatar: session.user.image || null }
        }).catch(() => {});
      }
    } catch (e) {}

    return { success: true, isFollowing: true };
  }
}

export async function checkIsFollowing(targetUserId) {
  const session = await auth();
  if (!session?.user?.id) return false;

  const existing = await prisma.userFollow.findUnique({
    where: {
      followerId_followingId: {
        followerId: session.user.id,
        followingId: targetUserId
      }
    }
  });

  return !!existing;
}
