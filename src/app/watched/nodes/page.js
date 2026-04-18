import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export default async function WatchedNodesPage() {
  const session = await auth();

  if (!session?.user) {
    return <div className="p-8 text-center text-red-500 font-bold">Vui lòng đăng nhập để xem trang này.</div>;
  }

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: session.user.id, nodeId: { not: null } },
    include: {
      node: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="w-full">
      <div className="mb-4">
        <h1 className="text-[26px] tracking-tight font-normal text-[var(--voz-text)]">Diễn đàn đang theo dõi</h1>
      </div>

      <div className="voz-card overflow-hidden">
         <div className="bg-[var(--voz-accent)] px-3 py-2 border-b border-[var(--voz-border)] text-[12px] font-medium">
            <span>Danh sách diễn đàn</span>
         </div>
         <div className="bg-[var(--voz-surface)]">
            {bookmarks.length === 0 && (
              <div className="p-8 text-center text-sm text-[var(--voz-text-muted)]">Bạn chưa theo dõi chuyên mục nào.</div>
            )}
            {bookmarks.map(b => {
              const node = b.node;
              if (!node) return null;
              
              return (
                <div key={b.id} className="flex p-3 border-b border-[var(--voz-border-light)] hover:bg-[var(--voz-hover)] transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-semibold mb-[2px]">
                      <Link href={`/category/${node.id}`} className="hover:underline text-[var(--voz-link)]">{node.title}</Link>
                    </div>
                    {node.description && (
                      <div className="text-[12px] text-[var(--voz-text-muted)] mt-1 line-clamp-1">{node.description}</div>
                    )}
                  </div>
                </div>
              );
            })}
         </div>
      </div>
    </div>
  );
}
