import { prisma } from '@/lib/prisma';
import { CheckCircle, XCircle, Clock, User, Calendar } from 'lucide-react';
import ApproveRejectButtons from './ApproveRejectButtons';
import Link from 'next/link';

export default async function AdminPendingPage() {
  const pendingThreads = await prisma.thread.findMany({
    where: { isApproved: false },
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: { username: true, avatar: true, email: true, messageCount: true, createdAt: true } },
      node: { select: { title: true } },
      posts: {
        orderBy: { position: 'asc' },
        take: 1,
        select: { content: true }
      }
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--voz-text)]">Duyệt bài viết</h1>
          <p className="text-sm text-[var(--voz-text-muted)] mt-1">
            {pendingThreads.length > 0 
              ? `Có ${pendingThreads.length} bài viết đang chờ phê duyệt.` 
              : 'Không có bài viết nào đang chờ duyệt. 🎉'}
          </p>
        </div>
      </div>

      {pendingThreads.length === 0 ? (
        <div className="bg-[var(--voz-surface)] rounded-lg shadow-sm border border-[var(--voz-border)] p-12 text-center">
          <CheckCircle size={48} className="mx-auto text-emerald-500 mb-4" />
          <h3 className="text-lg font-semibold text-[var(--voz-text)] mb-2">Tất cả đã được duyệt!</h3>
          <p className="text-sm text-[var(--voz-text-muted)]">Không có bài viết nào đang chờ phê duyệt.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {pendingThreads.map(thread => (
            <div key={thread.id} className="bg-[var(--voz-surface)] rounded-lg shadow-sm border border-[var(--voz-border)] overflow-hidden">
              {/* Header */}
              <div className="bg-amber-500/10 border-b border-amber-500/20 px-5 py-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Clock size={16} className="text-amber-500" />
                  <span className="text-sm font-medium text-amber-600">Đang chờ duyệt</span>
                  <span className="text-xs text-[var(--voz-text-muted)]">
                    trong <strong>{thread.node.title}</strong>
                  </span>
                </div>
                <span className="text-xs text-[var(--voz-text-muted)]">
                  {new Date(thread.createdAt).toLocaleString('vi-VN')}
                </span>
              </div>
              
              {/* Content */}
              <div className="p-5">
                <h3 className="text-lg font-semibold text-[var(--voz-text)] mb-3">{thread.title}</h3>
                
                {/* Author info */}
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[var(--voz-border)]">
                  <Link href={`/profile/${thread.author.username}`}>
                    <img 
                      src={thread.author.avatar || `https://ui-avatars.com/api/?name=${thread.author.username}&background=random`} 
                      className="w-10 h-10 rounded-full" 
                    />
                  </Link>
                  <div className="text-sm">
                    <Link href={`/profile/${thread.author.username}`} className="font-medium text-[var(--voz-link)] hover:underline">{thread.author.username}</Link>
                    <div className="text-xs text-[var(--voz-text-muted)] flex gap-3">
                      <span>{thread.author.email}</span>
                      <span>•</span>
                      <span>{thread.author.messageCount} bài viết</span>
                      <span>•</span>
                      <span>Tham gia: {new Date(thread.author.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                </div>

                {/* Post content preview */}
                <div 
                  className="text-sm text-[var(--voz-text)] bg-[var(--voz-accent)] border border-[var(--voz-border)] rounded p-4 max-h-[200px] overflow-y-auto leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: thread.posts[0]?.content || '<em>Không có nội dung</em>' }}
                />
              </div>

              {/* Actions */}
              <div className="bg-[var(--voz-hover)] border-t border-[var(--voz-border)] px-5 py-3 flex justify-end gap-3">
                <ApproveRejectButtons threadId={thread.id} threadTitle={thread.title} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
