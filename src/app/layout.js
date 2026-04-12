import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import GlobalChat from "@/components/chat/GlobalChat";
import { auth } from "@/auth";

const inter = Inter({ subsets: ["latin"], display: 'swap' });

export const metadata = {
  title: "VOZ.vn - Diễn đàn công nghệ lớn nhất Việt Nam",
  description: "Trang web diễn đàn công nghệ lớn nhất Việt Nam",
};

export default async function RootLayout({ children }) {
  const session = await auth();

  return (
    <html lang="vi">
      <body className={`${inter.className} min-h-screen flex flex-col pt-0 bg-[var(--voz-bg)] text-[var(--voz-text)]`}>
        <Header session={session} />
        <main className="max-w-[1240px] px-2 md:px-4 mx-auto w-full flex-1 py-4 md:py-6">
          {children}
        </main>
        <Footer />
        <GlobalChat />
      </body>
    </html>
  );
}
