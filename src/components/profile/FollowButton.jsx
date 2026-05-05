'use client';

import { useState, useTransition } from 'react';
import { UserPlus, UserMinus } from 'lucide-react';
import { toggleFollow } from '@/actions/followActions';

export default function FollowButton({ targetUserId, initialIsFollowing }) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      try {
        const res = await toggleFollow(targetUserId);
        if (res.success) {
          setIsFollowing(res.isFollowing);
        }
      } catch (err) {
        alert(err.message);
      }
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`px-4 py-2 font-medium text-[13px] rounded flex items-center gap-2 border transition-all ${
        isFollowing
          ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
          : 'bg-[var(--voz-surface)] hover:bg-[var(--voz-accent)] text-[var(--voz-text-strong)] border-[#ccc]'
      } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isFollowing ? <UserMinus size={14} /> : <UserPlus size={14} />}
      {isPending ? '...' : isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
    </button>
  );
}
