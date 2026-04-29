"use client";

import { useRef, useState, useTransition } from 'react';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { replyToConversation } from '@/actions/conversationActions';

export default function ConversationReplyBox({ session, conversationId }) {
  const [content, setContent] = useState('');
  const [isPending, startTransition] = useTransition();
  const editorRef = useRef(null);

  const handleImageUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      return data.url;
    } catch (e) {
      console.error(e);
      alert('Lỗi upload ảnh.');
      return null;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content || content === '<p></p>') return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append('content', content);
      
      await replyToConversation(conversationId, formData);
      
      const editor = editorRef.current?.getEditor();
      if (editor) {
        editor.commands.setContent('');
        setContent('');
      }
    });
  };

  if (!session) return null;

  return (
    <form id="reply-box" onSubmit={handleSubmit} className="voz-card mt-4 overflow-hidden">
      <div className="bg-[var(--voz-accent)] px-4 py-[10px] text-[13px] border-b border-[var(--voz-border)] text-[#183254] font-medium flex gap-2 items-center">
         <img src={session.user.image} className="w-5 h-5 rounded-sm" /> Gửi tin nhắn
      </div>
      <div className="p-4 bg-[var(--voz-surface)] flex flex-col items-end w-full">
         <RichTextEditor 
            ref={editorRef}
            content={content}
            onChange={setContent}
            onImageUpload={handleImageUpload}
            placeholder="Nhập nội dung tin nhắn..."
         />
         <div className="flex gap-2 items-center mt-3 w-full justify-end">
           {isPending && <span className="text-sm text-[var(--voz-text-muted)]">Đang gửi...</span>}
           <button type="submit" disabled={isPending} className="voz-button px-6 py-[6px] disabled:opacity-50">
             Gửi tin
           </button>
         </div>
      </div>
    </form>
  );
}
