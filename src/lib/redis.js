import Redis from 'ioredis';

// Cấu hình Redis từ Biến Môi Trường (Mặc định local port 6379)
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Khởi tạo có giới hạn retry để tránh treo dính chấu trên Local nếu ko bật Redis
export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 1, // Kém ổn định thì bỏ qua luôn (fallback)
  retryStrategy(times) {
    // Chỉ thử kết nối lại 3 lần, mỗi lần cách nhau 1s. Sau đó ngắt
    if (times > 3) return null;
    return 1000;
  },
  showFriendlyErrorStack: true
});

// Chặn tiếng ồn ném lỗi ra Terminal nếu chạy ở môi trường không có Redis (như lúc DEV)
redis.on('error', (err) => {
  // Console log ra thì rườm rà. Lờ đi để hệ thống tự fall-back xuống CSDL.
  // console.warn('Redis connection failed. Bypassing caching system...');
});

/**
 * Hàm lấy Cache An Toàn: Nếu Redis sập, trả về undefined để ứng dụng ép chạy xuống Database.
 */
export async function getCache(key) {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    return null;
  }
}

/**
 * Hàm Set Cache An Toàn: Lỗi thì dẹp, khô xương máu. 
 * @param {string} key 
 * @param {any} data 
 * @param {number} ttl Thời gian sống (giây)
 */
export async function setCache(key, data, ttlSeconds = 60) {
  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
  } catch (error) {
    // Bỏ qua lỗi
  }
}

/**
 * Xóa Cache thủ công khi có người Đăng bài
 */
export async function deleteCache(key) {
  try {
    await redis.del(key);
  } catch (error) {
    // Bỏ qua lỗi
  }
}
