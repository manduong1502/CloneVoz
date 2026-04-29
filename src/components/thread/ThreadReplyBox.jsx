"use client";

import { useRef, useState, useEffect, useTransition } from 'react';
import { X } from 'lucide-react';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { createReply } from '@/actions/postActions';

export default function ThreadReplyBox({ session, threadId }) {
  const [content, setContent] = useState('');
  const [turnstileToken, setTurnstileToken] = useState(null);
  const [showTurnstile, setShowTurnstile] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [quotingUser, setQuotingUser] = useState(null); // Tên user đang được trích dẫn
  const editorRef = useRef(null);

  // Lắng nghe Event gài Quote
  useEffect(() => {
    const handleQuote = (e) => {
      const { username, text } = e.detail;
      const quoteHtml = `<blockquote class="voz-quote"><div class="voz-quote-header">${username} đã viết:</div><div class="voz-quote-body">${text}</div></blockquote><p></p>`;
      
      const editor = editorRef.current?.getEditor();
      if (editor) {
        editor.commands.setContent(quoteHtml);
        setContent(quoteHtml);
        editor.commands.focus();
        setShowTurnstile(true);
        setQuotingUser(username);
        
        document.getElementById('reply-box')?.scrollIntoView({ behavior: 'smooth' });
      }
    };

    window.addEventListener('insert-quote', handleQuote);
    return () => window.removeEventListener('insert-quote', handleQuote);
  }, []);

  const handleClearQuote = () => {
    const editor = editorRef.current?.getEditor();
    if (editor) {
      editor.commands.setContent('');
      setContent('');
      setQuotingUser(null);
    }
  };

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
    if (!turnstileToken) {
       alert("Vui lòng xác minh bảo vệ Cloudflare!");
       return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('turnstileToken', turnstileToken);
      
      await createReply(threadId, formData);
      
      const editor = editorRef.current?.getEditor();
      if (editor) {
        editor.commands.setContent('');
        setContent('');
      }
      setShowTurnstile(false);
      setTurnstileToken(null);
      setQuotingUser(null);
    });
  };

  const handleEditorFocus = () => {
    if (!showTurnstile) setShowTurnstile(true);
  };

  if (!session) {
    return (
      <div className="voz-card mt-4 p-5 text-center bg-[var(--voz-accent)]">
         <span className="text-[var(--voz-text-muted)] text-[14px]">Bạn phải </span>
         <button 
           onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { type: 'login' } }))}
           className="text-[var(--voz-link)] font-bold cursor-pointer hover:underline bg-transparent border-0 p-0 text-[14px]"
         >đăng nhập</button>
         <span className="text-[var(--voz-text-muted)] text-[14px]"> hoặc </span>
         <button 
           onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { type: 'register' } }))}
           className="text-[var(--voz-link)] font-bold cursor-pointer hover:underline bg-transparent border-0 p-0 text-[14px]"
         >đăng ký</button>
         <span className="text-[var(--voz-text-muted)] text-[14px]"> để trả lời bài viết.</span>
      </div>
    );
  }

  return (
    <form id="reply-box" onSubmit={handleSubmit} className="voz-card mt-4 overflow-hidden">
      <div className="bg-[var(--voz-accent)] px-4 py-[10px] text-[13px] border-b border-[var(--voz-border)] text-[#183254] font-medium flex gap-2 items-center justify-between">
         <div className="flex gap-2 items-center">
           <img src={session.user.image} className="w-5 h-5 rounded-sm" /> Gửi trả lời dưới tên {session.user.name}
         </div>
      </div>

      {/* Quote indicator bar with dismiss button */}
      {quotingUser && (
        <div className="bg-[#f2930d]/15 border-l-[3px] border-[#f2930d] px-4 py-2 text-[13px] text-[var(--voz-text-strong)] flex justify-between items-center">
          <span>💬 Gửi trả lời dưới tên <strong>{quotingUser}</strong></span>
          <button 
            type="button" 
            onClick={handleClearQuote}
            className="text-[var(--voz-text-muted)] hover:text-red-500 transition-colors p-1 rounded hover:bg-red-500/10"
            title="Xóa trích dẫn"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="p-4 bg-[var(--voz-surface)] flex flex-col items-end w-full" onClick={handleEditorFocus}>
         <RichTextEditor 
            ref={editorRef}
            content={content}
            onChange={setContent}
            onImageUpload={handleImageUpload}
         />
         <div className="flex flex-col sm:flex-row gap-3 items-center mt-3 w-full justify-between">
           {showTurnstile ? (
             <TurnstileLazy 
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                onSuccess={(token) => setTurnstileToken(token)}
             />
           ) : (
             <div className="text-xs text-[var(--voz-text-muted)]">Bảo mật Cloudflare sẽ kích hoạt khi bạn soạn thảo</div>
           )}
           <div className="flex gap-2 items-center">
             {isPending && <span className="text-sm text-[var(--voz-text-muted)]">Đang gửi...</span>}
             <button type="submit" disabled={isPending || !turnstileToken} className="voz-button px-6 py-[6px] disabled:opacity-50">
               Gửi trả lời
             </button>
           </div>
         </div>
      </div>
    </form>
  );
}

// Lazy-load Turnstile component
function TurnstileLazy({ siteKey, onSuccess }) {
  const { Turnstile } = require('@marsidev/react-turnstile');
  return (
    <Turnstile 
      siteKey={siteKey}
      onSuccess={onSuccess}
      options={{ theme: 'auto', size: 'compact' }}
    />
  );
}
