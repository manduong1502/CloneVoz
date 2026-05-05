"use client";
import { Trash2 } from 'lucide-react';
import { deleteNode } from '@/actions/nodeActions';

export default function DeleteCategoryButton({ nodeId, title }) {
  return (
    <button 
      onClick={async () => {
        if (!confirm(`CẢNH BÁO NGUY HIỂM: Bạn có chắc chắn muốn xóa thư mục "${title}" cùng TOÀN BỘ bài viết bên trong không?`)) return;
        await deleteNode(nodeId);
      }}
      className="p-1.5 text-[var(--voz-text-muted)] hover:text-red-500 hover:bg-[var(--voz-hover)] rounded transition" 
      title="Xóa danh mục"
    >
      <Trash2 size={16} />
    </button>
  );
}
