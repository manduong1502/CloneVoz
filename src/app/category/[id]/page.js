import Link from 'next/link';
import { PenSquare, MessageCircle } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import Pagination from '@/components/ui/Pagination';
import { auth } from '@/auth';
import { checkNodePermission } from '@/lib/permissions';
import WatchNodeButton from '@/components/category/WatchNodeButton';
import ThreadFilterDropdown from '@/components/category/ThreadFilterDropdown';
import { formatRelativeTime } from '@/lib/formatTime';
import { getCache, setCache } from '@/lib/redis';

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

  // Dùng bộ nhớ Cache siêu tốc để tiết kiệm RAM Database
  const cacheKey = `voz_node_${id}_page_${page}_prefix_${sp.prefix || 'none'}_sb_${sp.startedBy || 'none'}_lu_${sp.lastUpdated || 'none'}_sort_${sp.sortBy || 'updatedAt'}_${sp.sortOrder || 'desc'}`;
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
  }

  if (!node) {
    return <div className="p-8 text-center text-red-500 text-xl font-bold">DanOngThongMinh Error: The requested forum could not be found.</div>;
  }

  // ========== CATEGORY VIEW ==========
  if (node.nodeType === 'Category') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 w-full">
        <div className="flex flex-col">
          {/* Breadcrumb */}
          <div className="text-[13px] mb-2 text-[var(--voz-text-muted)]">
            <Link href="/" className="hover:text-[var(--voz-link-hover)] transition-colors text-[var(--voz-link)]">Diễn đàn</Link>
            <span className="mx-1">›</span>
          </div>

          <h1 className="text-[26px] tracking-tight font-bold text-[var(--voz-text)] mb-4">{node.title}</h1>

          <div className="voz-card overflow-hidden">
            <div className="bg-[var(--voz-accent)] border-b border-[var(--voz-border)] px-3 py-2 text-[var(--voz-link)]">
              <h2 className="text-[16px] font-bold m-0">{node.title}</h2>
            </div>

            <div className="flex flex-col bg-[var(--voz-surface)]">
              {(!node.children || node.children.length === 0) ? (
                <div className="p-4 text-sm text-[var(--voz-text-muted)] text-center">Chưa có box con nào được tạo.</div>
              ) : node.children.map((child, i) => (
                <div key={child.id} className={`flex items-center p-3 hover:bg-[var(--voz-hover)] transition-colors ${i !== node.children.length - 1 ? 'border-b border-[var(--voz-border-light)]' : ''}`}>
                  <div className="flex-1 flex items-center min-w-0 pr-4">
                    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center mr-3 text-[#BFE3FF]">
                      <MessageCircle strokeWidth={1.5} size={32} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/category/${child.id}`} className="text-[15px] font-bold hover:no-underline hover:text-[var(--voz-link-hover)] text-[var(--voz-link)]">
                        {child.title}
                      </Link>
                      {child.description && <div className="text-xs text-[var(--voz-text-muted)] mt-1">{child.description}</div>}
                    </div>
                  </div>
                  <div className="hidden md:flex flex-row justify-center items-center w-[140px] shrink-0 text-[11px] text-[var(--voz-text-muted)] gap-5">
                    <div className="flex flex-col items-center">
                      <div>Chủ đề</div>
                      <div className="text-[var(--voz-text-strong)] text-[13px]">{child.threadsCount || 0}</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div>Bình luận</div>
                      <div className="text-[var(--voz-text-strong)] text-[13px]">{child.postsCount || 0}</div>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center w-[260px] shrink-0 pl-4 min-w-0">
                    {child.threads && child.threads.length > 0 ? (
                      <>
                        <img src={child.threads[0].author.avatar || `https://ui-avatars.com/api/?name=${child.threads[0].author.username}&background=random`} className="w-[32px] h-[32px] rounded-full shrink-0 object-cover bg-gray-100" />
                        <div className="flex-1 min-w-0 text-[12px] ml-3 flex flex-col justify-center">
                          <Link href={`/thread/${child.threads[0].id}`} className="text-[var(--voz-link)] hover:underline truncate font-medium">
                            {child.threads[0].title}
                          </Link>
                          <div className="text-[var(--voz-text-muted)] truncate mt-[2px]">
                            {formatRelativeTime(child.threads[0].createdAt)} · <Link href={`/profile/${child.threads[0].author.username}`} className="hover:underline hover:text-[var(--voz-link)]">{child.threads[0].author.username}</Link>
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
        </div>
        <div className="hidden lg:block"></div>
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

  const whereCondition = { nodeId: id, isApproved: true };
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

  const session = await auth();
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
    threadsDb = await prisma.thread.findMany({
      where: whereCondition,
      orderBy: { [orderField]: orderDir },
      skip: skip,
      take: threadsPerPage,
      include: {
        author: true,
        prefix: true,
        posts: {
          take: 1,
          orderBy: { position: 'desc' },
          include: { author: true }
        }
      }
    });
  }

  let trendingThreads = cachedData?.trendingThreads;
  if (!trendingThreads) {
    trendingThreads = await prisma.thread.findMany({
      where: { isApproved: true },
      orderBy: { replyCount: 'desc' },
      take: 5,
      include: { author: true }
    });
  }

  if (!cachedData) {
    await setCache(cacheKey, { node, availablePrefixes, threadsDb, trendingThreads }, 10);
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
      <div className="hidden lg:flex flex-col gap-4 pt-[32px]">
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
      </div>
    </div>
  );
}

