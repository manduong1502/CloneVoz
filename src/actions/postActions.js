"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { pusherServer } from '@/lib/pusher.server';
import { deleteCache } from '@/lib/redis';
import { checkNodePermission } from '@/lib/permissions';
import { checkRateLimit, verifyTurnstile } from '@/lib/antispam';

import { countWords } from '@/lib/wordCount';

export async function deletePost(postId, threadId, isFirstPost) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Chưa đăng nhập");

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true, content: true, createdAt: true }
  });
  if (!post) throw new Error("Không tìm thấy bài viết");

  const isAdminOrMod = session.user.isAdmin || session.user.isMod;
  const isAuthor = post.authorId === session.user.id;

  if (!isAdminOrMod && !isAuthor) {
    throw new Error("Bạn không có quyền xoá bài viết này");
  }

  // Calculate penalty if post is old (already gave points)
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  let penaltyPoints = 0;
  if (post.createdAt < startOfToday) {
     const words = countWords(post.content);
     if (isFirstPost && words >= 200) penaltyPoints = 5;
     else if (!isFirstPost && words >= 20) penaltyPoints = 2;
  }

  if (isFirstPost) {
    // Nếu là bài đăng đầu tiên, tức là xoá Cả Thread
    const allPosts = await prisma.post.findMany({ where: { threadId }, select: { id: true } });
    const postIds = allPosts.map(p => p.id);
    
    await prisma.$transaction([
      prisma.reaction.deleteMany({ where: { postId: { in: postIds } } }),
      prisma.report.deleteMany({ where: { postId: { in: postIds } } }),
      prisma.bookmark.deleteMany({ where: { threadId } }),
      prisma.post.deleteMany({ where: { threadId } }),
      prisma.thread.delete({ where: { id: threadId } })
    ]);
    revalidatePath(`/`);
  } else {
    // Nếu chỉ là bình luận xoá lẻ
    await prisma.$transaction([
       prisma.reaction.deleteMany({ where: { postId } }),
       prisma.report.deleteMany({ where: { postId } }),
       prisma.post.delete({ where: { id: postId } }),
       prisma.thread.update({ where: { id: threadId }, data: { replyCount: { decrement: 1 } } })
    ]);
  }

  if (penaltyPoints > 0) {
    await prisma.user.update({
      where: { id: post.authorId },
      data: { points: { decrement: penaltyPoints } }
    });
  }
  
  // Xóa cache màn hình
  await deleteCache(`thread:${threadId}`);
  revalidatePath(`/thread/${threadId}`);
}

export async function createReply(threadId, formData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Chưa đăng nhập");
  const content = formData.get("content");
  if (!content || typeof content !== 'string' || content.trim() === '') throw new Error("Nội dung trống");

  const turnstileToken = formData.get("turnstileToken");
  const tsCheck = await verifyTurnstile(turnstileToken);
  if (!tsCheck.success) throw new Error(tsCheck.error);

  const spamCheck = await checkRateLimit();
  if (!spamCheck.passed) throw new Error(spamCheck.reason);

  const thread = await prisma.thread.findUnique({
     where: { id: threadId },
     select: { nodeId: true, isLocked: true, authorId: true }
  });

  if (!thread) throw new Error("Thread không tồn tại");
  if (thread.isLocked) throw new Error("Thread đã bị khóa, không thể bình luận.");

  const perm = await checkNodePermission(thread.nodeId);
  if (!perm.granted) throw new Error(perm.reason);

  // Đếm số post hiện tại để lấy position cuối
  const currentPostCount = await prisma.post.count({ where: { threadId }});

  // Tạo post
  const newPost = await prisma.post.create({
    data: {
      content: content,
      position: currentPostCount + 1,
      threadId,
      authorId: session.user.id
    }
  });

  // PHÂN TÍCH VÀ GỬI THÔNG BÁO (Mentions / Quote / Watched Thread / Thread Author)
  const mentionedUsernames = [...content.matchAll(/@([a-zA-Z0-9_]+)/g)].map(m => m[1]);
  const uniqueMentions = [...new Set(mentionedUsernames)].filter(name => name !== session.user.username);
  
  const mentionedUserIds = [];
  if (uniqueMentions.length > 0) {
    const usersToNotify = await prisma.user.findMany({ where: { username: { in: uniqueMentions } } });
    usersToNotify.forEach(u => mentionedUserIds.push(u.id));
  }

  // Lấy người theo dõi chủ đề
  const watchers = await prisma.bookmark.findMany({ where: { threadId } });
  
  const userIdsToNotify = new Set();
  mentionedUserIds.forEach(id => userIdsToNotify.add(id));
  if (thread.authorId) userIdsToNotify.add(thread.authorId);
  watchers.forEach(w => userIdsToNotify.add(w.userId));
  
  // Xóa chính mình ra khỏi danh sách nhận
  userIdsToNotify.delete(session.user.id);

  // Đóng gói mảng Data để xả đạn (Batch Insert)
  const notificationsData = [];
  const pusherPromises = [];

  for (const uid of userIdsToNotify) {
      let type = "reply";
      let text = `${session.user.name} đã bình luận vào bài viết bạn đang theo dõi.`;
      
      if (uid === thread.authorId) {
          text = `${session.user.name} đã bình luận vào bài viết của bạn.`;
      }
      if (mentionedUserIds.includes(uid)) {
          type = "quote";
          text = `${session.user.name} đã nhắc đến bạn trong một bài viết.`;
      }
      
      notificationsData.push({
         userId: uid,
         senderId: session.user.id,
         type,
         content: text,
         link: `/thread/${threadId}#post-${newPost.id}`
      });
  }

  if (notificationsData.length > 0) {
      // 1. Lưu toàn bộ notification vào DB trong TÍCH TẮC cực độ (1 Query duy nhất)
      await prisma.notification.createMany({
          data: notificationsData
      });

      // Lấy danh sách Notify vừa tạo (Dùng để lấy ID gửi kèm pusher, tuỳ chọn)
      // Nhưng do Pusher chỉ cần báo UI báo số, ta tạo fake package báo tin luôn.
      if (pusherServer) {
         notificationsData.forEach(notif => {
             const payload = {
                 ...notif, 
                 id: Math.random().toString(36).substr(2, 9), 
                 sender: { username: session.user.username, avatar: session.user.avatar || null }
             };
             pusherPromises.push(pusherServer.trigger(`user-${notif.userId}`, 'new-notification', payload).catch(e => {}));
         });
         // 2. Kích hoạt toàn sóng không cần chờ đồng bộ
         Promise.all(pusherPromises).catch(console.error);
      }
  }

  // Cập nhật số liệu Thread
  await prisma.thread.update({
    where: { id: threadId },
    data: { replyCount: { increment: 1 }, updatedAt: new Date() }
  });

  // Cập nhật số liệu User: +1 messageCount
  await prisma.user.update({
    where: { id: session.user.id },
    data: { messageCount: { increment: 1 } }
  });

  // Xóa rác Cache để Data mới nổi lên
  await deleteCache('voz_homepage_data');
  await deleteCache(`voz_node_${thread.nodeId}_page_1_prefix_none`);

  revalidatePath(`/thread/${threadId}`);
  revalidatePath(`/`);
  
  return { success: true, post: newPost };
}

// ==========================================
// LIKE (REACTION) ACTIONS
// ==========================================
export async function handleReaction(postId, path, reactionType) {
  // reactionType: "Like" hoặc "Dislike" (hoặc null nếu muốn hủy)
  const session = await auth();
  if (!session?.user?.id) throw new Error("Chưa đăng nhập");

  const userId = session.user.id;

  const existingReaction = await prisma.reaction.findFirst({
    where: { postId, userId }
  });

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
  const isOwnPost = post && post.authorId === userId;

  let scoreDelta = 0;

  if (existingReaction) {
    if (existingReaction.type === reactionType) {
      // Hủy reaction hiện tại (toggle off)
      await prisma.reaction.delete({ where: { id: existingReaction.id } });
      scoreDelta = existingReaction.type === "Like" ? -1 : 1;
      reactionType = null;
    } else {
      // Đổi reaction (từ Like sang Dislike hoặc ngược lại)
      await prisma.reaction.update({
        where: { id: existingReaction.id },
        data: { type: reactionType }
      });
      scoreDelta = reactionType === "Like" ? 2 : -2;
    }
  } else {
    // Thêm mới reaction
    await prisma.reaction.create({
      data: { postId, userId, type: reactionType }
    });
    scoreDelta = reactionType === "Like" ? 1 : -1;
  }

  // Cập nhật điểm (chỉ cộng/trừ nếu không phải tự vote bài mình)
  if (post && !isOwnPost && scoreDelta !== 0) {
    // Calculate penalty if removing an old like
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    let penaltyPoints = 0;
    
    if (existingReaction && existingReaction.createdAt < startOfToday) {
       if (existingReaction.type === 'Like' && reactionType !== 'Like') {
          penaltyPoints = 1; // Removed an old like, penalize 1 point
       }
    }

    await prisma.user.update({
      where: { id: post.authorId },
      data: { 
        reactionScore: { increment: scoreDelta },
        ...(penaltyPoints > 0 ? { points: { decrement: penaltyPoints } } : {})
      }
    });

    // Thông báo nếu có Like mới
    if (reactionType === "Like" && !existingReaction) {
      try {
        const thread = await prisma.post.findUnique({ where: { id: postId }, select: { thread: true } });
        await prisma.notification.create({
           data: {
             userId: post.authorId,
             senderId: session.user.id,
             type: "reaction",
             content: `<strong>${session.user.name}</strong> đã thả Ưng bài viết của bạn.`,
             link: `/thread/${thread.thread.id}#post-${postId}`
           }
        });
        pusherServer.trigger(`user-${post.authorId}`, 'new-notification', { type: 'reaction' }).catch(() => {});
      } catch (err) {}
    }
  }

  revalidatePath(path);
  return { success: true, currentReaction: reactionType };
}
