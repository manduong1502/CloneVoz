import Link from 'next/link';
import { ThumbsUp, Flag, MessageSquareQuote } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { checkNodePermission } from '@/lib/permissions';
import ThreadReplyBox from '@/components/thread/ThreadReplyBox';
import QuoteButton from '@/components/thread/QuoteButton';
import WatchButton from '@/components/thread/WatchButton';
import ReportModal from '@/components/thread/ReportModal';
import Pagination from '@/components/ui/Pagination';
import DOMPurify from 'isomorphic-dompurify';
import { formatRelativeTime } from '@/lib/formatTime';

export async function generateMetadata({ params }) {
  const { id } = await params;
  
  const thread = await prisma.thread.findUnique({ 
    where: { id: id },
    include: {
      node: { select: { title: true } },
      posts: {
        orderBy: { position: 'asc' },
        take: 1,
        select: { content: true }
      }
    }
  });
  
  if (!thread) return { title: 'Bài viết không tồn tại | DanOngThongMinh' };

  let description = `${thread.title} - Thảo luận tại box ${thread.node.title}`;
  if (thread.posts.length > 0) {
    // Xóa bớt HTML tag để lấy text description thô cho SEO, độ dài tối đa 160 ký tự.
    const rawText = thread.posts[0].content.replace(/<[^>]*>?/gm, ' ');
    if (rawText.length > 10) {
      description = rawText.substring(0, 160) + (rawText.length > 160 ? '...' : '');
    }
  }
  
  return {
    title: `${thread.title} | DanOngThongMinh`,
    description: description,
    openGraph: {
      title: thread.title,
      description: description,
      siteName: "DanOngThongMinh Forum",
      type: "article",
    }
  };
}

export default async function ThreadPage({ params, searchParams }) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await auth();

  const page = parseInt(sp.page) || 1;
  const postsPerPage = 15;
  const skip = (page - 1) * postsPerPage;

  const totalPosts = await prisma.post.count({ where: { threadId: id } });
  const totalPages = Math.ceil(totalPosts / postsPerPage);

  const thread = await prisma.thread.findUnique({
    where: { id },
    include: {
      author: true,
      node: { include: { parent: true } },
      posts: {
        orderBy: { position: 'asc' },
        skip: skip,
        take: postsPerPage,
        include: { author: true }
      }
    }
  });

  let isWatching = false;
  if (session?.user?.id) {
    const bookmark = await prisma.bookmark.findFirst({
      where: { userId: session.user.id, threadId: id }
    });
    if (bookmark) isWatching = true;
  }

  if (!thread) {
    return <div className="p-8 text-center text-red-500 text-xl font-bold">DanOngThongMinh Error: Thread not found.</div>;
  }

  // ==== KÍCH HOẠT RÀO CHẮN ======
  const perm = await checkNodePermission(thread.nodeId);
  if (!perm.granted) {
    return (
      <div className="voz-card overflow-hidden my-6 max-w-3xl mx-auto">
        <h2 className="bg-[#185886] text-white px-4 py-3 text-[15px] font-bold">DanOngThongMinh Error</h2>
        <div className="p-8 text-center text-[#141414] font-medium bg-white">
          <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="48px" width="48px" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4 text-red-500"><path d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24V296c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"></path></svg>
          <div className="text-lg mb-2 text-red-600">Bạn không có quyền truy cập vào nội dung này.</div>
          <div className="text-sm text-gray-600">{perm.reason}</div>
          {!session?.user && (
            <Link href="/" className="mt-4 inline-block bg-[#185886] text-white px-4 py-2 rounded-sm text-sm hover:no-underline">Đăng nhập ngay</Link>
          )}
        </div>
      </div>
    );
  }

  // Tăng View Count (Fake simple mode, no IP checks)
  await prisma.thread.update({
    where: { id },
    data: { viewCount: { increment: 1 } }
  });

  // ViewCount Update logic here.

  return (
    <div className="w-full">
      {/* Breadcrumb */}
      <div className="text-[13px] mb-2 text-[#8c8c8c]">
        <Link href="/" className="hover:text-[var(--voz-link-hover)] transition-colors text-[var(--voz-link)]">Forums</Link>
        <span className="mx-1">›</span>
        {thread.node.parent && (
          <>
            <Link href={`/category/${thread.node.parent.id}`} className="hover:text-[var(--voz-link-hover)] transition-colors text-[var(--voz-link)]">{thread.node.parent.title}</Link>
            <span className="mx-1">›</span>
          </>
        )}
        <Link href={`/category/${thread.node.id}`} className="hover:text-[var(--voz-link-hover)] transition-colors text-[var(--voz-link)]">{thread.node.title}</Link>
      </div>

      <div className="mb-4">
        <h1 className="text-[22px] font-normal leading-tight text-[#141414] mb-[2px]">{thread.title}</h1>
        <div className="text-[12px] text-[#8c8c8c] flex gap-1 items-center">
           <img src={thread.author.avatar || `https://ui-avatars.com/api/?name=${thread.author.username.charAt(0)}&background=random`} className="w-[16px] h-[16px] rounded-sm" />
           <Link href={`/profile/${thread.author.username}`} className="text-[var(--voz-text)] hover:underline hover:text-[var(--voz-link)] font-medium">{thread.author.username}</Link>
           <span>·</span>
           <span>{formatRelativeTime(thread.createdAt)}</span>
        </div>
      </div>

      <div className="flex justify-between items-center mb-2 min-h-[30px]">
        <Pagination basePath={`/thread/${id}`} currentPage={page} totalPages={totalPages} />
        <div className="flex gap-2 text-[13px] ml-auto">
           {session && <WatchButton threadId={id} initialIsWatching={isWatching} />}
        </div>
      </div>

      <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3">
        {thread.posts.map((post, index) => (
          <div key={post.id} id={`post-${post.id}`} className="voz-card flex flex-col md:flex-row overflow-hidden">
            
            {/* User Block (Left Side) */}
            <div className="bg-[#f5f5f5] md:w-[140px] lg:w-[150px] shrink-0 p-3 md:border-r border-[var(--voz-border)] flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-0">
               <img src={post.author.avatar || `https://ui-avatars.com/api/?name=${post.author.username}&background=random`} className="w-[48px] h-[48px] md:w-[96px] md:h-[96px] rounded-sm shrink-0 border border-black/10" />
               <div className="flex-1 text-left md:text-center mt-2 w-full">
                  <div className="font-semibold text-[#c84448] text-[15px] hover:underline cursor-pointer break-words pb-1">{post.author.username}</div>
                  <div className="text-[11px] text-[#2574A9] md:mb-2">{post.author.customTitle || 'Member'}</div>
                  
                  <div className="hidden md:flex flex-col items-start w-full text-[11px] text-[#8c8c8c] gap-[2px]">
                     <div className="flex justify-between w-full"><span>Ngày tham gia</span> <span className="font-medium text-[#141414]">{post.author.createdAt.toLocaleDateString()}</span></div>
                     <div className="flex justify-between w-full"><span>Bài viết</span> <span className="font-medium text-[#141414]">{post.author.messageCount}</span></div>
                     <div className="flex justify-between w-full"><span>Điểm reaction</span> <span className="font-medium text-[#141414]">{post.author.reactionScore}</span></div>
                  </div>
               </div>
            </div>

            {/* Content Block */}
            <div className="flex-1 bg-white flex flex-col min-w-0">
               <div className="bg-[#f5f5f5] px-4 py-2 text-[12px] text-[#8c8c8c] flex justify-between border-b border-[var(--voz-border)]">
                 <div>{formatRelativeTime(post.createdAt)}</div>
                 <div className="flex gap-3"><Link href={`#post-${post.id}`} className="hover:underline">#{post.position}</Link></div>
               </div>
               
               <div className="p-4 text-[15px] leading-relaxed flex-1" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }} />
               
               {post.author.signature && (
                 <div className="mx-4 pb-2 text-[12px] text-[#8c8c8c] border-t border-[#f0f0f0] pt-2 italic">
                   {post.author.signature}
                 </div>
               )}

               <div className="bg-[#f9f9f9] px-4 py-2 border-t border-[#f0f0f0] flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                 <div className="text-[12px] text-[var(--voz-link)] flex items-center gap-1 group cursor-pointer hover:underline">
                    <div className="bg-[#2574A9] text-white rounded-full p-[2px]"><ThumbsUp size={12}/></div>
                    <span>{0} người thích</span>
                 </div>
                 
                 <div className="flex gap-3 text-[12px] text-[#8c8c8c]">
                    {session?.user && <ReportModal postId={post.id} threadId={id} />}
                    <QuoteButton username={post.author.username} content={post.content} />
                 </div>
               </div>
            </div>

          </div>
        ))}
      </div>
      </div>

      {/* Reply Box */}
      {/* Reply Box */}
      <ThreadReplyBox session={session} threadId={id} />
    </div>
  );
}
