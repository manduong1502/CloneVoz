import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export default async function WatchedThreadsPage() {
  const session = await auth();

  if (!session?.user) {
    return <div className="p-8 text-center text-red-500 font-bold">Vui lòng đăng nhập để xem trang này.</div>;
  }

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: session.user.id, threadId: { not: null } },
    include: {
      thread: {
        include: {
          author: true,
          node: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="w-full">
      <div className="mb-4">
        <h1 className="text-[26px] tracking-tight font-normal text-[var(--voz-text)]">Chủ đề đang theo dõi</h1>
      </div>

      <div className="voz-card overflow-hidden">
         <div className="bg-[#f5f5f5] px-3 py-2 border-b border-[var(--voz-border)] text-[12px] font-medium">
            <span>Danh sách Chủ đề</span>
         </div>
         <div className="bg-white">
            {bookmarks.length === 0 && (
              <div className="p-8 text-center text-sm text-gray-500">Bạn chưa theo dõi chủ đề nào.</div>
            )}
            {bookmarks.map(b => {
              const thread = b.thread;
              if (!thread) return null;
              
              return (
                <div key={b.id} className="flex p-3 border-b border-[#f0f0f0] hover:bg-[#fafafa] transition-colors">
                  <div className="shrink-0 mr-3 mt-1 relative">
                     <img src={thread.author.avatar || `https://ui-avatars.com/api/?name=${thread.author.username.charAt(0)}&background=random`} className="w-[36px] h-[36px] rounded-full object-cover" />
                  </div>
                  
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="text-[15px] font-semibold mb-[2px]">
                      <Link href={`/thread/${thread.id}`} className="hover:underline text-[var(--voz-link)]">{thread.title}</Link>
                    </div>
                    <div className="text-[12px] text-[#8c8c8c] flex items-center gap-1">
                      <span>{thread.author.username}</span>
                      <span>·</span>
                      <span>Chuyên mục: <Link href={`/category/${thread.nodeId}`} className="hover:underline">{thread.node?.title || 'Unknown'}</Link></span>
                    </div>
                  </div>
                </div>
              );
            })}
         </div>
      </div>
    </div>
  );
}
