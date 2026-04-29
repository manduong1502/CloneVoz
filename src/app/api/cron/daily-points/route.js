import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { countWords } from "@/lib/wordCount";

export const dynamic = 'force-dynamic';

// Fix timezone: force UTC+7 (Vietnam)
function getVietnamDate(date = new Date()) {
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return new Date(utc + (7 * 3600000));
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const mode = searchParams.get('mode'); // 'interval' = chạy mỗi 10 phút, mặc định = daily

    // Fix #16: Secret from env instead of hardcoded
    const cronSecret = process.env.CRON_SECRET || 'voz_cron_secret_2026';
    if (secret !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vnNow = getVietnamDate();
    const startOfToday = new Date(vnNow.getFullYear(), vnNow.getMonth(), vnNow.getDate());
    const startOfTodayUTC = new Date(startOfToday.getTime() - (7 * 3600000));

    let periodStart, periodEnd;
    const dateStr = startOfToday.toISOString().split('T')[0];

    if (mode === 'interval') {
      // Mode interval: xử lý posts từ 15 phút trước đến hiện tại
      periodEnd = new Date();
      periodStart = new Date(periodEnd.getTime() - (15 * 60 * 1000));
      console.log(`[Interval Mode] Xử lý từ ${periodStart.toISOString()} → ${periodEnd.toISOString()}`);
    } else {
      // Mode daily: xử lý posts ngày hôm qua (mặc định)
      periodEnd = startOfTodayUTC;
      periodStart = new Date(startOfTodayUTC);
      periodStart.setDate(periodStart.getDate() - 1);

      // Check if already processed today
      const existingLog = await prisma.dailyCronStatus.findUnique({
        where: { date: dateStr }
      });
      if (existingLog) {
        return NextResponse.json({ message: `Ngày ${dateStr} đã được xử lý rồi.` });
      }
    }

    console.log(`Bắt đầu chạy Cronjob tính điểm...`);

    // Fetch Posts in time range
    const posts = await prisma.post.findMany({
      where: {
        createdAt: {
          gte: periodStart,
          lt: periodEnd
        }
      },
      select: {
        authorId: true,
        content: true,
        position: true,
        threadId: true
      }
    });

    // Fix #2: Fetch Reactions with snapshot of voter points AT the time of reaction
    // We store voter points now to correctly check rank threshold
    const reactions = await prisma.reaction.findMany({
      where: {
        createdAt: {
          gte: periodStart,
          lt: periodEnd
        }
      },
      select: {
        type: true,
        userId: true,
        voterPoints: true,
        post: { select: { authorId: true, threadId: true } }
      }
    });

    const userPoints = {}; // authorId -> { totalPoints: 0, monthlyTopics: { threadId: monthlyPts } }

    // Xử lý Posts
    posts.forEach(p => {
      const words = countWords(p.content);
      const isThread = p.position === 1;

      let totalPts = 0;
      let monthlyPts = 0;

      if (isThread && words >= 200) {
        totalPts = 5;
        monthlyPts = 1;
      } else if (!isThread && words >= 20) {
        totalPts = 2;
        monthlyPts = 1;
      }

      if (totalPts > 0 || monthlyPts > 0) {
        if (!userPoints[p.authorId]) userPoints[p.authorId] = { totalPoints: 0, monthlyTopics: {} };
        userPoints[p.authorId].totalPoints += totalPts;

        if (!userPoints[p.authorId].monthlyTopics[p.threadId]) userPoints[p.authorId].monthlyTopics[p.threadId] = 0;
        userPoints[p.authorId].monthlyTopics[p.threadId] += monthlyPts;
      }
    });

    // Xử lý Reactions
    reactions.forEach(r => {
      const targetUserId = r.post.authorId;
      if (r.userId === targetUserId) return; // Ignore self reactions

      let totalPts = 0;
      let monthlyPts = 0;

      if (r.type === 'Like') {
        totalPts = 1;
        monthlyPts = 1;
      } else if (r.type === 'Dislike') {
        // Dislike: -1 điểm tháng nếu voter có rank >= Bản lĩnh (300đ) tại thời điểm dislike
        if (r.voterPoints >= 300) {
          monthlyPts = -1;
        }
      }

      if (totalPts !== 0 || monthlyPts !== 0) {
        if (!userPoints[targetUserId]) userPoints[targetUserId] = { totalPoints: 0, monthlyTopics: {} };
        userPoints[targetUserId].totalPoints += totalPts;

        if (!userPoints[targetUserId].monthlyTopics[r.post.threadId]) userPoints[targetUserId].monthlyTopics[r.post.threadId] = 0;
        userPoints[targetUserId].monthlyTopics[r.post.threadId] += monthlyPts;
      }
    });

    // Tính toán kết quả cuối cùng
    const isFirstDayOfMonth = vnNow.getDate() === 1;

    // Reset toàn bộ monthlyPoints nếu là ngày mùng 1 đầu tháng
    if (isFirstDayOfMonth) {
      console.log('Reset điểm tháng cho tháng mới...');
      await prisma.user.updateMany({
        data: { monthlyPoints: 0 }
      });
    }

    // Fix #14: Batch update bằng transaction thay vì sequential
    const updateOps = [];
    for (const [userId, pts] of Object.entries(userPoints)) {
      // Giới hạn Tổng điểm ngày: +20
      const finalTotalPoints = Math.min(20, Math.max(0, pts.totalPoints));

      // Giới hạn Điểm Tháng theo topic
      let finalMonthlyPoints = 0;
      for (const threadId in pts.monthlyTopics) {
        let topicPts = pts.monthlyTopics[threadId];
        if (topicPts > 3) topicPts = 3;
        if (topicPts < -3) topicPts = -3;
        finalMonthlyPoints += topicPts;
      }
      
      // Giới hạn Điểm Tháng trong ngày: +20, -20
      if (finalMonthlyPoints > 20) finalMonthlyPoints = 20;
      if (finalMonthlyPoints < -20) finalMonthlyPoints = -20;

      if (isFirstDayOfMonth) {
        if (finalTotalPoints > 0 || finalMonthlyPoints !== 0) {
          updateOps.push(
            prisma.user.update({
              where: { id: userId },
              data: { 
                points: { increment: finalTotalPoints },
                monthlyPoints: { increment: finalMonthlyPoints }
              }
            })
          );
        }
      } else {
        if (finalTotalPoints !== 0 || finalMonthlyPoints !== 0) {
          updateOps.push(
            prisma.user.update({
              where: { id: userId },
              data: { 
                points: { increment: finalTotalPoints },
                monthlyPoints: { increment: finalMonthlyPoints }
              }
            })
          );
        }
      }
    }

    // Execute all updates in a single transaction
    if (updateOps.length > 0) {
      await prisma.$transaction(updateOps);
    }

    // Mark as processed (only in daily mode)
    if (mode !== 'interval') {
      await prisma.dailyCronStatus.create({
        data: { date: dateStr }
      });
    }

    console.log(`Đã cập nhật điểm cho ${updateOps.length} thành viên. (mode: ${mode || 'daily'})`);

    return NextResponse.json({ 
      success: true, 
      mode: mode || 'daily',
      postsProcessed: posts.length,
      reactionsProcessed: reactions.length,
      updatedUsersCount: updateOps.length,
      resetMonthly: isFirstDayOfMonth
    });

  } catch (error) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
