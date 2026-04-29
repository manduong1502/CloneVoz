import React from 'react';
import { Shield, Activity, MessageSquare, ThumbsUp, Medal, Clock } from 'lucide-react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import EditProfileModal from '@/components/profile/EditProfileModal';
import RankBadge from '@/components/ui/RankBadge';
import { getRankInfo } from '@/lib/rank';

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
        <div className="h-[120px] bg-gradient-to-r from-[#183254] to-[#2574A9] relative"></div>
        
        <div className="bg-[var(--voz-surface)] px-6 pb-6 pt-0 relative flex flex-col md:flex-row md:items-end gap-6 justify-between">
          
          {/* Avatar and Info Block */}
          <div className="flex flex-col md:flex-row items-center md:items-end gap-4 mt-[-40px] md:mt-[-60px] relative z-10 w-full md:w-auto text-center md:text-left">
            <div className="bg-[var(--voz-surface)] p-1 rounded-full border border-[var(--voz-border)] shadow-sm">
              <img 
                src={targetUser.avatar || `https://ui-avatars.com/api/?name=${targetUser.username.charAt(0)}&background=random&size=150`} 
                className="w-[100px] h-[100px] md:w-[150px] md:h-[150px] rounded-full object-cover" 
              />
            </div>
            
            <div className="flex flex-col md:mb-2">
              <h1 className="text-[28px] font-semibold text-[var(--voz-text)] flex flex-wrap items-center justify-center md:justify-start gap-3 leading-none mb-2">
                {targetUser.username}
                {targetUser.customTitle === 'Quản trị viên' && <Shield size={20} className="text-red-600" />}
                <RankBadge points={targetUser.points} size="lg" />
              </h1>
              
              <div className="text-[14px] text-[var(--voz-text-muted)] mb-2">{targetUser.customTitle || "Thành viên"}</div>
              <div className="text-[12px] text-[var(--voz-text-muted)] flex items-center justify-center md:justify-start gap-1">
                <Clock size={12}/> Đã tham gia: {new Date(targetUser.createdAt).toLocaleDateString('vi-VN')}
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 justify-center md:justify-end mb-2 w-full md:w-auto">
             {isOwner ? (
                <EditProfileModal user={targetUser} />
             ) : (
                <>
                  <button className="bg-[var(--voz-surface)] hover:bg-[var(--voz-accent)] text-[var(--voz-text-strong)] px-4 py-2 font-medium text-[13px] rounded flex items-center gap-2 border border-[#ccc] transition-all">
                     Theo dọi
                  </button>
                  <button className="bg-[var(--voz-surface)] hover:bg-[var(--voz-accent)] text-[var(--voz-text-strong)] px-4 py-2 font-medium text-[13px] rounded flex items-center gap-2 border border-[#ccc] transition-all">
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
            <h3 className="bg-[var(--voz-accent)] text-[13px] font-normal px-3 py-2 border-b border-[var(--voz-border)] text-[var(--voz-link)]">Thống kê</h3>
            <div className="bg-[var(--voz-surface)] p-3 text-[13px] text-[var(--voz-text-strong)] flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-[var(--voz-border-light)] pb-2">
                <span className="flex items-center gap-2 text-[var(--voz-text-muted)]"><MessageSquare size={16}/> Bình luận:</span> 
                <span className="font-semibold">{postsCount}</span>
              </div>
              <div className="flex justify-between items-center border-b border-[var(--voz-border-light)] pb-2">
                <span className="flex items-center gap-2 text-[var(--voz-text-muted)]"><Activity size={16}/> Lượt thích:</span> 
                <span className="font-semibold">{targetUser.reactionScore}</span>
              </div>
              <div className="flex justify-between items-center border-b border-[var(--voz-border-light)] pb-2">
                <span className="flex items-center gap-2 text-[var(--voz-text-muted)]"><Medal size={16}/> Chủ đề:</span> 
                <span className="font-semibold">{threadsCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-[var(--voz-text-muted)]"><ThumbsUp size={16}/> Công đức:</span> 
                <span className="font-semibold">{targetUser.points}</span>
              </div>
            </div>
          </div>
          
          {/* Signature Preview */}
          {targetUser.signature && (
            <div className="voz-card overflow-hidden">
              <h3 className="bg-[var(--voz-accent)] text-[13px] font-normal px-3 py-2 border-b border-[var(--voz-border)] text-[var(--voz-link)]">Chữ ký</h3>
              <div className="bg-[var(--voz-surface)] p-3 text-[12px] text-[var(--voz-text-muted)] italic border-l-[3px] border-[#2574A9] bg-[var(--voz-accent)]">
                 <div dangerouslySetInnerHTML={{ __html: targetUser.signature }} />
              </div>
            </div>
          )}
        </div>

        {/* Right Content Area (Recent Activity) */}
        <div className="flex flex-col gap-4">
          <div className="voz-card overflow-hidden">
            <h3 className="bg-[var(--voz-accent)] text-[13px] font-normal px-3 py-2 border-b border-[var(--voz-border)] text-[var(--voz-link)]">Hoạt động gần đây</h3>
            <div className="bg-[#white]">
               {recentPosts.length === 0 ? (
                 <div className="p-8 text-center text-[var(--voz-text-muted)] text-[13px]">
                   Thành viên này chưa có hoạt động nào nổi bật dạo gian gần đây.
                 </div>
               ) : (
                recentPosts.map(post => (
                    <div key={post.id} className="px-4 py-3 border-b border-[var(--voz-border-light)] last:border-0 hover:bg-[var(--voz-hover)] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] text-[var(--voz-text-strong)] leading-tight">
                          {post.position === 1 ? 'Đã khởi tạo chủ đề mới ' : 'Đã bình luận trong chủ đề '} 
                          <Link href={`/thread/${post.threadId}#post-${post.id}`} className="font-semibold text-[var(--voz-link)] hover:underline">{post.thread.title}</Link>
                        </div>
                      </div>
                      <div className="text-[12px] text-[var(--voz-text-muted)] shrink-0 text-left md:text-right">{formatRelativeTime(post.createdAt)}</div>
                    </div>
                 ))
               )}
            </div>
            {postsCount > 0 && (
              <div className="bg-[var(--voz-accent)] p-2 flex justify-end border-t border-[var(--voz-border)]">
                 <Pagination basePath={`/profile/${encodedUsername}`} currentPage={page} totalPages={totalPages} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
