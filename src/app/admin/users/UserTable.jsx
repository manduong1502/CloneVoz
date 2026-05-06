"use client";

import { useState } from 'react';
import { Search, Ban, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import UserRoleActions from './UserRoleActions';

const ITEMS_PER_PAGE = 20;

export default function UserTable({ users }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('join_asc');

  // Map: userId -> số thứ tự tham gia (dựa vào thứ tự gốc từ server, đã sắp xếp createdAt asc)
  const joinOrderMap = {};
  users.forEach((u, i) => { joinOrderMap[u.id] = i + 1; });

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

  // Sort logic
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    switch (sortBy) {
      case 'join_asc': return new Date(a.createdAt) - new Date(b.createdAt);
      case 'join_desc': return new Date(b.createdAt) - new Date(a.createdAt);
      case 'name_asc': return (a.username || '').localeCompare(b.username || '');
      case 'posts_desc': return ((b._count?.posts ?? 0) + (b._count?.threads ?? 0)) - ((a._count?.posts ?? 0) + (a._count?.threads ?? 0));
      case 'points_desc': return (b.points ?? 0) - (a.points ?? 0);
      default: return 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = sortedUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset page when filter/search changes
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };
  const handleFilterChange = (key) => {
    setFilterRole(key);
    setCurrentPage(1);
  };
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="bg-[var(--voz-surface)] rounded-lg shadow-sm border border-[var(--voz-border)] overflow-hidden">
      {/* Toolbar */}
      <div className="p-3 border-b border-[var(--voz-border)] flex flex-col sm:flex-row justify-between gap-3 bg-[var(--voz-accent)]">
         <div className="relative">
            <input 
              type="text" 
              placeholder="Tìm kiếm theo tên hoặc email..." 
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-8 pr-3 py-[6px] border border-[var(--voz-border)] bg-[var(--voz-surface)] text-[var(--voz-text)] rounded text-[13px] w-full sm:w-[260px] outline-none focus:border-blue-500" 
            />
            <Search className="absolute left-2.5 top-[8px] text-[var(--voz-text-muted)]" size={14} />
         </div>
         <div className="flex gap-2 items-center">
           <div className="flex gap-1.5 items-center text-[11px]">
             {[
               { key: 'all', label: `Tất cả (${users.length})`, bg: 'bg-blue-600' },
               { key: 'Admin', label: 'Admin', bg: 'bg-red-500' },
               { key: 'Moderator', label: 'Moderator', bg: 'bg-blue-500' },
               { key: 'Member', label: 'Member', bg: 'bg-gray-500' },
             ].map(f => (
               <button 
                 key={f.key}
                 onClick={() => handleFilterChange(f.key)}
                 className={`px-2.5 py-1 rounded border transition font-medium ${filterRole === f.key ? `${f.bg} text-white border-transparent` : 'border-[var(--voz-border)] text-[var(--voz-text-muted)] hover:bg-[var(--voz-hover)]'}`}
               >{f.label}</button>
             ))}
           </div>
           <select 
             value={sortBy} 
             onChange={handleSortChange}
             className="text-[11px] px-2 py-1 rounded border border-[var(--voz-border)] bg-[var(--voz-surface)] text-[var(--voz-text)] outline-none cursor-pointer"
           >
             <option value="join_asc">Cũ nhất</option>
             <option value="join_desc">Mới nhất</option>
             <option value="name_asc">Tên A-Z</option>
             <option value="posts_desc">Nhiều bài nhất</option>
             <option value="points_desc">Nhiều điểm nhất</option>
           </select>
         </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[13px] table-fixed">
          <colgroup>
            <col style={{ width: '45px' }} />
            <col style={{ width: '200px' }} />
            <col className="hidden md:table-column" style={{ width: '180px' }} />
            <col style={{ width: '90px' }} />
            <col style={{ width: '70px' }} />
            <col style={{ width: '70px' }} />
            <col style={{ width: '80px' }} />
            <col style={{ width: '80px' }} />
            <col style={{ width: '90px' }} />
            <col style={{ width: '180px' }} />
          </colgroup>
          <thead>
            <tr className="bg-[var(--voz-accent)] border-b border-[var(--voz-border)] text-[11px] uppercase text-[var(--voz-text-muted)] font-semibold">
              <th className="text-center px-2 py-2.5">#</th>
              <th className="text-left px-4 py-2.5">Thành viên</th>
              <th className="text-left px-3 py-2.5 hidden md:table-cell">Email</th>
              <th className="text-center px-3 py-2.5">Tham gia</th>
              <th className="text-center px-3 py-2.5">Chủ đề</th>
              <th className="text-center px-3 py-2.5">Bình luận</th>
              <th className="text-center px-3 py-2.5">Công đức</th>
              <th className="text-center px-3 py-2.5">Reactions</th>
              <th className="text-center px-3 py-2.5">Trạng thái</th>
              <th className="text-right px-4 py-2.5">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--voz-border-light)]">
            {paginatedUsers.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-[var(--voz-text-muted)]">
                  Không tìm thấy user nào.
                </td>
              </tr>
            )}
            {paginatedUsers.map((u, index) => {
              const isAdmin = u.userGroups.some(g => g.name === 'Admin');
              const isMod = u.userGroups.some(g => g.name === 'Moderator');
              const roleName = isAdmin ? 'Admin' : isMod ? 'Moderator' : 'Member';
              const roleColor = isAdmin ? 'text-red-500' : isMod ? 'text-blue-500' : 'text-[var(--voz-text-muted)]';
              const joinDate = new Date(u.createdAt).toLocaleDateString('vi-VN');
              const rowNumber = startIndex + index + 1;

              const isBanExpired = u.banExpiresAt ? new Date(u.banExpiresAt).getTime() <= Date.now() : false;
              const isActuallyBanned = u.isBanned && !isBanExpired;

              return (
                <tr key={u.id} className={`hover:bg-[var(--voz-hover)] transition-colors ${isActuallyBanned ? 'bg-red-500/5' : ''}`}>
                  {/* Row number = số thứ tự tham gia cố định */}
                  <td className="px-2 py-3 text-center text-[12px] text-[var(--voz-text-muted)] font-medium">#{joinOrderMap[u.id]}</td>

                  {/* User info */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Link href={`/profile/${u.username}`}>
                        <img 
                          src={u.avatar || `https://ui-avatars.com/api/?name=${u.username}&background=random&size=80`} 
                          className="w-9 h-9 rounded-full shrink-0 object-cover hover:ring-2 hover:ring-blue-500 transition" 
                        />
                      </Link>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Link href={`/profile/${u.username}`} className="font-bold text-[var(--voz-link)] hover:underline truncate">
                            {u.username}
                          </Link>
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

                  {/* Công đức */}
                  <td className="px-3 py-3 text-center font-semibold text-[var(--voz-text)]">{u.points ?? 0}</td>

                  {/* Reactions */}
                  <td className="px-3 py-3 text-center font-semibold text-[var(--voz-text)]">{u._count?.reactions ?? 0}</td>

                  {/* Status */}
                  <td className="px-3 py-3 text-center">
                    {isActuallyBanned ? (
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
                    <UserRoleActions userId={u.id} username={u.username} currentRole={roleName} isBanned={isActuallyBanned} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="border-t border-[var(--voz-border)] bg-[var(--voz-accent)] px-4 py-2.5 flex justify-between items-center">
          <span className="text-[12px] text-[var(--voz-text-muted)]">
            Hiển thị {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, sortedUsers.length)} / {sortedUsers.length} thành viên
          </span>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-[var(--voz-border)] hover:bg-[var(--voz-surface)] disabled:opacity-30 transition"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-2.5 py-1 rounded text-[12px] font-medium transition ${currentPage === page ? 'bg-blue-600 text-white' : 'border border-[var(--voz-border)] text-[var(--voz-text-muted)] hover:bg-[var(--voz-surface)]'}`}
              >
                {page}
              </button>
            ))}
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border border-[var(--voz-border)] hover:bg-[var(--voz-surface)] disabled:opacity-30 transition"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Ban reason tooltip row */}
      {filteredUsers.some(u => {
        const isBanExpired = u.banExpiresAt ? new Date(u.banExpiresAt).getTime() <= Date.now() : false;
        return u.isBanned && !isBanExpired && u.banReason;
      }) && (
        <div className="border-t border-[var(--voz-border)] bg-red-500/5 px-4 py-2.5">
          <div className="text-[11px] text-red-400 font-semibold mb-1">Chi tiết ban:</div>
          {filteredUsers.filter(u => {
            const isBanExpired = u.banExpiresAt ? new Date(u.banExpiresAt).getTime() <= Date.now() : false;
            return u.isBanned && !isBanExpired;
          }).map(u => (
            <div key={u.id} className="text-[12px] text-[var(--voz-text-muted)] flex gap-2 py-0.5">
              <Link href={`/profile/${u.username}`} className="font-semibold text-[var(--voz-link)] hover:underline">{u.username}:</Link>
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
