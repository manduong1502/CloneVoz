"use client";

import { useState } from 'react';
import { Search } from 'lucide-react';
import UserRoleActions from './UserRoleActions';

export default function UserTable({ users }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all'); // all, Admin, Moderator, Member

  // Filter users
  const filteredUsers = users.filter(u => {
    const isAdmin = u.userGroups.some(g => g.name === 'Admin');
    const isMod = u.userGroups.some(g => g.name === 'Moderator');
    const roleName = isAdmin ? 'Admin' : isMod ? 'Moderator' : 'Member';

    // Search filter
    const matchesSearch = searchQuery === '' || 
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());

    // Role filter
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
              className="pl-9 pr-4 py-2 border border-[var(--voz-border)] bg-[var(--voz-surface)] text-[var(--voz-text)] rounded-md text-sm w-[300px] outline-none focus:border-blue-500" 
            />
            <Search className="absolute left-3 top-[10px] text-[var(--voz-text-muted)]" size={16} />
         </div>
         <div className="flex gap-2 items-center text-xs">
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
      
      {/* Results count */}
      {searchQuery && (
        <div className="px-4 py-2 text-xs text-[var(--voz-text-muted)] bg-[var(--voz-accent)] border-b border-[var(--voz-border)]">
          Tìm thấy <strong>{filteredUsers.length}</strong> kết quả cho "{searchQuery}"
        </div>
      )}

      {/* Table */}
      <table className="w-full text-sm text-left">
         <thead className="bg-[var(--voz-surface)] text-[var(--voz-text-muted)] font-medium border-b border-[var(--voz-border)] uppercase text-xs">
            <tr>
               <th className="px-5 py-3">User</th>
               <th className="px-5 py-3">Email</th>
               <th className="px-5 py-3">Vai trò</th>
               <th className="px-5 py-3">Stats</th>
               <th className="px-5 py-3">Trạng thái</th>
               <th className="px-5 py-3 text-right">Hành động</th>
            </tr>
         </thead>
         <tbody className="divide-y divide-[var(--voz-border)] text-[var(--voz-text)]">
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan="6" className="px-5 py-8 text-center text-[var(--voz-text-muted)]">
                  Không tìm thấy user nào phù hợp.
                </td>
              </tr>
            )}
            {filteredUsers.map(u => {
              const isAdmin = u.userGroups.some(g => g.name === 'Admin');
              const isMod = u.userGroups.some(g => g.name === 'Moderator');
              const roleName = isAdmin ? 'Admin' : isMod ? 'Moderator' : 'Member';
              const roleColor = isAdmin ? 'bg-red-500' : isMod ? 'bg-blue-500' : 'bg-gray-400';

              return (
                <tr key={u.id} className="hover:bg-[var(--voz-hover)] transition-colors">
                 <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                       <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.username}`} className="w-10 h-10 rounded-full" />
                       <div>
                          <div className="font-semibold text-[var(--voz-text)]">{u.username}</div>
                          <div className="text-xs text-[var(--voz-text-muted)]">{u.customTitle || 'Member'}</div>
                       </div>
                    </div>
                 </td>
                 <td className="px-5 py-4 text-xs">{u.email}</td>
                 <td className="px-5 py-4">
                    <span className={`${roleColor} text-white px-2 py-1 rounded text-xs font-bold`}>
                      {roleName}
                    </span>
                 </td>
                 <td className="px-5 py-4">
                    <div className="text-xs space-y-[2px]">
                       <div>Chủ đề: <span className="font-medium text-[var(--voz-text)]">{u._count?.threads ?? u.messageCount ?? 0}</span></div>
                       <div>Bài viết: <span className="font-medium text-[var(--voz-text)]">{u._count?.posts ?? 0}</span></div>
                       <div>Reactions: <span className="font-medium text-[var(--voz-text)]">{u._count?.reactions ?? u.reactionScore ?? 0}</span></div>
                       <div className="text-[var(--voz-text-muted)]">Tham gia: {new Date(u.createdAt).toLocaleDateString('vi-VN')}</div>
                    </div>
                 </td>
                 <td className="px-5 py-4">
                   {u.isBanned ? (
                     <span className="text-red-500 text-xs font-bold">🚫 Đã ban</span>
                   ) : (
                     <span className="text-emerald-500 text-xs">✓ Hoạt động</span>
                   )}
                 </td>
                 <td className="px-5 py-4 text-right">
                    <UserRoleActions userId={u.id} username={u.username} currentRole={roleName} isBanned={u.isBanned} />
                 </td>
              </tr>
              );
            })}
         </tbody>
      </table>
    </div>
  );
}
