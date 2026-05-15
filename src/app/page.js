import Link from 'next/link';
import { MessageCircle, PenSquare } from 'lucide-react';
import { prisma } from '@/lib/prisma'; // 🚀 Nhúng Database
import { formatRelativeTime } from '@/lib/formatTime';
import { getCache, setCache } from '@/lib/redis'; // ⚡ Nhúng Vũ Khí Cache
import { getRankInfo } from '@/lib/rank';
import LeaderboardBox from '@/components/ui/LeaderboardBox';
import Pagination from '@/components/ui/Pagination';

const ITEMS_PER_CATEGORY = 20;

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

      // Build combined list of forums + threads
      const catPage = parseInt(sp?.[`cp_${category.id}`]) || 1;

      // Create combined items: forums as {type:'forum', data, sortDate, pinned}
      const forumItems = category.children.map(node => ({
        type: 'forum',
        data: node,
        sortDate: node.threads?.[0]?.createdAt ? new Date(node.threads[0].createdAt) : new Date(0),
        pinned: (node.displayOrder || 10) <= 0
      }));

      // Get all node IDs (category itself + all its children)
      const categoryNodeIds = [category.id, ...category.children.map(c => c.id)];

      // Fetch all threads for this category and its children
      const allDirectThreads = await prisma.thread.findMany({
        where: { nodeId: { in: categoryNodeIds }, isApproved: true },
        orderBy: { updatedAt: 'desc' },
        include: {
          author: true,
          posts: { take: 1, orderBy: { position: 'desc' }, include: { author: true } }
        }
      });

      const threadItems = allDirectThreads.map(t => ({
        type: 'thread',
        data: t,
        sortDate: new Date(t.updatedAt),
        pinned: t.isPinned
      }));

      // Combine and sort: pinned first, then unpinned forums, then unpinned threads by sortDate desc
      const allItems = [...forumItems, ...threadItems].sort((a, b) => {
        // 1. Pinned items always come first
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        // 2. Among unpinned: forums come before threads
        if (!a.pinned && !b.pinned) {
          if (a.type === 'forum' && b.type !== 'forum') return -1;
          if (a.type !== 'forum' && b.type === 'forum') return 1;
        }
        // 3. Within same priority group: sort by date desc
        return b.sortDate - a.sortDate;
      });

      const totalItems = allItems.length;
      const totalPages = Math.ceil(totalItems / ITEMS_PER_CATEGORY) || 1;
      const skip = (catPage - 1) * ITEMS_PER_CATEGORY;
      const pageItems = allItems.slice(skip, skip + ITEMS_PER_CATEGORY);

      category._combinedItems = pageItems;
      category._currentPage = catPage;
      category._totalPages = totalPages;
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
    const totalForumPosts = await prisma.post.count({ where: { thread: { isApproved: true }, position: { gt: 1 } } });
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
      <div className="flex flex-col gap-4 min-w-0 overflow-hidden">
        {categoriesDb.map(category => {
          const combinedItems = category._combinedItems || [];
          const currentPage = category._currentPage || 1;
          const totalPages = category._totalPages || 1;

          return (
            <div key={category.id} className="voz-card overflow-hidden">
              {/* Header */}
              <div className="bg-[var(--voz-blue-dark)] border-b border-[var(--voz-blue-dark)] px-4 py-2.5 flex justify-between items-center shadow-sm">
                <Link href={`/category/${category.id}`} className="text-[18px] font-bold m-0 hover:underline cursor-pointer text-white tracking-wide" style={{ color: '#ffffff' }}>
                  {category.title}
                </Link>
                <Link href={`/category/${category.id}/post-thread`} className="bg-[#f2930d] hover:bg-[#d88107] hover:no-underline text-white rounded-[4px] px-4 py-[5px] font-medium text-[13px] shadow-sm flex items-center gap-1 border-b-[2px] border-[#c07306] active:border-b-0 active:translate-y-[1px] transition-all">
                  <PenSquare size={14} /> Đăng bài
                </Link>
              </div>

              {/* Combined List */}
              <div className="flex flex-col bg-[var(--voz-surface)]">
                {combinedItems.length === 0 && (
                  <div className="p-4 text-sm text-[var(--voz-text-muted)] text-center">Chưa có nội dung nào.</div>
                )}

                {combinedItems.map((item, i) => {
                  if (item.type === 'forum') {
                    const node = item.data;
                    return (
                      <div key={`f-${node.id}`} className="flex items-center p-2 hover:bg-[var(--voz-hover)] transition-colors border-b border-[var(--voz-border-light)] last:border-b-0">
                        <div className="flex-1 flex items-center min-w-0 pr-2 sm:pr-4">
                          <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center mr-3 text-[var(--voz-link)]">
                            <MessageCircle strokeWidth={1.5} size={32} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center flex-wrap gap-2">
                              {item.pinned && <span className="text-[10px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded font-bold">📌</span>}
                              <Link href={`/category/${node.id}`} className="text-[15px] font-bold hover:no-underline hover:text-[var(--voz-link-hover)] text-[var(--voz-link)]">{node.title}</Link>
                              
                              {node.threadsCount > 15 && (
                                <div className="hidden sm:flex gap-[3px] items-center ml-1">
                                  {Array.from({ length: Math.min(3, Math.ceil((node.threadsCount || 0) / 15)) }).map((_, idx) => (
                                    <Link key={idx} href={`/category/${node.id}?page=${idx + 1}`} className="text-[10px] bg-[var(--voz-accent)] hover:bg-[var(--voz-border-light)] border border-[var(--voz-border)] rounded-[3px] px-1.5 py-[2px] text-[var(--voz-text-muted)] leading-none transition-colors">
                                      {idx + 1}
                                    </Link>
                                  ))}
                                  {Math.ceil((node.threadsCount || 0) / 15) > 4 && <span className="text-[10px] text-[var(--voz-text-muted)] px-0.5">...</span>}
                                  {Math.ceil((node.threadsCount || 0) / 15) > 3 && (
                                    <Link href={`/category/${node.id}?page=${Math.ceil((node.threadsCount || 0) / 15)}`} className="text-[10px] bg-[var(--voz-accent)] hover:bg-[var(--voz-border-light)] border border-[var(--voz-border)] rounded-[3px] px-1.5 py-[2px] text-[var(--voz-text-muted)] leading-none transition-colors">
                                      {Math.ceil((node.threadsCount || 0) / 15)}
                                    </Link>
                                  )}
                                </div>
                              )}
                            </div>
                            {node.description && <div className="text-xs text-[var(--voz-text-muted)] mt-1">{node.description}</div>}
                            <div className="flex sm:hidden flex-col gap-0.5 mt-1.5">
                              <div className="text-[11px] text-[var(--voz-text-muted)]">Chủ đề: <span className="font-medium text-[var(--voz-text)]">{formatNumber(node.threadsCount)}</span> · Bình luận: <span className="font-medium text-[var(--voz-text)]">{formatNumber(node.postsCount)}</span></div>
                            </div>
                          </div>
                        </div>
                        <div className="hidden md:flex flex-row justify-center items-center w-[140px] shrink-0 text-[11px] text-[var(--voz-text-muted)] gap-5">
                          <div className="flex flex-col items-center"><div>Chủ đề</div><div className="text-[var(--voz-text-strong)] text-[13px]">{formatNumber(node.threadsCount)}</div></div>
                          <div className="flex flex-col items-center"><div>Bình luận</div><div className="text-[var(--voz-text-strong)] text-[13px]">{formatNumber(node.postsCount)}</div></div>
                        </div>
                        <div className="hidden sm:flex items-center w-[260px] shrink-0 pl-4 min-w-0">
                          {node.threads && node.threads.length > 0 ? (<>
                            <img src={node.threads[0].author.avatar || `https://ui-avatars.com/api/?name=${node.threads[0].author.username}&background=random`} className="w-[32px] h-[32px] rounded-full shrink-0 object-cover bg-gray-100" />
                            <div className="flex-1 min-w-0 text-[12px] ml-3 flex flex-col justify-center">
                              <Link href={`/thread/${node.threads[0].id}`} className="text-[var(--voz-link)] hover:underline truncate font-medium">{node.threads[0].title}</Link>
                              <div className="text-[var(--voz-text-muted)] truncate mt-[2px]">{formatRelativeTime(node.threads[0].createdAt)} · <Link href={`/profile/${node.threads[0].author.username}`} className="hover:underline hover:text-[var(--voz-link)]">{node.threads[0].author.username}</Link></div>
                            </div>
                          </>) : (<div className="flex-1 text-[12px] text-[var(--voz-text-muted)] italic">Chưa có bài viết</div>)}
                        </div>
                      </div>
                    );
                  } else {
                    const thread = item.data;
                    const lastPoster = thread.posts?.[0] ? thread.posts[0].author : thread.author;
                    const lastActivityTime = thread.posts?.[0]?.createdAt || thread.createdAt;
                    const lpa = lastPoster.avatar || `https://ui-avatars.com/api/?name=${lastPoster.username?.charAt(0) || 'U'}&background=random`;
                    return (
                      <div key={`t-${thread.id}`} className="flex p-2 hover:bg-[var(--voz-hover)] transition-colors items-center border-b border-[var(--voz-border-light)] last:border-b-0">
                        <div className="shrink-0 mr-3">
                          <img src={thread.author?.avatar || `https://ui-avatars.com/api/?name=${thread.author?.username?.charAt(0) || 'U'}&background=random`} className="w-[36px] h-[36px] rounded-full object-cover" />
                        </div>
                        <div className="flex-1 flex flex-col min-w-0 pr-2 md:pr-4">
                          <Link href={`/thread/${thread.id}`} className={`block text-[17px] font-semibold hover:underline leading-snug mb-[3px] truncate ${item.pinned ? 'text-red-500' : ''}`} style={{ color: item.pinned ? undefined : 'var(--voz-link)' }}>
                            {item.pinned && <span className="mr-1">📌</span>}{thread.title}
                          </Link>
                          <div className="text-[12px]"><Link href={`/profile/${thread.author.username}`} className="hover:underline" style={{ color: '#8c8c8c' }}>{thread.author.username}</Link></div>
                          <div className="md:hidden text-[11px] mt-[2px]" style={{ color: '#8c8c8c' }}>Trả lời: {thread.replyCount} · {formatRelativeTime(lastActivityTime)}</div>
                        </div>
                        <div className="hidden md:flex flex-col items-end shrink-0 pr-4 text-[12px] text-[var(--voz-text-muted)] w-[120px]">
                          <div>Trả lời: <span className="text-[var(--voz-text-strong)] font-medium">{thread.replyCount}</span></div>
                          <div>Lượt xem: <span className="text-[var(--voz-text-strong)]">{formatNumber(thread.viewCount)}</span></div>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 w-[200px] shrink-0 min-w-0 justify-end">
                          <div className="flex-1 min-w-0 text-right text-[12px]">
                            <div className="text-[var(--voz-text)] truncate">{formatRelativeTime(lastActivityTime)}</div>
                            <Link href={`/profile/${lastPoster.username}`} className="hover:underline truncate inline-block max-w-full text-[var(--voz-text-muted)]">{lastPoster.username}</Link>
                          </div>
                          <img src={lpa} className="w-[30px] h-[30px] rounded-full shrink-0 object-cover" />
                        </div>
                      </div>
                    );
                  }
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-[var(--voz-accent)] border-t border-[var(--voz-border)] px-3 py-2 flex justify-end">
                  <Pagination basePath="/" currentPage={currentPage} totalPages={totalPages} queryParam={`cp_${category.id}`} existingParams={buildExistingParams(category.id)} />
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
