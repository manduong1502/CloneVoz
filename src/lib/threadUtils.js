import { prisma } from "@/lib/prisma";

/**
 * Xóa toàn bộ Thread cùng tất cả dữ liệu liên quan (posts, reactions, reports, bookmarks)
 * Dùng chung cho: deletePost (isFirstPost), adminActions.deleteThread, adminActions.rejectThread
 */
export async function cascadeDeleteThread(threadId) {
  const allPosts = await prisma.post.findMany({ where: { threadId }, select: { id: true } });
  const postIds = allPosts.map(p => p.id);

  await prisma.$transaction([
    prisma.reaction.deleteMany({ where: { postId: { in: postIds } } }),
    prisma.report.deleteMany({ where: { OR: [{ postId: { in: postIds } }, { threadId }] } }),
    prisma.bookmark.deleteMany({ where: { threadId } }),
    prisma.post.deleteMany({ where: { threadId } }),
    prisma.thread.delete({ where: { id: threadId } })
  ]);

  return { postIds, postCount: postIds.length };
}

/**
 * Xóa 1 post đơn lẻ và giảm replyCount
 */
export async function cascadeDeletePost(postId, threadId) {
  await prisma.$transaction([
    prisma.reaction.deleteMany({ where: { postId } }),
    prisma.report.deleteMany({ where: { postId } }),
    prisma.post.delete({ where: { id: postId } }),
    prisma.thread.update({ where: { id: threadId }, data: { replyCount: { decrement: 1 } } })
  ]);
}
