'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Mail } from 'lucide-react';
import { findOrCreateDirectConversation } from '@/actions/conversationActions';

export default function InboxButton({ targetUserId }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      try {
        const res = await findOrCreateDirectConversation(targetUserId);
        if (res.success) {
          router.push(`/conversations/${res.conversationId}`);
        }
      } catch (err) {
        alert(err.message || 'Có lỗi xảy ra');
      }
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="bg-[#2574A9] hover:bg-[#1a5f8a] text-white px-4 py-2 font-medium text-[13px] rounded flex items-center gap-2 border-b-[3px] border-[#1a5276] active:border-b-0 active:translate-y-[2px] transition-all"
    >
      <Mail size={16} />
      {isPending ? 'Đang mở...' : 'Inbox'}
    </button>
  );
}
