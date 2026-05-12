import Link from 'next/link';
import { MessageCircle, PenSquare } from 'lucide-react';
import { prisma } from '@/lib/prisma'; // 🚀 Nhúng Database
import { formatRelativeTime } from '@/lib/formatTime';
import { getCache, setCache } from '@/lib/redis'; // ⚡ Nhúng Vũ Khí Cache
import { getRankInfo } from '@/lib/rank';
import LeaderboardBox from '@/components/ui/LeaderboardBox';
import Pagination from '@/components/ui/Pagination';

const ITEMS_PER_CATEGORY = 5;

export default async function Home({ searchParams }) {
  const sp = await searchParams;

  // THUẬT TOÁN CACHING XUYÊN THỦNG
  // Build a stable cache key that includes category page params
  const catPageParams = Object.entries(sp || {}).filter(([k]) => k.startsWith('cp_')).sort().map(([k,v]) => `${k}=${v}`).join('&');
  const cacheKey = `voz_homepage_data_v2_${catPageParams || 'default'}`;
  let cachedData = await getCache(cacheKey);

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

    // Tính toán số lượng threads/posts đã được duyệt cho mỗi node
    const statsQuery = await prisma.thread.groupBy({
      by: ['nodeId'],
      where: { isApproved: true },
      _count: { id: true },
      _sum: { replyCount: true }
    });

    const nodeStats = {};
    for (const stat of statsQuery) {
      nodeStats[stat.nodeId] = {
        threadsCount: stat._count.id,
        postsCount: (stat._sum.replyCount || 0) + stat._count.id
      };
    }

    // Gán lại stats thực tế vào từng node + query threads cho mỗi category
    for (const category of categoriesDb) {
      for (const node of category.children) {
        node.threadsCount = nodeStats[node.id]?.threadsCount || 0;
        node.postsCount = nodeStats[node.id]?.postsCount || 0;
      }

      // Query threads trực tiếp thuộc Category này
      const catPage = parseInt(sp?.[`cp_${category.id}`]) || 1;
      const totalChildren = category.children.length;

      // Đếm threads trực tiếp thuộc category
      const directThreadCount = await prisma.thread.count({
        where: { nodeId: category.id, isApproved: true }
      });

      const totalItems = totalChildren + directThreadCount;
      const totalPages = Math.ceil(totalItems / ITEMS_PER_CATEGORY) || 1;
      const skip = (catPage - 1) * ITEMS_PER_CATEGORY;

      // Tính toán: bao nhiêu node con hiện ở trang này, bao nhiêu thread
      let nodesToShow = [];
      let threadsToShow = [];

      if (skip < totalChildren) {
        // Trang này bắt đầu trong vùng nodes
        nodesToShow = category.children.slice(skip, skip + ITEMS_PER_CATEGORY);
        const remainingSlots = ITEMS_PER_CATEGORY - nodesToShow.length;
        if (remainingSlots > 0) {
          threadsToShow = await prisma.thread.findMany({
            where: { nodeId: category.id, isApproved: true },
            orderBy: { updatedAt: 'desc' },
            take: remainingSlots,
            include: {
              author: true,
              posts: { take: 1, orderBy: { position: 'desc' }, include: { author: true } }
            }
          });
        }
      } else {
        // Trang này chỉ có threads (đã qua hết nodes)
        const threadSkip = skip - totalChildren;
        threadsToShow = await prisma.thread.findMany({
          where: { nodeId: category.id, isApproved: true },
          orderBy: { updatedAt: 'desc' },
          skip: threadSkip,
          take: ITEMS_PER_CATEGORY,
          include: {
            author: true,
            posts: { take: 1, orderBy: { position: 'desc' }, include: { author: true } }
          }
        });
      }

      // Attach computed data to category
      category._displayNodes = nodesToShow;
      category._displayThreads = threadsToShow;
      category._currentPage = catPage;
      category._totalPages = totalPages;
      category._directThreadCount = directThreadCount;
    }

    // 2. Kéo Trending Content (Nhiều Reply nhất)
    const trendingThreads = await prisma.thread.findMany({
      where: { isApproved: true },
      orderBy: { replyCount: 'desc' },
      take: 5,
      include: { author: true }
    });

    // 3. Xếp hạng tổng (top 5 by points)
    const topUsersTotal = await prisma.user.findMany({
      where: { points: { gt: 0 } },
      orderBy: { points: 'desc' },
      take: 5,
      select: { id: true, username: true, avatar: true, points: true, userGroups: { select: { name: true } } }
    });

    // 4. Xếp hạng tháng (dùng monthlyPoints trực tiếp)
    const topUsersMonth = await prisma.user.findMany({
      where: { monthlyPoints: { not: 0 } },
      orderBy: { monthlyPoints: 'desc' },
      take: 5,
      select: { id: true, username: true, avatar: true, points: true, monthlyPoints: true, userGroups: { select: { name: true } } }
    });

    // 5. Kéo Forum Statistics
    const totalForumThreads = await prisma.thread.count({ where: { isApproved: true } });
    const totalForumPosts = await prisma.post.count({ where: { thread: { isApproved: true } } });
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
    await setCache(cacheKey, cachedData, 30);
  }

  // Khui dữ liệu từ Cache
  const { categoriesDb, trendingThreads, topUsersTotal, topUsersMonth, totalForumThreads, totalForumPosts, totalForumUsers, latestUser } = cachedData;

  const formatNumber = (num) => {
    if (num >= 1000) return (num / 1000).toFixed(1).replace('.0', '') + 'K';
    return num;
  };

  // Build existing params for pagination (preserve other categories' pages)
  const buildExistingParams = (excludeCatId) => {
    const params = {};
    Object.entries(sp || {}).forEach(([k, v]) => {
      if (k.startsWith('cp_') && k !== `cp_${excludeCatId}`) {
        params[k] = v;
      }
    });
    return params;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 w-full">
      {/* Main Column */}
      <div className="flex flex-col gap-4">
        {categoriesDb.map(category => {
          const displayNodes = category._displayNodes || category.children.slice(0, ITEMS_PER_CATEGORY);
          const displayThreads = category._displayThreads || [];
          const currentPage = category._currentPage || 1;
          const totalPages = category._totalPages || 1;

          return (
            <div key={category.id} className="voz-card overflow-hidden">
              {/* Header */}
              <div className="bg-[var(--voz-accent)] border-b border-[var(--voz-border)] px-3 py-2 flex justify-between items-center">
                <Link href={`/category/${category.id}`} className="text-[16px] font-bold m-0 hover:underline cursor-pointer text-[var(--voz-link)]">
                  {category.title}
                </Link>
                <Link 
                  href={`/category/${category.id}/post-thread`} 
                  className="bg-[#f2930d] hover:bg-[#d88107] hover:no-underline text-white rounded-sm px-3 py-[4px] font-medium text-[12px] flex items-center gap-1 border-b-[2px] border-[#c07306] active:border-b-0 active:translate-y-[1px] transition-all"
                >
                  <PenSquare size={12} /> Đăng bài
                </Link>
              </div>

              {/* List: Nodes + Threads */}
              <div className="flex flex-col bg-[var(--voz-surface)]">
                {displayNodes.length === 0 && displayThreads.length === 0 && (
                  <div className="p-4 text-sm text-[var(--voz-text-muted)] text-center">Chưa có nội dung nào.</div>
                )}

                {/* Forum nhỏ (Nodes) */}
                {displayNodes.map((node, i) => (
                  <div key={node.id} className={`flex items-center p-3 hover:bg-[var(--voz-hover)] transition-colors ${(i !== displayNodes.length - 1 || displayThreads.length > 0) ? 'border-b border-[var(--voz-border-light)]' : ''}`}>

                    {/* Icon & Title */}
                    <div className="flex-1 flex items-center min-w-0 pr-2 sm:pr-4">
                      <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center mr-3 text-[var(--voz-link)]">
                        <MessageCircle strokeWidth={1.5} size={32} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/category/${node.id}`} className="text-[15px] font-bold hover:no-underline hover:text-[var(--voz-link-hover)] text-[var(--voz-link)]">
                          {node.title}
                        </Link>
                        {node.description && <div className="text-xs text-[var(--voz-text-muted)] mt-1">{node.description}</div>}
                        
                        {/* Mobile Stats & Last Post (Hidden on larger screens) */}
                        <div className="flex sm:hidden flex-col gap-0.5 mt-1.5">
                          <div className="text-[11px] text-[var(--voz-text-muted)]">
                            Chủ đề: <span className="font-medium text-[var(--voz-text)]">{formatNumber(node.threadsCount)}</span> <span className="mx-1">·</span> 
                            Bình luận: <span className="font-medium text-[var(--voz-text)]">{formatNumber(node.postsCount)}</span>
                          </div>
                          {node.threads && node.threads.length > 0 && (
                            <div className="text-[11px] text-[var(--voz-text-muted)] truncate">
                              {formatRelativeTime(node.threads[0].createdAt)} <span className="mx-1">·</span> 
                              <Link href={`/profile/${node.threads[0].author.username}`} className="hover:underline hover:text-[var(--voz-link)] font-medium">{node.threads[0].author.username}</Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Mobile Last Post Avatar */}
                    <div className="sm:hidden flex items-center shrink-0 pl-2">
                      {node.threads && node.threads.length > 0 && (
                        <Link href={`/thread/${node.threads[0].id}`}>
                          <img src={node.threads[0].author.avatar || `https://ui-avatars.com/api/?name=${node.threads[0].author.username}&background=random`} className="w-8 h-8 rounded-full object-cover shadow-sm border border-[var(--voz-border-light)]" />
                        </Link>
                      )}
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

                {/* Bài viết (Threads) trực tiếp thuộc Category */}
                {displayThreads.map((thread, i) => {
                  const lastPoster = thread.posts?.[0] ? thread.posts[0].author : thread.author;
                  const lastPosterAvatar = lastPoster.avatar || `https://ui-avatars.com/api/?name=${lastPoster.username?.charAt(0) || 'U'}&background=random`;

                  return (
                    <div key={thread.id} className={`flex py-3 px-3 hover:bg-[var(--voz-hover)] transition-colors items-center ${i !== displayThreads.length - 1 ? 'border-b border-[var(--voz-border-light)]' : ''}`}>
                      {/* Author Avatar */}
                      <div className="shrink-0 mr-3">
                        <img src={thread.author?.avatar || `https://ui-avatars.com/api/?name=${thread.author?.username?.charAt(0) || 'U'}&background=random`} className="w-[36px] h-[36px] rounded-full object-cover" />
                      </div>

                      {/* Title + Author */}
                      <div className="flex-1 flex flex-col min-w-0 pr-2 md:pr-4">
                        <Link href={`/thread/${thread.id}`} className="text-[14px] font-bold thread-title-link leading-snug mb-[2px] truncate">
                          {thread.title}
                        </Link>
                        <div className="text-[12px] text-[var(--voz-text-muted)]">
                          <Link href={`/profile/${thread.author.username}`} className="hover:underline text-[var(--voz-text-muted)]">{thread.author.username}</Link>
                        </div>
                        {/* Mobile stats */}
                        <div className="md:hidden text-[11px] mt-[2px] text-[var(--voz-text-muted)]">
                          Trả lời: {thread.replyCount} · {formatRelativeTime(thread.updatedAt)}
                        </div>
                      </div>

                      {/* Stats: Replies + Views */}
                      <div className="hidden md:flex flex-col items-end shrink-0 pr-4 text-[12px] text-[var(--voz-text-muted)] w-[120px]">
                        <div>Trả lời: <span className="text-[var(--voz-text-strong)] font-medium">{thread.replyCount}</span></div>
                        <div>Lượt xem: <span className="text-[var(--voz-text-strong)]">{formatNumber(thread.viewCount)}</span></div>
                      </div>

                      {/* Last Post Info */}
                      <div className="hidden sm:flex items-center gap-2 w-[200px] shrink-0 min-w-0 justify-end">
                        <div className="flex-1 min-w-0 text-right text-[12px]">
                          <div className="text-[var(--voz-text)] truncate">{formatRelativeTime(thread.updatedAt)}</div>
                          <Link href={`/profile/${lastPoster.username}`} className="hover:underline truncate inline-block max-w-full text-[var(--voz-text-muted)]">
                            {lastPoster.username}
                          </Link>
                        </div>
                        <img src={lastPosterAvatar} className="w-[30px] h-[30px] rounded-full shrink-0 object-cover" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination cho Category */}
              {totalPages > 1 && (
                <div className="bg-[var(--voz-accent)] border-t border-[var(--voz-border)] px-3 py-2 flex justify-end">
                  <Pagination 
                    basePath="/" 
                    currentPage={currentPage} 
                    totalPages={totalPages}
                    queryParam={`cp_${category.id}`}
                    existingParams={buildExistingParams(category.id)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sidebar */}
      <div className="flex flex-col gap-4 w-full lg:w-[300px]">

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
