import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { formatRelativeTime } from '@/lib/formatTime';
import SearchForm from './SearchForm';

export default async function SearchPage({ searchParams }) {
  const sp = await searchParams;
  const keyword = sp.q || '';
  const titleOnly = sp.titleOnly === '1';
  
  let results = [];
  let searched = false;

  if (keyword.trim()) {
    searched = true;
    
    const whereCondition = {
      isApproved: true,
      ...(titleOnly 
        ? { title: { contains: keyword, mode: 'insensitive' } }
        : {
            OR: [
              { title: { contains: keyword, mode: 'insensitive' } },
              { posts: { some: { content: { contains: keyword, mode: 'insensitive' } } } }
            ]
          }
      )
    };

    results = await prisma.thread.findMany({
      where: whereCondition,
      orderBy: { updatedAt: 'desc' },
      take: 50,
      include: {
        author: { select: { username: true, avatar: true } },
        node: { select: { title: true, id: true } },
      }
    });
  }

  return (
    <div className="w-full flex flex-col gap-4 mt-2">
      {/* Search Form */}
      <div className="voz-card w-full max-w-[800px] mx-auto overflow-hidden">
        <div className="bg-[var(--voz-accent)] px-4 py-[10px] text-[15px] border-b border-[var(--voz-border)] text-[var(--voz-link)] font-medium">
           Tìm kiếm chủ đề
        </div>
        <div className="p-4 md:p-6 bg-[var(--voz-surface)]">
          <SearchForm initialKeyword={keyword} initialTitleOnly={titleOnly} />
        </div>
      </div>

      {/* Results */}
      {searched && (
        <div className="voz-card w-full max-w-[800px] mx-auto overflow-hidden">
          <div className="bg-[var(--voz-accent)] px-4 py-[10px] text-[14px] border-b border-[var(--voz-border)] text-[var(--voz-text)] font-medium flex justify-between">
            <span>Kết quả tìm kiếm cho "{keyword}"</span>
            <span className="text-[var(--voz-text-muted)] font-normal">{results.length} kết quả</span>
          </div>
          
          <div className="bg-[var(--voz-surface)]">
            {results.length === 0 ? (
              <div className="p-8 text-center text-[var(--voz-text-muted)]">
                <div className="text-3xl mb-2">🔍</div>
                <div className="text-[15px] font-medium text-[var(--voz-text)]">Không tìm thấy kết quả</div>
                <div className="text-[13px] mt-1">Thử từ khóa khác hoặc bỏ tùy chọn "Chỉ tìm tiêu đề"</div>
              </div>
            ) : (
              <div className="flex flex-col">
                {results.map((thread, i) => (
                  <div key={thread.id} className={`flex items-center gap-3 p-3 hover:bg-[var(--voz-hover)] transition-colors ${i !== results.length - 1 ? 'border-b border-[var(--voz-border-light)]' : ''}`}>
                    <img 
                      src={thread.author.avatar || `https://ui-avatars.com/api/?name=${thread.author.username}&background=random`} 
                      className="w-9 h-9 rounded-full shrink-0 object-cover" 
                    />
                    <div className="flex-1 min-w-0">
                      <Link href={`/thread/${thread.id}`} className="text-[14px] text-[var(--voz-link)] hover:underline font-medium line-clamp-1">
                        {thread.title}
                      </Link>
                      <div className="text-[11px] text-[var(--voz-text-muted)] mt-[2px] flex gap-2 flex-wrap">
                        <span>{thread.author.username}</span>
                        <span>·</span>
                        <span>{formatRelativeTime(thread.createdAt)}</span>
                        <span>·</span>
                        <Link href={`/category/${thread.node?.id}`} className="text-[var(--voz-link)] hover:underline">{thread.node?.title}</Link>
                      </div>
                    </div>
                    <div className="hidden sm:flex flex-col items-end text-[11px] text-[var(--voz-text-muted)] shrink-0">
                      <div>Trả lời: <span className="text-[var(--voz-text-strong)]">{thread.replyCount}</span></div>
                      <div>Lượt xem: <span className="text-[var(--voz-text-strong)]">{thread.viewCount}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
