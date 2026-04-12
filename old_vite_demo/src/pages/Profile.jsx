import React from 'react';
import { Settings, Shield, Activity, MessageSquare, Heart } from 'lucide-react';

const Profile = () => {
  return (
    <div className="profile-page">
      <div className="card profile-header" style={{ padding: '24px', display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '24px' }}>
        <img src="https://ui-avatars.com/api/?name=Admin&background=random&size=120" alt="Avatar" style={{ borderRadius: '50%' }} />
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '28px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Admin <Shield size={20} color="var(--danger-color)" />
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>Đã tham gia: 01-01-2015 • Điểm thành tích: 9,999</p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span className="badge" style={{ padding: '4px 8px', backgroundColor: 'var(--primary-color)', color: '#fff', borderRadius: '4px', fontSize: '12px' }}>Quản trị viên</span>
            <span className="badge" style={{ padding: '4px 8px', backgroundColor: 'var(--success-color)', color: '#fff', borderRadius: '4px', fontSize: '12px' }}>Đã xác minh</span>
          </div>
        </div>
        <div>
          <button className="btn btn-ghost" style={{ border: '1px solid var(--border-color)' }}>
            <Settings size={18} /> Cài đặt
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>Thống kê</h3>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <li style={{ display: 'flex', justifyContent: 'space-between' }}><span className="flex-center" style={{gap: '8px'}}><MessageSquare size={16}/> Bài viết:</span> <b>2,345</b></li>
            <li style={{ display: 'flex', justifyContent: 'space-between' }}><span className="flex-center" style={{gap: '8px'}}><Activity size={16}/> Lượt thích đã nhận:</span> <b>15,403</b></li>
            <li style={{ display: 'flex', justifyContent: 'space-between' }}><span className="flex-center" style={{gap: '8px'}}><Heart size={16}/> Đang theo dõi:</span> <b>12</b></li>
          </ul>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>Hoạt động gần đây</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ borderBottom: '1px dashed var(--border-color)', paddingBottom: '12px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Hôm nay lúc 09:20</div>
              <div style={{ marginTop: '4px' }}>Đã bình luận trong chủ đề <b>Tư vấn build PC 20 triệu</b></div>
            </div>
            <div style={{ borderBottom: '1px dashed var(--border-color)', paddingBottom: '12px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Hôm qua lúc 15:30</div>
              <div style={{ marginTop: '4px' }}>Đã tạo chủ đề <b>[Nội quy] Cập nhật quy định mới năm 2026</b></div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>2 ngày trước</div>
              <div style={{ marginTop: '4px' }}>Đã thích bài viết của <b>tech_guru</b></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
