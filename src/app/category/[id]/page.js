import Link from 'next/link';
import { PenSquare } from 'lucide-react';
import { prisma } from '@/lib/prisma'; // 🚀 Nhúng Database

export default async function CategoryPage({ params }) {
  const { id } = await params;

  // Gọi CSDL để lấy cái Box (Node) hiện trường
  const node = await prisma.node.findUnique({
    where: { id: id },
  });

  if (!node) {
    return <div className="p-8 text-center text-red-500 text-xl font-bold">XenForo Error: The requested forum could not be found.</div>;
  }

  // Kéo 50 Thread ra list
  const threadsDb = await prisma.thread.findMany({
    where: { nodeId: id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      author: true,
      prefix: true,
    }
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 w-full">
      <div className="flex flex-col">
        {/* Breadcrumb */}
        <div className="text-[13px] mb-2 text-[#8c8c8c]">
          <Link href="/" className="hover:text-[var(--voz-link-hover)] transition-colors text-[var(--voz-link)]">Forums</Link>
          <span className="mx-1">›</span>
          <Link href="/" className="hover:text-[var(--voz-link-hover)] transition-colors text-[var(--voz-link)]">Đại sảnh</Link>
          <span className="mx-1">›</span>
        </div>

        <div className="mb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <h1 className="text-[26px] tracking-tight font-normal text-[var(--voz-text)]">{node.title}</h1>
          
          <div className="flex gap-4 items-center">
            <Link href={`/category/${id}/post-thread`} className="bg-[#f2930d] hover:bg-[#d88107] hover:no-underline text-white rounded px-4 py-2 font-medium text-sm flex items-center gap-2 border-b-[3px] border-[#c07306] active:border-b-0 active:translate-y-[3px] transition-all">
              <PenSquare size={16}/> Post thread
            </Link>
          </div>
        </div>

        <div className="flex justify-between items-center mb-2">
          {/* Pagination */}
          <div className="flex bg-[#f5f5f5] border border-[var(--voz-border)] rounded-sm text-[13px]">
            <span className="px-3 py-[6px] border-r border-[var(--voz-border)] bg-[#185886] text-white font-medium">1</span>
            <span className="px-3 py-[6px] border-r border-[var(--voz-border)] hover:bg-gray-200 cursor-pointer">2</span>
            <span className="px-3 py-[6px] border-r border-[var(--voz-border)] hover:bg-gray-200 cursor-pointer">3</span>
            <span className="px-3 py-[6px] hover:bg-gray-200 cursor-pointer text-[var(--voz-link)]">Next ›</span>
          </div>

          <div className="flex gap-2 text-[13px]">
            <button className="bg-white border border-[var(--voz-border)] rounded-sm px-3 py-[6px] hover:bg-gray-50">Watch</button>
          </div>
        </div>

        <div className="voz-card overflow-hidden">
          {/* Filters Bar */}
          <div className="bg-[#f9f9f9] border-b border-[var(--voz-border)] px-3 py-2 flex justify-between items-center text-[12px] text-[#8c8c8c]">
             <div></div>
             <button className="hover:text-[var(--voz-text)]">Filters ▾</button>
          </div>
          
          {/* Table Header mimicking "Thread title" fake input */}
          <div className="p-3 border-b border-[#f0f0f0] bg-white flex gap-3 items-center text-[13px]">
             <img src="https://ui-avatars.com/api/?name=YOU&background=random" className="w-[36px] h-[36px] rounded-full opacity-50" />
             <div className="flex-1 flex gap-2">
                <span className="border border-[var(--voz-border)] rounded-sm px-2 py-1 text-[#8c8c8c] bg-[#f9f9f9]">(No prefix) ▾</span>
                <input type="text" placeholder="Thread title" className="border border-transparent hover:border-[var(--voz-border)] bg-transparent w-full outline-none px-2 text-[#8c8c8c]" readOnly/>
             </div>
          </div>

          {/* Thread List */}
          <div className="bg-white">
            {threadsDb.length === 0 && (
              <div className="p-8 text-center text-sm text-gray-500">Chưa có bài viết nào trong box này.</div>
            )}
            
            {threadsDb.map((thread) => (
              <div key={thread.id} className="flex p-3 border-b border-[#f0f0f0] hover:bg-[#fafafa] last:border-0 transition-colors">
                
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
                  
                  <div className="text-[12px] text-[#8c8c8c] flex items-center gap-1 mt-1">
                    <Link href={`/profile/${thread.author.username}`} className="hover:underline">{thread.author.username}</Link>
                    <span>·</span>
                    <span>{thread.createdAt.toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="hidden md:flex gap-4 items-center shrink-0 pr-4 text-[12px] text-[#8c8c8c] w-[140px] border-r border-transparent">
                  <div className="flex flex-col items-end w-full">
                     <div className="flex gap-2"><span>Replies:</span> <span className="text-[#141414] font-medium">{thread.replyCount}</span></div>
                     <div className="flex gap-2"><span>Views:</span> <span className="text-[#141414]">{thread.viewCount}</span></div>
                  </div>
                </div>

                {/* Last Post */}
                <div className="hidden sm:flex items-center gap-3 w-[160px] lg:w-[150px] shrink-0 min-w-0 justify-end lg:justify-between px-2">
                   <div className="flex-1 min-w-0 text-right text-[12px]">
                      <div className="text-[var(--voz-text)] truncate mb-1 bg-transparent hover:none">{thread.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      <Link href={`/profile/${thread.author.username}`} className="text-[#8c8c8c] hover:underline truncate inline-block max-w-full">{thread.author.username}</Link>
                   </div>
                   <img src={thread.author?.avatar || `https://ui-avatars.com/api/?name=${thread.author?.username?.charAt(0) || 'U'}&background=random`} className="hidden lg:block w-[24px] h-[24px] rounded-sm shrink-0 object-cover" />
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
          <h3 className="bg-[#f5f5f5] text-[13px] font-normal px-3 py-2 border-b border-[var(--voz-border)] text-[#185886]">Trending content</h3>
          <div className="bg-white px-3 py-2">
            
            <div className="flex gap-2 py-2 border-b border-[#f0f0f0] last:border-0">
              <img src="https://ui-avatars.com/api/?name=R&background=random" className="w-[24px] h-[24px] rounded-sm mt-1 shrink-0" />
              <div className="flex-1 min-w-0">
                <Link href="/thread/trending1" className="text-[13px] text-[var(--voz-text)] hover:no-underline font-medium hover:text-[var(--voz-link)] mb-1 leading-tight flex">
                  Làm sao để giàu nhanh?
                </Link>
                <div className="text-[11px] text-[#8c8c8c] mt-1">
                  voz_er · Nov 23, 2022<br/>Replies: 5K
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
