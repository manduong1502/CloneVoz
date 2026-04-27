import Link from 'next/link';
import { Home, LayoutList, Users, Settings, Activity, Flag, CheckCircle, ArrowLeft } from 'lucide-react';
import { Inter } from 'next/font/google';
import '../globals.css';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AdminSidebar from './AdminSidebar';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export default async function AdminLayout({ children }) {
  const session = await auth();
  const isSuperAdmin = session?.user?.email === 'lamphatcommerce@gmail.com' || session?.user?.email === 'mandtdn@gmail.com';
  const isAdmin = session?.user?.isAdmin || isSuperAdmin;
  const isMod = session?.user?.isMod;
  
  if (!isAdmin && !isMod) {
    redirect('/');
  }

  // Đếm số bài chờ duyệt
  const pendingCount = await prisma.thread.count({ where: { isApproved: false } });

  const navItems = [
    ...(isAdmin ? [{ href: '/admin', icon: 'Home', label: 'Bảng điều khiển' }] : []),
    { href: '/admin/pending', icon: 'CheckCircle', label: 'Duyệt bài', badge: pendingCount },
    { href: '/admin/reports', icon: 'Flag', label: 'Báo cáo vi phạm' },
    ...(isAdmin ? [
      { href: '/admin/nodes', icon: 'LayoutList', label: 'Quản lý chuyên mục' },
      { href: '/admin/users', icon: 'Users', label: 'Quản lý thành viên' },
      { href: '/admin/settings', icon: 'Settings', label: 'Cài đặt' },
    ] : []),
  ];

  return (
    <div className="fixed inset-0 z-[9999] bg-[var(--voz-bg)] text-[var(--voz-text)] flex flex-col md:flex-row overflow-hidden font-sans">
      {/* Mobile Header */}
      <AdminSidebar 
        navItems={navItems} 
        userName={session?.user?.name} 
        userImage={session?.user?.image}
        role={isAdmin ? 'Admin' : 'Moderator'}
      />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#1e293b] text-slate-300 flex-col pt-4 shrink-0">
         <div className="px-6 mb-8">
            <h2 className="text-xl font-bold text-white tracking-wide">DanOng<span className="text-blue-400">ThongMinh</span></h2>
            <p className="text-xs text-slate-500 mt-1">Control Panel v2.0</p>
         </div>
           
         <nav className="flex-1 flex flex-col gap-1 px-3">
           {navItems.map(item => (
             <Link key={item.href} href={item.href} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition text-sm">
               {item.icon === 'Home' && <Home size={18}/>}
               {item.icon === 'CheckCircle' && <CheckCircle size={18}/>}
               {item.icon === 'Flag' && <Flag size={18}/>}
               {item.icon === 'LayoutList' && <LayoutList size={18}/>}
               {item.icon === 'Users' && <Users size={18}/>}
               {item.icon === 'Settings' && <Settings size={18}/>}
               <span>{item.label}</span>
               {item.badge > 0 && (
                 <span className="ml-auto bg-red-500 text-white text-[11px] font-bold px-2 py-[2px] rounded-full min-w-[20px] text-center">
                   {item.badge}
                 </span>
               )}
             </Link>
           ))}
         </nav>
         
         <div className="p-4 border-t border-slate-700 m-3 rounded-md text-xs">
            Đăng nhập: <span className="text-emerald-400 font-semibold">{session?.user?.name}</span>
            <br/>
            Vai trò: <span className="text-amber-400 font-semibold">{isAdmin ? 'Admin' : 'Moderator'}</span>
         </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-[50px] md:h-[60px] bg-[var(--voz-surface)] border-b border-[var(--voz-border)] px-4 md:px-6 hidden md:flex justify-between items-center shadow-sm">
           <div className="font-semibold text-[var(--voz-text)]">Administrator Control Panel</div>
           <div className="flex items-center gap-4 text-sm font-medium">
              <Link href="/" className="text-blue-600 hover:underline">← Quay lại Diễn đàn</Link>
              <div className="flex items-center gap-2">
                 <img src={session?.user?.image || "https://ui-avatars.com/api/?name=Admin&background=random"} className="w-8 h-8 rounded-full" />
                 {session?.user?.name || 'Admin'}
              </div>
           </div>
        </header>
        
        <main className="p-3 md:p-6 flex-1 overflow-auto">
           {children}
        </main>
      </div>
    </div>
  );
}
