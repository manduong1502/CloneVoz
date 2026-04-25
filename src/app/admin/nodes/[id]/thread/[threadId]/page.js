import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { formatRelativeTime } from '@/lib/formatTime';
import DeleteCommentButton from './DeleteCommentButton';

export default async function AdminThreadComments({ params }) {
  const { id: nodeId, threadId } = await params;

  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    include: {
      author: { select: { username: true, avatar: true } },
      node: { select: { title: true } },
      posts: {
        orderBy: { position: 'asc' },
        include: {
          author: { select: { id: true, username: true, avatar: true } }
        }
      }
    }
  });

  if (!thread) {
    return <div className="p-8 text-center text-red-500 font-bold">Thread không tồn tại.</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/admin/nodes/${nodeId}`} className="text-blue-500 hover:text-blue-600 transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-[var(--voz-text)] line-clamp-1">
            {thread.title}
          </h1>
          <p className="text-sm text-[var(--voz-text-muted)]">
            {thread.node?.title} · Tác giả: {thread.author.username} · {thread.posts.length} bình luận
          </p>
        </div>
      </div>

      {/* Comments List */}
      <div className="bg-[var(--voz-surface)] rounded-lg shadow-sm border border-[var(--voz-border)] overflow-hidden">
        <div className="bg-[var(--voz-accent)] px-4 py-3 border-b border-[var(--voz-border)] flex justify-between items-center">
          <span className="font-semibold text-[14px]">Danh sách bình luận</span>
          <Link href={`/thread/${threadId}`} target="_blank" className="text-xs text-blue-500 hover:underline">
            Xem trên diễn đàn ↗
          </Link>
        </div>

        <div className="divide-y divide-[var(--voz-border)]">
          {thread.posts.map((post) => (
            <div key={post.id} className="px-4 py-3 hover:bg-[var(--voz-hover)] transition-colors">
              <div className="flex items-start gap-3">
                <img 
                  src={post.author.avatar || `https://ui-avatars.com/api/?name=${post.author.username}&background=random`} 
                  className="w-8 h-8 rounded-full shrink-0 mt-1" 
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-[13px] text-[var(--voz-text)]">{post.author.username}</span>
                    <span className="text-[11px] text-[var(--voz-text-muted)]">#{post.position}</span>
                    <span className="text-[11px] text-[var(--voz-text-muted)]">· {formatRelativeTime(post.createdAt)}</span>
                    {post.position === 1 && (
                      <span className="text-[10px] bg-blue-500 text-white px-1.5 py-[1px] rounded font-bold">BÀI GỐC</span>
                    )}
                  </div>
                  
                  {/* Content preview */}
                  <div 
                    className="text-[13px] text-[var(--voz-text-muted)] line-clamp-3 break-words"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />
                </div>

                {/* Delete button - không cho xóa bài gốc (#1) */}
                <div className="shrink-0">
                  {post.position === 1 ? (
                    <span className="text-[10px] text-[var(--voz-text-muted)] italic">Bài gốc</span>
                  ) : (
                    <DeleteCommentButton postId={post.id} threadId={threadId} nodeId={nodeId} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
