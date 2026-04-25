"use client";

import { useTransition } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { approveThread, rejectThread } from '@/actions/adminActions';

export default function ApproveRejectButtons({ threadId, threadTitle }) {
  const [isPending, startTransition] = useTransition();

  const handleApprove = () => {
    startTransition(async () => {
      await approveThread(threadId);
    });
  };

  const handleReject = () => {
    if (!confirm(`Bạn chắc chắn muốn TỪ CHỐI và XÓA bài "${threadTitle}"?`)) return;
    startTransition(async () => {
      await rejectThread(threadId);
    });
  };

  return (
    <>
      <button
        onClick={handleReject}
        disabled={isPending}
        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-600 border border-red-500/30 rounded-md hover:bg-red-500/20 transition text-sm font-medium disabled:opacity-50"
      >
        <XCircle size={16} /> Từ chối
      </button>
      <button
        onClick={handleApprove}
        disabled={isPending}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition text-sm font-medium disabled:opacity-50"
      >
        <CheckCircle size={16} /> {isPending ? 'Đang xử lý...' : 'Duyệt bài'}
      </button>
    </>
  );
}
