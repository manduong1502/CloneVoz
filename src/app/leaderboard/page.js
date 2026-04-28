import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getRankInfo } from '@/lib/rank';
import RankBadge from '@/components/ui/RankBadge';
import { Trophy, Medal, Crown } from 'lucide-react';
import Pagination from '@/components/ui/Pagination';

export const metadata = {
  title: 'Bảng xếp hạng | DanOngThongMinh',
  description: 'Bảng xếp hạng thành viên diễn đàn Đàn Ông Thông Minh theo công đức tổng và công đức tháng.',
};

export default async function LeaderboardPage(props) {
  const searchParams = await props.searchParams;
  
  const pageTotal = parseInt(searchParams.pageTotal || '1', 10);
  const pageMonth = parseInt(searchParams.pageMonth || '1', 10);
  const take = 10;

  // --- Xếp hạng tổng ---
  const totalUsersCount = await prisma.user.count({ where: { points: { gt: 0 } } });
  const totalPagesTotal = Math.max(1, Math.ceil(totalUsersCount / take));

  const topUsersTotal = await prisma.user.findMany({
    where: { points: { gt: 0 } },
    orderBy: { points: 'desc' },
    take,
    skip: (pageTotal - 1) * take,
    select: { id: true, username: true, avatar: true, points: true, createdAt: true }
  });

  // --- Xếp hạng tháng ---
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthName = now.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

  // Lấy tổng số user có điểm trong tháng để tính page
  const monthlyCountRaw = await prisma.pointLog.groupBy({
    by: ['userId'],
    where: { createdAt: { gte: startOfMonth }, action: { in: ['like', 'dislike'] } }
  });
  const totalMonthUsersCount = monthlyCountRaw.length;
  const totalPagesMonth = Math.max(1, Math.ceil(totalMonthUsersCount / take));

  const monthlyRaw = await prisma.pointLog.groupBy({
    by: ['userId'],
    where: { createdAt: { gte: startOfMonth }, action: { in: ['like', 'dislike'] } },
    _sum: { points: true },
    orderBy: { _sum: { points: 'desc' } },
    take,
    skip: (pageMonth - 1) * take
  });

  const monthlyUserIds = monthlyRaw.map(r => r.userId);
  const monthlyUsers = monthlyUserIds.length > 0
    ? await prisma.user.findMany({ where: { id: { in: monthlyUserIds } }, select: { id: true, username: true, avatar: true, points: true, createdAt: true } })
    : [];

  const topUsersMonth = monthlyRaw.map(r => {
    const u = monthlyUsers.find(u => u.id === r.userId);
    return u ? { ...u, monthPoints: r._sum.points } : null;
  }).filter(Boolean);

  const POSITION_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
  const POSITION_ICONS = ['🥇', '🥈', '🥉'];

  const renderTable = (users, type, currentPage, totalPages, queryParam) => {
    const skipOffset = (currentPage - 1) * take;
    return (
      <div className="voz-card overflow-hidden">
        {/* Header row */}
        <div className="bg-[var(--voz-accent)] px-4 py-2.5 grid grid-cols-[40px_1fr_100px] md:grid-cols-[40px_1fr_100px_120px] gap-2 text-[12px] font-bold text-[var(--voz-text-muted)] border-b border-[var(--voz-border)] uppercase tracking-wide">
          <div className="text-center">#</div>
          <div>Thành viên</div>
          <div className="text-center">{type === 'total' ? 'Công đức' : 'Tháng này'}</div>
          <div className="text-center hidden md:block">Tham gia</div>
        </div>

        {/* Rows */}
        {users.map((user, index) => {
          const rank = getRankInfo(user.points);
          const displayPoints = type === 'month' ? user.monthPoints : user.points;
          const globalIndex = skipOffset + index;

          return (
            <div
              key={user.id}
              className={`px-4 py-3 grid grid-cols-[40px_1fr_100px] md:grid-cols-[40px_1fr_100px_120px] gap-2 items-center border-b border-[var(--voz-border)] last:border-b-0 hover:bg-[var(--voz-accent)] transition-colors ${globalIndex < 3 ? 'bg-[var(--voz-accent)]' : 'bg-[var(--voz-surface)]'}`}
            >
              {/* Position */}
              <div className="text-center">
                {globalIndex < 3 ? (
                  <span className={`text-[20px] ${globalIndex === 0 ? 'crown-animate inline-block' : ''}`}>
                    {POSITION_ICONS[globalIndex]}
                  </span>
                ) : (
                  <span className="text-[14px] font-bold text-[var(--voz-text-muted)]">{globalIndex + 1}</span>
                )}
              </div>

              {/* User Info */}
              <div className="flex items-center gap-3 min-w-0">
                <Link href={`/profile/${user.username}`}>
                  <img
                    src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                    className={`w-[36px] h-[36px] rounded-full object-cover shrink-0 ${globalIndex < 3 ? 'ring-2' : 'border border-black/10'}`}
                    style={globalIndex < 3 ? { '--tw-ring-color': POSITION_COLORS[globalIndex] } : {}}
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
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[var(--voz-border)] bg-[var(--voz-surface)] flex justify-center">
            <Pagination 
              basePath="/leaderboard" 
              currentPage={currentPage} 
              totalPages={totalPages} 
              queryParam={queryParam}
              existingParams={{ pageTotal: searchParams.pageTotal, pageMonth: searchParams.pageMonth }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <h1 className="text-[26px] tracking-tight font-normal text-[var(--voz-text)] mb-4 flex items-center gap-2">
        <Trophy size={28} className="text-[#F59E0B]" />
        Bảng xếp hạng thành viên
      </h1>

      {/* Xếp hạng tổng */}
      <div className="mb-8">
        {renderTable(topUsersTotal, 'total', pageTotal, totalPagesTotal, 'pageTotal')}
      </div>

      {/* Xếp hạng tháng */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Medal size={20} className="text-[#3B82F6]" />
          <h2 className="text-[18px] font-semibold text-[var(--voz-text)]">Xếp hạng tháng — {monthName}</h2>
        </div>
        <p className="text-[13px] text-[var(--voz-text-muted)] mb-3">
          Điểm công đức tháng chỉ tính trên 2 tiêu chí: nhận Like (+1) và bị Dislike (-1). Bảng xếp hạng tự động reset vào đầu mỗi tháng mới.
        </p>
        {renderTable(topUsersMonth, 'month', pageMonth, totalPagesMonth, 'pageMonth')}
      </div>

    </div>
  );
}
