'use client';

import { useState, useTransition } from 'react';
import { Pin, PinOff } from 'lucide-react';
import { togglePinThread } from '@/actions/adminActions';

export default function PinThreadButton({ threadId, isPinned }) {
  const [pinned, setPinned] = useState(isPinned);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      try {
        const res = await togglePinThread(threadId);
        if (res.success) {
          setPinned(res.isPinned);
        }
      } catch (err) {
        alert(err.message);
      }
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[13px] font-medium transition-all border ${
        pinned
          ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
          : 'bg-[var(--voz-surface)] text-[var(--voz-text-muted)] border-[var(--voz-border)] hover:bg-[var(--voz-hover)]'
      } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={pinned ? 'Bỏ ghim bài viết' : 'Ghim bài viết lên đầu'}
    >
      {pinned ? <PinOff size={14} /> : <Pin size={14} />}
      {isPending ? '...' : pinned ? 'Bỏ ghim' : 'Ghim'}
    </button>
  );
}
