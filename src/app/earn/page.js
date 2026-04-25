import Link from 'next/link';
import { Rocket, ArrowLeft } from 'lucide-react';

export default function EarnTogetherPage() {
  return (
    <div className="w-full flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
      <div className="text-center max-w-[520px] px-6">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
          <Rocket size={36} className="text-white" />
        </div>

        {/* Title */}
        <h1 className="text-[28px] md:text-[34px] font-bold text-[var(--voz-text)] mb-3 leading-tight">
          Cùng Nhau Kiếm Tiền
        </h1>

        {/* Description */}
        <p className="text-[15px] text-[var(--voz-text)] leading-relaxed mb-6 font-medium">
          Đây sẽ là nơi anh em được mua hàng với deal ngon, dropship kiếm thêm thu nhập lúc rảnh rỗi, giúp anh em tổng kho đẩy hàng tồn nhanh chóng.
        </p>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 px-4 py-2 rounded-full text-[13px] font-semibold mb-8">
          <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
          Đang phát triển — Sắp ra mắt
        </div>

        {/* CTA */}
        <div>
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-[var(--voz-link)] hover:underline text-[14px] font-medium"
          >
            <ArrowLeft size={16} />
            Quay lại Diễn đàn
          </Link>
        </div>
      </div>
    </div>
  );
}
