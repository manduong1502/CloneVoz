"use client";

import { useTransition } from 'react';
import { toggleWatchThread } from '@/actions/bookmarkActions';

export default function WatchButton({ threadId, initialIsWatching }) {
  const [isPending, startTransition] = useTransition();

  const handleWatch = () => {
    startTransition(async () => {
      try {
        await toggleWatchThread(threadId);
      } catch (err) {
        alert(err.message || 'Lỗi khi lưu bài viết.');
      }
    });
  };

  return (
    <button 
      onClick={handleWatch}
      disabled={isPending}
      className={`border rounded-sm px-3 py-[6px] transition-colors text-[13px] ${
        initialIsWatching 
          ? 'bg-[#183254] text-white border-[var(--voz-link)] hover:bg-[#134970]' 
          : 'bg-[var(--voz-surface)] border-[var(--voz-border)] hover:bg-[var(--voz-hover)]'
      } disabled:opacity-50`}
    >
      {isPending ? 'Đang xử lý...' : (initialIsWatching ? 'Bỏ theo dõi' : 'Theo dõi')}
    </button>
  );
}
