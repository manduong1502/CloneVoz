'use client';

import React, { useState } from 'react';
import { updateProfile } from '@/actions/userActions';
import Modal from '@/components/ui/Modal';
import { Settings } from 'lucide-react';

export default function EditProfileModal({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user.avatar || '');
  const [username, setUsername] = useState(user.username || '');
  const [isUploading, setIsUploading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const formData = new FormData(e.target);
      const res = await updateProfile(formData);
      
      if (res?.success) {
        setIsOpen(false);
      } else {
        alert(res?.error || "Có lỗi xảy ra");
      }
    } catch (err) {
      // NEXT_REDIRECT sẽ throw, bỏ qua
      if (!err?.digest?.startsWith?.('NEXT_REDIRECT')) {
        alert(err?.message || "Có lỗi xảy ra khi lưu.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        setAvatarUrl(data.url); // Tự động điền link vào ô input
      } else {
        alert("Upload thất bại!");
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ Cloudinary.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-[#f2930d] hover:bg-[#d88107] text-white px-4 py-2 font-medium text-[13px] rounded flex items-center gap-2 border-b-[3px] border-[#c07306] active:border-b-0 active:translate-y-[2px] transition-all"
      >
        <Settings size={16} /> Chỉnh sửa Hồ Sơ
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Cài Đặt Hồ Sơ Cá Nhân" width="550px">
        <div className="p-6 bg-[var(--voz-accent)]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input type="hidden" name="userId" value={user.id} />
            
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-[13px] text-[var(--voz-text)]">Tên hiển thị (Username)</label>
              <input 
                name="username" 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9._\u00C0-\u024F\u1E00-\u1EFF]/g, ''))}
                placeholder="Ví dụ: NguyenVanA, coolboy99..." 
                className="border border-[var(--voz-border)] bg-[var(--voz-surface)] text-[var(--voz-text)] rounded-[2px] p-2 focus:border-[var(--voz-link)] outline-none text-[13px]" 
                minLength={3}
                maxLength={30}
                required
              />
              <span className="text-[11px] text-[var(--voz-text-muted)]">3-30 ký tự. Chữ cái, số, dấu cách, dấu chấm và gạch dưới. Thay đổi sẽ cập nhật trên toàn bộ diễn đàn.</span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-[13px] text-[var(--voz-text)]">Link Ảnh Đại Diện (Avatar URL)</label>
              <div className="flex gap-2 items-center">
                 <input 
                   name="avatarUrl" 
                   type="url" 
                   value={avatarUrl}
                   onChange={(e) => setAvatarUrl(e.target.value)}
                   placeholder="https://imgur.com/your-image.png" 
                   className="flex-1 border border-[var(--voz-border)] bg-[var(--voz-surface)] text-[var(--voz-text)] rounded-[2px] p-2 focus:border-[var(--voz-link)] outline-none text-[13px]" 
                 />
                 <label className="voz-button cursor-pointer py-2 px-3 flex-shrink-0 text-center opacity-90 hover:opacity-100 min-w-[120px]">
                    {isUploading ? "Đang lên mây..." : "Tải ảnh lên"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                 </label>
              </div>
              <span className="text-[11px] text-[var(--voz-text-muted)]">Chỉ nhận link hình ảnh trực tiếp hoặc tải ảnh từ máy tính.</span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-[13px] text-[var(--voz-text)]">Bút Danh (Custom Title)</label>
              <input 
                name="customTitle" 
                type="text" 
                defaultValue={user.customTitle || ''} 
                placeholder="Ví dụ: Đại gia chân đất, Dân chơi phố huyện..." 
                className="border border-[var(--voz-border)] bg-[var(--voz-surface)] text-[var(--voz-text)] rounded-[2px] p-2 focus:border-[var(--voz-link)] outline-none text-[13px]" 
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-[13px] text-[var(--voz-text)]">Chữ Ký (Signature)</label>
              <textarea 
                name="signature" 
                rows="3"
                defaultValue={user.signature || ''} 
                placeholder="Mọi nội dung dưới này sẽ hiển thị dưới mỗi bài cmt của bạn." 
                className="border border-[var(--voz-border)] bg-[var(--voz-surface)] text-[var(--voz-text)] rounded-[2px] p-2 focus:border-[var(--voz-link)] outline-none text-[13px]" 
              />
               <span className="text-[11px] text-[var(--voz-text-muted)] italic">Hỗ trợ mã HTML cơ bản. Đã được bọc khử trùng XSS.</span>
            </div>

            <div className="mt-4 flex gap-3 justify-center border-t border-[var(--voz-border)] pt-4">
              <button 
                type="button" 
                onClick={() => setIsOpen(false)}
                className="bg-[var(--voz-border)] hover:bg-[var(--voz-border-light)] text-[var(--voz-text-strong)] px-4 py-2 font-medium text-[13px] rounded border-b-[3px] border-gray-400 active:border-b-0 active:translate-y-[2px] transition-all min-w-[120px]"
              >
                Hủy bỏ
              </button>
              <button 
                type="submit" 
                disabled={isLoading}
                className="bg-[#183254] hover:bg-[#134970] text-white px-4 py-2 font-medium text-[13px] rounded border-b-[3px] border-[#0e3b5e] active:border-b-0 active:translate-y-[2px] transition-all min-w-[120px]"
              >
                {isLoading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
