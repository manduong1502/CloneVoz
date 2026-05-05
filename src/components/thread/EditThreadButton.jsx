'use client';

import { useState, useRef, useTransition } from 'react';
import { Pencil, X, Loader2 } from 'lucide-react';
import { editThread } from '@/actions/threadActions';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { useRouter } from 'next/navigation';

export default function EditThreadButton({ threadId, currentTitle, currentContent }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState(currentTitle);
  const [content, setContent] = useState(currentContent);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPending, startTransition] = useTransition();
  const editorRef = useRef(null);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title.trim() || !content.trim() || content === '<p></p>') {
      setError('Vui lòng nhập đủ Tiêu đề và Nội dung.');
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set('title', title.trim());
        formData.set('content', content);

        const result = await editThread(threadId, formData);
        
        if (result.needsApproval) {
          setSuccess('Bài viết đã được cập nhật và đang chờ duyệt lại.');
        } else {
          setSuccess('Bài viết đã được cập nhật thành công!');
        }

        setTimeout(() => {
          setIsOpen(false);
          setSuccess('');
          router.refresh();
        }, 1500);
      } catch (err) {
        setError(err.message || 'Đã xảy ra lỗi khi cập nhật bài viết.');
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 text-[var(--voz-text-muted)] hover:text-[var(--voz-link)] cursor-pointer transition-colors"
      >
        <Pencil size={12} /> Sửa bài
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => !isPending && setIsOpen(false)}>
          <div 
            className="bg-[var(--voz-surface)] border border-[var(--voz-border)] rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[var(--voz-accent)] border-b border-[var(--voz-border)] px-5 py-3 flex justify-between items-center rounded-t-lg">
              <h3 className="text-[16px] font-semibold text-[var(--voz-text)]">
                <Pencil size={16} className="inline mr-2 text-[var(--voz-link)]" />
                Chỉnh sửa bài viết
              </h3>
              <button onClick={() => !isPending && setIsOpen(false)} className="text-[var(--voz-text-muted)] hover:text-[var(--voz-text)] transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 flex flex-col gap-4 overflow-y-auto flex-1">
                {/* Warning */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded px-4 py-2.5 text-[13px] text-amber-600">
                  ⚠️ Sau khi chỉnh sửa, bài viết sẽ được gửi duyệt lại. Trong thời gian chờ duyệt, chỉ bạn mới có thể xem bài viết này.
                </div>

                {/* Title */}
                <div>
                  <label className="text-[13px] font-medium text-[var(--voz-text)] mb-1 block">Tiêu đề</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--voz-accent)] border border-[var(--voz-border)] rounded text-[14px] text-[var(--voz-text)] focus:outline-none focus:ring-1 focus:ring-[var(--voz-link)]"
                    placeholder="Nhập tiêu đề bài viết..."
                    disabled={isPending}
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="text-[13px] font-medium text-[var(--voz-text)] mb-1 block">Nội dung</label>
                  <div className="min-h-[250px]">
                    <RichTextEditor
                      ref={editorRef}
                      content={content}
                      onChange={setContent}
                      placeholder="Nhập nội dung bài viết..."
                    />
                  </div>
                </div>

                {/* Messages */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded px-4 py-2 text-[13px] text-red-500">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded px-4 py-2 text-[13px] text-emerald-500">
                    ✅ {success}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-[var(--voz-accent)] border-t border-[var(--voz-border)] px-5 py-3 flex justify-end gap-3 rounded-b-lg">
                <button 
                  type="button" 
                  onClick={() => !isPending && setIsOpen(false)}
                  className="px-4 py-2 text-[13px] text-[var(--voz-text-muted)] hover:text-[var(--voz-text)] transition-colors"
                  disabled={isPending}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-[#f2930d] hover:bg-[#d88107] text-white rounded px-5 py-2 font-medium text-[13px] flex items-center gap-2 border-b-[3px] border-[#c07306] active:border-b-0 active:translate-y-[2px] transition-all disabled:opacity-50"
                >
                  {isPending ? <><Loader2 size={14} className="animate-spin" /> Đang lưu...</> : 'Lưu & Nộp duyệt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
