import React from 'react';
import Link from 'next/link';
import { ShieldAlert, Book } from 'lucide-react';

export const metadata = {
  title: 'Nội quy diễn đàn | DanOngThongMinh',
};

export default function TermsPage() {
  return (
    <div className="w-full max-w-4xl mx-auto my-6">
      <div className="voz-card overflow-hidden">
        <h2 className="bg-[#185886] text-white px-4 py-3 text-[16px] font-medium flex items-center justify-between">
           <span className="flex items-center gap-2"><Book size={18} /> Nội quy hoạt động tại DanOngThongMinh</span>
        </h2>
        <div className="p-6 bg-white text-[#141414] leading-relaxed text-[15px]">
          <p className="mb-4 text-[#8c8c8c] italic text-sm">Cập nhật lần cuối: 16 tháng 4, 2026</p>
          
          <h3 className="font-bold text-lg mb-2 text-[#2574A9]">1. Nguyên tắc chung</h3>
          <ul className="list-disc pl-6 mb-6 flex flex-col gap-2">
             <li>Thành viên phải tuân thủ nghiêm pháp luật của nhà nước.</li>
             <li>Không đăng tải nội dung đồi trụy, vi phạm thuần phong mỹ tục.</li>
             <li>Tôn trọng người khác, không chửi rủa, đe dọa, hay lăng mạ cá nhân/tổ chức.</li>
          </ul>

          <h3 className="font-bold text-lg mb-2 text-[#2574A9]">2. Quy định đóng góp nội dung</h3>
          <ul className="list-disc pl-6 mb-6 flex flex-col gap-2">
             <li>Sử dụng ngôn ngữ Tiếng Việt có dấu rõ ràng. Không dùng ngôn từ teen code quá mức.</li>
             <li>Tiêu đề phải rõ ràng, phản ánh đúng nội dung thảo luận. Nghiêm cấm mọi hình thức giật tít, câu view.</li>
             <li>Mọi vi phạm (Tạo thread rác, Đào bộ, Spam, XSS chèn Script) sẽ bị Mod xử lý thẳng tay không báo trước ngang qua Hệ thống Report tự động. <b>3 Báo cáo = Tự động KIA.</b></li>
          </ul>

          <div className="bg-[#fcf8e3] border border-[#faebcc] text-[#8a6d3b] p-4 rounded mt-8 text-sm flex gap-3 items-start">
             <ShieldAlert className="shrink-0 text-[#8a6d3b] mt-[2px]" size={18} />
             <div>Việc bạn tạo tài khoản và bấm Đăng ký đồng nghĩa với việc bạn đã đọc và đồng ý tuân thủ tuyệt đối các quy định trên đây. Ban Quản Trị có toàn quyền xử lý tài khoản của bạn nếu vi phạm.</div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-center">
         <Link href="/" className="text-[var(--voz-link)] hover:underline">&larr; Quay lại Trang chủ</Link>
      </div>
    </div>
  );
}
