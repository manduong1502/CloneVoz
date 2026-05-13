"use client";

import { useTransition } from 'react';
import { ArrowUpFromLine } from 'lucide-react';
import { moveAllThreadsFromCategory } from '@/actions/nodeActions';
import { useRouter } from 'next/navigation';

export default function MoveAllFromCategoryButton({ categoryId, categoryTitle, totalThreads }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (totalThreads <= 0) return null;

  const handleMove = () => {
    if (!confirm(`⚠️ Bạn chắc chắn muốn chuyển TẤT CẢ ${totalThreads} bài viết từ các forum nhỏ ra "${categoryTitle}"?\n\nCác forum nhỏ sẽ được giữ lại (trống).`)) return;

    startTransition(async () => {
      try {
        const result = await moveAllThreadsFromCategory(categoryId);
        alert(`✅ Đã chuyển ${result.moved} bài viết từ ${result.forumCount} forum nhỏ ra "${categoryTitle}".`);
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
      className="flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium bg-amber-500 hover:bg-amber-600 disabled:bg-gray-400 text-white rounded shadow-sm transition"
      title={`Chuyển tất cả ${totalThreads} bài viết từ các forum nhỏ ra "${categoryTitle}"`}
    >
      <ArrowUpFromLine size={12} />
      {isPending ? 'Đang chuyển...' : 'Chuyển tất cả bài viết'}
    </button>
  );
}
