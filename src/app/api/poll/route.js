import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get('conversationId');
  const lastMessageId = searchParams.get('lastMessageId');

  try {
    // 1. Lấy thông báo mới (chưa đọc)
    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { sender: { select: { username: true, avatar: true } } }
    });
    const unreadCount = notifications.filter(n => !n.isRead).length;

    // 2. Nếu đang ở trong phòng chat, lấy các tin nhắn MỚI HƠN lastMessageId
    let newMessages = [];
    if (conversationId && lastMessageId) {
       // Kỹ thuật lấy tin nhắn mới bằng 'cursor' hoặc so sánh ID. 
       // Vì Prisma ID là CUID (có tính chất tăng dần theo thời gian ở một mức độ), nhưng chuẩn nhất là lấy theo mốc thời gian của tin nhắn cuối cùng đó.
       const lastMsg = await prisma.conversationMessage.findUnique({
          where: { id: lastMessageId },
          select: { createdAt: true }
       });

       if (lastMsg) {
          newMessages = await prisma.conversationMessage.findMany({
             where: { 
                conversationId,
                createdAt: { gt: lastMsg.createdAt } // Chỉ lấy tin nhắn TẠO SAU tin nhắn cuối trên UI
             },
             orderBy: { createdAt: 'asc' },
             include: {
               author: { select: { username: true, avatar: true, customTitle: true, createdAt: true } }
             }
          });
       }
    }

    return NextResponse.json({ 
       notifications, 
       unreadCount, 
       newMessages 
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
