let pusherInstance = null;

export const getPusherClient = async () => {
  if (typeof window === 'undefined') return null;
  
  if (!pusherInstance) {
    // Dynamic import để Next.js không chạy node version của Pusher lúc SSR
    const Pusher = (await import('pusher-js')).default;
    pusherInstance = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });
  }
  
  return pusherInstance;
};
