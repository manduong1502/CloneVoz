"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { notifyAdmins } from '@/lib/adminNotify';

export async function submitReport({ reason, postId, threadId, shoutboxMessageId }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Vui lòng đăng nhập để gửi báo cáo.");
  if (!reason || reason.trim() === "") throw new Error("Lý do không được để trống.");
  if (!postId && !threadId && !shoutboxMessageId) throw new Error("Lỗi: Không tìm thấy đối tượng báo cáo.");

  // Check if already reported and pending
  const existingReport = await prisma.report.findFirst({
     where: {
        reporterId: session.user.id,
        postId: postId || null,
        threadId: threadId || null,
        shoutboxMessageId: shoutboxMessageId || null,
        status: "pending"
     }
  });

  if (existingReport) {
     throw new Error("Bạn đã báo cáo nội dung này rồi. Vui lòng chờ Mod xử lý.");
  }

  await prisma.report.create({
    data: {
      reason,
      reporterId: session.user.id,
      postId: postId || null,
      threadId: threadId || null,
      shoutboxMessageId: shoutboxMessageId || null
    }
  });

  // Thông báo Admin/Mod có report mới
  const safeName = (session.user.name || session.user.username || '').replace(/[<>"'&]/g, '');
  const safeReason = (reason || '').substring(0, 50).replace(/[<>"'&]/g, '');
  await notifyAdmins({
    type: 'admin_report',
    content: `🚨 <strong>${safeName}</strong> vừa gửi một báo cáo vi phạm: "${safeReason}"`,
    link: '/admin/reports',
    senderId: session.user.id,
    excludeUserId: session.user.id,
  });

  return { success: true };
}

// Hàm dành riêng cho Mod xử lý Report
export async function resolveReportAndWarn({ reportId, warningReason, warningPoints, targetUserId }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Chưa đăng nhập");

  // Kiểm tra quyền Admin/Mod
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { userGroups: true }
  });
  const isAdmin = currentUser?.userGroups.some(g => g.name === 'Admin');
  const isMod = currentUser?.userGroups.some(g => g.name === 'Moderator');
  if (!isAdmin && !isMod) throw new Error("Bạn không có quyền xử lý báo cáo.");

  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId }});
  if (!targetUser) throw new Error("Không tìm thấy người dùng");

  // 1. Phạt (Tạo Warning)
  await prisma.warning.create({
    data: {
       reason: warningReason,
       points: parseInt(warningPoints) || 1,
       userId: targetUserId,
       issuerId: session.user.id
    }
  });

  // 2. Chuyển trạng thái Report thành Resolved
  await prisma.report.update({
    where: { id: reportId },
    data: { 
       status: "resolved",
       assignedToId: session.user.id 
    }
  });

  // 3. Update User Banned Status nếu điểm vượt mức (Ví dụ > 3)
  const allWarnings = await prisma.warning.findMany({ where: { userId: targetUserId } });
  const totalPoints = allWarnings.reduce((sum, w) => sum + w.points, 0);

  if (totalPoints >= 3) {
     await prisma.user.update({
        where: { id: targetUserId },
        data: { isBanned: true }
     });
     // Optional: Bắn thông báo Ban nếu có cơ chế
  }

  revalidatePath('/admin/reports');
  return { success: true, banned: totalPoints >= 3 };
}

export async function rejectReport(reportId) {
   const session = await auth();
   if (!session?.user?.id) throw new Error("Chưa đăng nhập");

   // Kiểm tra quyền Admin/Mod
   const currentUser = await prisma.user.findUnique({
     where: { id: session.user.id },
     include: { userGroups: true }
   });
   const isAdmin = currentUser?.userGroups.some(g => g.name === 'Admin');
   const isMod = currentUser?.userGroups.some(g => g.name === 'Moderator');
   if (!isAdmin && !isMod) throw new Error("Bạn không có quyền xử lý báo cáo.");

   await prisma.report.update({
      where: { id: reportId },
      data: {
         status: "rejected",
         assignedToId: session.user.id
      }
   });

   revalidatePath('/admin/reports');
   return { success: true };
}
