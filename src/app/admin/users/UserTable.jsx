"use client";

import { useState } from 'react';
import { Search, Ban } from 'lucide-react';
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
      <div className="p-3 border-b border-[var(--voz-border)] flex flex-col sm:flex-row justify-between gap-3 bg-[var(--voz-accent)]">
         <div className="relative">
            <input 
              type="text" 
              placeholder="Tìm kiếm theo tên hoặc email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-[6px] border border-[var(--voz-border)] bg-[var(--voz-surface)] text-[var(--voz-text)] rounded text-[13px] w-full sm:w-[260px] outline-none focus:border-blue-500" 
            />
            <Search className="absolute left-2.5 top-[8px] text-[var(--voz-text-muted)]" size={14} />
         </div>
         <div className="flex gap-1.5 items-center text-[11px]">
           {[
             { key: 'all', label: `Tất cả (${users.length})`, bg: 'bg-blue-600' },
             { key: 'Admin', label: 'Admin', bg: 'bg-red-500' },
             { key: 'Moderator', label: 'Moderator', bg: 'bg-blue-500' },
             { key: 'Member', label: 'Member', bg: 'bg-gray-500' },
           ].map(f => (
             <button 
               key={f.key}
               onClick={() => setFilterRole(f.key)}
               className={`px-2.5 py-1 rounded border transition font-medium ${filterRole === f.key ? `${f.bg} text-white border-transparent` : 'border-[var(--voz-border)] text-[var(--voz-text-muted)] hover:bg-[var(--voz-hover)]'}`}
             >{f.label}</button>
           ))}
         </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-[var(--voz-accent)] border-b border-[var(--voz-border)] text-[11px] uppercase text-[var(--voz-text-muted)] font-semibold">
              <th className="text-left px-4 py-2.5">Thành viên</th>
              <th className="text-left px-3 py-2.5 hidden md:table-cell">Email</th>
              <th className="text-center px-3 py-2.5 w-[80px]">Tham gia</th>
              <th className="text-center px-3 py-2.5 w-[60px]">Chủ đề</th>
              <th className="text-center px-3 py-2.5 w-[60px]">Bài viết</th>
              <th className="text-center px-3 py-2.5 w-[70px]">Reactions</th>
              <th className="text-center px-3 py-2.5 w-[80px]">Trạng thái</th>
              <th className="text-right px-4 py-2.5 w-[190px]">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--voz-border-light)]">
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-[var(--voz-text-muted)]">
                  Không tìm thấy user nào.
                </td>
              </tr>
            )}
            {filteredUsers.map(u => {
              const isAdmin = u.userGroups.some(g => g.name === 'Admin');
              const isMod = u.userGroups.some(g => g.name === 'Moderator');
              const roleName = isAdmin ? 'Admin' : isMod ? 'Moderator' : 'Member';
              const roleColor = isAdmin ? 'text-red-500' : isMod ? 'text-blue-500' : 'text-[var(--voz-text-muted)]';
              const joinDate = new Date(u.createdAt).toLocaleDateString('vi-VN');

              return (
                <tr key={u.id} className={`hover:bg-[var(--voz-hover)] transition-colors ${u.isBanned ? 'bg-red-500/5' : ''}`}>
                  {/* User info */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <img 
                        src={u.avatar || `https://ui-avatars.com/api/?name=${u.username}&background=random&size=80`} 
                        className="w-9 h-9 rounded-full shrink-0 object-cover" 
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[var(--voz-text)] truncate">{u.username}</span>
                          <span className={`text-[10px] font-bold ${roleColor}`}>{roleName}</span>
                        </div>
                        <div className="text-[11px] text-[var(--voz-text-muted)] truncate">{u.customTitle || 'Member'}</div>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-3 py-3 hidden md:table-cell">
                    <span className="text-[12px] text-[var(--voz-text-muted)] truncate block max-w-[180px]">{u.email}</span>
                  </td>

                  {/* Join Date */}
                  <td className="px-3 py-3 text-center text-[12px] text-[var(--voz-text-muted)]">{joinDate}</td>

                  {/* Threads */}
                  <td className="px-3 py-3 text-center font-semibold text-[var(--voz-text)]">{u._count?.threads ?? 0}</td>

                  {/* Posts */}
                  <td className="px-3 py-3 text-center font-semibold text-[var(--voz-text)]">{u._count?.posts ?? 0}</td>

                  {/* Reactions */}
                  <td className="px-3 py-3 text-center font-semibold text-[var(--voz-text)]">{u._count?.reactions ?? 0}</td>

                  {/* Status */}
                  <td className="px-3 py-3 text-center">
                    {u.isBanned ? (
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="inline-flex items-center gap-1 bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                          <Ban size={10} /> BAN
                        </span>
                        <span className="text-[10px] text-red-400 leading-tight">
                          {u.banExpiresAt ? new Date(u.banExpiresAt).toLocaleDateString('vi-VN') : 'Vĩnh viễn'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-emerald-500 text-[11px] font-medium">Hoạt động</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <UserRoleActions userId={u.id} username={u.username} currentRole={roleName} isBanned={u.isBanned} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Ban reason tooltip row - hiển thị dưới bảng nếu có user bị ban */}
      {filteredUsers.some(u => u.isBanned && u.banReason) && (
        <div className="border-t border-[var(--voz-border)] bg-red-500/5 px-4 py-2.5">
          <div className="text-[11px] text-red-400 font-semibold mb-1">Chi tiết ban:</div>
          {filteredUsers.filter(u => u.isBanned).map(u => (
            <div key={u.id} className="text-[12px] text-[var(--voz-text-muted)] flex gap-2 py-0.5">
              <span className="font-semibold text-[var(--voz-text)]">{u.username}:</span>
              <span>{u.banReason || '—'}</span>
              <span className="text-red-400">
                ({u.banExpiresAt ? `đến ${new Date(u.banExpiresAt).toLocaleDateString('vi-VN')}` : 'Vĩnh viễn'})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
