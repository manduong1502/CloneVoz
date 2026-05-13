"use client";

import { useState, useTransition } from 'react';
import { FolderInput } from 'lucide-react';
import { moveThreadToNode } from '@/actions/nodeActions';
import { useRouter } from 'next/navigation';

export default function MoveThreadSelect({ threadId, forums }) {
  const [showSelect, setShowSelect] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (!forums || forums.length === 0) return null;

  const handleMove = (targetNodeId) => {
    if (!targetNodeId) return;
    const targetForum = forums.find(f => f.id === targetNodeId);
    
    startTransition(async () => {
      try {
        await moveThreadToNode(threadId, targetNodeId);
        setShowSelect(false);
        router.refresh();
      } catch (err) {
        alert(`❌ Lỗi: ${err.message}`);
      }
    });
  };

  if (showSelect) {
    return (
      <select
        autoFocus
        className="text-[11px] bg-[var(--voz-surface)] border border-[var(--voz-border)] rounded px-1 py-0.5 text-[var(--voz-text)] max-w-[130px]"
        defaultValue=""
        onChange={(e) => handleMove(e.target.value)}
        onBlur={() => setShowSelect(false)}
        disabled={isPending}
      >
        <option value="" disabled>{isPending ? 'Đang chuyển...' : 'Chọn forum...'}</option>
        {forums.map(f => (
          <option key={f.id} value={f.id}>{f.title}</option>
        ))}
      </select>
    );
  }

  return (
    <button
      onClick={() => setShowSelect(true)}
      className="p-1.5 text-[var(--voz-text-muted)] hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded transition"
      title="Chuyển vào forum nhỏ"
    >
      <FolderInput size={15} />
    </button>
  );
}
