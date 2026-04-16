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
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Quản lý Báo Cáo (Reports)</h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm text-gray-700">
          <thead className="bg-gray-50 border-b border-gray-200">
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
                <td colSpan="4" className="text-center p-8 text-gray-500">Tuyệt vời! Không có báo cáo vi phạm nào cần xử lý.</td>
              </tr>
            )}
            
            {pendingReports.map(report => (
              <tr key={report.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3">
                  {report.post ? (
                    <div className="flex flex-col">
                      <span className="font-bold text-red-600">{report.post.author?.username || 'Unknown'}</span>
                      <Link href={`/thread/${report.post.threadId}#post-${report.postId}`} target="_blank" className="text-blue-600 hover:underline text-xs">
                         Xem nội dung vi phạm
                      </Link>
                    </div>
                  ) : (
                    <span className="text-gray-400">Không tìm thấy bài</span>
                  )}
                </td>
                
                <td className="px-4 py-3 font-medium">
                  {report.reporter.username}
                </td>

                <td className="px-4 py-3 max-w-[300px]">
                  <p className="line-clamp-2 text-gray-800" title={report.reason}>{report.reason}</p>
                </td>

                <td className="px-4 py-3 w-[200px]">
                  <div className="flex flex-col gap-2">
                    {/* Hành động Phạt */}
                    <form action={async () => {
                       'use server';
                       await resolveReportAndWarn({ 
                         reportId: report.id, 
                         warningReason: report.reason, 
                         warningPoints: 1, 
                         targetUserId: report.post?.author?.id 
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
                      <button className="bg-gray-200 text-gray-700 px-3 py-1 rounded w-full text-xs hover:bg-gray-300 font-medium transition">
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
