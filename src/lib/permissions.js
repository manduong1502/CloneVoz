import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function checkNodePermission(nodeId) {
  const node = await prisma.node.findUnique({
    where: { id: nodeId },
    select: { minAccountAgeDays: true, minMessageCount: true, title: true }
  });

  if (!node) return { granted: false, reason: "Box không tồn tại." };

  // Nếu Box không yêu cầu gì đặc biệt
  if (node.minAccountAgeDays === 0 && node.minMessageCount === 0) {
    return { granted: true };
  }

  // Bắt đầu check quyền
  const session = await auth();
  if (!session?.user) {
    return { 
      granted: false, 
      reason: `Bạn phải đăng nhập để xem nội dung trong "${node.title}".` 
    };
  }

  // Lấy chi tiết user hiện tại
  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  if (!user || user.isBanned) {
    return { granted: false, reason: "Tài khoản của bạn đã bị khóa hoặc không tồn tại." };
  }

  // Kiểm tra số bài viết
  if (node.minMessageCount > 0 && user.messageCount < node.minMessageCount) {
    return { 
      granted: false, 
      reason: `Box "${node.title}" yêu cầu tối thiểu ${node.minMessageCount} bài viết (Bạn đang có ${user.messageCount}).` 
    };
  }

  // Kiểm tra tuổi account
  if (node.minAccountAgeDays > 0) {
    const ageInMs = new Date().getTime() - user.createdAt.getTime();
    const ageInDays = Math.floor(ageInMs / (1000 * 60 * 60 * 24));
    
    if (ageInDays < node.minAccountAgeDays) {
      return { 
        granted: false, 
        reason: `Box "${node.title}" yêu cầu tài khoản tối thiểu ${node.minAccountAgeDays} ngày tuổi (Tài khoản bạn tạo được ${ageInDays} ngày).` 
      };
    }
  }

  return { granted: true };
}
