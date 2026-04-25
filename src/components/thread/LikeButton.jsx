"use client";

import { useTransition, useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { handleReaction } from '@/actions/postActions';
import { usePathname } from 'next/navigation';

export default function LikeButton({ postId, initialLikeCount, initialDislikeCount, initialReaction, isLoggedIn = true }) {
  const [isPending, startTransition] = useTransition();
  const [likeCount, setLikeCount] = useState(initialLikeCount || 0);
  const [dislikeCount, setDislikeCount] = useState(initialDislikeCount || 0);
  const [myReaction, setMyReaction] = useState(initialReaction || null);
  const pathname = usePathname();

  const toggleAction = (type) => {
    if (!isLoggedIn) {
      window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { type: 'login' } }));
      return;
    }
    // Optimistic UI updates
    const prevReaction = myReaction;
    const prevLikes = likeCount;
    const prevDislikes = dislikeCount;

    let nextReaction = type;
    if (prevReaction === type) nextReaction = null; // Toggle OFF

    setMyReaction(nextReaction);

    // Adjust counters
    if (prevReaction === 'Like') setLikeCount(c => c - 1);
    if (prevReaction === 'Dislike') setDislikeCount(c => c - 1);

    if (nextReaction === 'Like') setLikeCount(c => c + 1);
    if (nextReaction === 'Dislike') setDislikeCount(c => c + 1);

    startTransition(async () => {
      try {
        const res = await handleReaction(postId, pathname, type);
        if (res.error) {
            setMyReaction(prevReaction);
            setLikeCount(prevLikes);
            setDislikeCount(prevDislikes);
            alert(res.error);
        } else {
            setMyReaction(res.currentReaction);
        }
      } catch (err) {
        setMyReaction(prevReaction);
        setLikeCount(prevLikes);
        setDislikeCount(prevDislikes);
      }
    });
  };

  return (
    <div className="flex gap-4 items-center" style={{ opacity: isPending ? 0.7 : 1, pointerEvents: isPending ? 'none' : 'auto' }}>
        {/* Nút Thích */}
        <div 
          onClick={() => toggleAction('Like')}
          className={`text-[12px] flex items-center gap-1 group cursor-pointer hover:underline ${myReaction === 'Like' ? 'text-[var(--voz-link)] font-semibold' : 'text-[var(--voz-text-muted)] hover:text-[var(--voz-link)]'}`}
        >
           <div className={`rounded-full p-[2px] ${myReaction === 'Like' ? 'bg-[#2574A9] text-white' : 'bg-transparent border border-gray-400 text-gray-400 group-hover:border-[#2574A9] group-hover:bg-[#2574A9] group-hover:text-white'}`}>
              <ThumbsUp size={12}/>
           </div>
           <span>Ưng ({likeCount})</span>
        </div>

        {/* Nút Gạch (Dislike) */}
        <div 
          onClick={() => toggleAction('Dislike')}
          className={`text-[12px] flex items-center gap-1 group cursor-pointer hover:underline ${myReaction === 'Dislike' ? 'text-red-500 font-semibold' : 'text-[var(--voz-text-muted)] hover:text-red-500'}`}
        >
           <div className={`rounded-full p-[2px] ${myReaction === 'Dislike' ? 'bg-red-500 text-white' : 'bg-transparent border border-gray-400 text-gray-400 group-hover:border-red-500 group-hover:bg-red-500 group-hover:text-white'}`}>
              <ThumbsDown size={12}/>
           </div>
           <span>Gạch ({dislikeCount})</span>
        </div>
    </div>
  );
}
