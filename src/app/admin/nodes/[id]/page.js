import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Eye } from 'lucide-react';
import DeleteThreadButton from './DeleteThreadButton';

export default async function AdminNodeDetail({ params }) {
  const { id } = await params;

  try {
    const node = await prisma.node.findUnique({
      where: { id },
      select: { id: true, title: true, parentId: true }
    });

    if (!node) {
      return <div className="p-8 text-center text-red-500 font-bold">Forum không tồn tại (ID: {id})</div>;
    }

    let parentTitle = '';
    if (node.parentId) {
      const parent = await prisma.node.findUnique({ where: { id: node.parentId }, select: { title: true } });
      parentTitle = parent?.title || '';
    }

    const threads = await prisma.thread.findMany({
      where: { nodeId: id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        replyCount: true,
        author: { select: { username: true, avatar: true } },
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
              {parentTitle && <span>{parentTitle} › </span>}
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
            <div className="divide-y divide-[var(--voz-border)]">
              {threads.map(thread => (
                <div key={thread.id} className="px-4 py-3 flex items-center justify-between hover:bg-[var(--voz-hover)] transition-colors gap-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <img 
                      src={thread.author?.avatar || `https://ui-avatars.com/api/?name=${thread.author?.username || 'U'}&background=random`} 
                      className="w-7 h-7 rounded-full shrink-0" 
                    />
                    <div className="min-w-0">
                      <Link href={`/thread/${thread.id}`} target="_blank" className="text-[var(--voz-link)] hover:underline font-medium text-[13px] line-clamp-1 block">
                        {thread.title}
                      </Link>
                      <div className="text-[11px] text-[var(--voz-text-muted)]">
                        {thread.author?.username} · {thread.replyCount || 0} bình luận · {thread.createdAt ? new Date(thread.createdAt).toLocaleDateString('vi-VN') : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Link 
                      href={`/admin/nodes/${id}/thread/${thread.id}`}
                      className="p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded transition"
                      title="Xem & xóa bình luận"
                    >
                      <Eye size={15} />
                    </Link>
                    <DeleteThreadButton threadId={thread.id} threadTitle={thread.title} nodeId={id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h2 className="text-red-600 font-bold mb-2">Lỗi tải trang</h2>
          <pre className="text-red-500 text-xs whitespace-pre-wrap break-words">
            {error.message}
          </pre>
          <Link href="/admin/nodes" className="text-blue-500 hover:underline text-sm mt-3 block">← Quay lại danh sách</Link>
        </div>
      </div>
    );
  }
}
