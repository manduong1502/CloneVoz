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
      <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 flex items-center justify-between">
            <div>
               <p className="text-sm text-gray-500 font-medium mb-1">Total Users</p>
               <h3 className="text-2xl font-bold text-gray-800">{usersCount}</h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
               <Users size={24} />
            </div>
         </div>
         <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 flex items-center justify-between">
            <div>
               <p className="text-sm text-gray-500 font-medium mb-1">Total Threads</p>
               <h3 className="text-2xl font-bold text-gray-800">{threadsCount}</h3>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
               <FileText size={24} />
            </div>
         </div>
         <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 flex items-center justify-between">
            <div>
               <p className="text-sm text-gray-500 font-medium mb-1">Total Posts</p>
               <h3 className="text-2xl font-bold text-gray-800">{postsCount}</h3>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
               <MessageSquare size={24} />
            </div>
         </div>
         <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 flex items-center justify-between">
            <div>
               <p className="text-sm text-gray-500 font-medium mb-1">Nodes (Rooms)</p>
               <h3 className="text-2xl font-bold text-gray-800">{nodesCount}</h3>
            </div>
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
               <Layout size={24} />
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
         {/* Recent Users Table */}
         <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-100 px-5 py-3">
               <h3 className="font-semibold text-gray-700">Latest Registered Users</h3>
            </div>
            <div className="p-0">
               <table className="w-full text-sm text-left">
                  <thead className="bg-white text-gray-400 font-medium border-b border-gray-100">
                     <tr>
                        <th className="px-5 py-3">USERNAME</th>
                        <th className="px-5 py-3">GROUP</th>
                        <th className="px-5 py-3">JOINED</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-gray-600">
                     {recentUsers.map(u => (
                       <tr key={u.id} className="hover:bg-gray-50">
                          <td className="px-5 py-3 font-medium text-gray-800">{u.username}</td>
                          <td className="px-5 py-3">{u.customTitle || "Member"}</td>
                          <td className="px-5 py-3">{u.createdAt.toLocaleDateString()}</td>
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
