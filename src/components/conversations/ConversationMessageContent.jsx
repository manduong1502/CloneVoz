'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, X, Check } from 'lucide-react';
import { editConversationMessage, deleteConversationMessage } from '@/actions/conversationActions';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import HtmlWithLightbox from '@/components/ui/HtmlWithLightbox';

export default function ConversationMessageContent({ messageId, content, createdAt, isOwner }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [isPending, startTransition] = useTransition();

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
      <div className="flex-1 bg-[var(--voz-surface)] flex flex-col min-w-0">
         <div className="flex justify-between items-center text-[11px] text-[var(--voz-text-muted)] px-4 py-2 border-b border-[var(--voz-border-light)]">
            <span>{new Date(createdAt).toLocaleString('vi-VN')}</span>
         </div>
         <div className="p-4 flex flex-col gap-3">
            <div className="border border-[var(--voz-border-light)] rounded overflow-hidden">
               <RichTextEditor
                 content={editContent}
                 onChange={setEditContent}
                 onImageUpload={handleImageUpload}
               />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setIsEditing(false); setEditContent(content); }}
                disabled={isPending}
                className="flex items-center gap-1 px-4 py-2 text-[13px] rounded font-medium bg-[var(--voz-surface)] hover:bg-[var(--voz-hover)] border border-[var(--voz-border)] text-[var(--voz-text)] transition"
              >
                <X size={14} /> Hủy
              </button>
              <button
                onClick={handleEdit}
                disabled={isPending}
                className="flex items-center gap-1 px-4 py-2 text-[13px] rounded font-medium bg-[#2574A9] hover:bg-[#1a5f8a] text-white transition"
              >
                <Check size={14} /> {isPending ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
         </div>
      </div>
    );
  }

  return (
      <div className="flex-1 bg-[var(--voz-surface)] flex flex-col min-w-0">
         <div className="flex justify-between items-center text-[11px] text-[var(--voz-text-muted)] px-4 py-2 border-b border-[var(--voz-border-light)]">
            <span>{new Date(createdAt).toLocaleString('vi-VN')}</span>
            {isOwner && (
              <div className="flex items-center gap-2">
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
            )}
         </div>
         <HtmlWithLightbox className="p-4 text-[15px] leading-relaxed flex-1 post-content" html={content} />
      </div>
  );
}
