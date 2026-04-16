import React from 'react';
import { Shield, Activity, MessageSquare, ThumbsUp, Medal, Clock } from 'lucide-react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import EditProfileModal from '@/components/profile/EditProfileModal';
import DOMPurify from 'isomorphic-dompurify';
import Pagination from '@/components/ui/Pagination';
import { formatRelativeTime } from '@/lib/formatTime';

export async function generateMetadata({ params }) {
  const { id: username } = await params;
  const user = await prisma.user.findUnique({ where: { username: decodeURIComponent(username) } });
  if (!user) return { title: 'Thành viên không tồn tại' };
  return { title: `Hồ sơ của ${user.username} | DanOngThongMinh` };
}

export default async function ProfilePage({ params, searchParams }) {
  const { id: encodedUsername } = await params;
  const username = decodeURIComponent(encodedUsername);
  
  const sp = await searchParams;
  const page = parseInt(sp.page) || 1;
  const itemsPerPage = 10;
  const skip = (page - 1) * itemsPerPage;

  const session = await auth();
  const isOwner = session?.user?.name === username;

  const targetUser = await prisma.user.findUnique({
    where: { username },
  });

  if (!targetUser) {
    return <div className="p-8 text-center text-red-500 font-bold text-xl">Thành viên không tồn tại hoặc đã bị khóa.</div>;
  }

  // Calculate actual stats (Fallback if the model doesn't have it built-in properly)
  const postsCount = await prisma.post.count({ where: { authorId: targetUser.id } });
  const threadsCount = await prisma.thread.count({ where: { authorId: targetUser.id } });

  // Kéo dữ liệu Hoạt động gần đây (Recent Posts) với giới hạn 10 và phân trang
  const recentPosts = await prisma.post.findMany({
    where: { authorId: targetUser.id },
    orderBy: { createdAt: 'desc' },
    skip: skip,
    take: itemsPerPage,
    include: {
      thread: true
    }
  });

  const totalPages = Math.ceil(postsCount / itemsPerPage) || 1;

  return (
    <div className="w-full">
      {/* Hero Header Area */}
      <div className="voz-card overflow-hidden mb-4 border border-[var(--voz-border)]">
        {/* Cover Photo / Top Bar */}
        <div className="h-[120px] bg-gradient-to-r from-[#185886] to-[#2574A9] relative"></div>
        
        <div className="bg-white px-6 pb-6 pt-0 relative flex flex-col md:flex-row md:items-end gap-6 justify-between">
          
          {/* Avatar and Info Block */}
          <div className="flex flex-col md:flex-row items-center md:items-end gap-4 mt-[-40px] md:mt-[-60px] relative z-10 w-full md:w-auto text-center md:text-left">
            <div className="bg-white p-1 rounded-full border border-[var(--voz-border)] shadow-sm">
              <img 
                src={targetUser.avatar || `https://ui-avatars.com/api/?name=${targetUser.username.charAt(0)}&background=random&size=150`} 
                className="w-[100px] h-[100px] md:w-[150px] md:h-[150px] rounded-full object-cover" 
              />
            </div>
            
            <div className="flex flex-col md:mb-2">
              <h1 className="text-[28px] font-semibold text-[var(--voz-text)] flex items-center justify-center md:justify-start gap-2 leading-none">
                {targetUser.username}
                {targetUser.customTitle === 'Quản trị viên' && <Shield size={20} className="text-red-600" />}
              </h1>
              <div className="text-[14px] text-[#2574A9] mt-2 mb-1">{targetUser.customTitle || 'Thành viên mới'}</div>
              <div className="text-[12px] text-[#8c8c8c] flex items-center justify-center md:justify-start gap-1">
                <Clock size={12}/> Đã tham gia: {targetUser.createdAt.toLocaleDateString()}
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 justify-center md:justify-end mb-2 w-full md:w-auto">
             {isOwner ? (
                <EditProfileModal user={targetUser} />
             ) : (
                <>
                  <button className="bg-white hover:bg-[#f5f5f5] text-[#141414] px-4 py-2 font-medium text-[13px] rounded flex items-center gap-2 border border-[#ccc] transition-all">
                     Theo dọi
                  </button>
                  <button className="bg-white hover:bg-[#f5f5f5] text-[#141414] px-4 py-2 font-medium text-[13px] rounded flex items-center gap-2 border border-[#ccc] transition-all">
                     Bỏ qua
                  </button>
                </>
             )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-4 w-full">
        {/* Left Sidebar (Stats & Info) */}
        <div className="flex flex-col gap-4 w-full">
          {/* Stats Card */}
          <div className="voz-card overflow-hidden">
            <h3 className="bg-[#f5f5f5] text-[13px] font-normal px-3 py-2 border-b border-[var(--voz-border)] text-[#185886]">Thống kê</h3>
            <div className="bg-white p-3 text-[13px] text-[#141414] flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-[#f0f0f0] pb-2">
                <span className="flex items-center gap-2 text-[#8c8c8c]"><MessageSquare size={16}/> Bài viết:</span> 
                <span className="font-semibold">{postsCount}</span>
              </div>
              <div className="flex justify-between items-center border-b border-[#f0f0f0] pb-2">
                <span className="flex items-center gap-2 text-[#8c8c8c]"><Activity size={16}/> Lượt thích:</span> 
                <span className="font-semibold">{targetUser.reactionScore}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-[#8c8c8c]"><Medal size={16}/> Threads:</span> 
                <span className="font-semibold">{threadsCount}</span>
              </div>
            </div>
          </div>
          
          {/* Signature Preview */}
          {targetUser.signature && (
            <div className="voz-card overflow-hidden">
              <h3 className="bg-[#f5f5f5] text-[13px] font-normal px-3 py-2 border-b border-[var(--voz-border)] text-[#185886]">Chữ ký</h3>
              <div className="bg-white p-3 text-[12px] text-[#8c8c8c] italic border-l-[3px] border-[#2574A9] bg-[#f9f9f9]">
                 <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(targetUser.signature) }} />
              </div>
            </div>
          )}
        </div>

        {/* Right Content Area (Recent Activity) */}
        <div className="flex flex-col gap-4">
          <div className="voz-card overflow-hidden">
            <h3 className="bg-[#f5f5f5] text-[13px] font-normal px-3 py-2 border-b border-[var(--voz-border)] text-[#185886]">Hoạt động gần đây</h3>
            <div className="bg-[#white]">
               {recentPosts.length === 0 ? (
                 <div className="p-8 text-center text-[#8c8c8c] text-[13px]">
                   Thành viên này chưa có hoạt động nào nổi bật dạo gian gần đây.
                 </div>
               ) : (
                recentPosts.map(post => (
                    <div key={post.id} className="px-4 py-3 border-b border-[#f0f0f0] last:border-0 hover:bg-[#fafafa] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] text-[#141414] leading-tight">
                          {post.position === 1 ? 'Đã khởi tạo chủ đề mới ' : 'Đã bình luận trong chủ đề '} 
                          <Link href={`/thread/${post.threadId}#post-${post.id}`} className="font-semibold text-[var(--voz-link)] hover:underline">{post.thread.title}</Link>
                        </div>
                      </div>
                      <div className="text-[12px] text-[#8c8c8c] shrink-0 text-left md:text-right">{formatRelativeTime(post.createdAt)}</div>
                    </div>
                 ))
               )}
            </div>
            {postsCount > 0 && (
              <div className="bg-[#f5f5f5] p-2 flex justify-end border-t border-[var(--voz-border)]">
                 <Pagination basePath={`/profile/${encodedUsername}`} currentPage={page} totalPages={totalPages} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
