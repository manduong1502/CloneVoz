"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { deleteCache, deleteCachePattern } from '@/lib/redis';

// =============================================
// HELPER: Kiểm tra quyền Admin hoặc Mod
// =============================================
async function requireAdminOrMod() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Chưa đăng nhập");
  
  const isSuperAdmin = session.user.email === 'lamphatcommerce@gmail.com' || session.user.email === 'mandtdn@gmail.com';
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { userGroups: true }
  });
  
  const isAdmin = isSuperAdmin || user?.userGroups.some(g => g.name === 'Admin');
  const isMod = user?.userGroups.some(g => g.name === 'Moderator');
  const canApprove = isAdmin || user?.userGroups.some(g => g.canApprove);
  
  if (!isAdmin && !isMod) throw new Error("Không có quyền truy cập");
  
  return { session, user, isAdmin, isMod, canApprove };
}

async function requireAdmin() {
  const { session, user, isAdmin } = await requireAdminOrMod();
  if (!isAdmin) throw new Error("Chỉ Admin mới có quyền này");
  return { session, user };
}

// =============================================
// DUYỆT BÀI
// =============================================
export async function approveThread(threadId) {
  await requireAdminOrMod();
  
  await prisma.thread.update({
    where: { id: threadId },
    data: { isApproved: true }
  });

  // Thông báo cho tác giả
  const thread = await prisma.thread.findUnique({ 
    where: { id: threadId }, 
    select: { authorId: true, title: true, nodeId: true } 
  });
  
  if (thread) {
    await prisma.notification.create({
      data: {
        userId: thread.authorId,
        type: "system",
        content: `Bài viết "<strong>${thread.title}</strong>" của bạn đã được phê duyệt!`,
        link: `/thread/${threadId}`
      }
    });
  }

  // Xóa cache
  await deleteCache('voz_homepage_data');
  if (thread?.nodeId) await deleteCache(`voz_node_${thread.nodeId}_page_1_prefix_none`);
  
  revalidatePath('/admin/pending');
  revalidatePath('/');
  return { success: true };
}

export async function rejectThread(threadId) {
  await requireAdminOrMod();
  
  const thread = await prisma.thread.findUnique({ 
    where: { id: threadId }, 
    select: { authorId: true, title: true, nodeId: true } 
  });

  if (thread) {
    // Thông báo cho tác giả
    await prisma.notification.create({
      data: {
        userId: thread.authorId,
        type: "system",
        content: `Bài viết "<strong>${thread.title}</strong>" của bạn đã bị từ chối do vi phạm nội quy diễn đàn.`,
      }
    });
  }

  // Xoá thread và tất cả dữ liệu liên quan
  const allPosts = await prisma.post.findMany({ where: { threadId }, select: { id: true } });
  const postIds = allPosts.map(p => p.id);
  
  await prisma.$transaction([
    prisma.reaction.deleteMany({ where: { postId: { in: postIds } } }),
    prisma.report.deleteMany({ where: { OR: [{ postId: { in: postIds } }, { threadId }] } }),
    prisma.bookmark.deleteMany({ where: { threadId } }),
    prisma.post.deleteMany({ where: { threadId } }),
    prisma.thread.delete({ where: { id: threadId } })
  ]);

  await deleteCache('voz_homepage_data');
  
  revalidatePath('/admin/pending');
  revalidatePath('/');
  return { success: true };
}

// =============================================
// PHÂN QUYỀN USER
// =============================================
export async function setUserRole(userId, roleName) {
  // roleName: 'Admin', 'Moderator', hoặc 'Member' (xóa hết group)
  await requireAdmin();
  
  // Lấy danh sách group hiện tại của user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { userGroups: true }
  });
  if (!user) throw new Error("User không tồn tại");

  // Ngắt tất cả group cũ
  if (user.userGroups.length > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        userGroups: {
          disconnect: user.userGroups.map(g => ({ id: g.id }))
        }
      }
    });
  }

  // Nếu không phải Member thường thì kết nối group mới
  if (roleName !== 'Member') {
    let group = await prisma.userGroup.findUnique({ where: { name: roleName } });
    if (!group) {
      // Tạo group nếu chưa có
      const defaults = {
        Admin: { priority: 1000, canBan: true, canDelete: true, canEditAny: true, canApprove: true },
        Moderator: { priority: 500, canBan: false, canDelete: true, canEditAny: false, canApprove: true },
      };
      group = await prisma.userGroup.create({
        data: { name: roleName, ...defaults[roleName] }
      });
    }
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        userGroups: { connect: { id: group.id } }
      }
    });
  }

  revalidatePath('/admin/users');
  return { success: true, message: `Đã đặt ${user.username} thành ${roleName}` };
}

export async function banUser(userId) {
  await requireAdmin();
  
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User không tồn tại");
  
  await prisma.user.update({
    where: { id: userId },
    data: { isBanned: !user.isBanned }
  });

  revalidatePath('/admin/users');
  return { success: true, isBanned: !user.isBanned };
}

// =============================================
// XÓA THREAD (từ Admin Panel)
// =============================================
export async function deleteThread(threadId) {
  await requireAdminOrMod();
  
  const thread = await prisma.thread.findUnique({ 
    where: { id: threadId },
    select: { nodeId: true }
  });
  if (!thread) throw new Error("Thread không tồn tại");

  const allPosts = await prisma.post.findMany({ where: { threadId }, select: { id: true } });
  const postIds = allPosts.map(p => p.id);

  await prisma.$transaction([
    prisma.reaction.deleteMany({ where: { postId: { in: postIds } } }),
    prisma.report.deleteMany({ where: { OR: [{ postId: { in: postIds } }, { threadId }] } }),
    prisma.bookmark.deleteMany({ where: { threadId } }),
    prisma.post.deleteMany({ where: { threadId } }),
    prisma.thread.delete({ where: { id: threadId } })
  ]);

  await deleteCache('voz_homepage_data');
  // Xóa TẤT CẢ cache pages của node này (page 1, 2, 3... prefix...)
  if (thread.nodeId) await deleteCachePattern(`voz_node_${thread.nodeId}_*`);
  
  revalidatePath(`/admin/nodes/${thread.nodeId}`);
  revalidatePath(`/category/${thread.nodeId}`);
  revalidatePath('/');
  return { success: true };
}

// =============================================
// XÓA COMMENT (từ Admin Panel)
// =============================================
export async function deleteComment(postId, threadId) {
  await requireAdminOrMod();
  
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new Error("Bình luận không tồn tại");
  if (post.position === 1) throw new Error("Không thể xóa bài gốc. Hãy xóa cả thread thay vì comment.");

  await prisma.$transaction([
    prisma.reaction.deleteMany({ where: { postId } }),
    prisma.report.deleteMany({ where: { postId } }),
    prisma.post.delete({ where: { id: postId } })
  ]);

  // Cập nhật replyCount
  await prisma.thread.update({
    where: { id: threadId },
    data: { replyCount: { decrement: 1 } }
  });

  revalidatePath(`/admin/nodes`);
  revalidatePath(`/thread/${threadId}`);
  return { success: true };
}
