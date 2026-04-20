"use client";

import { Trash2 } from 'lucide-react';
import { useTransition } from 'react';
import { deletePost } from '@/actions/postActions';
import { useRouter } from 'next/navigation';

export default function DeletePostButton({ postId, threadId, isFirstPost }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    const isTopic = isFirstPost;
    const msg = isTopic 
       ? "Hành động này sẽ XÓA TOÀN BỘ CHỦ ĐỀ bao gồm tất cả bình luận bên trong, bạn có chắc không?"
       : "Bạn có chắc chắn muốn xóa Bình luận này không?";
       
    if (confirm(msg)) {
      startTransition(async () => {
        try {
          await deletePost(postId, threadId, isFirstPost);
          if (isTopic) {
            router.push('/'); // Đẩy về trang chủ nếu xoá nguyên 1 chủ đề
          }
        } catch (error) {
          alert('Lỗi: ' + error.message);
        }
      });
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isPending}
      className={`flex items-center gap-1 hover:text-red-500 hover:underline transition px-1 ${isPending ? 'opacity-50 cursor-progress' : ''} text-red-400`}
      title={isFirstPost ? "Xoá Toàn Bộ Chủ Đề (Thread)" : "Xoá Bình Luận (Post)"}
    >
      <Trash2 size={13} />
      <span>{isPending ? 'Đang xoá...' : 'Xóa'}</span>
    </button>
  );
}
