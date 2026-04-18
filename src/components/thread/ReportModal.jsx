"use client";

import { useState, useTransition } from 'react';
import Modal from '@/components/ui/Modal';
import { submitReport } from '@/actions/reportActions';

export default function ReportModal({ postId, threadId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleOpen = () => {
    setIsOpen(true);
    setSuccess(false);
    setReason('');
    setErrorCode('');
  };

  const handleReport = (e) => {
    e.preventDefault();
    if (!reason) {
      setErrorCode("Vui lòng nhập lý do phạt!");
      return;
    }
    
    startTransition(async () => {
      try {
        await submitReport({ reason, postId, threadId });
        setSuccess(true);
        setTimeout(() => setIsOpen(false), 2000);
      } catch(err) {
        setErrorCode(err.message || "Có lỗi xảy ra.");
      }
    });
  };

  return (
    <>
      <button 
        onClick={handleOpen} 
        className="hover:underline hover:text-[var(--voz-link)] flex items-center gap-1 bg-transparent border-0 p-0 text-inherit cursor-pointer"
      >
        <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M349.565 98.635C310.455 137.745 285.145 150.315 256 150.315c-29.146 0-54.456-12.57-93.565-51.68C127.319 63.518 78.431 32 0 32v352c78.431 0 127.319 31.518 162.435 66.635C201.545 489.745 226.855 502.315 256 502.315c29.146 0 54.456-12.57 93.565-51.68C384.681 415.518 433.569 384 512 384V32c-78.431 0-127.319 31.518-162.435 66.635z"></path></svg>
        Báo cáo vi phạm
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Báo cáo nội dung vi phạm" width="500px">
        <div className="p-4 bg-[var(--voz-accent)] text-[14px]">
           {success ? (
             <div className="text-green-600 font-bold p-4 text-center">Báo cáo của bạn đã được gửi. Đội ngũ quản trị sẽ xử lý sớm nhất!</div>
           ) : (
             <form onSubmit={handleReport} className="flex flex-col gap-3">
                {errorCode && <div className="text-red-500 font-bold text-sm bg-red-50 p-2 border border-red-200">{errorCode}</div>}
                
                <label className="font-semibold text-[var(--voz-text-strong)] text-[13px]">Lý do báo cáo:</label>
                <textarea 
                  value={reason} 
                  onChange={e => setReason(e.target.value)}
                  className="w-full border border-[var(--voz-border)] p-2 rounded-sm focus:border-[var(--voz-link)] outline-none resize-y min-h-[100px]"
                  placeholder="Vui lòng cung cấp lý do. Nội dung báo cáo sẽ được Mod xem xét."
                />

                <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-[var(--voz-border)]">
                   <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 bg-[var(--voz-border)] text-[var(--voz-text)] rounded-sm hover:bg-[var(--voz-border-light)] text-[13px] font-medium">Hủy bỏ</button>
                   <button type="submit" disabled={isPending} className="voz-button px-4 py-2 min-w-[100px]">
                      {isPending ? 'Đang gửi...' : 'Gửi Báo Cáo'}
                   </button>
                </div>
             </form>
           )}
        </div>
      </Modal>
    </>
  );
}
