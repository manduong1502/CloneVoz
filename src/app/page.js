import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { prisma } from '@/lib/prisma'; // 🚀 Nhúng Database
import { formatRelativeTime } from '@/lib/formatTime';
import { getCache, setCache } from '@/lib/redis'; // ⚡ Nhúng Vũ Khí Cache
import { getRankInfo } from '@/lib/rank';
import LeaderboardBox from '@/components/ui/LeaderboardBox';

export default async function Home() {

  // THUẬT TOÁN CACHING XUYÊN THỦNG
  let cachedData = await getCache('voz_homepage_data');
  if (!cachedData) {
    // 1. Kéo toàn bộ Nodes từ CSDL là Category
    const categoriesDb = await prisma.node.findMany({
      where: { nodeType: 'Category' },
      orderBy: { displayOrder: 'asc' },
      include: {
        children: {
          orderBy: { displayOrder: 'asc' },
          include: {
            threads: {
              where: { isApproved: true },
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: { author: true }
            }
          }
        }
      }
    });

    // 2. Kéo Trending Content (Nhiều Reply nhất)
    const trendingThreads = await prisma.thread.findMany({
      where: { isApproved: true },
      orderBy: { replyCount: 'desc' },
      take: 5,
      include: { author: true }
    });

    // 3. Xếp hạng tổng (top 5 by points)
    const topUsersTotal = await prisma.user.findMany({
      orderBy: { points: 'desc' },
      take: 5,
      select: { id: true, username: true, avatar: true, points: true }
    });

    // 4. Xếp hạng tháng (dùng monthlyPoints trực tiếp)
    const topUsersMonth = await prisma.user.findMany({
      where: { monthlyPoints: { not: 0 } },
      orderBy: { monthlyPoints: 'desc' },
      take: 5,
      select: { id: true, username: true, avatar: true, points: true, monthlyPoints: true }
    });

    // 5. Kéo Forum Statistics
    const totalForumThreads = await prisma.thread.count();
    const totalForumPosts = await prisma.post.count();
    const totalForumUsers = await prisma.user.count();
    const latestUser = await prisma.user.findFirst({ orderBy: { createdAt: 'desc' } });

    cachedData = {
      categoriesDb,
      trendingThreads,
      topUsersTotal,
      topUsersMonth,
      totalForumThreads,
      totalForumPosts,
      totalForumUsers,
      latestUser
    };

    // Lưu vào RAM ngay, thời gian sống là 30 giây
    await setCache('voz_homepage_data', cachedData, 30);
  }

  // Khui dữ liệu từ Cache
  const { categoriesDb, trendingThreads, topUsersTotal, topUsersMonth, totalForumThreads, totalForumPosts, totalForumUsers, latestUser } = cachedData;

  const formatNumber = (num) => {
    if (num >= 1000) return (num / 1000).toFixed(1).replace('.0', '') + 'K';
    return num;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 w-full">
      {/* Main Column */}
      <div className="flex flex-col gap-4">
        {categoriesDb.map(category => (
          <div key={category.id} className="voz-card overflow-hidden">
            {/* Header */}
            <div className="bg-[var(--voz-accent)] border-b border-[var(--voz-border)] px-3 py-2 flex justify-between items-center text-[var(--voz-link)]">
              <h2 className="text-[16px] font-bold m-0 hover:underline cursor-pointer">{category.title}</h2>
            </div>

            {/* List */}
            <div className="flex flex-col bg-[var(--voz-surface)]">
              {category.children.length === 0 ? (
                <div className="p-4 text-sm text-[var(--voz-text-muted)] text-center">Chưa có box con nào được tạo.</div>
              ) : category.children.slice(0, 4).map((node, i) => (
                <div key={node.id} className={`flex items-center p-3 hover:bg-[var(--voz-hover)] transition-colors ${i !== Math.min(category.children.length, 4) - 1 ? 'border-b border-[var(--voz-border-light)]' : ''}`}>

                  {/* Icon & Title */}
                  <div className="flex-1 flex items-center min-w-0 pr-4">
                    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center mr-3 text-[var(--voz-link)]">
                      <MessageCircle strokeWidth={1.5} size={32} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/category/${node.id}`} className="text-[15px] font-bold hover:no-underline hover:text-[var(--voz-link-hover)] text-[var(--voz-link)]">
                        {node.title}
                      </Link>
                      {node.description && <div className="text-xs text-[var(--voz-text-muted)] mt-1">{node.description}</div>}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex flex-row justify-center items-center w-[140px] shrink-0 text-[11px] text-[var(--voz-text-muted)] gap-5">
                    <div className="flex flex-col items-center">
                      <div>Chủ đề</div>
                      <div className="text-[var(--voz-text-strong)] text-[13px]">{formatNumber(node.threadsCount)}</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div>Bình luận</div>
                      <div className="text-[var(--voz-text-strong)] text-[13px]">{formatNumber(node.postsCount)}</div>
                    </div>
                  </div>

                  {/* Last Post */}
                  <div className="hidden sm:flex items-center w-[260px] shrink-0 pl-4 min-w-0">
                    {node.threads && node.threads.length > 0 ? (
                      <>
                        <img src={node.threads[0].author.avatar || `https://ui-avatars.com/api/?name=${node.threads[0].author.username}&background=random`} className="w-[32px] h-[32px] rounded-full shrink-0 object-cover bg-gray-100" />
                        <div className="flex-1 min-w-0 text-[12px] ml-3 flex flex-col justify-center">
                          <Link href={`/thread/${node.threads[0].id}`} className="text-[var(--voz-link)] hover:underline truncate font-medium">
                            {node.threads[0].title}
                          </Link>
                          <div className="text-[var(--voz-text-muted)] truncate mt-[2px]">
                            {formatRelativeTime(node.threads[0].createdAt)} · <Link href={`/profile/${node.threads[0].author.username}`} className="hover:underline hover:text-[var(--voz-link)]">{node.threads[0].author.username}</Link>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 text-[12px] text-[var(--voz-text-muted)] italic">Chưa có bài viết</div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar */}
      <div className="hidden lg:flex flex-col gap-4 w-[300px]">

        {/* Trending Content */}
        <div className="voz-card overflow-hidden">
          <div className="bg-[var(--voz-accent)] px-3 py-2 text-[var(--voz-link)] border-b border-[var(--voz-border)] text-[15px] font-bold hover:underline cursor-pointer">
            Đang thịnh hành
          </div>
          <div className="flex flex-col bg-[var(--voz-accent)]">
            {trendingThreads.map(t => (
              <div key={t.id} className="p-3 border-b border-[var(--voz-border)] flex gap-3 last:border-b-0 hover:bg-[var(--voz-surface)] transition-colors">
                <img src={t.author.avatar || `https://ui-avatars.com/api/?name=${t.author.username}&background=random`} className="w-[32px] h-[32px] rounded-full object-cover shrink-0" />
                <div className="flex flex-col min-w-0 flex-1">
                  <Link href={`/thread/${t.id}`} className="text-[14px] text-[var(--voz-link)] hover:underline leading-snug mb-[2px]">
                    {t.title}
                  </Link>
                  <div className="text-[12px] text-[var(--voz-text-muted)]">
                    {t.author.username} · {formatRelativeTime(t.createdAt)}
                  </div>
                  <div className="text-[12px] text-[var(--voz-text-muted)]">
                    Trả lời: {formatNumber(t.replyCount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard Box */}
        <LeaderboardBox topUsersTotal={topUsersTotal || []} topUsersMonth={topUsersMonth || []} />

        {/* Forum statistics */}
        <div className="voz-card overflow-hidden">
          <div className="bg-[var(--voz-accent)] px-3 py-2 text-[var(--voz-link)] border-b border-[var(--voz-border)] text-[14px] font-bold hover:underline cursor-pointer">
            Thống kê diễn đàn
          </div>
          <div className="bg-[var(--voz-accent)] p-3 text-[12px] text-[var(--voz-text-strong)] flex flex-col gap-1">
            <div className="flex justify-between border-b border-[var(--voz-border-light)] pb-1"><span>Chủ đề:</span> <span>{totalForumThreads.toLocaleString()}</span></div>
            <div className="flex justify-between border-b border-[var(--voz-border-light)] pb-1"><span>Bình luận:</span> <span>{totalForumPosts.toLocaleString()}</span></div>
            <div className="flex justify-between border-b border-[var(--voz-border-light)] pb-1"><span>Thành viên:</span> <span>{totalForumUsers.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Mới nhất:</span> <Link href={latestUser ? `/profile/${latestUser.username}` : '#'} className="text-[var(--voz-link)] font-medium hover:underline truncate max-w-[120px] text-right">{latestUser?.username || 'Chưa rõ'}</Link></div>
          </div>
        </div>

      </div>
    </div>
  );
}
