import { prisma } from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher.server';

/**
 * Gửi thông báo đến tất cả Admin và Moderator
 * @param {Object} params
 * @param {string} params.type - Loại thông báo: "admin_pending", "admin_report", ...
 * @param {string} params.content - Nội dung HTML ngắn gọn
 * @param {string} params.link - Link tới trang admin tương ứng
 * @param {string} [params.senderId] - ID người gây ra sự kiện (tùy chọn)
 * @param {string} [params.excludeUserId] - ID user không nhận thông báo (thường là chính người tạo)
 */
export async function notifyAdmins({ type, content, link, senderId = null, excludeUserId = null }) {
  try {
    // Tìm tất cả user thuộc nhóm Admin hoặc Moderator
    const adminMods = await prisma.user.findMany({
      where: {
        userGroups: {
          some: {
            OR: [
              { name: 'Admin' },
              { name: 'Moderator' },
              { canApprove: true }
            ]
          }
        }
      },
      select: { id: true }
    });

    // Loại bỏ chính người tạo sự kiện (nếu có)
    const recipientIds = adminMods
      .map(u => u.id)
      .filter(id => id !== excludeUserId);

    if (recipientIds.length === 0) return;

    // Tạo thông báo hàng loạt
    const notificationsData = recipientIds.map(userId => ({
      userId,
      senderId,
      type,
      content,
      link,
    }));

    await prisma.notification.createMany({ data: notificationsData });

    // Đẩy realtime qua Pusher
    if (pusherServer) {
      const now = new Date().toISOString();
      const promises = recipientIds.map(userId => {
        const payload = {
          id: Math.random().toString(36).substr(2, 9),
          userId,
          senderId,
          type,
          content,
          link,
          isRead: false,
          createdAt: now,
          sender: null, // Admin notifications thường không cần hiển thị sender avatar
        };
        return pusherServer.trigger(`user-${userId}`, 'new-notification', payload).catch(() => {});
      });
      Promise.all(promises).catch(() => {});
    }
  } catch (err) {
    console.error('[adminNotify] Lỗi gửi thông báo admin:', err);
  }
}
