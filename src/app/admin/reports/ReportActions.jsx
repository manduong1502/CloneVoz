"use client";

import { useTransition } from 'react';
import { resolveReportAndWarn, rejectReport } from '@/actions/reportActions';
import { banUser } from '@/actions/adminActions';

export default function ReportActions({ reportId, targetUserId, targetUsername, reason }) {
  const [isPending, startTransition] = useTransition();

  const handleWarn = () => {
    startTransition(async () => {
      await resolveReportAndWarn({ 
        reportId, 
        warningReason: reason, 
        warningPoints: 1, 
        targetUserId 
      });
    });
  };

  const handleBan = () => {
    if (!confirm(`Bạn chắc chắn muốn BAN user "${targetUsername}"?`)) return;
    startTransition(async () => {
      await banUser(targetUserId);
      await resolveReportAndWarn({ 
        reportId, 
        warningReason: reason + ' [BAN]', 
        warningPoints: 10, 
        targetUserId 
      });
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      await rejectReport(reportId);
    });
  };

  return (
    <div className="flex flex-col gap-2" style={{ opacity: isPending ? 0.5 : 1 }}>
      <button 
        onClick={handleWarn}
        disabled={isPending}
        className="bg-amber-500 text-white px-3 py-2 rounded text-xs font-bold hover:bg-amber-600 transition disabled:opacity-50"
      >
        ⚠️ Cảnh cáo +1
      </button>

      <button 
        onClick={handleBan}
        disabled={isPending}
        className="bg-red-600 text-white px-3 py-2 rounded text-xs font-bold hover:bg-red-700 transition disabled:opacity-50"
      >
        🚫 Ban ngay
      </button>
      
      <button 
        onClick={handleReject}
        disabled={isPending}
        className="bg-[var(--voz-border)] text-[var(--voz-text)] px-3 py-2 rounded text-xs hover:bg-[var(--voz-border-light)] font-medium transition disabled:opacity-50"
      >
        ✗ Bỏ qua
      </button>
    </div>
  );
}
