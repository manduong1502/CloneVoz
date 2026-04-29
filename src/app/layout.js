import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import GlobalChatbox from "@/components/layout/GlobalChatbox";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import BannedOverlay from "@/components/ui/BannedOverlay";

const inter = Inter({ subsets: ["latin"], display: 'swap' });

export const metadata = {
  title: "Diễn đàn DanOngThongMinh - Cộng đồng phái mạnh lớn nhất",
  description: "Trang web diễn đàn chia sẻ kiến thức, giao lưu trực tuyến công nghệ, đời sống hàng đầu Việt Nam",
  openGraph: {
    title: "Diễn đàn DanOngThongMinh",
    description: "Nơi tụ hội của những bộ óc nhạy bén.",
    url: "https://danongthongminh.vn",
    siteName: "DanOngThongMinh Forum",
    locale: "vi_VN",
    type: "website",
  },
};

export default async function RootLayout({ children }) {
  const session = await auth();

  let notifications = [];
  let unreadNotificationsCount = 0;
  let bannedUser = null;

  if (session?.user?.id) {
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isBanned: true, banReason: true, banExpiresAt: true, bannedAt: true }
    });

    // Check nếu ban đã hết hạn thì tự động gỡ ban
    if (currentUser?.isBanned && currentUser.banExpiresAt && new Date(currentUser.banExpiresAt) < new Date()) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { isBanned: false, banReason: null, banExpiresAt: null, bannedAt: null }
      });
    } else if (currentUser?.isBanned) {
      bannedUser = currentUser;
    }

    if (!bannedUser) {
      notifications = await prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { sender: { select: { username: true, avatar: true } } }
      });
      unreadNotificationsCount = notifications.filter(n => !n.isRead).length;
    }
  }

  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/favicon.png" type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/favicon.png" />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col pt-0 bg-[var(--voz-bg)] text-[var(--voz-text)]`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {bannedUser ? (
            <BannedOverlay 
              banReason={bannedUser.banReason}
              banExpiresAt={bannedUser.banExpiresAt?.toISOString()}
              bannedAt={bannedUser.bannedAt?.toISOString()}
            />
          ) : (
            <>
              <Header session={session} notifications={notifications} unreadCount={unreadNotificationsCount} />
              <main className="max-w-[1240px] px-2 md:px-4 mx-auto w-full flex-1 py-4 md:py-6">
                {children}
              </main>
              <Footer />
              <GlobalChatbox session={session} />
            </>
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}

