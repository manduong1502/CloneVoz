"use client";

import { useRef, useState, useTransition } from 'react';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { createThread } from '@/actions/threadActions';
import { Turnstile } from '@marsidev/react-turnstile';

export default function ThreadCreateBox({ session, nodeId }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [turnstileToken, setTurnstileToken] = useState(null);
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
    if (!title.trim()) { alert("Vui lòng nhập tiêu đề!"); return; }
    if (!content || content === '<p></p>') { alert("Vui lòng nhập nội dung!"); return; }
    if (!turnstileToken) { alert("Vui lòng xác minh bảo mật Cloudflare!"); return; }

    startTransition(async () => {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      formData.append('turnstileToken', turnstileToken);
      
      try {
        await createThread(nodeId, formData);
      } catch (error) {
        // NEXT_REDIRECT là redirect của Next.js — phải re-throw
        if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
        alert(error.message);
      }
    });
  };

  if (!session) {
    return (
      <div className="voz-card mt-4 p-4 text-center bg-[var(--voz-accent)]">
         <span className="text-[var(--voz-text-muted)]">Bạn phải <span className="text-[var(--voz-link)] font-bold cursor-pointer">đăng nhập</span> để tạo chủ đề mới.</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="bg-[var(--voz-surface)] border border-[var(--voz-border)] rounded-sm p-4 flex flex-col gap-4 shadow-sm">
        
        <div className="flex flex-col gap-1">
           <label className="text-[14px] font-semibold text-[var(--voz-text-strong)]">Tiêu đề</label>
           <input 
             type="text" 
             value={title}
             onChange={(e) => setTitle(e.target.value)}
             required
             className="w-full border border-[var(--voz-border)] bg-[var(--voz-surface)] text-[var(--voz-text)] p-2 rounded-[2px] focus:border-[var(--voz-link)] outline-none text-[15px]" 
             placeholder="Nhập tiêu đề chủ đề..." 
           />
        </div>
        
        <div className="flex flex-col gap-1">
           <label className="text-[14px] font-semibold text-[var(--voz-text-strong)]">Nội dung</label>
           <RichTextEditor 
              ref={editorRef}
              content={content}
              onChange={setContent}
              onImageUpload={handleImageUpload}
              placeholder="Viết nội dung bài viết vào đây..."
           />
        </div>

      </div>

      <div className="flex flex-col items-center gap-3 mt-2">
         {/* CLOUDFLARE TURNSTILE WIDGET */}
         <Turnstile 
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} 
            onSuccess={(token) => setTurnstileToken(token)}
            options={{ theme: 'auto' }}
         />

         {isPending && <span className="text-[13px] text-[var(--voz-text-muted)]">Đang chèn dữ liệu...</span>}
         <button type="submit" disabled={isPending || !turnstileToken} className="voz-button w-[200px] justify-center py-[10px] text-[15px] disabled:opacity-50">
            Đăng bài
         </button>
      </div>
    </form>
  );
}
