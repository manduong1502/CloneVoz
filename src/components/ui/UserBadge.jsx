import React from 'react';

export default function UserBadge({ userGroups }) {
  if (!userGroups || !Array.isArray(userGroups) || userGroups.length === 0) return null;
  
  const isAdmin = userGroups.some(g => g.name === 'Admin');
  const isMod = userGroups.some(g => g.name === 'Moderator');
  
  if (isAdmin) {
    return (
      <span className="inline-block text-[9px] font-bold bg-red-500 text-white px-1.5 py-[1px] rounded ml-1 align-text-bottom leading-tight" title="Quản trị viên">
        ADMIN
      </span>
    );
  }
  
  if (isMod) {
    return (
      <span className="inline-block text-[9px] font-bold bg-blue-500 text-white px-1.5 py-[1px] rounded ml-1 align-text-bottom leading-tight" title="Điều hành viên">
        MOD
      </span>
    );
  }
  
  return null;
}
