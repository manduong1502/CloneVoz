import { prisma } from '@/lib/prisma';
import { resolveReportAndWarn, rejectReport } from '@/actions/reportActions';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';

export default async function AdminReportsPage() {
  const pendingReports = await prisma.report.findMany({
    where: { status: 'pending' },
    include: {
      reporter: { select: { username: true } },
      post: {
        include: { author: { select: { id: true, username: true } }, thread: { select: { title: true } } }
      },
      shoutboxMessage: {
        include: { author: { select: { id: true, username: true } } }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-[var(--voz-text)]">Quản lý Báo Cáo (Reports)</h1>

      <div className="bg-[var(--voz-surface)] rounded-lg shadow-sm border border-[var(--voz-border)] overflow-hidden">
        <table className="w-full text-left text-sm text-[var(--voz-text)]">
          <thead className="bg-[var(--voz-hover)] border-b border-[var(--voz-border)]">
            <tr>
              <th className="px-4 py-3 font-medium">Bị báo cáo</th>
              <th className="px-4 py-3 font-medium">Người gửi</th>
              <th className="px-4 py-3 font-medium">Lý do</th>
              <th className="px-4 py-3 font-medium">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {pendingReports.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center p-8 text-[var(--voz-text-muted)]">Tuyệt vời! Không có báo cáo vi phạm nào cần xử lý.</td>
              </tr>
            )}
            
            {pendingReports.map(report => (
              <tr key={report.id} className="border-b border-[var(--voz-border)] last:border-0 hover:bg-[var(--voz-hover)]">
                <td className="px-4 py-3">
                  {report.post ? (
                    <div className="flex flex-col">
                      <span className="font-bold text-red-600">{report.post.author?.username || 'Unknown'}</span>
                      <Link href={`/thread/${report.post.threadId}#post-${report.postId}`} target="_blank" className="text-blue-600 hover:underline text-[12px]">
                         Nội dung: Trả lời diễn đàn
                      </Link>
                    </div>
                  ) : report.shoutboxMessage ? (
                    <div className="flex flex-col">
                      <span className="font-bold text-red-600">{report.shoutboxMessage.author?.username || 'Unknown'}</span>
                      <span className="text-purple-600 text-[12px] break-all">
                         Chatbox: "{report.shoutboxMessage.content}"
                      </span>
                    </div>
                  ) : (
                    <span className="text-[var(--voz-text-muted)]">Không rõ</span>
                  )}
                </td>
                
                <td className="px-4 py-3 font-medium">
                  {report.reporter.username}
                </td>

                <td className="px-4 py-3 max-w-[300px]">
                  <p className="line-clamp-2 text-[var(--voz-text)]" title={report.reason}>{report.reason}</p>
                </td>

                <td className="px-4 py-3 w-[200px]">
                  <div className="flex flex-col gap-2">
                    {/* Hành động Phạt */}
                    <form action={async () => {
                       'use server';
                       const targetUserId = report.post?.author?.id || report.shoutboxMessage?.author?.id;
                       await resolveReportAndWarn({ 
                         reportId: report.id, 
                         warningReason: report.reason, 
                         warningPoints: 1, 
                         targetUserId: targetUserId 
                       });
                    }}>
                      <button className="bg-red-600 text-white px-3 py-1 rounded w-full text-xs font-bold hover:bg-red-700 transition">
                         Phạt 1 điểm Cảnh Cáo
                      </button>
                    </form>

                    {/* Hành động Bỏ qua */}
                    <form action={async () => {
                       'use server';
                       await rejectReport(report.id);
                    }}>
                      <button className="bg-[var(--voz-border)] text-[var(--voz-text)] px-3 py-1 rounded w-full text-xs hover:bg-[var(--voz-border-light)] font-medium transition">
                         Bỏ qua (Báo cáo sai)
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
