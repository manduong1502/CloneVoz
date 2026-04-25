import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Trash2, Eye } from 'lucide-react';
import { formatRelativeTime } from '@/lib/formatTime';
import DeleteThreadButton from './DeleteThreadButton';

export default async function AdminNodeDetail({ params }) {
  const { id } = await params;

  const node = await prisma.node.findUnique({
    where: { id },
    include: { parent: true }
  });

  if (!node) {
    return <div className="p-8 text-center text-red-500 font-bold">Forum không tồn tại.</div>;
  }

  const threads = await prisma.thread.findMany({
    where: { nodeId: id },
    orderBy: { lastPostAt: 'desc' },
    include: {
      author: { select: { username: true, avatar: true } },
      _count: { select: { posts: true } }
    }
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/nodes" className="text-blue-500 hover:text-blue-600 transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-[var(--voz-text)]">
            {node.title}
          </h1>
          <p className="text-sm text-[var(--voz-text-muted)]">
            {node.parent?.title && <span>{node.parent.title} › </span>}
            {threads.length} chủ đề
          </p>
        </div>
      </div>

      {/* Thread List */}
      <div className="bg-[var(--voz-surface)] rounded-lg shadow-sm border border-[var(--voz-border)] overflow-hidden">
        <div className="bg-[var(--voz-accent)] px-4 py-3 border-b border-[var(--voz-border)] flex justify-between items-center">
          <span className="font-semibold text-[14px]">Danh sách chủ đề</span>
          <span className="text-xs text-[var(--voz-text-muted)]">{threads.length} threads</span>
        </div>

        {threads.length === 0 ? (
          <div className="p-8 text-center text-[var(--voz-text-muted)]">
            <MessageSquare size={32} className="mx-auto mb-2 opacity-40" />
            <div>Chưa có chủ đề nào trong forum này.</div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[var(--voz-hover)] text-[var(--voz-text-muted)] text-xs uppercase">
              <tr>
                <th className="px-4 py-2 text-left">Chủ đề</th>
                <th className="px-4 py-2 text-center w-[80px]">Bài viết</th>
                <th className="px-4 py-2 text-center w-[80px]">Lượt xem</th>
                <th className="px-4 py-2 text-right w-[140px]">Ngày tạo</th>
                <th className="px-4 py-2 text-center w-[100px]">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--voz-border)]">
              {threads.map(thread => (
                <tr key={thread.id} className="hover:bg-[var(--voz-hover)] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <img 
                        src={thread.author.avatar || `https://ui-avatars.com/api/?name=${thread.author.username}&background=random`} 
                        className="w-7 h-7 rounded-full shrink-0" 
                      />
                      <div className="min-w-0">
                        <Link href={`/thread/${thread.id}`} target="_blank" className="text-[var(--voz-link)] hover:underline font-medium text-[13px] line-clamp-1">
                          {thread.title}
                        </Link>
                        <div className="text-[11px] text-[var(--voz-text-muted)]">{thread.author.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-[var(--voz-text-muted)]">{thread._count.posts}</td>
                  <td className="px-4 py-3 text-center text-[var(--voz-text-muted)]">{thread.viewCount}</td>
                  <td className="px-4 py-3 text-right text-[11px] text-[var(--voz-text-muted)]">{formatRelativeTime(thread.createdAt)}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Link 
                        href={`/admin/nodes/${id}/thread/${thread.id}`}
                        className="p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded transition"
                        title="Xem & xóa bình luận"
                      >
                        <Eye size={15} />
                      </Link>
                      <DeleteThreadButton threadId={thread.id} threadTitle={thread.title} nodeId={id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
