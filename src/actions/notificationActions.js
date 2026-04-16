"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function markAllNotificationsAsRead() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Chưa đăng nhập");

  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true }
  });

  return { success: true };
}

export async function markNotificationAsRead(notificationId) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Chưa đăng nhập");

  await prisma.notification.update({
    where: { id: notificationId, userId: session.user.id },
    data: { isRead: true }
  });

  return { success: true };
}
