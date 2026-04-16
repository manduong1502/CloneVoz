import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { prisma } from '@/lib/prisma'; // 🚀 Nhúng Database
import { formatRelativeTime } from '@/lib/formatTime';

export default async function Home() {
  
  // 1. Kéo toàn bộ Nodes từ CSDL là Category
  const categoriesDb = await prisma.node.findMany({
    where: { nodeType: 'Category' },
    orderBy: { displayOrder: 'asc' },
    include: {
      children: { 
        orderBy: { displayOrder: 'asc' },
        include: {
           threads: {
             orderBy: { createdAt: 'desc' },
             take: 1,
             include: { author: true }
           }
        }
      }
    }
  });

  // 2. Kéo Trending Content (Nhiều Reply nhất)
  const trendingThreads = await prisma.thread.findMany({
    orderBy: { replyCount: 'desc' },
    take: 5,
    include: { author: true }
  });

  // 3. Kéo Featured Content (Nhiều View nhất)
  const featuredThreads = await prisma.thread.findMany({
    orderBy: { viewCount: 'desc' },
    take: 2,
    include: { author: true }
  });

  const formatNumber = (num) => {
     if (num >= 1000) return (num / 1000).toFixed(1).replace('.0', '') + 'K';
     return num;
  };

  // 4. Kéo Forum Statistics
  const totalForumThreads = await prisma.thread.count();
  const totalForumPosts = await prisma.post.count();
  const totalForumUsers = await prisma.user.count();
  const latestUser = await prisma.user.findFirst({ orderBy: { createdAt: 'desc' } });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 w-full">
      {/* Main Column */}
      <div className="flex flex-col gap-4">
        {categoriesDb.map(category => (
          <div key={category.id} className="voz-card overflow-hidden">
            {/* Header */}
            <div className="bg-[#f5f5f5] border-b border-[var(--voz-border)] px-3 py-2 flex justify-between items-center text-[#185886]">
              <h2 className="text-[16px] font-normal m-0 hover:underline cursor-pointer">{category.title}</h2>
            </div>
            
            {/* List */}
            <div className="flex flex-col bg-white">
              {category.children.length === 0 ? (
                 <div className="p-4 text-sm text-gray-500 text-center">Chưa có box con nào được tạo.</div>
              ) : category.children.map((node, i) => (
                <div key={node.id} className={`flex items-center p-3 hover:bg-[#fafafa] transition-colors ${i !== category.children.length -1 ? 'border-b border-[#f0f0f0]' : ''}`}>
                  
                  {/* Icon & Title */}
                  <div className="flex-1 flex items-center min-w-0 pr-4">
                    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center mr-3 text-[#BFE3FF]">
                      <MessageCircle strokeWidth={1.5} size={32} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/category/${node.id}`} className="text-[15px] font-normal hover:no-underline hover:text-[var(--voz-link-hover)] text-[#2574A9]">
                        {node.title}
                      </Link>
                      {node.description && <div className="text-xs text-gray-500 mt-1">{node.description}</div>}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex flex-row justify-center items-center w-[140px] shrink-0 text-[11px] text-[#8c8c8c] gap-5">
                     <div className="flex flex-col items-center">
                        <div>Threads</div>
                        <div className="text-[#141414] text-[13px]">{formatNumber(node.threadsCount)}</div>
                     </div>
                     <div className="flex flex-col items-center">
                        <div>Messages</div>
                        <div className="text-[#141414] text-[13px]">{formatNumber(node.postsCount)}</div>
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
                           <div className="text-[#8c8c8c] truncate mt-[2px]">
                              {formatRelativeTime(node.threads[0].createdAt)} · <Link href={`/profile/${node.threads[0].author.username}`} className="hover:underline hover:text-[var(--voz-link)]">{node.threads[0].author.username}</Link>
                           </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 text-[12px] text-gray-500 italic">Chưa có bài viết</div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar */}
      <div className="hidden lg:flex flex-col gap-4 w-[300px]">
        
        {/* Featured Content */}
        <div className="voz-card overflow-hidden">
           <div className="bg-[#f5f5f5] px-3 py-2 text-[#185886] border-b border-[var(--voz-border)] text-[15px] font-normal hover:underline cursor-pointer">
              Featured content
           </div>
           <div className="flex flex-col bg-[#f9f9f9]">
              {featuredThreads.map(t => (
                 <div key={t.id} className="p-3 border-b border-[var(--voz-border)] flex gap-3 last:border-b-0 hover:bg-white transition-colors">
                    <img src={t.author.avatar || `https://ui-avatars.com/api/?name=${t.author.username}&background=random`} className="w-[32px] h-[32px] rounded-full object-cover shrink-0" />
                    <div className="flex flex-col min-w-0 flex-1">
                       <Link href={`/thread/${t.id}`} className="text-[14px] text-[var(--voz-link)] hover:underline leading-snug mb-[2px]">
                          {t.title}
                       </Link>
                       <div className="text-[12px] text-[#8c8c8c]">
                          {t.author.username} · {formatRelativeTime(t.createdAt)}
                       </div>
                       <div className="text-[12px] text-[#8c8c8c]">
                          Replies: {formatNumber(t.replyCount)}
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        </div>

        {/* Trending Content */}
        <div className="voz-card overflow-hidden">
           <div className="bg-[#f5f5f5] px-3 py-2 text-[#185886] border-b border-[var(--voz-border)] text-[15px] font-normal hover:underline cursor-pointer">
              Trending content
           </div>
           <div className="flex flex-col bg-[#f9f9f9]">
              {trendingThreads.map(t => (
                 <div key={t.id} className="p-3 border-b border-[var(--voz-border)] flex gap-3 last:border-b-0 hover:bg-white transition-colors">
                    <img src={t.author.avatar || `https://ui-avatars.com/api/?name=${t.author.username}&background=random`} className="w-[32px] h-[32px] rounded-full object-cover shrink-0" />
                    <div className="flex flex-col min-w-0 flex-1">
                       <Link href={`/thread/${t.id}`} className="text-[14px] text-[var(--voz-link)] hover:underline leading-snug mb-[2px]">
                          {t.title}
                       </Link>
                       <div className="text-[12px] text-[#8c8c8c]">
                          {t.author.username} · {formatRelativeTime(t.createdAt)}
                       </div>
                       <div className="text-[12px] text-[#8c8c8c]">
                          Replies: {formatNumber(t.replyCount)}
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        </div>

        {/* Forum statistics */}
        <div className="voz-card overflow-hidden">
           <div className="bg-[#f5f5f5] px-3 py-2 text-[#185886] border-b border-[var(--voz-border)] text-[14px] font-normal hover:underline cursor-pointer">
              Forum statistics
           </div>
           <div className="bg-[#f9f9f9] p-3 text-[12px] text-[#141414] flex flex-col gap-1">
               <div className="flex justify-between border-b border-[#f0f0f0] pb-1"><span>Threads:</span> <span>{totalForumThreads.toLocaleString()}</span></div>
               <div className="flex justify-between border-b border-[#f0f0f0] pb-1"><span>Messages:</span> <span>{totalForumPosts.toLocaleString()}</span></div>
               <div className="flex justify-between border-b border-[#f0f0f0] pb-1"><span>Members:</span> <span>{totalForumUsers.toLocaleString()}</span></div>
               <div className="flex justify-between"><span>Latest member:</span> <Link href={latestUser ? `/profile/${latestUser.username}` : '#'} className="text-[var(--voz-link)] hover:underline">{latestUser?.username || 'Chưa rõ'}</Link></div>
           </div>
        </div>

      </div>
    </div>
  );
}
