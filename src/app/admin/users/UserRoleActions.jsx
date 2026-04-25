"use client";

import { useTransition, useState } from 'react';
import { Shield, ShieldCheck, User, Ban, ChevronDown } from 'lucide-react';
import { setUserRole, banUser } from '@/actions/adminActions';

export default function UserRoleActions({ userId, username, currentRole, isBanned }) {
  const [isPending, startTransition] = useTransition();
  const [showDropdown, setShowDropdown] = useState(false);
  const [role, setRole] = useState(currentRole);
  const [banned, setBanned] = useState(isBanned);

  const handleRoleChange = (newRole) => {
    if (!confirm(`Bạn muốn đặt ${username} thành ${newRole}?`)) return;
    setShowDropdown(false);
    startTransition(async () => {
      const res = await setUserRole(userId, newRole);
      if (res.success) setRole(newRole);
    });
  };

  const handleBan = () => {
    const action = banned ? 'GỠ BAN' : 'BAN';
    if (!confirm(`Bạn muốn ${action} user ${username}?`)) return;
    startTransition(async () => {
      const res = await banUser(userId);
      if (res.success) setBanned(res.isBanned);
    });
  };

  const roleOptions = [
    { name: 'Admin', icon: <ShieldCheck size={14} />, color: 'text-red-500' },
    { name: 'Moderator', icon: <Shield size={14} />, color: 'text-blue-500' },
    { name: 'Member', icon: <User size={14} />, color: 'text-gray-500' },
  ];

  return (
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
            ? 'border-emerald-500 text-emerald-600 hover:bg-emerald-50' 
            : 'border-red-300 text-red-500 hover:bg-red-50'
        }`}
      >
        <Ban size={14} /> {banned ? 'Gỡ ban' : 'Ban'}
      </button>
    </div>
  );
}
