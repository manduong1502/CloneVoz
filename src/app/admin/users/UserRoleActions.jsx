"use client";

import { useTransition, useState } from 'react';
import { Shield, ShieldCheck, User, Ban, ChevronDown } from 'lucide-react';
import { setUserRole, banUser } from '@/actions/adminActions';

export default function UserRoleActions({ userId, username, currentRole, isBanned }) {
  const [isPending, startTransition] = useTransition();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [role, setRole] = useState(currentRole);
  const [banned, setBanned] = useState(isBanned);
  const [banDuration, setBanDuration] = useState('7days');
  const [banReason, setBanReason] = useState('');

  const handleRoleChange = (newRole) => {
    if (!confirm(`Bạn muốn đặt ${username} thành ${newRole}?`)) return;
    setShowDropdown(false);
    startTransition(async () => {
      const res = await setUserRole(userId, newRole);
      if (res.success) setRole(newRole);
    });
  };

  const handleBan = () => {
    if (banned) {
      // Gỡ ban
      if (!confirm(`Gỡ ban cho ${username}?`)) return;
      startTransition(async () => {
        const res = await banUser(userId);
        if (res.success) setBanned(false);
      });
    } else {
      setShowBanDialog(true);
    }
  };

  const handleConfirmBan = () => {
    startTransition(async () => {
      const res = await banUser(userId, banDuration, banReason || 'Vi phạm nội quy diễn đàn');
      if (res.success) {
        setBanned(true);
        setShowBanDialog(false);
        setBanReason('');
      }
    });
  };

  const roleOptions = [
    { name: 'Admin', icon: <ShieldCheck size={14} />, color: 'text-red-500' },
    { name: 'Moderator', icon: <Shield size={14} />, color: 'text-blue-500' },
    { name: 'Member', icon: <User size={14} />, color: 'text-gray-500' },
  ];

  return (
    <>
      <div className="flex justify-end gap-2 items-center" style={{ opacity: isPending ? 0.5 : 1 }}>
        {/* Role Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-1 px-3 py-[6px] text-xs border border-[var(--voz-border)] rounded-md hover:bg-[var(--voz-hover)] transition bg-[var(--voz-surface)] text-[var(--voz-text)]"
            disabled={isPending}
          >
            {role} <ChevronDown size={12} />
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 top-full mt-1 bg-[var(--voz-surface)] border border-[var(--voz-border)] rounded-md shadow-lg z-50 min-w-[150px] overflow-hidden">
              {roleOptions.map(opt => (
                <button
                  key={opt.name}
                  onClick={() => handleRoleChange(opt.name)}
                  className={`flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-[var(--voz-hover)] transition text-left ${role === opt.name ? 'bg-[var(--voz-accent)] font-bold' : ''} ${opt.color}`}
                >
                  {opt.icon} {opt.name}
                  {role === opt.name && <span className="ml-auto">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Ban Button */}
        <button
          onClick={handleBan}
          disabled={isPending}
          className={`flex items-center gap-1 px-3 py-[6px] text-xs border rounded-md transition ${
            banned 
              ? 'border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20' 
              : 'border-red-300 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20'
          }`}
        >
          <Ban size={14} /> {banned ? 'Gỡ ban' : 'Ban'}
        </button>
      </div>

      {/* Ban Dialog Overlay */}
      {showBanDialog && (
        <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4" onClick={() => setShowBanDialog(false)}>
          <div 
            className="bg-[var(--voz-surface)] rounded-lg border border-[var(--voz-border)] shadow-2xl w-full max-w-[420px] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-red-600 px-5 py-3 text-white font-bold flex items-center gap-2">
              <Ban size={18} /> Ban thành viên: {username}
            </div>
            
            <div className="p-5 flex flex-col gap-4">
              {/* Duration */}
              <div>
                <label className="text-[13px] font-semibold mb-2 block text-[var(--voz-text)]">Thời hạn ban</label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: '7days', label: '7 ngày' },
                    { value: '30days', label: '30 ngày' },
                    { value: 'permanent', label: 'Vĩnh viễn' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setBanDuration(opt.value)}
                      className={`px-4 py-2 text-xs font-medium rounded-md border transition ${
                        banDuration === opt.value
                          ? opt.value === 'permanent' 
                            ? 'bg-red-600 text-white border-red-600' 
                            : 'bg-blue-600 text-white border-blue-600'
                          : 'border-[var(--voz-border)] text-[var(--voz-text)] hover:bg-[var(--voz-hover)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="text-[13px] font-semibold mb-2 block text-[var(--voz-text)]">Lý do ban</label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Nhập lý do ban (VD: Spam, Xúc phạm thành viên, Vi phạm nội quy...)"
                  className="w-full border border-[var(--voz-border)] bg-[var(--voz-bg)] text-[var(--voz-text)] px-3 py-2 rounded-md text-sm outline-none focus:border-red-400 h-20 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-2 border-t border-[var(--voz-border)]">
                <button
                  onClick={() => setShowBanDialog(false)}
                  className="px-4 py-2 text-xs border border-[var(--voz-border)] rounded-md text-[var(--voz-text)] hover:bg-[var(--voz-hover)] transition"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmBan}
                  disabled={isPending}
                  className="px-4 py-2 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 transition font-bold disabled:opacity-50"
                >
                  {isPending ? 'Đang xử lý...' : `🚫 Xác nhận Ban ${banDuration === 'permanent' ? 'vĩnh viễn' : banDuration === '7days' ? '7 ngày' : '30 ngày'}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
