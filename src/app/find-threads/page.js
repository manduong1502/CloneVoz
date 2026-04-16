import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import Pagination from '@/components/ui/Pagination';
import DOMPurify from 'isomorphic-dompurify';

export const metadata = {
  title: 'Kết quả tìm kiếm | DanOngThongMinh',
};

export default async function FindThreadsPage({ searchParams }) {
  const sp = await searchParams;
  const type = sp.type || 'recent';
  const page = parseInt(sp.page) || 1;
  const threadsPerPage = 20;
  const skip = (page - 1) * threadsPerPage;

  const session = await auth();

  let whereCondition = {};
  let pageTitle = "Kết quả tìm kiếm";

  if (type === 'unanswered') {
    whereCondition = { replyCount: 0 };
    pageTitle = "Chủ đề chưa có ai trả lời (Unanswered threads)";
  } else if (type === 'your_threads') {
    if (!session?.user) return <div className="p-8 text-center text-red-500 font-bold">Vui lòng đăng nhập để xem chủ đề của bạn.</div>;
    whereCondition = { authorId: session.user.id };
    pageTitle = "Chủ đề của bạn (Your threads)";
  } else if (type === 'contributed') {
    if (!session?.user) return <div className="p-8 text-center text-red-500 font-bold">Vui lòng đăng nhập để xem chủ đề bạn đã tham gia.</div>;
    whereCondition = { posts: { some: { authorId: session.user.id } } };
    pageTitle = "Chủ đề bạn đã tham gia (Threads with your replies)";
  }

  const totalThreads = await prisma.thread.count({ where: whereCondition });
  const totalPages = Math.ceil(totalThreads / threadsPerPage) || 1;

  const threadsDb = await prisma.thread.findMany({
    where: whereCondition,
    orderBy: { updatedAt: 'desc' },
    skip: skip,
    take: threadsPerPage,
    include: {
      author: true,
      node: true,
      posts: {
        take: 1,
        orderBy: { position: 'desc' },
        include: { author: true }
      }
    }
  });

  return (
    <div className="w-full">
      <div className="mb-4">
        <h1 className="text-[26px] tracking-tight font-normal text-[var(--voz-text)]">{pageTitle}</h1>
      </div>

      <div className="flex justify-between items-center mb-2 min-h-[30px]">
        <Pagination basePath={`/find-threads?type=${type}`} currentPage={page} totalPages={totalPages} />
      </div>

      <div className="voz-card overflow-hidden">
        {/* Thread List */}
        <div className="bg-white">
          {threadsDb.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-500">Không tìm thấy bài viết nào.</div>
          )}
          
          {threadsDb.map((thread) => (
            <div key={thread.id} className="flex p-3 border-b border-[#f0f0f0] hover:bg-[#fafafa] last:border-0 transition-colors">
              
              <div className="shrink-0 mr-3 mt-1">
                <img src={thread.author?.avatar || `https://ui-avatars.com/api/?name=${thread.author?.username?.charAt(0) || 'U'}&background=random`} className="w-[40px] h-[40px] rounded-full object-cover" />
              </div>

              <div className="flex-1 flex flex-col min-w-0 pr-4">
                <div className="text-[15px] mb-[2px] leading-tight">
                  <Link href={`/thread/${thread.id}`} className="font-semibold hover:underline text-[var(--voz-link)]">
                    {thread.title}
                  </Link>
                </div>
                
                <div className="text-[12px] text-[#8c8c8c] flex items-center gap-1 mt-1">
                  <Link href={`/profile/${thread.author.username}`} className="hover:underline">{thread.author.username}</Link>
                  <span>·</span>
                  <span>{thread.createdAt.toLocaleDateString()}</span>
                  <span>·</span>
                  <Link href={`/category/${thread.nodeId}`} className="hover:underline hover:text-[var(--voz-link)]">Box: {thread.node.title}</Link>
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
                    <div className="text-[var(--voz-text)] truncate mb-1 bg-transparent hover:none">{thread.updatedAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    <Link href={`/profile/${thread.posts[0] ? thread.posts[0].author.username : thread.author.username}`} className="text-[#8c8c8c] hover:underline truncate inline-block max-w-full">
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
  );
}
