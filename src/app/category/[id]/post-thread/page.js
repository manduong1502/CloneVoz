import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { createThread } from '@/actions/threadActions';
import { checkNodePermission } from '@/lib/permissions';

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
        <div className="p-8 text-center text-[#141414] font-medium bg-white">
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

  const handleSubmit = async (formData) => {
    "use server";
    await createThread(id, formData);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="text-[13px] mb-2 text-[#8c8c8c]">
        <Link href="/" className="hover:text-[var(--voz-link-hover)] transition-colors text-[var(--voz-link)]">Forums</Link>
        <span className="mx-1">›</span>
        <Link href={`/category/${id}`} className="hover:text-[var(--voz-link-hover)] transition-colors text-[var(--voz-link)]">{node.title}</Link>
      </div>

      <div className="mb-4">
        <h1 className="text-[26px] tracking-tight font-normal text-[var(--voz-text)]">Post thread</h1>
      </div>

      {!session ? (
        <div className="voz-card mt-4 p-4 text-center bg-[#f9f9f9]">
           <span className="text-gray-500">Bạn phải <span className="text-[#185886] font-bold cursor-pointer">đăng nhập</span> để tạo chủ đề mới.</span>
        </div>
      ) : (
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="bg-white border border-[var(--voz-border)] rounded-sm p-4 flex flex-col gap-4 shadow-sm">
            
            <div className="flex flex-col gap-1">
               <label className="text-[14px] font-semibold text-[#141414]">Tiêu đề</label>
               <input 
                 type="text" 
                 name="title" 
                 required
                 className="w-full border border-[var(--voz-border)] p-2 rounded-[2px] focus:border-[var(--voz-link)] outline-none text-[15px]" 
                 placeholder="Nhập tiêu đề chủ đề..." 
               />
            </div>
            
            <div className="flex flex-col gap-1">
               <label className="text-[14px] font-semibold text-[#141414]">Nội dung</label>
               {/* Giả lập bộ Toolbar Rich Text Editor của Xenforo */}
               <div className="border border-[var(--voz-border)] rounded-t-[2px] bg-[#f5f5f5] px-2 py-1 flex gap-2 text-[#8c8c8c] text-[15px]">
                  <span className="hover:text-black cursor-pointer px-1">B</span>
                  <span className="hover:text-black cursor-pointer px-1 italic">I</span>
                  <span className="hover:text-black cursor-pointer px-1 underline">U</span>
                  <span className="hover:text-black cursor-pointer px-1">T</span>
               </div>
               <textarea 
                 name="content" 
                 required
                 className="w-full min-h-[300px] p-3 border border-t-0 border-[var(--voz-border)] rounded-b-[2px] focus:outline-none focus:border-[var(--voz-link)] resize-y text-[15px]" 
                 placeholder="Viết nội dung bài viết vào đây..."
               ></textarea>
            </div>

          </div>

          <div className="flex justify-center mt-2">
             <button type="submit" className="voz-button w-[200px] justify-center py-[10px] text-[15px]">Post thread</button>
          </div>
        </form>
      )}
    </div>
  );
}
