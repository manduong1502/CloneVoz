import React from 'react';
import { Settings, Shield, Activity, MessageSquare, Heart } from 'lucide-react';
import Link from 'next/link';

export default async function ProfilePage({ params }) {
  const { id } = await params;
  
  // Trích xuất profile data từ id hoặc dùng mặc định
  const profileId = id || 'Admin';

  return (
    <div className="profile-page">
      <div className="card profile-header p-6 flex flex-col md:flex-row gap-6 items-center md:items-start mb-6 bg-[var(--bg-surface)] border border-[var(--border-color)]">
        <div className="avatar flex-shrink-0">
          <img src={`https://ui-avatars.com/api/?name=${profileId}&background=random&size=120`} alt="Avatar" className="rounded-full border-4 border-[var(--bg-surface-hover)] shadow-md" />
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl font-bold mb-2 flex items-center justify-center md:justify-start gap-2">
            {profileId} <Shield size={24} color="var(--danger-color)" />
          </h1>
          <p className="text-[var(--text-muted)] mb-3 text-sm">Đã tham gia: 01-01-2015 • Điểm thành tích: 9,999</p>
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            <span className="badge bg-[var(--primary-color)] text-white px-3 py-1 rounded text-xs font-medium">Quản trị viên</span>
            <span className="badge bg-[var(--success-color)] text-white px-3 py-1 rounded text-xs font-medium">Đã xác minh</span>
          </div>
        </div>
        
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <button className="btn btn-ghost border border-[var(--border-color)] hover:bg-[var(--bg-surface-hover)] justify-center">
            <Settings size={18} /> Cài đặt
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 bg-[var(--bg-surface)] border border-[var(--border-color)] col-span-1">
          <h3 className="border-b border-[var(--border-color)] pb-3 mb-4 font-semibold text-lg">Thống kê</h3>
          <ul className="flex flex-col gap-4 text-sm">
            <li className="flex justify-between items-center"><span className="flex items-center gap-2 text-[var(--text-secondary)]"><MessageSquare size={18}/> Bài viết:</span> <b className="text-[var(--text-primary)]">2,345</b></li>
            <li className="flex justify-between items-center"><span className="flex items-center gap-2 text-[var(--text-secondary)]"><Activity size={18}/> Lượt thích đã nhận:</span> <b className="text-[var(--text-primary)]">15,403</b></li>
            <li className="flex justify-between items-center"><span className="flex items-center gap-2 text-[var(--text-secondary)]"><Heart size={18}/> Đang theo dõi:</span> <b className="text-[var(--text-primary)]">12</b></li>
          </ul>
        </div>

        <div className="card p-6 bg-[var(--bg-surface)] border border-[var(--border-color)] col-span-1 md:col-span-2">
          <h3 className="border-b border-[var(--border-color)] pb-3 mb-4 font-semibold text-lg">Hoạt động gần đây</h3>
          <div className="flex flex-col gap-4">
            <div className="border-b border-dashed border-[var(--border-color)] pb-4">
              <div className="text-xs text-[var(--text-muted)] mb-1">Hôm nay lúc 09:20</div>
              <div className="text-[14px]">Đã bình luận trong chủ đề <Link href="/thread/1" className="font-semibold hover:text-[var(--primary-color)]">Tư vấn build PC 20 triệu</Link></div>
            </div>
            <div className="border-b border-dashed border-[var(--border-color)] pb-4">
              <div className="text-xs text-[var(--text-muted)] mb-1">Hôm qua lúc 15:30</div>
              <div className="text-[14px]">Đã tạo chủ đề <Link href="/thread/2" className="font-semibold hover:text-[var(--primary-color)]">[Nội quy] Cập nhật quy định mới năm 2026</Link></div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-muted)] mb-1">2 ngày trước</div>
              <div className="text-[14px]">Đã thích bài viết của <Link href="/profile/tech_guru" className="font-semibold hover:text-[var(--primary-color)]">tech_guru</Link></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
