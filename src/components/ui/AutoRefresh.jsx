"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AutoRefresh({ interval = 10000 }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      // Gọi ngầm server để lấy dữ liệu mới nhất (không reload cả trang, Next.js xịn chỗ này)
      router.refresh();
    }, interval);
    
    return () => clearInterval(timer);
  }, [router, interval]);

  return null;
}
