'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, X, Check } from 'lucide-react';
import { editConversationMessage, deleteConversationMessage } from '@/actions/conversationActions';
import { RichTextEditor } from '@/components/ui/RichTextEditor';

export default function ConversationMessageActions({ messageId, content, isOwner }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [isPending, startTransition] = useTransition();

  if (!isOwner) return null;

  const handleImageUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      return data.url;
    } catch (e) {
      alert('Lỗi upload ảnh.');
      return null;
    }
  };

  const handleEdit = () => {
    startTransition(async () => {
      try {
        const res = await editConversationMessage(messageId, editContent);
        if (res.success) {
          setIsEditing(false);
          router.refresh();
        }
      } catch (err) {
        alert(err.message || 'Lỗi khi sửa tin nhắn');
      }
    });
  };

  const handleDelete = () => {
    if (!confirm('Bạn có chắc muốn xóa tin nhắn này?')) return;
    startTransition(async () => {
      try {
        const res = await deleteConversationMessage(messageId);
        if (res.success) {
          router.refresh();
        }
      } catch (err) {
        alert(err.message || 'Lỗi khi xóa tin nhắn');
      }
    });
  };

  if (isEditing) {
    return (
      <div className="p-4 flex flex-col gap-2">
        <RichTextEditor
          content={editContent}
          onChange={setEditContent}
          onImageUpload={handleImageUpload}
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => { setIsEditing(false); setEditContent(content); }}
            disabled={isPending}
            className="flex items-center gap-1 px-3 py-1 text-[12px] rounded bg-[var(--voz-border)] hover:bg-[var(--voz-border-light)] text-[var(--voz-text)] transition"
          >
            <X size={13} /> Hủy
          </button>
          <button
            onClick={handleEdit}
            disabled={isPending}
            className="flex items-center gap-1 px-3 py-1 text-[12px] rounded bg-[#2574A9] hover:bg-[#1a5f8a] text-white transition"
          >
            <Check size={13} /> {isPending ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setIsEditing(true)}
        className="p-1 rounded hover:bg-[var(--voz-hover)] text-[var(--voz-text-muted)] hover:text-[#2574A9] transition"
        title="Sửa tin nhắn"
      >
        <Pencil size={13} />
      </button>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="p-1 rounded hover:bg-[var(--voz-hover)] text-[var(--voz-text-muted)] hover:text-red-500 transition"
        title="Xóa tin nhắn"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}
