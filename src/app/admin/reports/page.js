import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import ReportActions from './ReportActions';

export default async function AdminReportsPage() {
  const pendingReports = await prisma.report.findMany({
    where: { status: 'pending' },
    include: {
      reporter: { select: { username: true, avatar: true } },
      post: {
        include: { 
          author: { select: { id: true, username: true, avatar: true, isBanned: true } }, 
          thread: { select: { id: true, title: true } } 
        }
      },
      shoutboxMessage: {
        include: { author: { select: { id: true, username: true, avatar: true, isBanned: true } } }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Đếm tổng số reports đã xử lý
  const resolvedCount = await prisma.report.count({ where: { status: 'resolved' } });
  const rejectedCount = await prisma.report.count({ where: { status: 'rejected' } });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--voz-text)]">Quản lý Báo Cáo</h1>
          <p className="text-sm text-[var(--voz-text-muted)] mt-1">
            {pendingReports.length} đang chờ · {resolvedCount} đã xử lý · {rejectedCount} đã bỏ qua
          </p>
        </div>
      </div>

      <div className="bg-[var(--voz-surface)] rounded-lg shadow-sm border border-[var(--voz-border)] overflow-hidden">
        {pendingReports.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-lg font-semibold text-[var(--voz-text)] mb-1">Sạch sẽ!</h3>
            <p className="text-sm text-[var(--voz-text-muted)]">Không có báo cáo vi phạm nào cần xử lý.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {pendingReports.map(report => {
              const targetUser = report.post?.author || report.shoutboxMessage?.author;
              const contentPreview = report.post 
                ? report.post.thread?.title 
                : report.shoutboxMessage?.content;
              const contentType = report.post ? 'Bình luận diễn đàn' : 'Tin nhắn Chatbox';
              const contentLink = report.post 
                ? `/thread/${report.post.thread?.id}#post-${report.postId}` 
                : null;

              return (
                <div key={report.id} className="p-4 border-b border-[var(--voz-border)] last:border-0 hover:bg-[var(--voz-hover)] transition-colors">
                  <div className="flex gap-4">
                    {/* Reporter info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-amber-500/20 text-amber-600 text-[11px] font-bold px-2 py-[2px] rounded">REPORT</span>
                        <span className="text-xs text-[var(--voz-text-muted)]">
                          Từ <strong><Link href={`/profile/${report.reporter.username}`} className="text-[var(--voz-link)] hover:underline">{report.reporter.username}</Link></strong> · {new Date(report.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>

                      {/* Target user */}
                      {targetUser && (
                        <div className="flex items-center gap-2 mb-2">
                          <Link href={`/profile/${targetUser.username}`}>
                            <img src={targetUser.avatar || `https://ui-avatars.com/api/?name=${targetUser.username}`} className="w-6 h-6 rounded-full" />
                          </Link>
                          <Link href={`/profile/${targetUser.username}`} className="font-bold text-red-500 hover:underline">{targetUser.username}</Link>
                          {targetUser.isBanned && <span className="text-[10px] bg-red-500 text-white px-1 rounded">BANNED</span>}
                          <span className="text-xs text-[var(--voz-text-muted)]">— {contentType}</span>
                        </div>
                      )}
                      
                      {/* Content preview */}
                      {contentLink ? (
                        <Link href={contentLink} target="_blank" className="text-xs text-blue-500 hover:underline block mb-2">
                          📎 Xem nội dung bài viết: "{contentPreview}"
                        </Link>
                      ) : contentPreview && (
                        <div className="text-xs text-[var(--voz-text-muted)] bg-[var(--voz-accent)] p-2 rounded mb-2 max-w-[400px] truncate">
                          💬 "{contentPreview}"
                        </div>
                      )}

                      {/* Reason */}
                      <div className="text-sm text-[var(--voz-text)] bg-red-500/5 border-l-2 border-red-500 px-3 py-2 rounded-r">
                        <strong className="text-xs text-red-500 block mb-1">Lý do:</strong>
                        {report.reason}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="shrink-0 flex flex-col gap-2 w-[150px]">
                      <ReportActions 
                        reportId={report.id} 
                        targetUserId={targetUser?.id}
                        targetUsername={targetUser?.username}
                        reason={report.reason}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
