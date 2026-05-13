"use client";

import { useState, useTransition } from 'react';
import { ArrowUpFromLine } from 'lucide-react';
import { moveAllThreadsToParent } from '@/actions/nodeActions';
import { useRouter } from 'next/navigation';

export default function MoveAllThreadsButton({ forumId, forumTitle, threadCount }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleMove = () => {
    if (!confirm(`⚠️ CẢNH BÁO: Bạn chắc chắn muốn chuyển TẤT CẢ ${threadCount} bài viết từ "${forumTitle}" ra ngoài Category cha?\n\nHành động này không thể hoàn tác.`)) return;

    startTransition(async () => {
      try {
        const result = await moveAllThreadsToParent(forumId);
        alert(`✅ Đã chuyển thành công ${result.moved} bài viết ra ngoài Category cha.`);
        router.refresh();
      } catch (err) {
        alert(`❌ Lỗi: ${err.message}`);
      }
    });
  };

  return (
    <button
      onClick={handleMove}
      disabled={isPending}
      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium bg-amber-500 hover:bg-amber-600 disabled:bg-gray-400 text-white rounded shadow-sm transition"
    >
      <ArrowUpFromLine size={14} />
      {isPending ? 'Đang chuyển...' : `Chuyển tất cả ra ngoài`}
    </button>
  );
}
