import { prisma } from '@/lib/prisma';
import { Search, Ban, Edit2 } from 'lucide-react';

export default async function AdminUsers() {
  const users = await prisma.user.findMany({
    include: { userGroups: true }
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Users</h1>
          <p className="text-sm text-[var(--voz-text-muted)] mt-1">Manage all registered users in the database.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">Create New User</button>
      </div>
      
      <div className="bg-[var(--voz-surface)] rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex justify-between bg-gray-50">
           <div className="relative">
              <input type="text" placeholder="Search by username..." className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm w-[250px] outline-none focus:border-blue-500" />
              <Search className="absolute left-3 top-[10px] text-gray-400" size={16} />
           </div>
        </div>
        
        {/* Table */}
        <table className="w-full text-sm text-left">
           <thead className="bg-[#f8fafc] text-[var(--voz-text-muted)] font-medium border-b border-[var(--voz-border)] uppercase text-xs">
              <tr>
                 <th className="px-5 py-3">User</th>
                 <th className="px-5 py-3">Email</th>
                 <th className="px-5 py-3">Group</th>
                 <th className="px-5 py-3">Stats</th>
                 <th className="px-5 py-3 text-right">Actions</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-gray-100 text-gray-600">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                   <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                         <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.username}`} className="w-10 h-10 rounded-full" />
                         <div>
                            <div className="font-semibold text-gray-800">{u.username}</div>
                            <div className="text-xs text-[var(--voz-text-muted)]">{u.customTitle}</div>
                         </div>
                      </div>
                   </td>
                   <td className="px-5 py-4">{u.email}</td>
                   <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                         {u.userGroups.map(g => (
                            <span key={g.id} className="bg-slate-200 text-slate-700 px-2 py-1 rounded text-xs font-medium">{g.name}</span>
                         ))}
                      </div>
                   </td>
                   <td className="px-5 py-4">
                      <div className="text-xs">
                         <div>Posts: {u.messageCount}</div>
                         <div>Reactions: {u.reactionScore}</div>
                      </div>
                   </td>
                   <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                         <button className="p-2 text-slate-400 hover:text-blue-600 bg-[var(--voz-surface)] hover:bg-blue-50 border border-slate-200 rounded transition"><Edit2 size={16} /></button>
                         <button className="p-2 text-slate-400 hover:text-red-600 bg-[var(--voz-surface)] hover:bg-red-50 border border-slate-200 rounded transition"><Ban size={16} /></button>
                      </div>
                   </td>
                </tr>
              ))}
           </tbody>
        </table>
      </div>
    </div>
  );
}
