import { prisma } from '@/lib/prisma';
import { Users, FileText, MessageSquare, Layout } from 'lucide-react';

export default async function AdminDashboard() {
  const usersCount = await prisma.user.count();
  const threadsCount = await prisma.thread.count();
  const postsCount = await prisma.post.count();
  const nodesCount = await prisma.node.count();

  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-[var(--voz-text)]">Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="bg-[var(--voz-surface)] rounded-lg shadow-sm border border-[var(--voz-border)] p-5 flex items-center justify-between">
            <div>
               <p className="text-sm text-[var(--voz-text-muted)] font-medium mb-1">Tổng thành viên</p>
               <h3 className="text-2xl font-bold text-[var(--voz-text)]">{usersCount}</h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
               <Users size={24} />
            </div>
         </div>
         <div className="bg-[var(--voz-surface)] rounded-lg shadow-sm border border-[var(--voz-border)] p-5 flex items-center justify-between">
            <div>
               <p className="text-sm text-[var(--voz-text-muted)] font-medium mb-1">Tổng chủ đề</p>
               <h3 className="text-2xl font-bold text-[var(--voz-text)]">{threadsCount}</h3>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
               <FileText size={24} />
            </div>
         </div>
         <div className="bg-[var(--voz-surface)] rounded-lg shadow-sm border border-[var(--voz-border)] p-5 flex items-center justify-between">
            <div>
               <p className="text-sm text-[var(--voz-text-muted)] font-medium mb-1">Tổng bài viết</p>
               <h3 className="text-2xl font-bold text-[var(--voz-text)]">{postsCount}</h3>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
               <MessageSquare size={24} />
            </div>
         </div>
         <div className="bg-[var(--voz-surface)] rounded-lg shadow-sm border border-[var(--voz-border)] p-5 flex items-center justify-between">
            <div>
               <p className="text-sm text-[var(--voz-text-muted)] font-medium mb-1">Chuyên mục</p>
               <h3 className="text-2xl font-bold text-[var(--voz-text)]">{nodesCount}</h3>
            </div>
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
               <Layout size={24} />
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
         {/* Recent Users Table */}
         <div className="bg-[var(--voz-surface)] rounded-lg shadow-sm border border-[var(--voz-border)] overflow-hidden">
            <div className="bg-[var(--voz-hover)] border-b border-[var(--voz-border)] px-5 py-3">
               <h3 className="font-semibold text-[var(--voz-text)]">Latest Registered Users</h3>
            </div>
            <div className="p-0">
               <table className="w-full text-sm text-left">
                  <thead className="bg-[var(--voz-surface)] text-[var(--voz-text-muted)] font-medium border-b border-[var(--voz-border)]">
                     <tr>
                        <th className="px-5 py-3">USERNAME</th>
                        <th className="px-5 py-3">GROUP</th>
                        <th className="px-5 py-3">JOINED</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--voz-border)] text-[var(--voz-text)]">
                     {recentUsers.map(u => (
                       <tr key={u.id} className="hover:bg-[var(--voz-hover)]">
                          <td className="px-5 py-3 font-medium text-[var(--voz-text)]">{u.username}</td>
                          <td className="px-5 py-3">{u.customTitle || "Member"}</td>
                          <td className="px-5 py-3">{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
    </div>
  );
}
