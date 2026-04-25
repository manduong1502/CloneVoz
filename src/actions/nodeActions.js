"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 1. Tạo mới một Node
export async function createNode(formData) {
  const title = formData.get("title");
  const description = formData.get("description") || "";
  const nodeType = formData.get("nodeType") || "Forum";
  const parentId = formData.get("parentId") || null;
  const displayOrder = parseInt(formData.get("displayOrder") || "10", 10);
  const cssClass = formData.get("cssClass") || "";

  if (!title) throw new Error("Vui lòng nhập tên diễn đàn");

  await prisma.node.create({
    data: {
      title,
      description,
      nodeType,
      parentId: parentId === "none" ? null : parentId,
      displayOrder,
      // cssClass, // (nếu có bổ sung cột này ở schema)
    }
  });

  revalidatePath("/");
  revalidatePath("/admin/nodes");
}

// 2. Cập nhật một Node
export async function updateNode(id, formData) {
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

// 3. Xoá hoàn toàn một Node. Rất nguy hiểm vì nó xoá sạch mọi dữ liệu con!
export async function deleteNode(id) {
  if (!id) return;
  
  // Do giới hạn của SQLite môi trường dev, ta sẽ sử dụng Prisma Transaction 
  // để tự động dọn rác thủ công cực kỳ cẩn thận từ dưới lên trên, tránh bị mồ côi (Cascade Deletion).
  
  // Lấy danh sách ID của tất cả Threads trong Node này
  const threads = await prisma.thread.findMany({
     where: { nodeId: id },
     select: { id: true }
  });
  const threadIds = threads.map(t => t.id);

  if (threadIds.length > 0) {
      await prisma.$transaction([
        // 1. Xoá toàn bộ Reactions dựa trên Post thuộc Thread
        prisma.reaction.deleteMany({
          where: { post: { threadId: { in: threadIds } } }
        }),
        // 2. Xoá toàn bộ Báo cáo (Reports) nằm trong các Post này
        prisma.report.deleteMany({
          where: { post: { threadId: { in: threadIds } } }
        }),
        // 3. Xóa các Bookmarks liên quan
        prisma.bookmark.deleteMany({
          where: { threadId: { in: threadIds } }
        }),
        // 4. Xoá toàn bộ Posts
        prisma.post.deleteMany({
          where: { threadId: { in: threadIds } }
        }),
        // 5. Xoá Threads
         prisma.thread.deleteMany({
            where: { nodeId: id }
         }),
        // 6. Xoá chính Node
         prisma.node.delete({
            where: { id }
         })
      ]);
  } else {
     // Nếu Node rỗng (chưa có Threads), chỉ việc xóa chính nó
     await prisma.node.delete({
       where: { id }
     });
  }

  revalidatePath("/");
  revalidatePath("/admin/nodes");
}

// 4. Di chuyển Forum sang Category khác
export async function moveNode(nodeId, newParentId) {
  if (!nodeId || !newParentId) throw new Error("Thiếu thông tin");
  
  await prisma.node.update({
    where: { id: nodeId },
    data: { parentId: newParentId }
  });

  revalidatePath("/");
  revalidatePath("/admin/nodes");
}
