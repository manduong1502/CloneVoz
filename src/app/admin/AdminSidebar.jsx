"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Home, CheckCircle, Flag, LayoutList, Users, Settings, ArrowLeft } from 'lucide-react';

const iconMap = { Home, CheckCircle, Flag, LayoutList, Users, Settings };

export default function AdminSidebar({ navItems, userName, userImage, role }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-[#1e293b] text-white h-[50px] flex items-center justify-between px-4 shrink-0">
        <button onClick={() => setIsOpen(!isOpen)} className="text-white p-1">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h2 className="text-[16px] font-bold">DanOng<span className="text-blue-400">ThongMinh</span> <span className="text-[11px] text-slate-400 font-normal">Admin</span></h2>
        <Link href="/" className="text-blue-400 text-[12px]">
          <ArrowLeft size={18} />
        </Link>
      </div>

      {/* Mobile Slide Menu */}
      {isOpen && (
        <div className="md:hidden bg-[#1e293b] text-slate-300 border-b border-slate-700 pb-3">
          <nav className="flex flex-col gap-1 px-3">
            {navItems.map(item => {
              const Icon = iconMap[item.icon];
              return (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white hover:no-underline transition text-sm"
                  style={{ color: 'inherit' }}
                >
                  {Icon && <Icon size={18}/>}
                  <span>{item.label}</span>
                  {item.badge > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[11px] font-bold px-2 py-[2px] rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="px-6 pt-2 text-xs text-slate-500 border-t border-slate-700 mt-2">
            {userName} · <span className="text-amber-400">{role}</span>
          </div>
        </div>
      )}
    </>
  );
}
