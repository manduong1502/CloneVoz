import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// Voice clone: Mặc định chờ 30 giây giữa 2 bài post/thread (Có thể chỉnh lại)
const RATE_LIMIT_SECONDS = 30;

export async function checkRateLimit() {
  const session = await auth();
  if (!session?.user?.id) return { passed: false, reason: "Chưa đăng nhập." };

  const userId = session.user.id;

  // Tìm bài viết (Post) HOẶC Chủ đề (Thread) gần nhất của user này
  const lastPost = await prisma.post.findFirst({
    where: { authorId: userId },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true }
  });

  const lastThread = await prisma.thread.findFirst({
     where: { authorId: userId },
     orderBy: { createdAt: 'desc' },
     select: { createdAt: true }
  });

  let lastActionTime = new Date(0); // 1970

  if (lastPost && lastThread) {
     lastActionTime = lastPost.createdAt > lastThread.createdAt ? lastPost.createdAt : lastThread.createdAt;
  } else if (lastPost) {
     lastActionTime = lastPost.createdAt;
  } else if (lastThread) {
     lastActionTime = lastThread.createdAt;
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - lastActionTime.getTime()) / 1000);

  if (diffInSeconds < RATE_LIMIT_SECONDS) {
     const waitTime = RATE_LIMIT_SECONDS - diffInSeconds;
     return { 
        passed: false, 
        reason: `DanOngThongMinh Anti-Spam: Đẳng cấp là phải điềm đạm. Vui lòng chờ thêm ${waitTime} giây nữa trước khi gửi bài tiếp theo.` 
     };
  }

  return { passed: true };
}
