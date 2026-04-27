"use client";

import { useState } from 'react';
import { Search, MessageSquare, FileText, Heart, Calendar, Mail, Ban } from 'lucide-react';
import UserRoleActions from './UserRoleActions';

export default function UserTable({ users }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const filteredUsers = users.filter(u => {
    const isAdmin = u.userGroups.some(g => g.name === 'Admin');
    const isMod = u.userGroups.some(g => g.name === 'Moderator');
    const roleName = isAdmin ? 'Admin' : isMod ? 'Moderator' : 'Member';

    const matchesSearch = searchQuery === '' || 
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || roleName === filterRole;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="bg-[var(--voz-surface)] rounded-lg shadow-sm border border-[var(--voz-border)] overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-[var(--voz-border)] flex flex-col sm:flex-row justify-between gap-3 bg-[var(--voz-hover)]">
         <div className="relative">
            <input 
              type="text" 
              placeholder="Tìm kiếm theo tên hoặc email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-[var(--voz-border)] bg-[var(--voz-surface)] text-[var(--voz-text)] rounded-md text-sm w-full sm:w-[300px] outline-none focus:border-blue-500" 
            />
            <Search className="absolute left-3 top-[10px] text-[var(--voz-text-muted)]" size={16} />
         </div>
         <div className="flex gap-2 items-center text-xs flex-wrap">
           <button 
             onClick={() => setFilterRole('all')}
             className={`px-3 py-1 rounded-full border transition ${filterRole === 'all' ? 'bg-blue-600 text-white border-blue-600' : 'border-[var(--voz-border)] text-[var(--voz-text-muted)] hover:bg-[var(--voz-surface)]'}`}
           >Tất cả ({users.length})</button>
           <button 
             onClick={() => setFilterRole('Admin')}
             className={`px-3 py-1 rounded-full border transition ${filterRole === 'Admin' ? 'bg-red-500 text-white border-red-500' : 'border-[var(--voz-border)] text-[var(--voz-text-muted)] hover:bg-[var(--voz-surface)]'}`}
           >Admin</button>
           <button 
             onClick={() => setFilterRole('Moderator')}
             className={`px-3 py-1 rounded-full border transition ${filterRole === 'Moderator' ? 'bg-blue-500 text-white border-blue-500' : 'border-[var(--voz-border)] text-[var(--voz-text-muted)] hover:bg-[var(--voz-surface)]'}`}
           >Moderator</button>
           <button 
             onClick={() => setFilterRole('Member')}
             className={`px-3 py-1 rounded-full border transition ${filterRole === 'Member' ? 'bg-gray-500 text-white border-gray-500' : 'border-[var(--voz-border)] text-[var(--voz-text-muted)] hover:bg-[var(--voz-surface)]'}`}
           >Member</button>
         </div>
      </div>
      
      {searchQuery && (
        <div className="px-4 py-2 text-xs text-[var(--voz-text-muted)] bg-[var(--voz-accent)] border-b border-[var(--voz-border)]">
          Tìm thấy <strong>{filteredUsers.length}</strong> kết quả cho "{searchQuery}"
        </div>
      )}

      {/* User Cards */}
      <div className="divide-y divide-[var(--voz-border)]">
        {filteredUsers.length === 0 && (
          <div className="px-5 py-8 text-center text-[var(--voz-text-muted)]">
            Không tìm thấy user nào phù hợp.
          </div>
        )}
        {filteredUsers.map(u => {
          const isAdmin = u.userGroups.some(g => g.name === 'Admin');
          const isMod = u.userGroups.some(g => g.name === 'Moderator');
          const roleName = isAdmin ? 'Admin' : isMod ? 'Moderator' : 'Member';
          const roleColor = isAdmin ? 'bg-red-500' : isMod ? 'bg-blue-500' : 'bg-gray-400';
          const joinDate = new Date(u.createdAt).toLocaleDateString('vi-VN');
          
          const banExpiry = u.banExpiresAt 
            ? new Date(u.banExpiresAt).toLocaleDateString('vi-VN') 
            : 'Vĩnh viễn';

          return (
            <div key={u.id} className={`p-4 hover:bg-[var(--voz-hover)] transition-colors ${u.isBanned ? 'bg-red-50/50 dark:bg-red-950/10' : ''}`}>
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Avatar + Info */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.username}&background=random`} className="w-12 h-12 rounded-full shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[var(--voz-text)] text-[15px]">{u.username}</span>
                      <span className={`${roleColor} text-white px-2 py-0.5 rounded text-[10px] font-bold`}>
                        {roleName}
                      </span>
                      {u.isBanned && (
                        <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                          <Ban size={10} /> BANNED
                        </span>
                      )}
                    </div>
                    <div className="text-[12px] text-[var(--voz-text-muted)] mt-0.5">{u.customTitle || 'Member'}</div>
                    
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 mt-2 text-[12px]">
                      <div className="flex items-center gap-1.5 text-[var(--voz-text-muted)]">
                        <Mail size={12} />
                        <span className="truncate">{u.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[var(--voz-text-muted)]">
                        <Calendar size={12} />
                        <span>Tham gia: <strong className="text-[var(--voz-text)]">{joinDate}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[var(--voz-text-muted)]">
                        <FileText size={12} />
                        <span>Chủ đề: <strong className="text-[var(--voz-text)]">{u._count?.threads ?? 0}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[var(--voz-text-muted)]">
                        <MessageSquare size={12} />
                        <span>Bài viết: <strong className="text-[var(--voz-text)]">{u._count?.posts ?? 0}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[var(--voz-text-muted)]">
                        <Heart size={12} />
                        <span>Reactions: <strong className="text-[var(--voz-text)]">{u._count?.reactions ?? 0}</strong></span>
                      </div>
                      {u.isBanned && (
                        <>
                          <div className="flex items-center gap-1.5 text-red-500 col-span-2 sm:col-span-3">
                            <Ban size={12} />
                            <span>Lý do: <strong>{u.banReason || '—'}</strong> · Hết hạn: <strong>{banExpiry}</strong></span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="shrink-0 flex items-start">
                  <UserRoleActions userId={u.id} username={u.username} currentRole={roleName} isBanned={u.isBanned} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
