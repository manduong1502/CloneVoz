"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { createConversation } from '@/actions/conversationActions';

export default function NewConversationPage() {
  const router = useRouter();
  const [toUsername, setToUsername] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isPending, startTransition] = useTransition();

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
      alert('Lỗi upload ảnh.');
      return null;
    }
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!toUsername || !title || !content || content === '<p></p>') {
      setErrorMsg("Vui lòng nhập đầy đủ Tên người nhận, Tiêu đề và Nội dung.");
      return;
    }
    setErrorMsg('');

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('toUsername', toUsername);
        formData.append('title', title);
        formData.append('content', content);
        
        const res = await createConversation(formData);
        if (res.success) {
           router.push(`/conversations/${res.conversationId}`);
        }
      } catch (err) {
        setErrorMsg(err.message || "Tên người dùng không hợp lệ hoặc đã có lỗi xảy ra.");
      }
    });
  };

  return (
    <div className="max-w-[1000px] mx-auto w-full">
      <div className="mb-4">
        <h1 className="text-[26px] tracking-tight font-normal text-[var(--voz-text)]">Bắt đầu cuộc trò chuyện mới</h1>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 text-red-700 text-sm">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleCreate} className="voz-card bg-[#f5f5f5] p-4 text-[13px]">
         <div className="flex flex-col md:flex-row mb-4 gap-4 md:items-center">
            <label className="md:w-[200px] text-right font-medium text-[#141414]">Người nhận:</label>
            <input 
              type="text" 
              value={toUsername}
              onChange={e => setToUsername(e.target.value)}
              className="flex-1 border border-[var(--voz-border)] rounded-[2px] p-2 focus:border-[var(--voz-link)] outline-none" 
              placeholder="Nhập chính xác Username người nhận (VD: Kuang2)..." 
            />
         </div>
         
         <div className="flex flex-col md:flex-row mb-4 gap-4 md:items-center">
            <label className="md:w-[200px] text-right font-medium text-[#141414]">Tiêu đề:</label>
            <input 
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="flex-1 border border-[var(--voz-border)] rounded-[2px] p-2 focus:border-[var(--voz-link)] outline-none" 
              placeholder="Tiêu đề cuộc trò chuyện..." 
            />
         </div>

         <div className="flex flex-col md:flex-row mb-4 gap-4">
            <label className="md:w-[200px] text-right font-medium text-[#141414] mt-2">Nội dung:</label>
            <div className="flex-1 bg-white">
              <RichTextEditor 
                content={content}
                onChange={setContent}
                onImageUpload={handleImageUpload}
              />
            </div>
         </div>

         <div className="flex justify-center border-t border-[var(--voz-border)] pt-4 mt-4">
            <button type="submit" disabled={isPending} className="voz-button px-6 py-[6px] min-w-[200px]">
              {isPending ? 'Đang gửi...' : 'Bắt đầu trò chuyện'}
            </button>
         </div>
      </form>
    </div>
  );
}
