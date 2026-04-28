import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// Voice clone: Mặc định chờ 30 giây giữa 2 bài post/thread (Có thể chỉnh lại)
const RATE_LIMIT_SECONDS = 30;

export async function checkRateLimit() {
  const session = await auth();
  if (!session?.user?.id) return { passed: false, reason: "Chưa đăng nhập." };

  const userId = session.user.id;

  // Gom lại thành 1 query duy nhất: tìm hành động gần nhất
  const [lastPost, lastThread] = await Promise.all([
    prisma.post.findFirst({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    }),
    prisma.thread.findFirst({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    })
  ]);

  let lastActionTime = new Date(0);

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

// 🛡️ Bức Tường Lửa Cloudflare Turnstile
export async function verifyTurnstile(token) {
  if (!token) return { success: false, error: "Thiếu Token bảo vệ." };
  // Khóa bí mật (Chỉ Server biết)
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) return { success: true }; // Bỏ qua nếu ko cài cấu hình

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });
    
    const outcome = await res.json();
    if (outcome.success) {
       return { success: true };
    }
    return { success: false, error: "Lá chắn Cloudflare đã chặn bạn vì có dấu hiệu Bot tự động." };
  } catch (err) {
    return { success: false, error: "Hệ thống xác thực tạm thời gặp sự cố." };
  }
}

