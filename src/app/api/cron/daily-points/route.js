import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { countWords } from "@/lib/wordCount";

export const dynamic = 'force-dynamic';

// Fix timezone: force UTC+7 (Vietnam)
function getVietnamDate(date = new Date()) {
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return new Date(utc + (7 * 3600000));
}

/**
 * Tính điểm từ tất cả posts + reactions trong 1 khoảng thời gian.
 * Trả về: { [userId]: { totalPoints, monthlyPoints } } (đã áp cap)
 */
async function calculatePoints(periodStart, periodEnd) {
  // Fetch Posts
  const posts = await prisma.post.findMany({
    where: { createdAt: { gte: periodStart, lt: periodEnd } },
    select: { authorId: true, content: true, position: true, threadId: true }
  });

  // Fetch Reactions
  const reactions = await prisma.reaction.findMany({
    where: { createdAt: { gte: periodStart, lt: periodEnd } },
    select: {
      type: true,
      userId: true,
      voterPoints: true,
      post: { select: { authorId: true, threadId: true } }
    }
  });

  // Accumulate raw points per user
  const userRaw = {}; // userId -> { totalPoints, monthlyTopics: { threadId: pts } }

  posts.forEach(p => {
    const words = countWords(p.content);
    const isThread = p.position === 1;
    let totalPts = 0, monthlyPts = 0;

    if (isThread && words >= 200) { totalPts = 5; monthlyPts = 1; }
    else if (!isThread && words >= 20) { totalPts = 2; monthlyPts = 1; }

    if (totalPts > 0 || monthlyPts > 0) {
      if (!userRaw[p.authorId]) userRaw[p.authorId] = { totalPoints: 0, monthlyTopics: {} };
      userRaw[p.authorId].totalPoints += totalPts;
      if (!userRaw[p.authorId].monthlyTopics[p.threadId]) userRaw[p.authorId].monthlyTopics[p.threadId] = 0;
      userRaw[p.authorId].monthlyTopics[p.threadId] += monthlyPts;
    }
  });

  reactions.forEach(r => {
    const targetUserId = r.post.authorId;
    if (r.userId === targetUserId) return; // Bỏ qua self-reaction

    let totalPts = 0, monthlyPts = 0;
    if (r.type === 'Like') { totalPts = 1; monthlyPts = 1; }
    else if (r.type === 'Dislike') {
      if (r.voterPoints >= 300) monthlyPts = -1; // Chỉ tính khi voter >= Bản lĩnh
    }

    if (totalPts !== 0 || monthlyPts !== 0) {
      if (!userRaw[targetUserId]) userRaw[targetUserId] = { totalPoints: 0, monthlyTopics: {} };
      userRaw[targetUserId].totalPoints += totalPts;
      if (!userRaw[targetUserId].monthlyTopics[r.post.threadId]) userRaw[targetUserId].monthlyTopics[r.post.threadId] = 0;
      userRaw[targetUserId].monthlyTopics[r.post.threadId] += monthlyPts;
    }
  });

  // Apply caps
  const result = {}; // userId -> { totalPoints, monthlyPoints }
  for (const [userId, pts] of Object.entries(userRaw)) {
    // Cap tổng điểm ngày: max +20, min 0
    const finalTotal = Math.min(20, Math.max(0, pts.totalPoints));

    // Cap điểm tháng: per thread ±3, tổng ngày ±20
    let finalMonthly = 0;
    for (const threadId in pts.monthlyTopics) {
      let topicPts = pts.monthlyTopics[threadId];
      if (topicPts > 3) topicPts = 3;
      if (topicPts < -3) topicPts = -3;
      finalMonthly += topicPts;
    }
    if (finalMonthly > 20) finalMonthly = 20;
    if (finalMonthly < -20) finalMonthly = -20;

    result[userId] = { totalPoints: finalTotal, monthlyPoints: finalMonthly };
  }

  return { result, postsCount: posts.length, reactionsCount: reactions.length };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const mode = searchParams.get('mode'); // 'interval' hoặc mặc định = 'daily'

    const cronSecret = process.env.CRON_SECRET || 'voz_cron_secret_2026';
    if (secret !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vnNow = getVietnamDate();
    const startOfToday = new Date(vnNow.getFullYear(), vnNow.getMonth(), vnNow.getDate());
    const startOfTodayUTC = new Date(startOfToday.getTime() - (7 * 3600000));
    const dateStr = startOfToday.toISOString().split('T')[0];
    const isFirstDayOfMonth = vnNow.getDate() === 1;

    if (mode === 'interval') {
      // ============================================================
      // INTERVAL MODE: Xử lý TOÀN BỘ ngày hôm nay (từ 0h đến now)
      // Tính tổng mới → so sánh với đã áp dụng → cộng delta
      // Đảm bảo cap per-thread (±3) và per-day (±20) luôn đúng
      // ============================================================
      const periodStart = startOfTodayUTC;
      const periodEnd = new Date();

      console.log(`[Interval] Tính lại toàn bộ hôm nay: ${periodStart.toISOString()} → ${periodEnd.toISOString()}`);

      const { result: newTotals, postsCount, reactionsCount } = await calculatePoints(periodStart, periodEnd);

      // Lấy snapshot đã áp dụng trước đó (lưu trong DailyCronStatus)
      const prevSnapshot = await prisma.dailyCronStatus.findUnique({
        where: { date: `interval_${dateStr}` }
      });
      const prevApplied = prevSnapshot ? JSON.parse(prevSnapshot.snapshot || '{}') : {};

      // Tính delta (mới - cũ) và áp dụng
      const updateOps = [];
      for (const [userId, newPts] of Object.entries(newTotals)) {
        const prev = prevApplied[userId] || { totalPoints: 0, monthlyPoints: 0 };
        const deltaTotal = newPts.totalPoints - prev.totalPoints;
        const deltaMonthly = newPts.monthlyPoints - prev.monthlyPoints;

        if (deltaTotal !== 0 || deltaMonthly !== 0) {
          updateOps.push(
            prisma.user.update({
              where: { id: userId },
              data: {
                ...(deltaTotal !== 0 ? { points: { increment: deltaTotal } } : {}),
                ...(deltaMonthly !== 0 ? { monthlyPoints: { increment: deltaMonthly } } : {})
              }
            })
          );
        }
      }

      // Handle giảm: user có trong prev nhưng không có trong new (bài/like bị xóa)
      for (const [userId, prevPts] of Object.entries(prevApplied)) {
        if (!newTotals[userId]) {
          const deltaTotal = -prevPts.totalPoints;
          const deltaMonthly = -prevPts.monthlyPoints;
          if (deltaTotal !== 0 || deltaMonthly !== 0) {
            updateOps.push(
              prisma.user.update({
                where: { id: userId },
                data: {
                  ...(deltaTotal !== 0 ? { points: { increment: deltaTotal } } : {}),
                  ...(deltaMonthly !== 0 ? { monthlyPoints: { increment: deltaMonthly } } : {})
                }
              })
            );
          }
        }
      }

      if (updateOps.length > 0) {
        await prisma.$transaction(updateOps);
      }

      // Lưu/cập nhật snapshot (upsert)
      await prisma.dailyCronStatus.upsert({
        where: { date: `interval_${dateStr}` },
        create: { date: `interval_${dateStr}`, snapshot: JSON.stringify(newTotals) },
        update: { snapshot: JSON.stringify(newTotals), processedAt: new Date() }
      });

      console.log(`[Interval] Cập nhật ${updateOps.length} user. Posts: ${postsCount}, Reactions: ${reactionsCount}`);

      return NextResponse.json({
        success: true,
        mode: 'interval',
        postsProcessed: postsCount,
        reactionsProcessed: reactionsCount,
        updatedUsersCount: updateOps.length
      });

    } else {
      // ============================================================
      // DAILY MODE: Xử lý ngày hôm qua (chạy 1 lần lúc 0h)
      // ============================================================
      const existingLog = await prisma.dailyCronStatus.findUnique({
        where: { date: dateStr }
      });
      if (existingLog) {
        return NextResponse.json({ message: `Ngày ${dateStr} đã được xử lý rồi.` });
      }

      const periodStart = new Date(startOfTodayUTC);
      periodStart.setDate(periodStart.getDate() - 1);
      const periodEnd = startOfTodayUTC;
      const yesterdayStr = periodStart.toISOString().split('T')[0];

      console.log(`[Daily] Xử lý ngày ${yesterdayStr}`);

      // Reset monthlyPoints nếu là mùng 1
      if (isFirstDayOfMonth) {
        console.log('Reset điểm tháng cho tháng mới...');
        await prisma.user.updateMany({ data: { monthlyPoints: 0 } });
      }

      // Xóa interval snapshot của ngày hôm qua (đã xử lý xong)
      const yesterdayIntervalKey = `interval_${yesterdayStr}`;
      await prisma.dailyCronStatus.deleteMany({
        where: { date: yesterdayIntervalKey }
      });

      // Tính điểm ngày hôm qua
      const { result: dayTotals, postsCount, reactionsCount } = await calculatePoints(periodStart, periodEnd);

      // Trừ đi những gì interval đã áp dụng cho ngày hôm qua
      // (interval snapshot đã bị xóa ở trên, nhưng ta cần biết đã apply bao nhiêu)
      // Giải pháp: daily chỉ chạy khi KHÔNG có interval mode
      // Nếu dùng interval: daily không cần chạy (interval đã xử lý real-time)
      // Nếu dùng daily: interval không chạy
      
      const updateOps = [];
      for (const [userId, pts] of Object.entries(dayTotals)) {
        if (pts.totalPoints !== 0 || pts.monthlyPoints !== 0) {
          updateOps.push(
            prisma.user.update({
              where: { id: userId },
              data: {
                ...(pts.totalPoints !== 0 ? { points: { increment: pts.totalPoints } } : {}),
                ...(pts.monthlyPoints !== 0 ? { monthlyPoints: { increment: pts.monthlyPoints } } : {})
              }
            })
          );
        }
      }

      if (updateOps.length > 0) {
        await prisma.$transaction(updateOps);
      }

      // Mark ngày hôm qua đã xử lý
      await prisma.dailyCronStatus.create({ data: { date: dateStr } });

      console.log(`[Daily] Cập nhật ${updateOps.length} user. Posts: ${postsCount}, Reactions: ${reactionsCount}`);

      return NextResponse.json({
        success: true,
        mode: 'daily',
        processedDate: yesterdayStr,
        postsProcessed: postsCount,
        reactionsProcessed: reactionsCount,
        updatedUsersCount: updateOps.length,
        resetMonthly: isFirstDayOfMonth
      });
    }

  } catch (error) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
