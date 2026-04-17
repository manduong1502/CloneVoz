import Link from 'next/link';
import { prisma } from '@/lib/prisma'; // 🚀 Nhúng Database

export default async function WhatsNewPage() {
  
  // Lấy 30 Thread mới nhất trực tiếp từ PostgreSQL
  const latestThreads = await prisma.thread.findMany({
    orderBy: { createdAt: 'desc' },
    take: 30,
    include: {
      author: true,
      node: true,
      prefix: true
    }
  });

  return (
    <div className="w-full">
      <div className="mb-4">
        <h1 className="text-[26px] tracking-tight font-normal text-[var(--voz-text)]">Có gì mới</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--voz-border)] mb-4 text-[13px]">
        <Link href="/whats-new" className="px-4 py-2 border-b-[3px] border-[#185886] font-semibold text-[#185886]">Bài viết mới</Link>
        <Link href="#" className="px-4 py-2 border-b-[3px] border-transparent hover:border-[#2574A9]/50 text-[#8c8c8c] hover:text-[#185886]">Bài viết hồ sơ mới</Link>
        <Link href="#" className="px-4 py-2 border-b-[3px] border-transparent hover:border-[#2574A9]/50 text-[#8c8c8c] hover:text-[#185886]">Hoạt động mới nhất</Link>
      </div>

      <div className="voz-card overflow-hidden">
        <div className="bg-[#f9f9f9] border-b border-[var(--voz-border)] px-3 py-[6px] flex justify-end items-center text-[12px] text-[#8c8c8c]">
           <button className="hover:text-[var(--voz-text)]">Bộ lọc ▾</button>
        </div>
        
        <div className="bg-white">
          {latestThreads.map(thread => (
            <div key={thread.id} className="flex p-3 border-b border-[#f0f0f0] hover:bg-[#fafafa] last:border-0 transition-colors">
              <div className="shrink-0 mr-3 mt-1">
                 <img src={thread.author.avatar || `https://ui-avatars.com/api/?name=${thread.author.username.charAt(0)}&background=random`} className="w-[36px] h-[36px] rounded-full object-cover" />
              </div>
              <div className="flex-1 flex flex-col min-w-0 pr-4">
                <div className="text-[15px] mb-[2px] leading-tight">
                  <Link href={`/thread/${thread.id}`} className="font-semibold hover:underline text-[var(--voz-link)]">
                    {thread.title}
                  </Link>
                </div>
                <div className="text-[12px] text-[#8c8c8c] flex flex-wrap items-center gap-1 mt-1">
                  Mới nhất: <Link href={`/profile/${thread.author.username}`} className="hover:underline">{thread.author.username}</Link>
                  <span>·</span>
                  <span>{thread.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  <span>·</span>
                  <Link href={`/category/${thread.nodeId}`} className="hover:underline hover:text-[var(--voz-text)] text-[#8c8c8c]">{thread.node.title}</Link>
                </div>
              </div>

              <div className="hidden md:flex gap-4 items-center shrink-0 pr-4 text-[12px] text-[#8c8c8c] w-[140px]">
                <div className="flex flex-col items-end w-full">
                    <div className="flex gap-2"><span>Trả lời:</span> <span className="text-[#141414] font-medium">{thread.replyCount}</span></div>
                    <div className="flex gap-2"><span>Lượt xem:</span> <span className="text-[#141414]">{thread.viewCount}</span></div>
                </div>
              </div>
            </div>
          ))}
          {latestThreads.length === 0 && (
            <div className="p-4 text-center text-gray-500 text-sm">Chưa có bài viết mới nào.</div>
          )}
        </div>

        <div className="bg-[#f9f9f9] border-t border-[var(--voz-border)] px-3 py-[6px] text-center text-[12px]">
           <Link href="#" className="text-[var(--voz-link)] hover:underline">Xem thêm...</Link>
        </div>
      </div>
    </div>
  );
}
