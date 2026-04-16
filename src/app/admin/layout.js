import Link from 'next/link';
import { Home, LayoutList, Users, Settings, Activity, Flag } from 'lucide-react';
import { Inter } from 'next/font/google';
import '../globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export default function AdminLayout({ children }) {
  return (
    <div className="fixed inset-0 z-[9999] bg-gray-50 text-gray-800 flex overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1e293b] text-slate-300 flex flex-col pt-4 shrink-0">
         <div className="px-6 mb-8">
            <h2 className="text-xl font-bold text-white tracking-wide">DanOng<span className="text-blue-400">ThongMinh</span></h2>
            <p className="text-xs text-slate-500 mt-1">Control Panel v2.0</p>
         </div>
           
           <nav className="flex-1 flex flex-col gap-1 px-3">
              <Link href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition">
                 <Home size={18}/> Dashboard
              </Link>
              <Link href="/admin/nodes" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition">
                 <LayoutList size={18}/> Forums & Nodes
              </Link>
              <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition">
                 <Users size={18}/> Users & Groups
              </Link>
              <Link href="/admin/reports" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition">
                 <Flag size={18}/> Reports & Warnings
              </Link>
              <Link href="/admin/settings" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition">
                 <Settings size={18}/> Options
              </Link>
           </nav>
           
           <div className="p-4 border-t border-slate-700 m-3 rounded-md text-xs">
              Môi trường: <span className="text-emerald-400 font-semibold">Development</span>
           </div>
        </aside>

        {/* Main Area */}
        <div className="flex-1 flex flex-col">
          <header className="h-[60px] bg-white border-b border-gray-200 px-6 flex justify-between items-center shadow-sm">
             <div className="font-semibold text-gray-600">Administrator Control Panel</div>
             <div className="flex items-center gap-4 text-sm font-medium">
                <Link href="/" className="text-blue-600 hover:underline">Exit to Forum</Link>
                <div className="flex items-center gap-2">
                   <img src="https://ui-avatars.com/api/?name=Admin&background=random" className="w-8 h-8 rounded-full" />
                   Admin
                </div>
             </div>
          </header>
          
          <main className="p-6 flex-1 overflow-auto">
             {children}
          </main>
        </div>
    </div>
  );
}
