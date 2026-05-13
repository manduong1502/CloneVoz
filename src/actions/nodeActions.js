"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { isSuperAdmin } from '@/lib/adminConfig';

async function requireAdminOrMod() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Chưa đăng nhập");
  
  const superAdmin = isSuperAdmin(session.user.email);
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { userGroups: true }
  });
  
  const isAdmin = superAdmin || user?.userGroups.some(g => g.name === 'Admin');
  const isMod = user?.userGroups.some(g => g.name === 'Moderator');
  
  if (!isAdmin && !isMod) throw new Error("Chỉ Admin hoặc Mod mới có quyền thực hiện hành động này");
  return { session, user };
}

// 1. Tạo mới một Node
export async function createNode(formData) {
  await requireAdminOrMod();
  const title = formData.get("title");
  const description = formData.get("description") || "";
  const nodeType = formData.get("nodeType") || "Forum";
  const parentId = formData.get("parentId") || null;
  const displayOrder = parseInt(formData.get("displayOrder") || "10", 10);

  if (!title) throw new Error("Vui lòng nhập tên diễn đàn");

  await prisma.node.create({
    data: {
      title,
      description,
      nodeType,
      parentId: parentId === "none" ? null : parentId,
      displayOrder,
    }
  });

  revalidatePath("/");
  revalidatePath("/admin/nodes");
}

// 2. Cập nhật một Node
export async function updateNode(id, formData) {
  await requireAdminOrMod();
  const title = formData.get("title");
  const description = formData.get("description") || "";
  const displayOrder = parseInt(formData.get("displayOrder") || "10", 10);
  
  if (!title) throw new Error("Tên nhóm/diễn đàn không được trống");

  await prisma.node.update({
    where: { id },
    data: {
      title,
      description,
      displayOrder
    }
  });

  revalidatePath("/");
  revalidatePath("/admin/nodes");
}

// 3. Xoá hoàn toàn một Node
export async function deleteNode(id) {
  await requireAdminOrMod();
  if (!id) return;
  
  const threads = await prisma.thread.findMany({
     where: { nodeId: id },
     select: { id: true }
  });
  const threadIds = threads.map(t => t.id);

  if (threadIds.length > 0) {
      await prisma.$transaction([
        prisma.reaction.deleteMany({
          where: { post: { threadId: { in: threadIds } } }
        }),
        prisma.report.deleteMany({
          where: { post: { threadId: { in: threadIds } } }
        }),
        prisma.bookmark.deleteMany({
          where: { threadId: { in: threadIds } }
        }),
        prisma.post.deleteMany({
          where: { threadId: { in: threadIds } }
        }),
        prisma.thread.deleteMany({
           where: { nodeId: id }
        }),
        prisma.node.delete({
           where: { id }
        })
      ]);
  } else {
     await prisma.node.delete({
       where: { id }
     });
  }

  revalidatePath("/");
  revalidatePath("/admin/nodes");
}

// 4. Di chuyển Forum sang Category khác
export async function moveNode(nodeId, newParentId) {
  await requireAdminOrMod();
  if (!nodeId || !newParentId) throw new Error("Thiếu thông tin");
  
  await prisma.node.update({
    where: { id: nodeId },
    data: { parentId: newParentId }
  });

  revalidatePath("/");
  revalidatePath("/admin/nodes");
}

// 5. Cập nhật thứ tự hiển thị của Forum
export async function updateNodeOrder(nodeId, newOrder) {
  await requireAdminOrMod();
  if (!nodeId || typeof newOrder !== 'number') throw new Error("Thiếu thông tin");
  
  await prisma.node.update({
    where: { id: nodeId },
    data: { displayOrder: parseInt(newOrder) }
  });

  const { deleteCache } = await import('@/lib/redis');
  await deleteCache('voz_homepage_data');

  revalidatePath("/");
  revalidatePath("/admin/nodes");
}

// 6. Đổi tên Node (Category hoặc Forum)
export async function renameNode(nodeId, newTitle) {
  await requireAdminOrMod();
  if (!nodeId || !newTitle?.trim()) throw new Error("Thiếu thông tin");
  
  await prisma.node.update({
    where: { id: nodeId },
    data: { title: newTitle.trim() }
  });

  const { deleteCache } = await import('@/lib/redis');
  await deleteCache('voz_homepage_data');

  revalidatePath("/");
  revalidatePath("/admin/nodes");
}

// 7. Chuyển tất cả bài viết từ Forum con ra Forum cha (Category) - GIỮ LẠI forum
export async function moveAllThreadsToParent(forumId) {
  await requireAdminOrMod();
  if (!forumId) throw new Error("Thiếu thông tin forum");

  const forum = await prisma.node.findUnique({
    where: { id: forumId },
    select: { id: true, parentId: true, title: true }
  });

  if (!forum) throw new Error("Forum không tồn tại");
  if (!forum.parentId) throw new Error("Forum này không có Category cha");

  const result = await prisma.thread.updateMany({
    where: { nodeId: forumId },
    data: { nodeId: forum.parentId }
  });

  const { deleteCachePattern } = await import('@/lib/redis');
  await deleteCachePattern('voz_homepage_*');

  revalidatePath("/");
  revalidatePath("/admin/nodes");
  revalidatePath(`/admin/nodes/${forumId}`);
  revalidatePath(`/category/${forum.parentId}`);

  return { moved: result.count, parentId: forum.parentId, forumTitle: forum.title };
}

// 8. Chuyển tất cả bài viết từ TẤT CẢ forum nhỏ ra Category cha (GIỮ LẠI forum nhỏ)
export async function moveAllThreadsFromCategory(categoryId) {
  await requireAdminOrMod();
  if (!categoryId) throw new Error("Thiếu thông tin category");

  const childForums = await prisma.node.findMany({
    where: { parentId: categoryId },
    select: { id: true, title: true }
  });

  if (childForums.length === 0) throw new Error("Category này không có forum nhỏ nào");

  const childIds = childForums.map(f => f.id);

  const result = await prisma.thread.updateMany({
    where: { nodeId: { in: childIds } },
    data: { nodeId: categoryId }
  });

  const { deleteCachePattern } = await import('@/lib/redis');
  await deleteCachePattern('voz_homepage_*');

  revalidatePath("/");
  revalidatePath("/admin/nodes");
  revalidatePath(`/category/${categoryId}`);

  return { moved: result.count, forumCount: childForums.length };
}

// 9. Chuyển 1 bài viết vào forum nhỏ cụ thể
export async function moveThreadToNode(threadId, targetNodeId) {
  await requireAdminOrMod();
  if (!threadId || !targetNodeId) throw new Error("Thiếu thông tin");

  await prisma.thread.update({
    where: { id: threadId },
    data: { nodeId: targetNodeId }
  });

  const { deleteCachePattern } = await import('@/lib/redis');
  await deleteCachePattern('voz_homepage_*');

  revalidatePath("/");
  revalidatePath("/admin/nodes");

  return { success: true };
}
