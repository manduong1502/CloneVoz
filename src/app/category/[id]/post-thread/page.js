import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { createThread } from '@/actions/threadActions';

export default async function PostThreadPage({ params }) {
  const { id } = await params;
  const session = await auth();

  const node = await prisma.node.findUnique({
    where: { id }
  });

  if (!node) {
    return <div className="p-8 text-center text-red-500 font-bold">XenForo Error: The requested forum could not be found.</div>;
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
