"use client";

import { Ban, AlertTriangle } from 'lucide-react';

export default function BannedOverlay({ banReason, banExpiresAt, bannedAt }) {
  const expiryDate = banExpiresAt ? new Date(banExpiresAt) : null;
  const bannedDate = bannedAt ? new Date(bannedAt) : new Date();
  const isPermanent = !expiryDate;
  
  // Tính số ngày còn lại
  let daysLeft = null;
  if (expiryDate) {
    daysLeft = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) daysLeft = 0;
  }

  return (
    <div className="fixed inset-0 z-[99999] bg-gradient-to-b from-red-950 via-red-900 to-black flex items-center justify-center p-4" style={{ pointerEvents: 'all' }}>
      <div className="max-w-[500px] w-full text-center">
        {/* Icon */}
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-600/30 border-2 border-red-500 flex items-center justify-center animate-pulse">
          <Ban size={48} className="text-red-400" />
        </div>

        {/* Title */}
        <h1 className="text-[32px] font-bold text-white mb-2">
          Tài khoản đã bị khóa
        </h1>
        
        <p className="text-red-300 text-[16px] mb-8">
          Tài khoản của bạn đã bị quản trị viên khóa do vi phạm nội quy diễn đàn.
        </p>

        {/* Ban Details Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-red-500/30 rounded-xl p-6 text-left mb-6">
          <div className="flex flex-col gap-4">
            {/* Reason */}
            <div>
              <div className="text-red-400 text-[12px] uppercase font-bold mb-1 flex items-center gap-1">
                <AlertTriangle size={12} /> Lý do
              </div>
              <div className="text-white text-[15px] font-medium">
                {banReason || 'Vi phạm nội quy diễn đàn'}
              </div>
            </div>

            {/* Duration */}
            <div className="border-t border-red-500/20 pt-4">
              <div className="text-red-400 text-[12px] uppercase font-bold mb-1">Thời hạn</div>
              <div className="text-white text-[15px] font-medium">
                {isPermanent ? (
                  <span className="text-red-400 font-bold">Vĩnh viễn</span>
                ) : (
                  <span>
                    {daysLeft > 0 ? `Còn ${daysLeft} ngày` : 'Sắp hết hạn'} 
                    <span className="text-red-300 text-[13px] ml-2">
                      (đến {expiryDate.toLocaleDateString('vi-VN')})
                    </span>
                  </span>
                )}
              </div>
            </div>

            {/* Banned Date */}
            <div className="border-t border-red-500/20 pt-4">
              <div className="text-red-400 text-[12px] uppercase font-bold mb-1">Ngày bị khóa</div>
              <div className="text-white text-[14px]">
                {bannedDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-3 text-yellow-300 text-[13px]">
          ⚠️ Nếu bạn cho rằng đây là sai sót, vui lòng liên hệ quản trị viên qua email để được hỗ trợ.
        </div>
      </div>
    </div>
  );
}
