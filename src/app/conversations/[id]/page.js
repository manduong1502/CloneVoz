import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import ConversationReplyBox from '@/components/conversations/ConversationReplyBox';
import AutoRefresh from '@/components/ui/AutoRefresh';
import HtmlWithLightbox from '@/components/ui/HtmlWithLightbox';

export default async function ConversationDetailPage({ params }) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    return <div className="p-8 text-center text-red-500 font-bold">Truy cập bị từ chối.</div>;
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      participants: { select: { id: true, username: true, avatar: true } },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: {
          author: {
            select: { username: true, avatar: true, customTitle: true, createdAt: true, messageCount: true, reactionScore: true }
          }
        }
      }
    }
  });

  if (!conversation) return <div className="p-8 text-center">Không tìm thấy hộp thư.</div>;

  const isParticipant = conversation.participants.some(p => p.id === session.user.id);
  if (!isParticipant) return <div className="p-8 text-center text-red-500 font-bold">Truy cập bị từ chối. Bạn không có trong hộp thư này.</div>;

  const participantNames = conversation.participants.map(p => p.username).join(', ');

  return (
    <div className="w-full">
      <div className="text-[13px] mb-2 text-[var(--voz-text-muted)]">
        <Link href="/conversations" className="hover:text-[var(--voz-link-hover)] transition-colors text-[var(--voz-link)]">Hộp thư cá nhân</Link>
        <span className="mx-1">›</span>
      </div>

      <div className="mb-4">
        <h1 className="text-[22px] font-normal leading-tight text-[var(--voz-text-strong)] mb-[2px]">{conversation.title}</h1>
        <div className="text-[12px] text-[var(--voz-text-muted)]">Người tham gia: {participantNames}</div>
      </div>

      <div className="flex flex-col gap-3">
        {conversation.messages.map((message) => (
          <div key={message.id} id={`msg-${message.id}`} className="voz-card flex flex-col md:flex-row overflow-hidden">
            {/* User Block */}
            <div className="bg-[var(--voz-accent)] md:w-[140px] lg:w-[150px] shrink-0 p-3 md:border-r border-[var(--voz-border)] flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-0">
               <img src={message.author.avatar || `https://ui-avatars.com/api/?name=${message.author.username}&background=random`} className="w-[48px] h-[48px] md:w-[96px] md:h-[96px] rounded-sm shrink-0 border border-black/10" />
               <div className="flex-1 text-left md:text-center mt-2 w-full">
                  <div className="font-semibold text-[#c84448] text-[15px] hover:underline cursor-pointer break-words pb-1">{message.author.username}</div>
                  <div className="text-[11px] text-[#2574A9] md:mb-2">{message.author.customTitle || 'Member'}</div>
                  <div className="hidden md:flex flex-col items-start w-full text-[11px] text-[var(--voz-text-muted)] gap-[2px]">
                     <div className="flex justify-between w-full"><span>Joined</span> <span className="font-medium text-[var(--voz-text-strong)]">{new Date(message.author.createdAt).toLocaleDateString('vi-VN')}</span></div>
                  </div>
               </div>
            </div>

            {/* Content Block */}
            <div className="flex-1 bg-[var(--voz-surface)] flex flex-col min-w-0">
               <div className="flex justify-between text-[11px] text-[var(--voz-text-muted)] px-4 py-2 border-b border-[var(--voz-border-light)]">
                  <span>{new Date(message.createdAt).toLocaleString('vi-VN')}</span>
               </div>
               <HtmlWithLightbox className="p-4 text-[15px] leading-relaxed flex-1 post-content" html={message.content} />
            </div>
          </div>
        ))}
      </div>

      <ConversationReplyBox session={session} conversationId={conversation.id} />
      <AutoRefresh interval={10000} />
    </div>
  );
}
