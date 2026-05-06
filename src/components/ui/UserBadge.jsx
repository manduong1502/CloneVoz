import React from 'react';

export default function UserBadge({ userGroups, className = '' }) {
  if (!userGroups || !Array.isArray(userGroups) || userGroups.length === 0) return null;
  
  const isAdmin = userGroups.some(g => g.name === 'Admin');
  const isMod = userGroups.some(g => g.name === 'Moderator');
  
  if (isAdmin) {
    return (
      <span className={`inline-flex items-center justify-center text-[10px] font-bold bg-red-500 text-white px-2 py-[1.5px] rounded-sm shadow-sm border border-transparent select-none leading-none h-[22px] ${className}`} title="Quản trị viên">
        ADMIN
      </span>
    );
  }
  
  if (isMod) {
    return (
      <span className={`inline-flex items-center justify-center text-[10px] font-bold bg-blue-500 text-white px-2 py-[1.5px] rounded-sm shadow-sm border border-transparent select-none leading-none h-[22px] ${className}`} title="Điều hành viên">
        MOD
      </span>
    );
  }
  
  return null;
}
