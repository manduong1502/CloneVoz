"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { pusherServer } from '@/lib/pusher.server';
import { deleteCache } from '@/lib/redis';
import { checkNodePermission } from '@/lib/permissions';
import { checkRateLimit, verifyTurnstile } from '@/lib/antispam';

import { countWords } from '@/lib/wordCount';
import { cascadeDeleteThread, cascadeDeletePost } from '@/lib/threadUtils';

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
  // Calculate penalty: trừ lại điểm đã được cron cộng
  // Với interval mode: cron xử lý toàn bộ ngày hôm nay, nên bài tạo hôm nay cũng đã được cộng
  // Ta check xem interval snapshot có tồn tại không (= cron đã chạy ít nhất 1 lần hôm nay)
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  
  let postWasProcessed = false;
  if (post.createdAt < startOfToday) {
    // Bài từ hôm qua → chắc chắn đã qua daily cron
    postWasProcessed = true;
  } else {
    // Bài hôm nay → check xem interval cron đã chạy chưa
    const intervalSnapshot = await prisma.dailyCronStatus.findFirst({
      where: { date: { startsWith: 'interval_' } }
    });
    if (intervalSnapshot) postWasProcessed = true;
  }

  let penaltyPoints = 0;
  let penaltyMonthly = 0;

  if (postWasProcessed) {
    const words = countWords(post.content);
    if (isFirstPost && words >= 200) { penaltyPoints = 5; penaltyMonthly = 1; }
    else if (!isFirstPost && words >= 20) { penaltyPoints = 2; penaltyMonthly = 1; }
  }

  // Count likes đã được cron xử lý
  const allLikes = await prisma.reaction.count({
    where: { postId, type: 'Like' }
  });
  // Likes trước hôm nay chắc chắn đã xử lý
  // Likes hôm nay: nếu interval đã chạy thì cũng đã xử lý
  if (postWasProcessed) {
    penaltyPoints += allLikes;
    penaltyMonthly += allLikes;
  } else {
    // Chỉ count likes cũ (trước hôm nay)
    const oldLikes = await prisma.reaction.count({
      where: { postId, type: 'Like', createdAt: { lt: startOfToday } }
    });
    penaltyPoints += oldLikes;
    penaltyMonthly += oldLikes;
  }

  if (isFirstPost) {
    await cascadeDeleteThread(threadId);
    revalidatePath(`/`);
  } else {
    await cascadeDeletePost(postId, threadId);
  }

  // Deduct penalty — points floor at 0, monthlyPoints có thể âm nên luôn trừ
  if (penaltyPoints > 0 || penaltyMonthly > 0) {
    const author = await prisma.user.findUnique({ where: { id: post.authorId }, select: { points: true } });
    const actualPointsDeduction = Math.min(penaltyPoints, Math.max(0, author?.points || 0));
    
    const updateData = {};
    if (actualPointsDeduction > 0) updateData.points = { decrement: actualPointsDeduction };
    if (penaltyMonthly > 0) updateData.monthlyPoints = { decrement: penaltyMonthly };
    
    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: post.authorId },
        data: updateData
      });
    }
  }
  
  // Xóa cache màn hình
  await deleteCache(`thread:${threadId}`);
  revalidatePath(`/thread/${threadId}`);
}

export async function createReply(threadId, formData) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Chưa đăng nhập" };
    const content = formData.get("content");
    if (!content || typeof content !== 'string' || content.trim() === '') return { success: false, error: "Nội dung trống" };

    const turnstileToken = formData.get("turnstileToken");
    const tsCheck = await verifyTurnstile(turnstileToken);
    if (!tsCheck.success) return { success: false, error: tsCheck.error || "Xác minh Cloudflare thất bại" };

    const spamCheck = await checkRateLimit();
    if (!spamCheck.passed) return { success: false, error: spamCheck.reason };

    const thread = await prisma.thread.findUnique({
       where: { id: threadId },
       select: { nodeId: true, isLocked: true, authorId: true, title: true }
    });

    if (!thread) return { success: false, error: "Thread không tồn tại" };
    if (thread.isLocked) return { success: false, error: "Thread đã bị khóa, không thể bình luận." };

    const perm = await checkNodePermission(thread.nodeId);
    if (!perm.granted) return { success: false, error: perm.reason };

    // Tạo post với position atomic (tránh race condition)
    const newPost = await prisma.$transaction(async (tx) => {
      const currentPostCount = await tx.post.count({ where: { threadId }});
      return tx.post.create({
        data: {
          content: content,
          position: currentPostCount + 1,
          threadId,
          authorId: session.user.id
        }
      });
    });

    // PHÂN TÍCH VÀ GỬI THÔNG BÁO (Mentions / Quote / Watched Thread / Thread Author)
    const mentionedUsernames = [...content.matchAll(/@([a-zA-Z0-9_]+)/g)].map(m => m[1]);
    const uniqueMentions = [...new Set(mentionedUsernames)].filter(name => name !== session.user.username);
    
    const mentionedUserIds = [];
    if (uniqueMentions.length > 0) {
      const usersToNotify = await prisma.user.findMany({ where: { username: { in: uniqueMentions } } });
      usersToNotify.forEach(u => mentionedUserIds.push(u.id));
    }

    // Phân tích Quote: tìm username trong voz-quote-header ("username đã viết:")
    const quotedUsernames = [...content.matchAll(/class="voz-quote-header">([^<]+)\s+đã viết:/g)].map(m => m[1].trim());
    const uniqueQuotedNames = [...new Set(quotedUsernames)].filter(name => name !== session.user.username);
    
    const quotedUserIds = [];
    if (uniqueQuotedNames.length > 0) {
      const quotedUsers = await prisma.user.findMany({ where: { username: { in: uniqueQuotedNames } } });
      quotedUsers.forEach(u => quotedUserIds.push(u.id));
    }

    // Lấy người theo dõi chủ đề
    const watchers = await prisma.bookmark.findMany({ where: { threadId } });

    // Lấy tất cả người đã bình luận trong thread (participants)
    const participants = await prisma.post.findMany({
      where: { threadId },
      select: { authorId: true },
      distinct: ['authorId']
    });
    
    const userIdsToNotify = new Set();
    mentionedUserIds.forEach(id => userIdsToNotify.add(id));
    quotedUserIds.forEach(id => userIdsToNotify.add(id));
    if (thread.authorId) userIdsToNotify.add(thread.authorId);
    participants.forEach(p => userIdsToNotify.add(p.authorId));
    watchers.forEach(w => userIdsToNotify.add(w.userId));
    
    // Xóa chính mình ra khỏi danh sách nhận
    userIdsToNotify.delete(session.user.id);

    // Đóng gói mảng Data để xả đạn (Batch Insert)
    const notificationsData = [];
    const pusherPromises = [];

    for (const uid of userIdsToNotify) {
        let type = "reply";
        const safeName = (session.user.name || '').replace(/[<>"'&]/g, '');
        let text = `<strong>${safeName}</strong> đã bình luận vào bài viết bạn đang theo dõi.`;
        const safeTitle = (thread.title || '').replace(/[<>"'&]/g, '');

        // Ưu tiên thấp → cao (text cuối cùng ghi đè)
        // 1. Thread owner - "bình luận vào bài viết của bạn"
        if (uid === thread.authorId) {
            text = `<strong>${safeName}</strong> đã bình luận vào bài viết của bạn "<em>${safeTitle}</em>".`;
        }
        if (quotedUserIds.includes(uid)) {
            type = "quote";
            text = `<strong>${safeName}</strong> đã trả lời bình luận của bạn.`;
        }
        if (mentionedUserIds.includes(uid)) {
            type = "quote";
            text = `<strong>${safeName}</strong> đã nhắc đến bạn trong một bài viết.`;
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
                    createdAt: new Date().toISOString(),
                    sender: { username: session.user.username || session.user.name, avatar: session.user.avatar || session.user.image || null }
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
  } catch (err) {
    console.error('[createReply] Unexpected error:', err);
    return { success: false, error: err?.message || 'Đã xảy ra lỗi không xác định.' };
  }
}

// ==========================================
// LIKE (REACTION) ACTIONS
// ==========================================
export async function handleReaction(postId, path, reactionType) {
  // reactionType: "Like" hoặc "Dislike" (hoặc null nếu muốn hủy)
  const session = await auth();
  if (!session?.user?.id) throw new Error("Chưa đăng nhập");

  const userId = session.user.id;

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
  if (!post) throw new Error("Bài viết không tồn tại");

  // Chặn tự like/dislike chính mình
  if (post.authorId === userId) {
    return { error: "Bạn không thể tự Like hoặc Dislike bài viết của chính mình." };
  }

  const existingReaction = await prisma.reaction.findFirst({
    where: { postId, userId }
  });

  // Lấy điểm hiện tại của voter để lưu snapshot
  const voter = await prisma.user.findUnique({ where: { id: userId }, select: { points: true } });
  const currentVoterPoints = voter?.points || 0;

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
        data: { type: reactionType, voterPoints: currentVoterPoints }
      });
      scoreDelta = reactionType === "Like" ? 2 : -2;
    }
  } else {
    // Thêm mới reaction + lưu snapshot điểm voter
    await prisma.reaction.create({
      data: { postId, userId, type: reactionType, voterPoints: currentVoterPoints }
    });
    scoreDelta = reactionType === "Like" ? 1 : -1;
  }

  // Cập nhật điểm reactionScore trực tiếp
  if (scoreDelta !== 0) {
    // Kiểm tra xem like đã được cron xử lý chưa (= đã cộng points rồi)
    // Với interval mode: like có thể đã được xử lý dù tạo hôm nay
    // Ta check DailyCronStatus có interval nào processedAt > reaction.createdAt không
    let likeWasProcessed = false;
    
    if (existingReaction && existingReaction.type === 'Like' && reactionType !== 'Like') {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      
      if (existingReaction.createdAt < startOfToday) {
        // Like từ trước hôm nay → chắc chắn đã qua daily cron
        likeWasProcessed = true;
      } else {
        // Like hôm nay → check xem interval cron đã xử lý chưa
        const intervalRun = await prisma.dailyCronStatus.findFirst({
          where: { 
            date: { startsWith: 'interval_' },
            processedAt: { gt: existingReaction.createdAt }
          }
        });
        if (intervalRun) likeWasProcessed = true;
      }
    }

    await prisma.user.update({
      where: { id: post.authorId },
      data: { 
        reactionScore: { increment: scoreDelta },
        ...(likeWasProcessed ? { 
          points: { decrement: 1 },
          monthlyPoints: { decrement: 1 }
        } : {})
      }
    });

    // Thông báo nếu có Like mới (không gửi nếu tự like bài mình)
    if (reactionType === "Like" && !existingReaction && post.authorId !== session.user.id) {
      try {
        const postData = await prisma.post.findUnique({ where: { id: postId }, select: { position: true, thread: true } });
        const label = postData.position === 1 ? 'bài viết' : 'bình luận';
        const newNotif = await prisma.notification.create({
           data: {
             userId: post.authorId,
             senderId: session.user.id,
             type: "reaction",
             content: `<strong>${(session.user.name || '').replace(/[<>"'&]/g, '')}</strong> đã Like ${label} của bạn.`,
             link: `/thread/${postData.thread.id}#post-${postId}`
           },
           include: { sender: { select: { username: true, avatar: true } } }
        });
        
        if (pusherServer) {
          pusherServer.trigger(`user-${post.authorId}`, 'new-notification', {
            ...newNotif,
            createdAt: newNotif.createdAt.toISOString()
          }).catch(() => {});
        }
      } catch (err) {}
    }
  }

  revalidatePath(path);
  return { success: true, currentReaction: reactionType };
}
