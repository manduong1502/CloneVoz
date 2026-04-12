"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Bell, Menu, X, ShieldAlert, Mail } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';
import Modal from '@/components/ui/Modal';
import { loginWithProvider, loginWithCredentials, handleLogOut } from '@/actions/authActions';

const Header = ({ session }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  const user = session?.user;

  return (
    <>
      <header className="w-full relative z-[60] shadow-sm font-sans">
        {/* Top Main Bar */}
        <div className="bg-[#185886] text-white">
          <div className="max-w-[1240px] px-2 md:px-4 mx-auto flex items-center justify-between h-[50px]">
            <div className="flex items-center gap-4 h-full">
              <button 
                className="md:hidden text-white flex items-center justify-center p-1"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <Link href="/" className="flex items-center gap-2 text-2xl font-bold tracking-tight hover:no-underline text-white relative top-[-2px]">
                <span className="bg-white text-[#185886] rounded-full p-1"><ShieldAlert size={20} /></span>
                <span className="italic">VOZ</span>
              </Link>

              {/* Desktop Nav */}
              <nav className="hidden md:flex ml-4 h-full items-end gap-1">
                <Link href="/" className="bg-[#f5f5f5] text-[#185886] px-4 py-[14px] text-[15px] font-medium border-t-[3px] border-[#185886] hover:no-underline rounded-t-sm">
                  Forums
                </Link>
                <Link href="/whats-new" className="px-4 py-[14px] text-[15px] font-medium text-white/90 hover:text-white hover:bg-white/10 transition hover:no-underline rounded-t-sm border-t-[3px] border-transparent">
                  Latests
                </Link>
                <Link href="#" className="px-4 py-[14px] text-[15px] font-medium text-white/90 hover:text-white hover:bg-white/10 transition hover:no-underline rounded-t-sm border-t-[3px] border-transparent">
                  pik.vn
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4 h-full">
              <div className="flex items-center h-full gap-1">
                {user ? (
                  <>
                    <Dropdown 
                      align="right" 
                      width="250px"
                      trigger={(isOpen) => (
                        <div className={`flex items-center h-full px-2 gap-2 hover:bg-white/10 transition cursor-pointer ${isOpen ? 'bg-white/10' : ''}`}>
                          <img src={user.image || `https://ui-avatars.com/api/?name=${user.name}&background=random`} className="w-6 h-6 rounded-sm" />
                          <span className="text-white/90 text-[13px] hidden md:inline font-medium">{user.name}</span>
                        </div>
                      )}
                    >
                      <div className="flex flex-col text-[14px] text-[var(--voz-text)] p-2">
                        <Link href={`/profile/${user.name}`} className="px-3 py-2 hover:bg-[#f5f5f5] border-b border-[#f0f0f0]">Trang hồ sơ của bạn</Link>
                        {user.name === 'Kuang2' && <Link href="/admin" className="px-3 py-2 hover:bg-[#f5f5f5] text-red-600 font-bold">Vào trang Quản Trị (Admin)</Link>}
                        <Link href="#" className="px-3 py-2 hover:bg-[#f5f5f5]">Chi tiết tài khoản</Link>
                        <Link href="#" className="px-3 py-2 hover:bg-[#f5f5f5] border-b border-[#f0f0f0]">Tùy chọn</Link>
                        <form action={handleLogOut}>
                          <button type="submit" className="text-left w-full px-3 py-2 hover:bg-[#f5f5f5] text-[var(--voz-link)]">Đăng xuất</button>
                        </form>
                      </div>
                    </Dropdown>

                    <button className="text-white/80 hover:text-white h-full px-2 hover:bg-white/10 transition cursor-pointer">
                      <Mail size={18} />
                    </button>

                    <Dropdown 
                      align="right" 
                      width="350px"
                      trigger={(isOpen) => (
                        <div className={`flex items-center h-full px-2 hover:bg-white/10 transition cursor-pointer relative ${isOpen ? 'bg-white/10' : ''}`}>
                          <Bell size={18} className="text-white/80" />
                          <span className="absolute top-[12px] right=[8px] w-2 h-2 bg-red-500 rounded-full border border-[#185886]"></span>
                        </div>
                      )}
                    >
                      <div className="flex flex-col text-[var(--voz-text)]">
                         <div className="bg-[#f5f5f5] border-b border-[var(--voz-border)] px-3 py-2 text-[13px] font-medium flex justify-between">
                            <span>Thông báo</span>
                            <Link href="#" className="text-[var(--voz-link)]">Đánh dấu đã xem</Link>
                         </div>
                         <div className="p-4 text-center text-[13px] text-[#8c8c8c]">
                            Không có thông báo mới nào.
                         </div>
                         <div className="bg-[#f9f9f9] border-t border-[var(--voz-border)] px-3 py-2 text-[12px] text-center">
                            <Link href="#" className="text-[var(--voz-link)]">Hiển thị tất cả</Link>
                         </div>
                      </div>
                    </Dropdown>
                  </>
                ) : (
                  <>
                    <button onClick={() => setIsLoginModalOpen(true)} className="text-[13px] font-medium hover:bg-white/10 h-full px-3 transition flex items-center">
                      Log in
                    </button>
                    <button onClick={() => setIsLoginModalOpen(true)} className="text-[13px] font-medium hover:bg-white/10 h-full px-3 transition hidden md:flex items-center">
                      Register
                    </button>
                  </>
                )}
                
                <Dropdown 
                  align="right" 
                  width="300px"
                  trigger={(isOpen) => (
                    <div className={`flex items-center h-full px-3 hover:bg-white/10 transition cursor-pointer gap-1 text-[13px] font-medium hidden md:flex ${isOpen ? 'bg-white/10' : ''}`}>
                      <Search size={18} /> Search
                    </div>
                  )}
                >
                   <div className="p-3 text-[14px]">
                      <input type="text" placeholder="Search..." className="w-full border border-[var(--voz-border)] p-2 rounded-[2px] mb-2 focus:border-[var(--voz-link)] outline-none" />
                      <div className="flex flex-col gap-2 mb-3">
                        <label className="flex items-center gap-2 cursor-pointer text-[13px]"><input type="checkbox"/> Search titles only</label>
                      </div>
                      <div className="border-t border-[var(--voz-border)] pt-2 flex justify-between items-center text-[13px]">
                         <Link href="/search" className="text-[var(--voz-link)] hover:underline">Advanced search...</Link>
                         <button className="voz-button">Search</button>
                      </div>
                   </div>
                </Dropdown>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Bar */}
        <div className="bg-[#f5f5f5] border-b border-[#dedede] min-h-[36px] items-center hidden md:flex text-[13px]">
           <div className="max-w-[1240px] px-4 mx-auto w-full">
              <nav className="flex gap-4 text-[#185886] h-[36px]">
                <Link href="/whats-new" className="hover:text-[#2574A9] flex items-center h-full border-b-[3px] border-transparent hover:border-[#2574A9]">New posts</Link>
                
                <Dropdown
                  align="left"
                  width="200px"
                  trigger={(isOpen) => (
                    <div className="hover:text-[#2574A9] flex items-center h-full cursor-pointer">Find threads ▾</div>
                  )}
                >
                  <div className="flex flex-col text-[14px] text-[var(--voz-text)]">
                    <Link href="#" className="px-3 py-2 border-b border-[#f0f0f0] hover:bg-[#f5f5f5]">Your threads</Link>
                    <Link href="#" className="px-3 py-2 border-b border-[#f0f0f0] hover:bg-[#f5f5f5]">Threads with your replies</Link>
                    <Link href="#" className="px-3 py-2 hover:bg-[#f5f5f5]">Unanswered threads</Link>
                  </div>
                </Dropdown>

                <Dropdown
                  align="left"
                  width="200px"
                  trigger={(isOpen) => (
                    <div className="hover:text-[#2574A9] flex items-center h-full cursor-pointer">Watched ▾</div>
                  )}
                >
                  <div className="flex flex-col text-[14px] text-[var(--voz-text)]">
                    <Link href="#" className="px-3 py-2 border-b border-[#f0f0f0] hover:bg-[#f5f5f5]">Threads</Link>
                    <Link href="#" className="px-3 py-2 hover:bg-[#f5f5f5]">Forums</Link>
                  </div>
                </Dropdown>

                <Link href="/search" className="hover:text-[#2574A9] flex items-center h-full">Search forums</Link>
                <Link href="#" className="hover:text-[#2574A9] flex items-center h-full ml-auto">Mark forums read</Link>
              </nav>
           </div>
        </div>

        {/* Mobile Sliding Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-[50px] left-0 w-full bg-[#185886] border-t border-white/10 z-40 text-white flex flex-col shadow-lg transition-all duration-300 transform origin-top">
            <Link href="/" className="px-4 py-3 border-b border-white/10 font-bold hover:bg-white/10 block">Forums</Link>
            <Link href="/whats-new" className="px-4 py-3 border-b border-white/10 hover:bg-white/10 block font-bold">Latests</Link>
            <div className="px-4 py-3 border-b border-white/10 font-bold flex justify-between items-center bg-[#134970]">
              <input type="text" placeholder="Search..." className="bg-white/10 border border-white/20 px-2 py-1 outline-none rounded-sm w-full placeholder-white/50 text-sm" />
              <Search size={18} className="ml-2" />
            </div>
            {!user && (
               <div className="px-4 py-3 bg-[#134970] flex gap-2">
                 <button className="bg-white text-[#185886] px-3 py-1 font-medium rounded-sm text-sm" onClick={() => {setIsLoginModalOpen(true); setIsMobileMenuOpen(false);}}>Log in</button>
                 <button className="border border-white/50 px-3 py-1 font-medium rounded-sm text-sm" onClick={() => {setIsLoginModalOpen(true); setIsMobileMenuOpen(false);}}>Register</button>
               </div>
            )}
          </div>
        )}
      </header>

      {/* Login Modal */}
      <Modal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} title="Log in" width="500px">
        <div className="p-6 bg-[#f5f5f5] flex flex-col gap-4 text-[14px]">
          <div className="bg-white p-4 border border-[var(--voz-border)] rounded-sm text-center mb-2">
            <p className="text-[#8c8c8c] text-[13px] mb-3">Login faster using your preferred service:</p>
            <div className="flex justify-center gap-3">
              <form action={() => loginWithProvider('google')}>
                <button type="submit" className="bg-[#4285F4] text-white px-4 py-2 font-medium rounded-sm w-[140px] text-[13px]">Google</button>
              </form>
              <button className="bg-[#1877F2] text-white px-4 py-2 font-medium rounded-sm w-[140px] text-[13px]">Facebook</button>
            </div>
          </div>
          
          <form action={async (formData) => {
             const res = await loginWithCredentials(formData);
             if (res?.success) setIsLoginModalOpen(false);
             else if (res?.error) alert(res.error);
          }}>
            <div className="flex flex-col gap-1 mb-4">
              <label className="font-semibold text-[13px] text-[var(--voz-text)]">Your username (Mock)</label>
              <input name="username" type="text" placeholder="Thử 'Kuang2' hoặc 'thuyvan'" className="border border-[var(--voz-border)] rounded-[2px] p-2 focus:border-[var(--voz-link)] outline-none" required />
            </div>
            <div className="flex flex-col gap-1 mb-4">
              <label className="font-semibold text-[13px] text-[var(--voz-text)]">Password</label>
              <input name="password" type="password" className="border border-[var(--voz-border)] rounded-[2px] p-2 focus:border-[var(--voz-link)] outline-none" required />
            </div>
            <div className="mt-4 flex gap-3 justify-center border-t border-[var(--voz-border)] pt-4">
              <button type="submit" className="voz-button justify-center min-w-[120px]">
                Log in
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
};

export default Header;
