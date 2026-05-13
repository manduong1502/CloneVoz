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
    if (!confirm(`⚠️ CẢNH BÁO: Bạn chắc chắn muốn chuyển TẤT CẢ bài viết từ các forum nhỏ trong "${categoryTitle}" ra ngoài?\n\nTổng cộng: ${totalThreads} bài viết sẽ được chuyển ra Category "${categoryTitle}".\n\nHành động này không thể hoàn tác.`)) return;

    startTransition(async () => {
      try {
        const result = await moveAllThreadsFromCategory(categoryId);
        alert(`✅ Đã chuyển thành công ${result.moved} bài viết từ ${result.forumCount} forum nhỏ ra "${categoryTitle}".`);
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
      {isPending ? 'Đang chuyển...' : `Dồn hết ra`}
    </button>
  );
}
