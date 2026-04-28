import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { countWords } from "@/lib/wordCount";

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Secure the endpoint
    if (secret !== 'voz_cron_secret_2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    // Start of today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // Start of yesterday
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const dateStr = startOfYesterday.toISOString().split('T')[0];

    // Check if already processed
    const existingLog = await prisma.dailyCronStatus.findUnique({
      where: { date: dateStr }
    });

    if (existingLog) {
      return NextResponse.json({ message: `Ngày ${dateStr} đã được xử lý rồi.` });
    }

    console.log(`Bắt đầu chạy Cronjob tính điểm cho ngày ${dateStr}`);

    // Fetch Posts from yesterday
    const posts = await prisma.post.findMany({
      where: {
        createdAt: {
          gte: startOfYesterday,
          lt: startOfToday
        }
      },
      select: {
        authorId: true,
        content: true,
        position: true,
        threadId: true
      }
    });

    // Fetch Reactions from yesterday
    const reactions = await prisma.reaction.findMany({
      where: {
        createdAt: {
          gte: startOfYesterday,
          lt: startOfToday
        }
      },
      select: {
        type: true,
        userId: true,
        user: { select: { points: true } },
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
        // Dislike: -1 điểm tháng nếu người bấm có rank >= Bản lĩnh (300đ tổng)
        if (r.user.points >= 300) {
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

    // Tính toán kết quả cuối cùng và Bulk Update
    const isFirstDayOfMonth = now.getDate() === 1;

    // Reset toàn bộ monthlyPoints nếu là ngày mùng 1 đầu tháng
    if (isFirstDayOfMonth) {
      console.log('Reset điểm tháng cho tháng mới...');
      await prisma.user.updateMany({
        data: { monthlyPoints: 0 }
      });
    }

    // Cập nhật cho từng user có điểm
    let updatedUsersCount = 0;
    for (const [userId, pts] of Object.entries(userPoints)) {
      // Giới hạn Tổng điểm ngày: +20
      const finalTotalPoints = Math.min(20, Math.max(0, pts.totalPoints));

      // Giới hạn Điểm Tháng
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

      // Update database
      if (isFirstDayOfMonth) {
        // Nếu là mùng 1, điểm tháng đã reset về 0, ko cộng thêm điểm tháng của hôm qua nữa (vì hôm qua là tháng cũ)
        if (finalTotalPoints > 0) {
          await prisma.user.update({
            where: { id: userId },
            data: { points: { increment: finalTotalPoints } }
          });
          updatedUsersCount++;
        }
      } else {
        // Ngày bình thường
        if (finalTotalPoints !== 0 || finalMonthlyPoints !== 0) {
          await prisma.user.update({
            where: { id: userId },
            data: { 
              points: { increment: finalTotalPoints },
              monthlyPoints: { increment: finalMonthlyPoints }
            }
          });
          updatedUsersCount++;
        }
      }
    }

    // Mark as processed
    await prisma.dailyCronStatus.create({
      data: { date: dateStr }
    });

    console.log(`Đã cập nhật điểm cho ${updatedUsersCount} thành viên.`);

    return NextResponse.json({ 
      success: true, 
      processedDate: dateStr,
      updatedUsersCount,
      resetMonthly: isFirstDayOfMonth
    });

  } catch (error) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
