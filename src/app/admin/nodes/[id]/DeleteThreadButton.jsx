"use client";

import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteThread } from '@/actions/adminActions';

export default function DeleteThreadButton({ threadId, threadTitle, nodeId }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm(`Bạn có chắc chắn muốn XÓA chủ đề:\n"${threadTitle}"?\n\nTất cả bình luận bên trong sẽ bị xóa vĩnh viễn!`)) return;
    startTransition(async () => {
      try {
        await deleteThread(threadId);
      } catch (err) {
        alert('Lỗi: ' + err.message);
      }
    });
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isPending}
      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition disabled:opacity-50"
      title="Xóa chủ đề"
    >
      <Trash2 size={15} />
    </button>
  );
}
