import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import GlobalChat from "@/components/chat/GlobalChat";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ThemeProvider } from "@/components/layout/ThemeProvider";

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

  if (session?.user?.id) {
    notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { sender: { select: { username: true, avatar: true } } }
    });
    unreadNotificationsCount = notifications.filter(n => !n.isRead).length;
  }

  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen flex flex-col pt-0 bg-[var(--voz-bg)] text-[var(--voz-text)]`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Header session={session} notifications={notifications} unreadCount={unreadNotificationsCount} />
          <main className="max-w-[1240px] px-2 md:px-4 mx-auto w-full flex-1 py-4 md:py-6">
            {children}
          </main>
          <Footer />
          <GlobalChat />
        </ThemeProvider>
      </body>
    </html>
  );
}
