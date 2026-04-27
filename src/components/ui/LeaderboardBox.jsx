'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getRankInfo } from '@/lib/rank';
import { Trophy, Crown, Medal, Award } from 'lucide-react';

const POSITION_STYLES = [
  { icon: '🥇', color: '#FFD700', bg: 'rgba(255,215,0,0.1)' },
  { icon: '🥈', color: '#C0C0C0', bg: 'rgba(192,192,192,0.1)' },
  { icon: '🥉', color: '#CD7F32', bg: 'rgba(205,127,50,0.1)' },
  { icon: '4', color: 'var(--voz-text-muted)', bg: 'transparent' },
  { icon: '5', color: 'var(--voz-text-muted)', bg: 'transparent' },
];

export default function LeaderboardBox({ topUsersTotal, topUsersMonth }) {
  const [tab, setTab] = useState('total'); // 'total' | 'month'
  
  const users = tab === 'total' ? topUsersTotal : topUsersMonth;
  
  return (
    <div className="voz-card overflow-hidden">
      {/* Tab Header */}
      <div className="bg-[var(--voz-accent)] border-b border-[var(--voz-border)] flex text-[13px]">
        <button 
          onClick={() => setTab('total')}
          className={`flex-1 px-3 py-2 font-medium transition-colors ${tab === 'total' ? 'text-[#185886] border-b-2 border-[#185886]' : 'text-[var(--voz-text-muted)] hover:text-[var(--voz-text)]'}`}
        >
          <Trophy size={14} className="inline mr-1" /> Tổng
        </button>
        <button 
          onClick={() => setTab('month')}
          className={`flex-1 px-3 py-2 font-medium transition-colors ${tab === 'month' ? 'text-[#185886] border-b-2 border-[#185886]' : 'text-[var(--voz-text-muted)] hover:text-[var(--voz-text)]'}`}
        >
          <Medal size={14} className="inline mr-1" /> Tháng
        </button>
      </div>
      
      {/* Leaderboard List */}
      <div className="flex flex-col bg-[var(--voz-accent)]">
        {users.length === 0 && (
          <div className="p-4 text-center text-[12px] text-[var(--voz-text-muted)]">
            Chưa có dữ liệu xếp hạng
          </div>
        )}
        
        {users.map((user, index) => {
          const rank = getRankInfo(user.points);
          const pos = POSITION_STYLES[index] || POSITION_STYLES[4];
          const displayPoints = tab === 'month' ? user.monthPoints : user.points;
          
          return (
            <div 
              key={user.id} 
              className={`p-2.5 border-b border-[var(--voz-border)] flex items-center gap-2.5 last:border-b-0 hover:bg-[var(--voz-surface)] transition-colors ${index === 0 ? 'bg-[rgba(255,215,0,0.03)]' : ''}`}
            >
              {/* Position */}
              <div className="w-[24px] text-center shrink-0">
                {index < 3 ? (
                  <span className={`text-[16px] ${index === 0 ? 'crown-animate inline-block' : ''}`}>{pos.icon}</span>
                ) : (
                  <span className="text-[13px] font-bold text-[var(--voz-text-muted)]">{pos.icon}</span>
                )}
              </div>
              
              {/* Avatar */}
              <Link href={`/profile/${user.username}`}>
                <img 
                  src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=random`} 
                  className="w-[28px] h-[28px] rounded-full object-cover shrink-0 border border-black/10" 
                />
              </Link>
              
              {/* Name + Rank */}
              <div className="flex-1 min-w-0">
                <Link href={`/profile/${user.username}`} className="text-[13px] font-semibold text-[var(--voz-link)] hover:underline block truncate">
                  {user.username}
                </Link>
                <span 
                  className={`text-[9px] px-1 py-[0px] rounded-sm font-bold ${rank.isMax ? 'rank-epic' : ''}`}
                  style={{ color: rank.color, backgroundColor: rank.bg, border: `1px solid ${rank.color}30` }}
                >
                  {rank.icon} {rank.title}
                </span>
              </div>
              
              {/* Points */}
              <div className="text-right shrink-0">
                <div className="text-[14px] font-bold" style={{ color: rank.color }}>{displayPoints}</div>
                <div className="text-[9px] text-[var(--voz-text-muted)]">công đức</div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* View All Link */}
      <Link 
        href="/leaderboard" 
        className="block bg-[var(--voz-accent)] text-center text-[12px] text-[var(--voz-link)] py-2 border-t border-[var(--voz-border)] hover:bg-[var(--voz-surface)] transition-colors hover:underline"
      >
        Xem bảng xếp hạng đầy đủ →
      </Link>
    </div>
  );
}
