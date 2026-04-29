"use client";

export default function ThreadError({ error, reset }) {
  return (
    <div className="voz-card overflow-hidden my-6 max-w-3xl mx-auto">
      <h2 className="bg-[#183254] text-white px-4 py-3 text-[15px] font-bold">Đã xảy ra lỗi</h2>
      <div className="p-8 text-center bg-[var(--voz-surface)]">
        <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="48px" width="48px" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4 text-red-500"><path d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24V296c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"></path></svg>
        <div className="text-lg mb-2 text-red-600 font-medium">Không thể tải nội dung</div>
        <div className="text-sm text-[var(--voz-text-muted)] mb-4">{error?.message || 'Đã xảy ra lỗi không xác định.'}</div>
        <button 
          onClick={() => reset()} 
          className="voz-button px-6 py-2"
        >
          Thử lại
        </button>
      </div>
    </div>
  );
}
