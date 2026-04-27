import Link from 'next/link';
import { PenSquare, MessageCircle } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import Pagination from '@/components/ui/Pagination';
import { auth } from '@/auth';
import { checkNodePermission } from '@/lib/permissions';
import WatchNodeButton from '@/components/category/WatchNodeButton';
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
  const cacheKey = `voz_node_${id}_page_${page}_prefix_${sp.prefix||'none'}`;
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
  // Nếu node là Category (chứa forum con), hiển thị danh sách forum con
  if (node.nodeType === 'Category') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 w-full">
        <div className="flex flex-col">
          {/* Breadcrumb */}
          <div className="text-[13px] mb-2 text-[var(--voz-text-muted)]">
            <Link href="/" className="hover:text-[var(--voz-link-hover)] transition-colors text-[var(--voz-link)]">Diễn đàn</Link>
            <span className="mx-1">›</span>
          </div>

          <h1 className="text-[26px] tracking-tight font-normal text-[var(--voz-text)] mb-4">{node.title}</h1>

          <div className="voz-card overflow-hidden">
            {/* Header */}
            <div className="bg-[var(--voz-accent)] border-b border-[var(--voz-border)] px-3 py-2 text-[var(--voz-link)]">
              <h2 className="text-[16px] font-normal m-0">{node.title}</h2>
            </div>
            
            {/* List of child forums */}
            <div className="flex flex-col bg-[var(--voz-surface)]">
              {(!node.children || node.children.length === 0) ? (
                 <div className="p-4 text-sm text-[var(--voz-text-muted)] text-center">Chưa có box con nào được tạo.</div>
              ) : node.children.map((child, i) => (
                <div key={child.id} className={`flex items-center p-3 hover:bg-[var(--voz-hover)] transition-colors ${i !== node.children.length -1 ? 'border-b border-[var(--voz-border-light)]' : ''}`}>
                  
                  {/* Icon & Title */}
                  <div className="flex-1 flex items-center min-w-0 pr-4">
                    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center mr-3 text-[#BFE3FF]">
                      <MessageCircle strokeWidth={1.5} size={32} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/category/${child.id}`} className="text-[15px] font-normal hover:no-underline hover:text-[var(--voz-link-hover)] text-[var(--voz-link)]">
                        {child.title}
                      </Link>
                      {child.description && <div className="text-xs text-[var(--voz-text-muted)] mt-1">{child.description}</div>}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex flex-row justify-center items-center w-[140px] shrink-0 text-[11px] text-[var(--voz-text-muted)] gap-5">
                     <div className="flex flex-col items-center">
                        <div>Chủ đề</div>
                        <div className="text-[var(--voz-text-strong)] text-[13px]">{child.threadsCount || 0}</div>
                     </div>
                     <div className="flex flex-col items-center">
                        <div>Bài viết</div>
                        <div className="text-[var(--voz-text-strong)] text-[13px]">{child.postsCount || 0}</div>
                     </div>
                  </div>

                  {/* Last Post */}
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

        {/* Sidebar placeholder for category view */}
        <div className="hidden lg:block"></div>
      </div>
    );
  }

  // ==== KÍCH HOẠT RÀO CHẮN ======
  const perm = await checkNodePermission(id);
  if (!perm.granted) {
    return (
      <div className="voz-card overflow-hidden my-6 max-w-3xl mx-auto">
        <h2 className="bg-[#185886] text-white px-4 py-3 text-[15px] font-bold">DanOngThongMinh Error</h2>
        <div className="p-8 text-center text-[var(--voz-text-strong)] font-medium bg-[var(--voz-surface)]">
          <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="48px" width="48px" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4 text-red-500"><path d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24V296c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"></path></svg>
          <div className="text-lg mb-2 text-red-600">Bạn không có quyền truy cập vào trang này.</div>
          <div className="text-sm text-gray-600">{perm.reason}</div>
          {!session?.user && (
            <Link href="/" className="mt-4 inline-block bg-[#185886] text-white px-4 py-2 rounded-sm text-sm hover:no-underline">Đăng nhập ngay</Link>
          )}
        </div>
      </div>
    );
  }

  const prefixId = sp.prefix || null;
  const whereCondition = { nodeId: id, isApproved: true };
  if (prefixId) whereCondition.prefixId = prefixId;

  // Lấy tổng số Thread để tính số trang
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

  // Lấy danh sách Prefix đang có của Box này
  let availablePrefixes = cachedData?.availablePrefixes;
  if (!availablePrefixes) {
      availablePrefixes = await prisma.threadPrefix.findMany({
        where: { nodes: { some: { id } } }
      });
  }

  // Kéo Thread ra list (BUMPING FIX: Sắp xếp theo updatedAt)
  let threadsDb = cachedData?.threadsDb;
  if (!threadsDb) {
      threadsDb = await prisma.thread.findMany({
        where: whereCondition,
        orderBy: { updatedAt: 'desc' },
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

  // Kéo Trending Content (Nhiều Reply nhất) cho Sidebar
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
      // Save full compiled data into Cache
      await setCache(cacheKey, { node, availablePrefixes, threadsDb, trendingThreads }, 10);
  }

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

        <div className="mb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <h1 className="text-[26px] tracking-tight font-normal text-[var(--voz-text)]">{node.title}</h1>
          
          <div className="flex gap-4 items-center">
            <Link href={`/category/${id}/post-thread`} className="bg-[#f2930d] hover:bg-[#d88107] hover:no-underline text-white rounded px-4 py-2 font-medium text-sm flex items-center gap-2 border-b-[3px] border-[#c07306] active:border-b-0 active:translate-y-[3px] transition-all">
              <PenSquare size={16}/> Đăng bài
            </Link>
          </div>
        </div>

        <div className="flex justify-between items-center mb-2 min-h-[30px]">
          <Pagination basePath={`/category/${id}`} currentPage={page} totalPages={totalPages} />

          <div className="flex gap-2 text-[13px] ml-auto">
             {session && <WatchNodeButton nodeId={id} initialIsWatching={isWatchingNode} />}
          </div>
        </div>

        <div className="voz-card overflow-hidden">
          {/* Filters Bar */}
          <div className="bg-[var(--voz-accent)] border-b border-[var(--voz-border)] px-3 py-2 flex justify-between items-center text-[12px] text-[var(--voz-text-muted)]">
             <div>{prefixId && <Link href={`/category/${id}`} className="hover:underline text-[var(--voz-link)] flex items-center gap-1 font-medium bg-[#e3e3e3] px-2 py-1 rounded">✖ Bỏ lọc Prefix</Link>}</div>
             <div className="group relative">
               <button className="hover:text-[var(--voz-text)] pb-1">Bộ lọc ▾</button>
               <div className="hidden group-hover:flex absolute right-0 top-full mt-[-4px] bg-[var(--voz-surface)] border border-[#ccc] shadow-[0_4px_8px_rgba(0,0,0,0.1)] z-10 flex-col w-[200px] text-left">
                  <div className="px-3 py-2 bg-[var(--voz-accent)] border-b border-[var(--voz-border-light)] font-bold text-[13px] text-[var(--voz-text-strong)]">Lọc theo Tiền tố</div>
                  <Link href={`/category/${id}`} className="px-3 py-2 text-[13px] hover:bg-[#2574a9] hover:text-white transition">(Tất cả)</Link>
                  {availablePrefixes.map(p => (
                     <Link key={p.id} href={`/category/${id}?prefix=${p.id}`} className="px-3 py-2 text-[13px] hover:bg-[#2574A9] hover:text-white transition">{p.title}</Link>
                  ))}
               </div>
             </div>
          </div>
          
          {/* Table Header mimicking "Tiêu đề bài viết" fake input */}
          <div className="p-3 border-b border-[var(--voz-border-light)] bg-[var(--voz-surface)] flex gap-3 items-center text-[13px]">
             <img src="https://ui-avatars.com/api/?name=YOU&background=random" className="w-[36px] h-[36px] rounded-full opacity-50 object-cover" />
             <div className="flex-1 flex gap-2">
                <span className="border border-[var(--voz-border)] rounded-sm px-2 py-1 text-[var(--voz-text-muted)] bg-[var(--voz-accent)] font-medium">{prefixId ? availablePrefixes.find(p => p.id === prefixId)?.title : '(Không có)'} ▾</span>
                <input type="text" placeholder="Tiêu đề bài viết" className="border border-transparent hover:border-[var(--voz-border)] bg-transparent w-full outline-none px-2 text-[var(--voz-text-muted)] cursor-not-allowed" readOnly/>
             </div>
          </div>

          {/* Thread List */}
          <div className="bg-[var(--voz-surface)]">
            {threadsDb.length === 0 && (
              <div className="p-8 text-center text-sm text-[var(--voz-text-muted)]">Chưa có bài viết nào khớp với bộ lọc.</div>
            )}
            
            {threadsDb.map((thread) => (
              <div key={thread.id} className="flex p-3 border-b border-[var(--voz-border-light)] hover:bg-[var(--voz-hover)] last:border-0 transition-colors">
                
                <div className="shrink-0 mr-3 mt-1">
                  <img src={thread.author?.avatar || `https://ui-avatars.com/api/?name=${thread.author?.username?.charAt(0) || 'U'}&background=random`} className="w-[36px] h-[36px] rounded-full object-cover" />
                </div>

                <div className="flex-1 flex flex-col min-w-0 pr-4">
                  <div className="text-[15px] mb-[2px] leading-tight">
                    {thread.prefix && (
                      <span className={`mr-[6px] ${thread.prefix.cssClass || 'voz-badge-info'}`}>
                        {thread.prefix.title}
                      </span>
                    )}
                    <Link href={`/thread/${thread.id}`} className={thread.isPinned ? "font-bold text-[#c84448] hover:underline" : "font-semibold hover:underline text-[var(--voz-link)]"}>
                      {thread.title}
                    </Link>
                  </div>
                  
                  <div className="text-[12px] text-[var(--voz-text-muted)] flex items-center gap-1 mt-1">
                    <Link href={`/profile/${thread.author.username}`} className="hover:underline">{thread.author.username}</Link>
                    <span>·</span>
                    <span>{formatRelativeTime(thread.createdAt)}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="hidden md:flex gap-4 items-center shrink-0 pr-4 text-[12px] text-[var(--voz-text-muted)] w-[140px] border-r border-transparent">
                  <div className="flex flex-col items-end w-full">
                     <div className="flex gap-2"><span>Trả lời:</span> <span className="text-[var(--voz-text-strong)] font-medium">{thread.replyCount}</span></div>
                     <div className="flex gap-2"><span>Lượt xem:</span> <span className="text-[var(--voz-text-strong)]">{thread.viewCount}</span></div>
                  </div>
                </div>

                {/* Last Post (LAST POSTER FIX) */}
                <div className="hidden sm:flex items-center gap-3 w-[160px] lg:w-[150px] shrink-0 min-w-0 justify-end lg:justify-between px-2">
                   <div className="flex-1 min-w-0 text-right text-[12px]">
                      <div className="text-[var(--voz-text)] truncate mb-1 bg-transparent hover:none">{formatRelativeTime(thread.updatedAt)}</div>
                      <Link href={`/profile/${thread.posts[0] ? thread.posts[0].author.username : thread.author.username}`} className="text-[var(--voz-text-muted)] hover:underline truncate inline-block max-w-full">
                        {thread.posts[0] ? thread.posts[0].author.username : thread.author.username}
                      </Link>
                   </div>
                   <img src={(thread.posts[0] ? thread.posts[0].author.avatar : thread.author.avatar) || `https://ui-avatars.com/api/?name=${(thread.posts[0] ? thread.posts[0].author.username : thread.author.username)?.charAt(0) || 'U'}&background=random`} className="hidden lg:block w-[24px] h-[24px] rounded-sm shrink-0 object-cover" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="hidden lg:flex flex-col gap-4 pt-[36px]">
        {/* Trending Content */}
        <div className="voz-card overflow-hidden">
          <h3 className="bg-[var(--voz-accent)] text-[13px] font-normal px-3 py-2 border-b border-[var(--voz-border)] text-[#185886]">Đang thịnh hành</h3>
          <div className="bg-[var(--voz-accent)]">
            {trendingThreads.map(t => (
              <div key={t.id} className="flex gap-2 p-3 border-b border-[var(--voz-border-light)] last:border-0 hover:bg-[var(--voz-surface)] transition-colors">
                <img src={t.author.avatar || `https://ui-avatars.com/api/?name=${t.author.username.charAt(0)}&background=random`} className="w-[32px] h-[32px] rounded-full mt-1 shrink-0 bg-gray-100 object-cover" />
                <div className="flex-1 min-w-0">
                  <Link href={`/thread/${t.id}`} className="text-[13px] text-[var(--voz-text)] hover:underline font-medium hover:text-[var(--voz-link)] mb-1 leading-snug flex">
                    {t.title}
                  </Link>
                  <div className="text-[11px] text-[var(--voz-text-muted)]">
                    {t.author.username} · {formatRelativeTime(t.createdAt)}<br/>Trả lời: {t.replyCount}
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
