"use client";

import { useTransition } from 'react';
import { toggleWatchNode } from '@/actions/bookmarkActions';

export default function WatchNodeButton({ nodeId, initialIsWatching }) {
  const [isPending, startTransition] = useTransition();

  const handleWatch = () => {
    startTransition(async () => {
      try {
        await toggleWatchNode(nodeId);
      } catch (err) {
        alert(err.message || 'Lỗi khi lưu khu vực.');
      }
    });
  };

  return (
    <button 
      onClick={handleWatch}
      disabled={isPending}
      className={`border rounded-sm px-3 py-[6px] transition-colors text-[13px] ${
        initialIsWatching 
          ? 'bg-[#185886] text-white border-[#185886] hover:bg-[#134970]' 
          : 'bg-white border-[var(--voz-border)] hover:bg-gray-50 text-[#141414]'
      } disabled:opacity-50 h-[30px] flex items-center justify-center min-w-[70px]`}
    >
      {isPending ? '...' : (initialIsWatching ? 'Unwatch' : 'Watch')}
    </button>
  );
}
