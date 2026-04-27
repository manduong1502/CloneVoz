import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getRankInfo } from '@/lib/rank';
import RankBadge from '@/components/ui/RankBadge';
import { Trophy, Medal, Crown } from 'lucide-react';

export const metadata = {
  title: 'Bảng xếp hạng | DanOngThongMinh',
  description: 'Bảng xếp hạng thành viên diễn đàn Đàn Ông Thông Minh theo công đức tổng và công đức tháng.',
};

export default async function LeaderboardPage() {
  // Xếp hạng tổng — top 20
  const topUsersTotal = await prisma.user.findMany({
    orderBy: { points: 'desc' },
    take: 20,
    select: { id: true, username: true, avatar: true, points: true, messageCount: true, reactionScore: true, createdAt: true }
  });

  // Xếp hạng tháng — top 20
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthName = now.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  
  const monthlyRaw = await prisma.pointLog.groupBy({
    by: ['userId'],
    where: { createdAt: { gte: startOfMonth }, action: { in: ['like', 'dislike'] } },
    _sum: { points: true },
    orderBy: { _sum: { points: 'desc' } },
    take: 20
  });
  
  const monthlyUserIds = monthlyRaw.map(r => r.userId);
  const monthlyUsers = monthlyUserIds.length > 0 
    ? await prisma.user.findMany({ where: { id: { in: monthlyUserIds } }, select: { id: true, username: true, avatar: true, points: true, messageCount: true, reactionScore: true, createdAt: true } })
    : [];
  
  const topUsersMonth = monthlyRaw.map(r => {
    const u = monthlyUsers.find(u => u.id === r.userId);
    return u ? { ...u, monthPoints: r._sum.points } : null;
  }).filter(Boolean);

  const POSITION_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
  const POSITION_ICONS = ['🥇', '🥈', '🥉'];

  const renderTable = (users, type) => (
    <div className="voz-card overflow-hidden">
      {/* Header row */}
      <div className="bg-[var(--voz-accent)] px-4 py-2.5 grid grid-cols-[40px_1fr_100px_100px] md:grid-cols-[40px_1fr_100px_100px_120px] gap-2 text-[12px] font-bold text-[var(--voz-text-muted)] border-b border-[var(--voz-border)] uppercase tracking-wide">
        <div className="text-center">#</div>
        <div>Thành viên</div>
        <div className="text-center">{type === 'total' ? 'Công đức' : 'Tháng này'}</div>
        <div className="text-center">Bài viết</div>
        <div className="text-center hidden md:block">Tham gia</div>
      </div>
      
      {/* Rows */}
      {users.map((user, index) => {
        const rank = getRankInfo(user.points);
        const displayPoints = type === 'month' ? user.monthPoints : user.points;
        
        return (
          <div 
            key={user.id} 
            className={`px-4 py-3 grid grid-cols-[40px_1fr_100px_100px] md:grid-cols-[40px_1fr_100px_100px_120px] gap-2 items-center border-b border-[var(--voz-border)] last:border-b-0 hover:bg-[var(--voz-accent)] transition-colors ${index < 3 ? 'bg-[var(--voz-accent)]' : 'bg-[var(--voz-surface)]'}`}
          >
            {/* Position */}
            <div className="text-center">
              {index < 3 ? (
                <span className={`text-[20px] ${index === 0 ? 'crown-animate inline-block' : ''}`}>
                  {POSITION_ICONS[index]}
                </span>
              ) : (
                <span className="text-[14px] font-bold text-[var(--voz-text-muted)]">{index + 1}</span>
              )}
            </div>
            
            {/* User Info */}
            <div className="flex items-center gap-3 min-w-0">
              <Link href={`/profile/${user.username}`}>
                <img 
                  src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=random`} 
                  className={`w-[36px] h-[36px] rounded-full object-cover shrink-0 ${index < 3 ? 'ring-2' : 'border border-black/10'}`}
                  style={index < 3 ? { '--tw-ring-color': POSITION_COLORS[index] } : {}}
                />
              </Link>
              <div className="min-w-0">
                <Link href={`/profile/${user.username}`} className="text-[14px] font-semibold text-[var(--voz-link)] hover:underline block truncate">
                  {user.username}
                </Link>
                <RankBadge points={user.points} />
              </div>
            </div>
            
            {/* Points */}
            <div className="text-center">
              <span className="text-[16px] font-bold" style={{ color: rank.color }}>{displayPoints}</span>
            </div>
            
            {/* Posts */}
            <div className="text-center text-[13px] text-[var(--voz-text-muted)]">
              {user.messageCount}
            </div>
            
            {/* Join Date */}
            <div className="text-center text-[12px] text-[var(--voz-text-muted)] hidden md:block">
              {new Date(user.createdAt).toLocaleDateString('vi-VN')}
            </div>
          </div>
        );
      })}
      
      {users.length === 0 && (
        <div className="p-8 text-center text-[var(--voz-text-muted)]">
          Chưa có dữ liệu xếp hạng
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto">
      <h1 className="text-[26px] tracking-tight font-normal text-[var(--voz-text)] mb-4 flex items-center gap-2">
        <Trophy size={28} className="text-[#F59E0B]" />
        Bảng xếp hạng thành viên
      </h1>

      {/* Xếp hạng tổng */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Crown size={20} className="text-[#F59E0B] crown-animate" />
          <h2 className="text-[18px] font-semibold text-[var(--voz-text)]">Xếp hạng tổng công đức</h2>
        </div>
        <p className="text-[13px] text-[var(--voz-text-muted)] mb-3">
          Tổng điểm công đức tích lũy từ khi tham gia diễn đàn. Tạo chủ đề +3, bình luận +2, nhận like +1, bị dislike -1.
        </p>
        {renderTable(topUsersTotal, 'total')}
      </div>

      {/* Xếp hạng tháng */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Medal size={20} className="text-[#3B82F6]" />
          <h2 className="text-[18px] font-semibold text-[var(--voz-text)]">Xếp hạng tháng — {monthName}</h2>
        </div>
        <p className="text-[13px] text-[var(--voz-text-muted)] mb-3">
          Điểm công đức tháng chỉ tính trên 2 tiêu chí: nhận Like (+1) và bị Dislike (-1). Bảng xếp hạng tự động reset vào đầu mỗi tháng mới.
        </p>
        {renderTable(topUsersMonth, 'month')}
      </div>

      {/* Công thức tính */}
      <div className="voz-card overflow-hidden mb-6">
        <div className="bg-[var(--voz-accent)] px-4 py-2.5 border-b border-[var(--voz-border)] text-[15px] font-semibold text-[var(--voz-text)]">
          📜 Công thức tính công đức
        </div>
        <div className="bg-[var(--voz-surface)] p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-3 rounded bg-[var(--voz-accent)] border border-[var(--voz-border)]">
            <div className="text-[24px] mb-1">📝</div>
            <div className="text-[13px] font-bold text-[var(--voz-text)]">Tạo chủ đề</div>
            <div className="text-[18px] font-bold text-[#22C55E]">+3</div>
          </div>
          <div className="text-center p-3 rounded bg-[var(--voz-accent)] border border-[var(--voz-border)]">
            <div className="text-[24px] mb-1">💬</div>
            <div className="text-[13px] font-bold text-[var(--voz-text)]">Bình luận</div>
            <div className="text-[18px] font-bold text-[#3B82F6]">+2</div>
          </div>
          <div className="text-center p-3 rounded bg-[var(--voz-accent)] border border-[var(--voz-border)]">
            <div className="text-[24px] mb-1">👍</div>
            <div className="text-[13px] font-bold text-[var(--voz-text)]">Nhận Like</div>
            <div className="text-[18px] font-bold text-[#F59E0B]">+1</div>
          </div>
          <div className="text-center p-3 rounded bg-[var(--voz-accent)] border border-[var(--voz-border)]">
            <div className="text-[24px] mb-1">👎</div>
            <div className="text-[13px] font-bold text-[var(--voz-text)]">Bị Dislike</div>
            <div className="text-[18px] font-bold text-[#EF4444]">-1</div>
          </div>
        </div>
      </div>
    </div>
  );
}
