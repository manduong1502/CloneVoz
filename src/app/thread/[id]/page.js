import Link from 'next/link';
import { ThumbsUp, Flag, MessageSquareQuote } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { createReply } from '@/actions/postActions';
import { revalidatePath } from 'next/cache';

export default async function ThreadPage({ params }) {
  const { id } = await params;
  const session = await auth();

  const thread = await prisma.thread.findUnique({
    where: { id },
    include: {
      author: true,
      node: true,
      posts: {
        orderBy: { position: 'asc' },
        include: { author: true }
      }
    }
  });

  if (!thread) {
    return <div className="p-8 text-center text-red-500 text-xl font-bold">XenForo Error: Thread not found.</div>;
  }

  // Tăng View Count (Fake simple mode, no IP checks)
  await prisma.thread.update({
    where: { id },
    data: { viewCount: { increment: 1 } }
  });

  // Action wrapper cho Reply
  const handleReply = async (formData) => {
    "use server";
    await createReply(id, formData);
  };

  return (
    <div className="w-full">
      {/* Breadcrumb */}
      <div className="text-[13px] mb-2 text-[#8c8c8c]">
        <Link href="/" className="hover:text-[var(--voz-link-hover)] transition-colors text-[var(--voz-link)]">Forums</Link>
        <span className="mx-1">›</span>
        <Link href="/" className="hover:text-[var(--voz-link-hover)] transition-colors text-[var(--voz-link)]">{thread.node.title}</Link>
      </div>

      <div className="mb-4">
        <h1 className="text-[22px] font-normal leading-tight text-[#141414] mb-[2px]">{thread.title}</h1>
        <div className="text-[12px] text-[#8c8c8c] flex gap-1 items-center">
           <img src={thread.author.avatar || `https://ui-avatars.com/api/?name=${thread.author.username.charAt(0)}&background=random`} className="w-[16px] h-[16px] rounded-sm" />
           <Link href={`/profile/${thread.author.username}`} className="text-[var(--voz-text)] hover:underline hover:text-[var(--voz-link)] font-medium">{thread.author.username}</Link>
           <span>·</span>
           <span>{thread.createdAt.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex justify-between items-center mb-2">
        {/* Pagination Dummy */}
        <div className="flex bg-[#f5f5f5] border border-[var(--voz-border)] rounded-sm text-[13px]">
          <span className="px-3 py-[6px] border-r border-[var(--voz-border)] bg-[#185886] text-white font-medium">1</span>
          <span className="px-3 py-[6px] border-r border-[var(--voz-border)] hover:bg-gray-200 cursor-pointer">2</span>
          <span className="px-3 py-[6px] border-r border-[var(--voz-border)] hover:bg-gray-200 cursor-pointer">3</span>
          <span className="px-3 py-[6px] border-r border-[var(--voz-border)] hover:bg-gray-200 cursor-pointer text-[var(--voz-link)]">Next ›</span>
        </div>
        <div className="flex gap-2 text-[13px]">
           <button className="bg-white border border-[var(--voz-border)] rounded-sm px-3 py-[6px] hover:bg-gray-50">Watch</button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3">
        {thread.posts.map((post, index) => (
          <div key={post.id} className="voz-card flex flex-col md:flex-row overflow-hidden">
            
            {/* User Block (Left Side) */}
            <div className="bg-[#f5f5f5] md:w-[140px] lg:w-[150px] shrink-0 p-3 md:border-r border-[var(--voz-border)] flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-0">
               <img src={post.author.avatar || `https://ui-avatars.com/api/?name=${post.author.username}&background=random`} className="w-[48px] h-[48px] md:w-[96px] md:h-[96px] rounded-sm shrink-0 border border-black/10" />
               <div className="flex-1 text-left md:text-center mt-2 w-full">
                  <div className="font-semibold text-[#c84448] text-[15px] hover:underline cursor-pointer break-words pb-1">{post.author.username}</div>
                  <div className="text-[11px] text-[#2574A9] md:mb-2">{post.author.customTitle || 'Member'}</div>
                  
                  <div className="hidden md:flex flex-col items-start w-full text-[11px] text-[#8c8c8c] gap-[2px]">
                     <div className="flex justify-between w-full"><span>Joined</span> <span className="font-medium text-[#141414]">{post.author.createdAt.toLocaleDateString()}</span></div>
                     <div className="flex justify-between w-full"><span>Messages</span> <span className="font-medium text-[#141414]">{post.author.messageCount}</span></div>
                     <div className="flex justify-between w-full"><span>Reaction score</span> <span className="font-medium text-[#141414]">{post.author.reactionScore}</span></div>
                  </div>
               </div>
            </div>

            {/* Content Block */}
            <div className="flex-1 bg-white flex flex-col min-w-0">
               <div className="flex justify-between text-[11px] text-[#8c8c8c] px-4 py-2 border-b border-[#f0f0f0]">
                  <span>{post.createdAt.toLocaleString()}</span>
                  <Link href={`#post-${post.id}`} className="hover:underline">#{post.position}</Link>
               </div>
               
               <div className="p-4 text-[15px] leading-relaxed flex-1" dangerouslySetInnerHTML={{ __html: post.content }} />
               
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
                    <button className="flex items-center gap-1 hover:text-[var(--voz-link)]"><Flag size={14}/> Report</button>
                    <button className="flex items-center gap-1 hover:text-[var(--voz-link)]"><MessageSquareQuote size={14}/> Reply</button>
                 </div>
               </div>
            </div>

          </div>
        ))}
      </div>
      </div>

      {/* Reply Box */}
      {/* Reply Box */}
      {session ? (
        <form action={handleReply} className="voz-card mt-4 overflow-hidden">
           <div className="bg-[#f5f5f5] px-4 py-[10px] text-[13px] border-b border-[var(--voz-border)] text-[#185886] font-medium flex gap-2 items-center">
              <img src={session.user.image} className="w-5 h-5 rounded-sm" /> Gửi trả lời dưới tên {session.user.name}
           </div>
           <div className="p-4 bg-white flex flex-col items-end">
              <textarea name="content" className="w-full min-h-[120px] p-2 border border-[var(--voz-border)] rounded-[2px] focus:outline-none focus:border-[var(--voz-link)] resize-y text-[14px]" placeholder="Viết bình luận..."></textarea>
              <button type="submit" className="voz-button mt-3 px-6 py-[6px]">Post reply</button>
           </div>
        </form>
      ) : (
        <div className="voz-card mt-4 p-4 text-center bg-[#f9f9f9]">
           <span className="text-gray-500">Bạn phải <span className="text-[#185886] font-bold cursor-pointer">đăng nhập</span> hoặc <span className="text-[#185886] font-bold cursor-pointer">đăng ký</span> để trả lời bài viết.</span>
        </div>
      )}
    </div>
  );
}
