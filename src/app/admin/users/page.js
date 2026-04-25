import { prisma } from '@/lib/prisma';
import { Search } from 'lucide-react';
import UserRoleActions from './UserRoleActions';

export default async function AdminUsers() {
  const users = await prisma.user.findMany({
    include: { userGroups: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--voz-text)]">Users & Groups</h1>
          <p className="text-sm text-[var(--voz-text-muted)] mt-1">Quản lý thành viên và phân quyền.</p>
        </div>
      </div>
      
      <div className="bg-[var(--voz-surface)] rounded-lg shadow-sm border border-[var(--voz-border)] overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-[var(--voz-border)] flex justify-between bg-[var(--voz-hover)]">
           <div className="relative">
              <input type="text" placeholder="Search by username..." className="pl-9 pr-4 py-2 border border-[var(--voz-border)] bg-[var(--voz-surface)] text-[var(--voz-text)] rounded-md text-sm w-[250px] outline-none focus:border-blue-500" />
              <Search className="absolute left-3 top-[10px] text-[var(--voz-text-muted)]" size={16} />
           </div>
           <div className="flex gap-2 text-xs text-[var(--voz-text-muted)] items-center">
             <span className="inline-block w-3 h-3 bg-red-500 rounded-full"></span> Admin
             <span className="inline-block w-3 h-3 bg-blue-500 rounded-full ml-2"></span> Moderator
             <span className="inline-block w-3 h-3 bg-gray-400 rounded-full ml-2"></span> Member
           </div>
        </div>
        
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
              {users.map(u => {
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
                      <div className="text-xs">
                         <div>Bài viết: {u.messageCount}</div>
                         <div>Điểm: {u.reactionScore}</div>
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
    </div>
  );
}
