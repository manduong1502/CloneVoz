import { getRankInfo } from '@/lib/rank';

export default function RankBadge({ points, showProgress = false, size = 'sm' }) {
  const rank = getRankInfo(points);
  
  const sizeClasses = size === 'lg' 
    ? 'text-[12px] px-2 py-[3px]' 
    : 'text-[10px] px-1.5 py-[1px]';
  
  return (
    <div className="inline-flex flex-col items-center gap-[2px]">
      <span 
        className={`rank-badge inline-flex items-center gap-1 rounded-sm font-bold ${sizeClasses} whitespace-nowrap ${rank.isMax ? 'rank-epic' : ''}`}
        style={{ 
          color: rank.color, 
          backgroundColor: rank.bg,
          border: `1px solid ${rank.color}30`,
        }}
      >
        <span className="rank-icon">{rank.icon}</span>
        {rank.title}
      </span>
      
    </div>
  );
}
