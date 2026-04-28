import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

let redis = null;

function getRedisClient() {
  if (redis) return redis;
  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (times > 2) return null;
        return 500;
      },
      lazyConnect: true,
      enableOfflineQueue: false,
    });
    redis.on('error', () => {});
    return redis;
  } catch (e) {
    return null;
  }
}

export async function getCache(key) {
  try {
    const client = getRedisClient();
    if (!client) return null;
    const data = await Promise.race([
      client.get(key),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
    ]);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function setCache(key, data, ttlSeconds = 60) {
  try {
    const client = getRedisClient();
    if (!client) return;
    await Promise.race([
      client.set(key, JSON.stringify(data), 'EX', ttlSeconds),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
    ]);
  } catch {
    // bỏ qua
  }
}

export async function deleteCache(key) {
  try {
    const client = getRedisClient();
    if (!client) return;
    await client.del(key);
  } catch {
    // bỏ qua
  }
}

export async function deleteCachePattern(pattern) {
  try {
    const client = getRedisClient();
    if (!client) return;
    // Use SCAN instead of KEYS to avoid blocking Redis
    const stream = client.scanStream({ match: pattern, count: 100 });
    const keysToDelete = [];
    await new Promise((resolve, reject) => {
      stream.on('data', (keys) => { keysToDelete.push(...keys); });
      stream.on('end', resolve);
      stream.on('error', reject);
    });
    if (keysToDelete.length > 0) {
      await client.del(...keysToDelete);
    }
  } catch {
    // bỏ qua
  }
}
