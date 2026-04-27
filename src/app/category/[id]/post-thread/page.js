import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { checkNodePermission } from '@/lib/permissions';
import ThreadCreateBox from '@/components/thread/ThreadCreateBox';

export default async function PostThreadPage({ params }) {
  const { id } = await params;
  const session = await auth();

  const node = await prisma.node.findUnique({
    where: { id }
  });

  if (!node) {
    return <div className="p-8 text-center text-red-500 font-bold">DanOngThongMinh Error: The requested forum could not be found.</div>;
  }

  // ==== KÍCH HOẠT RÀO CHẮN ======
  const perm = await checkNodePermission(id);
  if (!perm.granted) {
    return (
      <div className="voz-card overflow-hidden my-6 max-w-3xl mx-auto">
        <h2 className="bg-[#185886] text-white px-4 py-3 text-[15px] font-bold">DanOngThongMinh Error</h2>
        <div className="p-8 text-center text-[var(--voz-text-strong)] font-medium bg-[var(--voz-surface)]">
          <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="48px" width="48px" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4 text-red-500"><path d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24V296c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"></path></svg>
          <div className="text-lg mb-2 text-red-600">Bạn không có quyền đăng bài ở Box này.</div>
          <div className="text-sm text-gray-600">{perm.reason}</div>
          {!session?.user && (
            <Link href="/" className="mt-4 inline-block bg-[#185886] text-white px-4 py-2 rounded-sm text-sm hover:no-underline">Đăng nhập</Link>
          )}
        </div>
      </div>
    );
  }



  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="text-[13px] mb-2 text-[var(--voz-text-muted)]">
        <Link href="/" className="hover:text-[var(--voz-link-hover)] transition-colors text-[var(--voz-link)]">Diễn đàn</Link>
        <span className="mx-1">›</span>
        <Link href={`/category/${id}`} className="hover:text-[var(--voz-link-hover)] transition-colors text-[var(--voz-link)]">{node.title}</Link>
      </div>

      <div className="mb-4">
        <h1 className="text-[26px] tracking-tight font-normal text-[var(--voz-text)]">Đăng bài mới</h1>
      </div>

      <ThreadCreateBox session={session} nodeId={id} />
    </div>
  );
}
