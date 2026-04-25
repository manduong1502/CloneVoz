"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Bell, Menu, X, ShieldAlert, Mail } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';
import Modal from '@/components/ui/Modal';
import { loginWithProvider, loginWithCredentials, handleLogOut, registerWithCredentials } from '@/actions/authActions';
import { markAllNotificationsAsRead, markNotificationAsRead } from '@/actions/notificationActions';
import ThemeToggle from '@/components/layout/ThemeToggle';
import SearchDropdown from '@/components/layout/SearchDropdown';
import Pusher from 'pusher-js';

const Header = ({ session, notifications = [], unreadCount = 0 }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [modalType, setModalType] = useState('login'); // 'login' or 'register'
  const pathname = usePathname();

  const [liveNotifications, setLiveNotifications] = useState(notifications);
  const [liveUnreadCount, setLiveUnreadCount] = useState(unreadCount);
  const user = session?.user;

  // Lắng nghe event open-auth-modal từ các component khác (ThreadReplyBox, GlobalChatbox, ...)
  useEffect(() => {
    const handleOpenAuthModal = (e) => {
      const type = e.detail?.type || 'login';
      setModalType(type);
      setIsLoginModalOpen(true);
    };
    window.addEventListener('open-auth-modal', handleOpenAuthModal);
    return () => window.removeEventListener('open-auth-modal', handleOpenAuthModal);
  }, []);

  useEffect(() => {
    if (!user) return;

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    if (!pusherKey) return; // Bảo vệ an toàn nếu chưa cấu hình Pusher

    // Khởi tạo Pusher
    const pusher = new Pusher(pusherKey, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1',
    });

    const channel = pusher.subscribe(`user-${user.id}`);
    channel.bind('new-notification', (data) => {
      setLiveUnreadCount(prev => prev + 1);
      setLiveNotifications(prev => [data, ...prev].slice(0, 10)); // Giữ 10 thông báo mới nhất
    });

    return () => {
      pusher.unsubscribe(`user-${user.id}`);
      pusher.disconnect();
    };
  }, [user]);

  const handleMarkAllAsRead = async (e) => {
    e.preventDefault();
    if (!user) return;
    await markAllNotificationsAsRead();
    setLiveUnreadCount(0);
    setLiveNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleNotificationClick = async (notiId) => {
    if (!user) return;
    await markNotificationAsRead(notiId);
    // UI sẽ được update ở kỳ polling tiếp theo, hoặc update tạm thời luôn:
    setLiveNotifications(prev => prev.map(n => n.id === notiId ? { ...n, isRead: true } : n));
    setLiveUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <>
      <header className="w-full relative z-[60] shadow-sm font-sans">
        {/* Top Main Bar */}
        <div className="bg-[var(--voz-blue-dark)] text-white">
          <div className="max-w-[1240px] px-2 md:px-4 mx-auto flex items-center justify-between h-[50px]">
            <div className="flex items-center gap-4 h-full">
              <button
                className="md:hidden text-white flex items-center justify-center p-1"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <Link href="/" className="flex items-center gap-2 text-2xl font-bold tracking-tight hover:no-underline text-white relative top-[-2px]">
                {/* 🚀 Đổi Logo Ở Đây 🚀 */}
                {/* Nếu anh có logo hình, hãy copy file logo.png vào thư mục public/ và bật thẻ img dưới này lên */}
                {/* <img src="/logo.png" alt="Logo" className="h-8 object-contain" /> */}
                <span className="bg-[var(--voz-surface)] text-[var(--voz-text-strong)] rounded-full p-1"><ShieldAlert size={20} /></span>
                <span className="font-extrabold text-[18px] text-white" style={{ color: 'white' }}>DanOngThongMinh</span>
              </Link>

              {/* Desktop Nav */}
              <nav className="hidden md:flex ml-4 h-full items-end gap-1">
                <Link href="/" className={pathname === '/' || pathname.startsWith('/category') || pathname.startsWith('/thread') ? "bg-[var(--voz-accent)] text-[var(--voz-text-strong)] px-4 py-[14px] text-[15px] font-medium border-t-[3px] border-[var(--voz-text-strong)] hover:no-underline rounded-t-sm" : "px-4 py-[14px] text-[15px] font-medium text-white hover:text-white hover:bg-[var(--voz-surface)]/10 transition hover:no-underline rounded-t-sm border-t-[3px] border-transparent"}>
                  Diễn đàn
                </Link>
                <Link href="/whats-new" className={pathname.startsWith('/whats-new') ? "bg-[var(--voz-accent)] text-[var(--voz-text-strong)] px-4 py-[14px] text-[15px] font-medium border-t-[3px] border-[var(--voz-text-strong)] hover:no-underline rounded-t-sm" : "px-4 py-[14px] text-[15px] font-medium text-white hover:text-white hover:bg-[var(--voz-surface)]/10 transition hover:no-underline rounded-t-sm border-t-[3px] border-transparent"}>
                  Cùng nhau kiếm tiền
                </Link>
                <Link href="/terms" className={pathname.startsWith('/terms') || pathname.startsWith('/rules') ? "bg-[var(--voz-accent)] text-[var(--voz-text-strong)] px-4 py-[14px] text-[15px] font-medium border-t-[3px] border-[var(--voz-text-strong)] hover:no-underline rounded-t-sm" : "px-4 py-[14px] text-[15px] font-medium text-white hover:text-white hover:bg-[var(--voz-surface)]/10 transition hover:no-underline rounded-t-sm border-t-[3px] border-transparent"}>
                  Nội quy
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4 h-full">
              <ThemeToggle />
              <div className="flex items-center h-full gap-1">
                {user ? (
                  <>
                    <Dropdown
                      align="right"
                      width="250px"
                      trigger={(isOpen) => (
                        <div className={`flex items-center h-full px-2 gap-2 hover:bg-[var(--voz-surface)]/10 transition cursor-pointer ${isOpen ? 'bg-[var(--voz-surface)]/10' : ''}`}>
                          <img src={user.image || `https://ui-avatars.com/api/?name=${user.name}&background=random`} className="w-6 h-6 rounded-sm" />
                          <span className="text-white/90 text-[13px] hidden md:inline font-medium">{user.name}</span>
                        </div>
                      )}
                    >
                      <div className="flex flex-col text-[14px] text-[var(--voz-text)] p-2">
                        <Link href={`/profile/${user.name}`} className="px-3 py-2 hover:bg-[var(--voz-accent)] border-b border-[var(--voz-border-light)]">Trang hồ sơ của bạn</Link>
                        {(user.isAdmin || user.isMod || user.email === 'lamphatcommerce@gmail.com' || user.email === 'mandtdn@gmail.com') && (
                          <Link href="/admin/pending" className="px-3 py-2 hover:bg-[var(--voz-accent)] text-red-600 font-bold">Vào trang Quản Trị (Admin)</Link>
                        )}
                        <Link href={`/profile/${user.name}`} className="px-3 py-2 hover:bg-[var(--voz-accent)]">Chi tiết tài khoản (Profile)</Link>
                        <form action={handleLogOut}>
                          <button type="submit" className="text-left w-full px-3 py-2 hover:bg-[var(--voz-accent)] text-[var(--voz-link)] border-t border-[var(--voz-border-light)] mt-1">Đăng xuất</button>
                        </form>
                      </div>
                    </Dropdown>

                    <Link href="/conversations" className="text-white/80 hover:text-white h-full px-2 hover:bg-[var(--voz-surface)]/10 transition cursor-pointer flex items-center">
                      <Mail size={18} />
                    </Link>

                    <Dropdown
                      align="right"
                      width="350px"
                      trigger={(isOpen) => (
                        <div className={`flex items-center h-full px-2 hover:bg-[var(--voz-surface)]/10 transition cursor-pointer relative ${isOpen ? 'bg-[var(--voz-surface)]/10' : ''}`}>
                          <Bell size={18} className="text-white/80" />
                          <span className={`absolute top-[12px] right=[8px] w-2 h-2 ${liveUnreadCount > 0 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'hidden'} rounded-full border border-[#185886]`}></span>
                        </div>
                      )}
                    >
                      <div className="flex flex-col text-[var(--voz-text)]">
                        <div className="bg-[var(--voz-accent)] border-b border-[var(--voz-border)] px-3 py-2 text-[13px] font-medium flex justify-between hover:no-underline">
                          <span>Thông báo {liveUnreadCount > 0 && <span className="text-red-500 ml-1">({liveUnreadCount})</span>}</span>
                          <button onClick={handleMarkAllAsRead} className="text-[var(--voz-link)] font-normal text-[12px] hover:underline cursor-pointer bg-transparent border-0 p-0 m-0">Đánh dấu đã xem</button>
                        </div>
                        <div className="flex flex-col max-h-[300px] overflow-y-auto w-full">
                          {liveNotifications.length === 0 ? (
                            <div className="p-4 text-center text-[13px] text-[var(--voz-text-muted)]">
                              Không có thông báo mới nào.
                            </div>
                          ) : (
                            liveNotifications.map(noti => (
                              <Link href={noti.link || "#"} onClick={() => handleNotificationClick(noti.id)} key={noti.id} className={`flex items-start gap-3 p-3 border-b border-[var(--voz-border-light)] hover:bg-[var(--voz-hover)] transition-colors ${!noti.isRead ? 'bg-[#eef4f9]' : 'bg-[var(--voz-surface)]'}`}>
                                <img src={noti.sender?.avatar || `https://ui-avatars.com/api/?name=${noti.sender?.username || 'U'}&background=random`} className="w-8 h-8 rounded-full" />
                                <div className="flex-1 min-w-0">
                                  <div className="text-[13px] leading-tight mb-1" dangerouslySetInnerHTML={{ __html: noti.content }} />
                                  <div className="text-[11px] text-[var(--voz-text-muted)]">{new Date(noti.createdAt).toLocaleString('vi-VN')}</div>
                                </div>
                              </Link>
                            ))
                          )}
                        </div>
                        <div className="bg-[var(--voz-accent)] border-t border-[var(--voz-border)] px-3 py-2 text-[12px] text-center w-full">
                          <Link href="#" className="text-[var(--voz-link)] block w-full hover:underline">Hiển thị tất cả</Link>
                        </div>
                      </div>
                    </Dropdown>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setModalType('login'); setIsLoginModalOpen(true); }} className="text-[13px] font-medium hover:bg-[var(--voz-surface)]/10 h-full px-3 transition flex items-center">
                      Đăng nhập
                    </button>
                    <button onClick={() => { setModalType('register'); setIsLoginModalOpen(true); }} className="text-[13px] font-medium hover:bg-[var(--voz-surface)]/10 h-full px-3 transition hidden md:flex items-center">
                      Đăng ký
                    </button>
                  </>
                )}

                <Dropdown
                  align="right"
                  width="300px"
                  trigger={(isOpen) => (
                    <div className={`flex items-center h-full px-3 hover:bg-[var(--voz-surface)]/10 transition cursor-pointer gap-1 text-[13px] font-medium hidden md:flex ${isOpen ? 'bg-[var(--voz-surface)]/10' : ''}`}>
                      <Search size={18} /> Tìm kiếm
                    </div>
                  )}
                >
                  <SearchDropdown />
                </Dropdown>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Bar */}
        <div className="bg-[var(--voz-accent)] border-b border-[var(--voz-border)] min-h-[36px] items-center hidden md:flex text-[13px]">
          <div className="max-w-[1240px] px-4 mx-auto w-full">
            <nav className="flex gap-4 text-[var(--voz-link)] h-[36px]">
              <Link href="/whats-new" className="hover:text-[var(--voz-link-hover)] flex items-center h-full border-b-[3px] border-transparent hover:border-[var(--voz-link-hover)]">Bài viết mới</Link>

              <Dropdown
                align="left"
                width="200px"
                trigger={(isOpen) => (
                  <div className="hover:text-[var(--voz-link-hover)] flex items-center h-full cursor-pointer">Tìm chủ đề ▾</div>
                )}
              >
                <div className="flex flex-col text-[14px] text-[var(--voz-text)]">
                  <Link href="/find-threads?type=your_threads" className="px-3 py-2 border-b border-[var(--voz-border-light)] hover:bg-[var(--voz-accent)]">Chủ đề của bạn</Link>
                  <Link href="/find-threads?type=contributed" className="px-3 py-2 border-b border-[var(--voz-border-light)] hover:bg-[var(--voz-accent)]">Chủ đề có bạn tham gia</Link>
                  <Link href="/find-threads?type=unanswered" className="px-3 py-2 hover:bg-[var(--voz-accent)]">Chủ đề chưa có trả lời</Link>
                </div>
              </Dropdown>

              <Dropdown
                align="left"
                width="200px"
                trigger={(isOpen) => (
                  <div className="hover:text-[var(--voz-link-hover)] flex items-center h-full cursor-pointer">Đang theo dõi ▾</div>
                )}
              >
                <div className="flex flex-col text-[14px] text-[var(--voz-text)]">
                  <Link href="/watched/threads" className="px-3 py-2 border-b border-[var(--voz-border-light)] hover:bg-[var(--voz-accent)]">Chủ đề</Link>
                  <Link href="/watched/nodes" className="px-3 py-2 hover:bg-[var(--voz-accent)]">Diễn đàn</Link>
                </div>
              </Dropdown>

              <Link href="/search" className="hover:text-[var(--voz-link-hover)] flex items-center h-full">Tìm trong diễn đàn</Link>
            </nav>
          </div>
        </div>

        {/* Mobile Sliding Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-[50px] left-0 w-full bg-[var(--voz-blue-dark)] border-t border-white/10 z-40 text-white flex flex-col shadow-lg transition-all duration-300 transform origin-top">
            <Link href="/" className="px-4 py-3 border-b border-white/10 font-bold hover:bg-[var(--voz-surface)]/10 block">Diễn đàn</Link>
            <Link href="/whats-new" className="px-4 py-3 border-b border-white/10 hover:bg-[var(--voz-surface)]/10 block font-bold">Mới nhất</Link>
            <div className="px-4 py-3 border-b border-white/10 font-bold flex justify-between items-center bg-black/20">
              <input type="text" placeholder="Tìm kiếm..." className="bg-[var(--voz-surface)]/10 border border-white/20 px-2 py-1 outline-none rounded-sm w-full placeholder-white/50 text-sm" />
              <Search size={18} className="ml-2" />
            </div>
            {!user && (
              <div className="px-4 py-3 bg-black/20 flex gap-2">
                <button className="bg-[var(--voz-surface)] text-[var(--voz-blue-dark)] px-3 py-1 font-medium rounded-sm text-sm" onClick={() => { setModalType('login'); setIsLoginModalOpen(true); setIsMobileMenuOpen(false); }}>Đăng nhập</button>
                <button className="border border-white/50 px-3 py-1 font-medium rounded-sm text-sm" onClick={() => { setModalType('register'); setIsLoginModalOpen(true); setIsMobileMenuOpen(false); }}>Đăng ký</button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Login / Register Modal */}
      <Modal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} title={modalType === 'login' ? "Đăng nhập" : "Đăng ký thành viên"} width="500px">
        <div className="p-6 bg-[var(--voz-accent)] flex flex-col gap-4 text-[14px]">

          <div className="flex border-b border-[var(--voz-border)] mb-2">
            <button
              className={`flex-1 py-2 font-bold text-[14px] uppercase ${modalType === 'login' ? 'text-[var(--voz-link)] border-b-2 border-[var(--voz-link)]' : 'text-[var(--voz-text-muted)]'}`}
              onClick={() => setModalType('login')}
            >
              Đăng nhập
            </button>
            <button
              className={`flex-1 py-2 font-bold text-[14px] uppercase ${modalType === 'register' ? 'text-[var(--voz-link)] border-b-2 border-[var(--voz-link)]' : 'text-[var(--voz-text-muted)]'}`}
              onClick={() => setModalType('register')}
            >
              Đăng ký
            </button>
          </div>

          <div className="bg-[var(--voz-surface)] p-4 border border-[var(--voz-border)] rounded-sm text-center mb-2">
            <p className="text-[var(--voz-text-muted)] text-[13px] mb-3">Sử dụng tài khoản mạng xã hội để nhanh hơn:</p>
            <div className="flex justify-center gap-3">
              <form action={() => loginWithProvider('google')}>
                <button type="submit" className="bg-[#4285F4] text-white px-4 py-2 font-medium rounded-sm w-[140px] text-[13px]">Google</button>
              </form>
              <button disabled className="bg-[#1877F2] text-white px-4 py-2 font-medium rounded-sm w-[140px] text-[13px] opacity-50 cursor-not-allowed">Facebook</button>
            </div>
          </div>

          {modalType === 'login' ? (
            <form action={async (formData) => {
              const res = await loginWithCredentials(formData);
              if (res?.success) setIsLoginModalOpen(false);
              else if (res?.error) alert(res.error);
            }}>
              <div className="flex flex-col gap-1 mb-4">
                <label className="font-semibold text-[13px] text-[var(--voz-text)]">Username của bạn</label>
                <input name="username" type="text" placeholder="Thử 'Kuang2' hoặc 'thuyvan'" className="border border-[var(--voz-border)] bg-[var(--voz-surface)] text-[var(--voz-text)] rounded-[2px] p-2 focus:border-[var(--voz-link)] outline-none" required />
              </div>
              <div className="flex flex-col gap-1 mb-4">
                <label className="font-semibold text-[13px] text-[var(--voz-text)]">Mật khẩu</label>
                <input name="password" type="password" className="border border-[var(--voz-border)] bg-[var(--voz-surface)] text-[var(--voz-text)] rounded-[2px] p-2 focus:border-[var(--voz-link)] outline-none" required />
              </div>
              <div className="mt-4 flex gap-3 justify-center border-t border-[var(--voz-border)] pt-4">
                <button type="submit" className="voz-button justify-center min-w-[120px]">
                  Đăng nhập
                </button>
              </div>
            </form>
          ) : (
            <form action={async (formData) => {
              const res = await registerWithCredentials(formData);
              if (res?.success) setIsLoginModalOpen(false);
              else if (res?.error) alert(res.error);
            }}>
              <div className="flex flex-col gap-1 mb-4">
                <label className="font-semibold text-[13px] text-[var(--voz-text)]">Tên hiển thị (Username)</label>
                <input name="username" type="text" placeholder="Ví dụ: DanChoiCode2026" className="border border-[var(--voz-border)] bg-[var(--voz-surface)] text-[var(--voz-text)] rounded-[2px] p-2 focus:border-[var(--voz-link)] outline-none" required />
              </div>
              <div className="flex flex-col gap-1 mb-4">
                <label className="font-semibold text-[13px] text-[var(--voz-text)]">Email</label>
                <input name="email" type="email" placeholder="Ví dụ: danchoi@gmail.com" className="border border-[var(--voz-border)] bg-[var(--voz-surface)] text-[var(--voz-text)] rounded-[2px] p-2 focus:border-[var(--voz-link)] outline-none" required />
              </div>
              <div className="flex flex-col gap-1 mb-4">
                <label className="font-semibold text-[13px] text-[var(--voz-text)]">Mật khẩu</label>
                <input name="password" type="password" placeholder="Tùy ý" className="border border-[var(--voz-border)] bg-[var(--voz-surface)] text-[var(--voz-text)] rounded-[2px] p-2 focus:border-[var(--voz-link)] outline-none" required />
              </div>
              <div className="mt-4 flex gap-3 justify-center border-t border-[var(--voz-border)] pt-4">
                <button type="submit" className="voz-button bg-[#185886] hover:bg-[#134468] justify-center min-w-[120px]">
                  Đăng ký tài khoản
                </button>
              </div>
            </form>
          )}

        </div>
      </Modal>
    </>
  );
};

export default Header;
