let redis = null;

// Khởi tạo Redis lazily - tránh crash ngay khi module được import
function getRedisClient() {
  if (redis) return redis;
  
  try {
    // Dùng require thay vì import để tránh xung đột ESM/CJS với ioredis
    const { default: Redis } = require('ioredis');
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (times > 2) return null;
        return 500;
      },
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    redis.on('error', () => {
      // Tắt tiếng ồn - Redis lỗi thì hệ thống tự fall-back xuống DB
    });

    return redis;
  } catch (e) {
    // Nếu ioredis không load được, trả null để hệ thống bypass
    return null;
  }
}

/**
 * Lấy Cache an toàn - nếu Redis không hoạt động thì trả null
 */
export async function getCache(key) {
  try {
    const client = getRedisClient();
    if (!client) return null;

    const data = await Promise.race([
      client.get(key),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Redis Timeout')), 1500))
    ]);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    return null;
  }
}

/**
 * Set Cache an toàn - lỗi thì bỏ qua
 */
export async function setCache(key, data, ttlSeconds = 60) {
  try {
    const client = getRedisClient();
    if (!client) return;
    await Promise.race([
      client.set(key, JSON.stringify(data), 'EX', ttlSeconds),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Redis Timeout')), 1500))
    ]);
  } catch (error) {
    // Bỏ qua
  }
}

/**
 * Xóa Cache
 */
export async function deleteCache(key) {
  try {
    const client = getRedisClient();
    if (!client) return;
    await client.del(key);
  } catch (error) {
    // Bỏ qua
  }
}
