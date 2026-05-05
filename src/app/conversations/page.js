import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Mail } from 'lucide-react';

export default async function ConversationsPage() {
  const session = await auth();
  if (!session?.user) {
    return <div className="p-8 text-center text-red-500 font-bold">Vui lòng đăng nhập để xem hộp thư.</div>;
  }

  // Lấy các đoạn hội thoại mà user tham gia
  const conversations = await prisma.conversation.findMany({
    where: {
      participants: {
        some: { id: session.user.id }
      }
    },
    include: {
      participants: { select: { id: true, username: true, avatar: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true, author: { select: { username: true } } } }
    },
    orderBy: { updatedAt: 'desc' },
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-4 w-full">
      {/* Sidebar */}
      <div className="flex flex-col gap-2">
         <div className="voz-card overflow-hidden">
            <h3 className="bg-[var(--voz-accent)] text-[13px] font-medium px-3 py-2 border-b border-[var(--voz-border)] text-[var(--voz-link)]">Hộp thư</h3>
            <div className="flex flex-col text-[13px]">
               <Link href="/conversations" className="px-3 py-2 border-l-2 border-[var(--voz-link)] bg-[var(--voz-accent)] text-[var(--voz-text)] flex items-center justify-between font-bold">Danh sách <Mail size={14}/></Link>
               <Link href="/conversations/add" className="px-3 py-2 border-l-2 border-transparent hover:bg-[var(--voz-accent)] text-[var(--voz-link)]">Bắt đầu cuộc trò chuyện mới</Link>
            </div>
         </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col">
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-[26px] tracking-tight font-normal text-[var(--voz-text)]">Hộp thư cá nhân</h1>
          <Link href="/conversations/add" className="voz-button px-4 py-2 text-sm">Bắt đầu cuộc trò chuyện</Link>
        </div>

        <div className="voz-card overflow-hidden">
           <div className="bg-[var(--voz-accent)] px-3 py-2 border-b border-[var(--voz-border)] text-[12px] flex justify-between font-medium">
              <span>Tiêu đề</span>
              <span className="w-[150px] text-right hidden sm:block">Tin nhắn cuối</span>
           </div>

           <div className="bg-[var(--voz-surface)]">
              {conversations.length === 0 && (
                <div className="p-8 text-center text-sm text-[var(--voz-text-muted)]">Bạn chưa có cuộc trò chuyện nào.</div>
              )}
              
              {conversations.map(conv => {
                const otherParticipants = conv.participants.filter(p => p.id !== session.user.id);
                const participantNames = otherParticipants.map(p => p.username).join(', ');
                const lastMsg = conv.messages[0];

                return (
                  <div key={conv.id} className="flex p-3 border-b border-[var(--voz-border-light)] hover:bg-[var(--voz-hover)] transition-colors">
                    <div className="shrink-0 mr-3 mt-1 relative">
                       {otherParticipants[0] ? (
                         <img src={otherParticipants[0].avatar || `https://ui-avatars.com/api/?name=${otherParticipants[0].username.charAt(0)}&background=random`} className="w-[36px] h-[36px] rounded-full object-cover" />
                       ) : (
                         <div className="w-[36px] h-[36px] rounded-full bg-gray-300"></div>
                       )}
                    </div>
                    
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="text-[15px] font-semibold mb-[2px]">
                        <Link href={`/conversations/${conv.id}`} className="hover:underline text-[var(--voz-link)]">{conv.title}</Link>
                      </div>
                      <div className="text-[12px] text-[var(--voz-text-muted)]">
                        Người tham gia: {otherParticipants.length > 0 ? otherParticipants.map((p, i) => (
                          <span key={p.id}>{i > 0 && ', '}<Link href={`/profile/${p.username}`} className="text-[var(--voz-link)] hover:underline">{p.username}</Link></span>
                        )) : 'Không có ai'}
                      </div>
                    </div>

                    <div className="hidden sm:flex flex-col items-end w-[150px] shrink-0 min-w-0 text-[12px]">
                       {lastMsg ? (
                         <>
                           <div className="text-[var(--voz-text-strong)] whitespace-nowrap">{new Date(lastMsg.createdAt).toLocaleString('vi-VN')}</div>
                           <div className="text-[var(--voz-text-muted)] whitespace-nowrap"><Link href={`/profile/${lastMsg.author.username}`} className="hover:underline">{lastMsg.author.username}</Link></div>
                         </>
                       ) : (
                         <span className="text-gray-400">Trống</span>
                       )}
                    </div>
                  </div>
                );
              })}
           </div>
        </div>
      </div>
    </div>
  );
}
