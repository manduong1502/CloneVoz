import Link from 'next/link';
import { PenSquare, MessageCircle, Clock } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import Pagination from '@/components/ui/Pagination';
import { auth } from '@/auth';
import { checkNodePermission } from '@/lib/permissions';
import WatchNodeButton from '@/components/category/WatchNodeButton';
import ThreadFilterDropdown from '@/components/category/ThreadFilterDropdown';
import { formatRelativeTime } from '@/lib/formatTime';
import { getCache, setCache } from '@/lib/redis';
import LeaderboardBox from '@/components/ui/LeaderboardBox';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const node = await prisma.node.findUnique({ where: { id: id }, select: { title: true, description: true } });

  if (!node) return { title: 'Box không tồn tại | DanOngThongMinh' };

  return {
    title: `${node.title} | DanOngThongMinh`,
    description: node.description || `Tham gia thảo luận về ${node.title} tại diễn đàn DanOngThongMinh.`,
    openGraph: {
      title: `${node.title} | DanOngThongMinh`,
      description: node.description || `Tham gia thảo luận về ${node.title}.`,
      siteName: "DanOngThongMinh Forum",
    }
  };
}

export default async function CategoryPage({ params, searchParams }) {
  const { id } = await params;
  const sp = await searchParams;

  const page = parseInt(sp.page) || 1;
  const threadsPerPage = 20;
  const skip = (page - 1) * threadsPerPage;

  const session = await auth();
  const isAdminOrMod = session?.user?.isAdmin || session?.user?.isMod;
  const userCachePrefix = isAdminOrMod ? 'admin' : (session?.user?.id || 'anon');

  // Dùng bộ nhớ Cache siêu tốc để tiết kiệm RAM Database
  const cacheKey = `voz_node_${id}_page_${page}_prefix_${sp.prefix || 'none'}_sb_${sp.startedBy || 'none'}_lu_${sp.lastUpdated || 'none'}_sort_${sp.sortBy || 'updatedAt'}_${sp.sortOrder || 'desc'}_u_${userCachePrefix}`;
  let cachedData = await getCache(cacheKey);

  // Gọi CSDL nếu chưa có Cache
  let node = cachedData?.node;
  if (!node) {
    node = await prisma.node.findUnique({
      where: { id: id },
      include: {
        parent: true,
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

    if (node) {
      // Tải lại bộ đếm chính xác (bỏ qua chưa duyệt) cho các thư mục con
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
      if (node.children) {
        for (const child of node.children) {
          child.threadsCount = nodeStats[child.id]?.threadsCount || 0;
          child.postsCount = nodeStats[child.id]?.postsCount || 0;
        }
      }
    }
  }

  if (!node) {
    return <div className="p-8 text-center text-red-500 text-xl font-bold">DanOngThongMinh Error: The requested forum could not be found.</div>;
  }

  // ========== COMMON SIDEBAR DATA ==========
  let trendingThreads = cachedData?.trendingThreads;
  let topUsersTotal = cachedData?.topUsersTotal;
  let topUsersMonth = cachedData?.topUsersMonth;
  
  if (!trendingThreads) {
    trendingThreads = await prisma.thread.findMany({
      where: { isApproved: true },
      orderBy: { replyCount: 'desc' },
      take: 5,
      include: { author: true }
    });
    
    topUsersTotal = await prisma.user.findMany({
      where: { points: { gt: 0 } },
      orderBy: { points: 'desc' },
      take: 5,
      select: { id: true, username: true, avatar: true, points: true, userGroups: { select: { name: true } } }
    });

    topUsersMonth = await prisma.user.findMany({
      where: { monthlyPoints: { not: 0 } },
      orderBy: { monthlyPoints: 'desc' },
      take: 5,
      select: { id: true, username: true, avatar: true, points: true, monthlyPoints: true, userGroups: { select: { name: true } } }
    });
  }

  // ========== CATEGORY VIEW ==========
  if (node.nodeType === 'Category') {
    const catPage = parseInt(sp.page) || 1;
    const catPerPage = 20;
    const catSkip = (catPage - 1) * catPerPage;

    let isWatchingCategory = false;
    if (session?.user?.id) {
      const bookmark = await prisma.bookmark.findFirst({ where: { userId: session.user.id, nodeId: id } });
      if (bookmark) isWatchingCategory = true;
    }

    // Filter logic (same as Forum view)
    const sortBy = sp.sortBy || 'updatedAt';
    const sortOrder = sp.sortOrder || 'desc';
    const startedByFilter = sp.startedBy || null;
    const lastUpdatedFilter = sp.lastUpdated || null;
    const validSortFields = ['updatedAt', 'createdAt', 'replyCount', 'viewCount'];
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'updatedAt';
    const orderDir = sortOrder === 'asc' ? 'asc' : 'desc';

    let catWhere = { nodeId: id, isApproved: true };
    if (startedByFilter) {
      const filterUser = await prisma.user.findFirst({ where: { username: startedByFilter }, select: { id: true } });
      catWhere.authorId = filterUser ? filterUser.id : 'nonexistent';
    }
    if (lastUpdatedFilter) {
      const daysMap = { '1d': 1, '7d': 7, '30d': 30, '90d': 90, '365d': 365 };
      const days = daysMap[lastUpdatedFilter];
      if (days) { const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days); catWhere.updatedAt = { gte: cutoff }; }
    }

    // Build combined list: forums + threads
    const forumItems = (node.children || []).map(child => ({
      type: 'forum', data: child,
      sortDate: child.threads?.[0]?.createdAt ? new Date(child.threads[0].createdAt) : new Date(0),
      pinned: (child.displayOrder || 10) <= 0
    }));

    const directThreadCount = await prisma.thread.count({ where: catWhere });
    const directThreads = await prisma.thread.findMany({
      where: catWhere, orderBy: { [orderField]: orderDir },
      include: { author: true, prefix: true, posts: { take: 1, orderBy: { position: 'desc' }, include: { author: true } } }
    });

    const threadItems = directThreads.map(t => ({
      type: 'thread', data: t,
      sortDate: new Date(t.updatedAt),
      pinned: t.isPinned
    }));

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
    const catTotalPages = Math.ceil(totalItems / catPerPage) || 1;
    const pageItems = allItems.slice(catSkip, catSkip + catPerPage);

    const formatCount = (n) => { if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.0', '') + 'K'; return n.toString(); };
    const currentFilterParams = { startedBy: startedByFilter || '', lastUpdated: lastUpdatedFilter || '', sortBy, sortOrder };
    const catPagination = <Pagination basePath={`/category/${id}`} currentPage={catPage} totalPages={catTotalPages} existingParams={currentFilterParams} />;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 w-full">
        <div className="flex flex-col">
          <div className="text-[13px] mb-2 text-[var(--voz-text-muted)]">
            <Link href="/" className="hover:text-[var(--voz-link-hover)] transition-colors text-[var(--voz-link)]">Diễn đàn</Link>
            <span className="mx-1">›</span>
          </div>
          <div className="flex items-center justify-between mb-4 gap-4 bg-[var(--voz-blue-dark)] p-4 rounded-md shadow-sm">
            <h1 className="text-[22px] tracking-tight font-bold text-white">{node.title}</h1>
            <div className="flex gap-3 items-center shrink-0">
              {session && <WatchNodeButton nodeId={id} initialIsWatching={isWatchingCategory} />}
              <Link href={`/category/${id}/post-thread`} className="bg-[#f2930d] hover:bg-[#d88107] hover:no-underline text-white rounded-[4px] px-5 py-[8px] font-medium text-[14px] shadow-sm flex items-center gap-1.5 border-b-[3px] border-[#c07306] active:border-b-0 active:translate-y-[2px] transition-all h-[36px]">
                <PenSquare size={15} /> Đăng bài
              </Link>
            </div>
          </div>

          <div className="mb-2">{catPagination}</div>

          <div className="voz-card overflow-visible">
            <div className="bg-[var(--voz-accent)] border-b border-[var(--voz-border)] px-3 py-2 flex justify-between items-center">
              <div className="text-[12px] text-[var(--voz-text-muted)]">
                {(startedByFilter || lastUpdatedFilter) && (
                  <Link href={`/category/${id}`} className="hover:underline text-[var(--voz-link)] flex items-center gap-1 font-medium text-[12px]">✖ Xóa bộ lọc</Link>
                )}
              </div>
              <ThreadFilterDropdown prefixes={[]} currentParams={currentFilterParams} />
            </div>

            <div className="bg-[var(--voz-surface)]">
              {pageItems.length === 0 && (
                <div className="p-8 text-center text-sm text-[var(--voz-text-muted)]">Chưa có nội dung nào.</div>
              )}
              {pageItems.map((item) => {
                if (item.type === 'forum') {
                  const child = item.data;
                  return (
                    <div key={`f-${child.id}`} className="flex items-center p-3 hover:bg-[var(--voz-hover)] transition-colors border-b border-[var(--voz-border-light)] last:border-0">
                      <div className="flex-1 flex items-center min-w-0 pr-2 sm:pr-4">
                        <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center mr-3 text-[var(--voz-link)]"><MessageCircle strokeWidth={1.5} size={32} /></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-2">
                            {item.pinned && <span className="text-[10px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded font-bold">📌</span>}
                            <Link href={`/category/${child.id}`} className="text-[15px] font-bold hover:no-underline hover:text-[var(--voz-link-hover)] text-[var(--voz-link)]">{child.title}</Link>
                            
                            {child.threadsCount > 15 && (
                              <div className="hidden sm:flex gap-[3px] items-center ml-1">
                                {Array.from({ length: Math.min(3, Math.ceil((child.threadsCount || 0) / 15)) }).map((_, idx) => (
                                  <Link key={idx} href={`/category/${child.id}?page=${idx + 1}`} className="text-[10px] bg-[var(--voz-accent)] hover:bg-[var(--voz-border-light)] border border-[var(--voz-border)] rounded-[3px] px-1.5 py-[2px] text-[var(--voz-text-muted)] leading-none transition-colors">
                                    {idx + 1}
                                  </Link>
                                ))}
                                {Math.ceil((child.threadsCount || 0) / 15) > 4 && <span className="text-[10px] text-[var(--voz-text-muted)] px-0.5">...</span>}
                                {Math.ceil((child.threadsCount || 0) / 15) > 3 && (
                                  <Link href={`/category/${child.id}?page=${Math.ceil((child.threadsCount || 0) / 15)}`} className="text-[10px] bg-[var(--voz-accent)] hover:bg-[var(--voz-border-light)] border border-[var(--voz-border)] rounded-[3px] px-1.5 py-[2px] text-[var(--voz-text-muted)] leading-none transition-colors">
                                    {Math.ceil((child.threadsCount || 0) / 15)}
                                  </Link>
                                )}
                              </div>
                            )}
                          </div>
                          {child.description && <div className="text-xs text-[var(--voz-text-muted)] mt-1">{child.description}</div>}
                          <div className="flex sm:hidden flex-col gap-0.5 mt-1.5"><div className="text-[11px] text-[var(--voz-text-muted)]">Chủ đề: <span className="font-medium text-[var(--voz-text)]">{child.threadsCount || 0}</span> · Bình luận: <span className="font-medium text-[var(--voz-text)]">{child.postsCount || 0}</span></div></div>
                        </div>
                      </div>
                      <div className="hidden md:flex flex-row justify-center items-center w-[140px] shrink-0 text-[11px] text-[var(--voz-text-muted)] gap-5">
                        <div className="flex flex-col items-center"><div>Chủ đề</div><div className="text-[var(--voz-text-strong)] text-[13px]">{child.threadsCount || 0}</div></div>
                        <div className="flex flex-col items-center"><div>Bình luận</div><div className="text-[var(--voz-text-strong)] text-[13px]">{child.postsCount || 0}</div></div>
                      </div>
                      <div className="hidden sm:flex items-center w-[260px] shrink-0 pl-4 min-w-0">
                        {child.threads && child.threads.length > 0 ? (<>
                          <img src={child.threads[0].author.avatar || `https://ui-avatars.com/api/?name=${child.threads[0].author.username}&background=random`} className="w-[32px] h-[32px] rounded-full shrink-0 object-cover bg-gray-100" />
                          <div className="flex-1 min-w-0 text-[12px] ml-3 flex flex-col justify-center">
                            <Link href={`/thread/${child.threads[0].id}`} className="text-[var(--voz-link)] hover:underline truncate font-medium">{child.threads[0].title}</Link>
                            <div className="text-[var(--voz-text-muted)] truncate mt-[2px]">{formatRelativeTime(child.threads[0].createdAt)} · <Link href={`/profile/${child.threads[0].author.username}`} className="hover:underline hover:text-[var(--voz-link)]">{child.threads[0].author.username}</Link></div>
                          </div>
                        </>) : (<div className="flex-1 text-[12px] text-[var(--voz-text-muted)] italic">Chưa có bài viết</div>)}
                      </div>
                    </div>
                  );
                } else {
                  const thread = item.data;
                  const lastPoster = thread.posts[0] ? thread.posts[0].author : thread.author;
                  const lastActivityTime = thread.posts?.[0]?.createdAt || thread.createdAt;
                  const lpa = lastPoster.avatar || `https://ui-avatars.com/api/?name=${lastPoster.username?.charAt(0) || 'U'}&background=random`;
                  return (
                    <div key={`t-${thread.id}`} className="flex p-2 border-b border-[var(--voz-border-light)] hover:bg-[var(--voz-hover)] last:border-0 transition-colors items-start">
                      <div className="shrink-0 mr-3"><img src={thread.author?.avatar || `https://ui-avatars.com/api/?name=${thread.author?.username?.charAt(0) || 'U'}&background=random`} className="w-[42px] h-[42px] rounded-full object-cover" /></div>
                      <div className="flex-1 flex flex-col min-w-0 pr-2 md:pr-4">
                        <div className="leading-snug mb-[5px]">
                          {thread.isPinned && <span className="mr-1 text-red-500">📌</span>}
                          {thread.prefix && <span className={`mr-[6px] ${thread.prefix.cssClass || 'voz-badge-info'}`}>{thread.prefix.title}</span>}
                          <Link href={`/thread/${thread.id}`} className={`text-[17px] leading-snug font-semibold hover:underline ${thread.isPinned ? 'text-red-500' : ''}`} style={{ color: thread.isPinned ? undefined : 'var(--voz-link)' }}><span>{thread.title}</span></Link>
                        </div>
                        <div className="text-[13px]" style={{ color: '#8c9197' }}><Link href={`/profile/${thread.author.username}`} className="hover:underline" style={{ color: '#8c9197' }}>{thread.author.username}</Link></div>
                        <div className="md:hidden text-[12px] mt-[2px]" style={{ color: '#8c9197' }}>Trả lời: {thread.replyCount} · {formatRelativeTime(lastActivityTime)}</div>
                      </div>
                      <div className="hidden md:flex flex-col items-end shrink-0 pr-4 text-[13px] text-[var(--voz-text-muted)] w-[130px]">
                        <div>Trả lời: <span className="text-[var(--voz-text-strong)] font-medium">{thread.replyCount}</span></div>
                        <div>Lượt xem: <span className="text-[var(--voz-text-strong)]">{formatCount(thread.viewCount)}</span></div>
                      </div>
                      <div className="hidden sm:flex items-center gap-2.5 w-[200px] shrink-0 min-w-0 justify-end">
                        <div className="flex-1 min-w-0 text-right text-[13px]">
                          <div className="text-[var(--voz-text)] truncate">{formatRelativeTime(lastActivityTime)}</div>
                          <Link href={`/profile/${lastPoster.username}`} className="hover:underline truncate inline-block max-w-full" style={{ color: '#8c9197' }}>{lastPoster.username}</Link>
                        </div>
                        <img src={lpa} className="w-[32px] h-[32px] rounded-full shrink-0 object-cover" />
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          </div>
          <div className="mt-2">{catPagination}</div>
        </div>
        
        {/* Sidebar */}
        <div className="flex flex-col gap-4 pt-4 lg:pt-[32px] w-full lg:w-[300px]">
          <div className="voz-card overflow-hidden">
            <h3 className="bg-[var(--voz-accent)] text-[13px] font-bold px-3 py-2 border-b border-[var(--voz-border)] text-[var(--voz-link)]">Đang thịnh hành</h3>
            <div className="bg-[var(--voz-accent)]">
              {trendingThreads.map(t => (
                <div key={t.id} className="flex gap-2 p-3 border-b border-[var(--voz-border-light)] last:border-0 hover:bg-[var(--voz-surface)] transition-colors">
                  <img src={t.author.avatar || `https://ui-avatars.com/api/?name=${t.author.username.charAt(0)}&background=random`} className="w-[32px] h-[32px] rounded-full mt-1 shrink-0 bg-gray-100 object-cover" />
                  <div className="flex-1 min-w-0">
                    <Link href={`/thread/${t.id}`} className="text-[13px] text-[var(--voz-text)] hover:underline font-medium hover:text-[var(--voz-link)] mb-1 leading-snug flex">
                      {t.title}
                    </Link>
                    <div className="text-[11px] text-[var(--voz-text-muted)]">
                      {t.author.username} · {formatRelativeTime(t.createdAt)}<br />Trả lời: {t.replyCount}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <LeaderboardBox topUsersTotal={topUsersTotal || []} topUsersMonth={topUsersMonth || []} />
        </div>
      </div>
    );
  }

  // ==== KÍCH HOẠT RÀO CHẮN ======
  const perm = await checkNodePermission(id);
  if (!perm.granted) {
    return (
      <div className="voz-card overflow-hidden my-6 max-w-3xl mx-auto">
        <h2 className="bg-[#183254] text-white px-4 py-3 text-[15px] font-bold">DanOngThongMinh Error</h2>
        <div className="p-8 text-center text-[var(--voz-text-strong)] font-medium bg-[var(--voz-surface)]">
          <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="48px" width="48px" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4 text-red-500"><path d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24V296c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"></path></svg>
          <div className="text-lg mb-2 text-red-600">Bạn không có quyền truy cập vào trang này.</div>
          <div className="text-sm text-gray-600">{perm.reason}</div>
          {!session?.user && (
            <Link href="/" className="mt-4 inline-block bg-[#183254] text-white px-4 py-2 rounded-sm text-sm hover:no-underline">Đăng nhập ngay</Link>
          )}
        </div>
      </div>
    );
  }

  // ========== FILTER LOGIC ==========
  const prefixId = sp.prefix || null;
  const startedByFilter = sp.startedBy || null;
  const lastUpdatedFilter = sp.lastUpdated || null;
  const sortBy = sp.sortBy || 'updatedAt';
  const sortOrder = sp.sortOrder || 'desc';

  let whereCondition;
  if (isAdminOrMod) {
    whereCondition = { nodeId: id };
  } else if (session?.user?.id) {
    whereCondition = { 
      nodeId: id,
      OR: [
        { isApproved: true },
        { authorId: session.user.id, isApproved: false }
      ]
    };
  } else {
    whereCondition = { nodeId: id, isApproved: true };
  }

  if (prefixId) whereCondition.prefixId = prefixId;

  // Filter: started by username
  if (startedByFilter) {
    const filterUser = await prisma.user.findFirst({ where: { username: startedByFilter }, select: { id: true } });
    if (filterUser) {
      whereCondition.authorId = filterUser.id;
    } else {
      whereCondition.authorId = 'nonexistent'; // No results
    }
  }

  // Filter: last updated time range
  if (lastUpdatedFilter) {
    const daysMap = { '1d': 1, '7d': 7, '30d': 30, '90d': 90, '365d': 365 };
    const days = daysMap[lastUpdatedFilter];
    if (days) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      whereCondition.updatedAt = { gte: cutoff };
    }
  }

  // Sort
  const validSortFields = ['updatedAt', 'createdAt', 'replyCount', 'viewCount'];
  const orderField = validSortFields.includes(sortBy) ? sortBy : 'updatedAt';
  const orderDir = sortOrder === 'asc' ? 'asc' : 'desc';

  const totalThreads = await prisma.thread.count({ where: whereCondition });
  const totalPages = Math.ceil(totalThreads / threadsPerPage) || 1;

  let isWatchingNode = false;
  if (session?.user?.id) {
    const bookmark = await prisma.bookmark.findFirst({
      where: { userId: session.user.id, nodeId: id }
    });
    if (bookmark) isWatchingNode = true;
  }

  let availablePrefixes = cachedData?.availablePrefixes;
  if (!availablePrefixes) {
    availablePrefixes = await prisma.threadPrefix.findMany({
      where: { nodes: { some: { id } } }
    });
  }

  let threadsDb = cachedData?.threadsDb;
  if (!threadsDb) {
    if (page === 1) {
      // Trang 1: pinned lên đầu, rồi đến unpinned
      const pinnedThreads = await prisma.thread.findMany({
        where: { ...whereCondition, isPinned: true },
        orderBy: { [orderField]: orderDir },
        include: {
          author: true,
          prefix: true,
          posts: { take: 1, orderBy: { position: 'desc' }, include: { author: true } }
        }
      });
      const remaining = threadsPerPage - pinnedThreads.length;
      const unpinnedThreads = remaining > 0 ? await prisma.thread.findMany({
        where: { ...whereCondition, isPinned: false },
        orderBy: { [orderField]: orderDir },
        take: remaining,
        include: {
          author: true,
          prefix: true,
          posts: { take: 1, orderBy: { position: 'desc' }, include: { author: true } }
        }
      }) : [];
      threadsDb = [...pinnedThreads, ...unpinnedThreads];
    } else {
      // Trang 2+: chỉ unpinned, skip tính trừ đi pinned đã hiện ở trang 1
      const pinnedCount = await prisma.thread.count({ where: { ...whereCondition, isPinned: true } });
      const unpinnedSkip = skip - pinnedCount;
      threadsDb = await prisma.thread.findMany({
        where: { ...whereCondition, isPinned: false },
        orderBy: { [orderField]: orderDir },
        skip: Math.max(0, unpinnedSkip),
        take: threadsPerPage,
        include: {
          author: true,
          prefix: true,
          posts: { take: 1, orderBy: { position: 'desc' }, include: { author: true } }
        }
      });
    }
  }



  if (!cachedData) {
    await setCache(cacheKey, { node, availablePrefixes, threadsDb, trendingThreads, topUsersTotal, topUsersMonth }, 10);
  }

  // Helper: format view count (e.g. 1234 -> 1.2K)
  const formatCount = (n) => {
    if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.0', '') + 'K';
    return n.toString();
  };

  const currentFilterParams = {
    prefix: prefixId || '',
    startedBy: startedByFilter || '',
    lastUpdated: lastUpdatedFilter || '',
    sortBy: sortBy,
    sortOrder: sortOrder
  };

  const paginationComponent = <Pagination basePath={`/category/${id}`} currentPage={page} totalPages={totalPages} />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 w-full">
      <div className="flex flex-col">
        {/* Breadcrumb */}
        <div className="text-[13px] mb-2 text-[var(--voz-text-muted)]">
          <Link href="/" className="hover:text-[var(--voz-link-hover)] transition-colors text-[var(--voz-link)]">Diễn đàn</Link>
          <span className="mx-1">›</span>
          {node.parent && (
            <>
              <Link href={`/category/${node.parent.id}`} className="hover:text-[var(--voz-link-hover)] transition-colors text-[var(--voz-link)]">{node.parent.title}</Link>
              <span className="mx-1">›</span>
            </>
          )}
        </div>

        <div className="flex items-center justify-between mb-4 gap-4">
          <h1 className="text-[26px] tracking-tight font-bold text-[var(--voz-text)]">{node.title}</h1>
          <div className="flex gap-2 items-center shrink-0">
            {session && <WatchNodeButton nodeId={id} initialIsWatching={isWatchingNode} />}
            <Link href={`/category/${id}/post-thread`} className="bg-[#f2930d] hover:bg-[#d88107] hover:no-underline text-white rounded-sm px-4 py-[6px] font-medium text-[13px] flex items-center gap-1.5 border-b-[3px] border-[#c07306] active:border-b-0 active:translate-y-[2px] transition-all h-[30px]">
              <PenSquare size={14} /> Đăng bài
            </Link>
          </div>
        </div>

        {/* Top Pagination */}
        <div className="mb-2">
          {paginationComponent}
        </div>

        <div className="voz-card overflow-visible">
          {/* Filter bar */}
          <div className="bg-[var(--voz-accent)] border-b border-[var(--voz-border)] px-3 py-2 flex justify-between items-center">
            <div className="text-[12px] text-[var(--voz-text-muted)]">
              {(prefixId || startedByFilter || lastUpdatedFilter) && (
                <Link href={`/category/${id}`} className="hover:underline text-[var(--voz-link)] flex items-center gap-1 font-medium text-[12px]">✖ Xóa bộ lọc</Link>
              )}
            </div>
            <ThreadFilterDropdown prefixes={availablePrefixes} currentParams={currentFilterParams} />
          </div>

          {/* Thread List */}
          <div className="bg-[var(--voz-surface)]">
            {threadsDb.length === 0 && (
              <div className="p-8 text-center text-sm text-[var(--voz-text-muted)]">Chưa có bài viết nào khớp với bộ lọc.</div>
            )}

            {threadsDb.map((thread) => {
              const lastPoster = thread.posts[0] ? thread.posts[0].author : thread.author;
              const lastPosterAvatar = lastPoster.avatar || `https://ui-avatars.com/api/?name=${lastPoster.username?.charAt(0) || 'U'}&background=random`;

              return (
                <div key={thread.id} className="flex py-3.5 px-3 border-b border-[var(--voz-border-light)] hover:bg-[var(--voz-hover)] last:border-0 transition-colors items-start">

                  {/* Author Avatar */}
                  <div className="shrink-0 mr-3">
                    <img src={thread.author?.avatar || `https://ui-avatars.com/api/?name=${thread.author?.username?.charAt(0) || 'U'}&background=random`} className="w-[42px] h-[42px] rounded-full object-cover" />
                  </div>

                  {/* Title + Author */}
                  <div className="flex-1 flex flex-col min-w-0 pr-2 md:pr-4">
                    <div className="leading-snug mb-[4px]">
                      {thread.prefix && (
                        <span className={`mr-[6px] ${thread.prefix.cssClass || 'voz-badge-info'}`}>
                          {thread.prefix.title}
                        </span>
                      )}
                      <Link href={`/thread/${thread.id}`} style={{ color: thread.isPinned ? '#c84448' : undefined }} className={`text-[16px] leading-snug ${thread.isPinned ? "font-bold" : "font-bold hover:underline"}`}>
                        {thread.isPinned && <span className="mr-1">📌</span>}
                        {!thread.isApproved && <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-500 text-[11px] font-bold px-2 py-0.5 rounded mr-2 align-middle"><Clock size={11} /> Chờ duyệt</span>}
                        <span className={thread.isPinned ? "" : "thread-title-link"}>{thread.title}</span>
                      </Link>
                    </div>

                    <div className="text-[13px] flex items-center gap-1" style={{ color: '#8c9197' }}>
                      <Link href={`/profile/${thread.author.username}`} className="hover:underline" style={{ color: '#8c9197' }}>{thread.author.username}</Link>
                    </div>

                    {/* Mobile: dòng riêng cho stats */}
                    <div className="md:hidden text-[12px] mt-[2px] flex items-center gap-1" style={{ color: '#8c9197' }}>
                      Trả lời: {thread.replyCount} · {formatRelativeTime(thread.updatedAt)}
                    </div>
                  </div>

                  {/* Stats: Replies + Views */}
                  <div className="hidden md:flex flex-col items-end shrink-0 pr-4 text-[13px] text-[var(--voz-text-muted)] w-[130px]">
                    <div className="flex items-center gap-1.5">
                      <span>Trả lời:</span>
                      <span className="text-[var(--voz-text-strong)] font-medium min-w-[30px] text-right">{thread.replyCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>Lượt xem:</span>
                      <span className="text-[var(--voz-text-strong)] min-w-[30px] text-right">{formatCount(thread.viewCount)}</span>
                    </div>
                  </div>

                  {/* Last Post Info + Avatar */}
                  <div className="hidden sm:flex items-center gap-2.5 w-[200px] shrink-0 min-w-0 justify-end">
                    <div className="flex-1 min-w-0 text-right text-[13px]">
                      <div className="text-[var(--voz-text)] truncate">{formatRelativeTime(thread.updatedAt)}</div>
                      <Link href={`/profile/${lastPoster.username}`} className="hover:underline truncate inline-block max-w-full" style={{ color: '#8c9197' }}>
                        {lastPoster.username}
                      </Link>
                    </div>
                    <img src={lastPosterAvatar} className="w-[32px] h-[32px] rounded-full shrink-0 object-cover" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Pagination */}
        <div className="mt-2">
          {paginationComponent}
        </div>
      </div>

      {/* Sidebar */}
      <div className="flex flex-col gap-4 pt-4 lg:pt-[32px] w-full lg:w-[300px]">
        <div className="voz-card overflow-hidden">
          <h3 className="bg-[var(--voz-accent)] text-[13px] font-bold px-3 py-2 border-b border-[var(--voz-border)] text-[var(--voz-link)]">Đang thịnh hành</h3>
          <div className="bg-[var(--voz-accent)]">
            {trendingThreads.map(t => (
              <div key={t.id} className="flex gap-2 p-3 border-b border-[var(--voz-border-light)] last:border-0 hover:bg-[var(--voz-surface)] transition-colors">
                <img src={t.author.avatar || `https://ui-avatars.com/api/?name=${t.author.username.charAt(0)}&background=random`} className="w-[32px] h-[32px] rounded-full mt-1 shrink-0 bg-gray-100 object-cover" />
                <div className="flex-1 min-w-0">
                  <Link href={`/thread/${t.id}`} className="text-[13px] text-[var(--voz-text)] hover:underline font-medium hover:text-[var(--voz-link)] mb-1 leading-snug flex">
                    {t.title}
                  </Link>
                  <div className="text-[11px] text-[var(--voz-text-muted)]">
                    {t.author.username} · {formatRelativeTime(t.createdAt)}<br />Trả lời: {t.replyCount}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <LeaderboardBox topUsersTotal={topUsersTotal || []} topUsersMonth={topUsersMonth || []} />
      </div>
    </div>
  );
}

