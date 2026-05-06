"use client";

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { getPusherClient } from '@/lib/pusher.client';
import { getRecentShouts, postShout, toggleShoutboxReaction, deleteShout, getChatPauseState, toggleChatPause } from '@/actions/shoutboxActions';
import { MessageCircle, X, AlertTriangle, Send, SmilePlus, Image as ImageIcon, Mic, Sticker, Smile, Trash2, Lock, Unlock, Reply, Plus } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { submitReport } from '@/actions/reportActions';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
function ChatHint({ unreadCount }) {
  const [dismissed, setDismissed] = useState(false);
  const [showInitial, setShowInitial] = useState(false);

  // Hiện lại khi có tin nhắn mới chưa đọc
  useEffect(() => {
    if (unreadCount > 0) {
      setDismissed(false);
    }
  }, [unreadCount]);

  // Lần đầu vào trang, hiện gợi ý 1 lần
  useEffect(() => {
    const seen = localStorage.getItem('chat_hint_dismissed');
    if (!seen) {
      setShowInitial(true);
      const timer = setTimeout(() => { setShowInitial(false); localStorage.setItem('chat_hint_dismissed', '1'); }, 8000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setDismissed(true);
  };

  const shouldShow = !dismissed && (showInitial || unreadCount > 0);
  if (!shouldShow) return null;

  return (
    <div className="bg-[var(--voz-surface)] border border-[var(--voz-border)] rounded-lg shadow-lg px-3 py-2 text-[12px] text-[var(--voz-text)] flex items-center gap-2 animate-fade-in max-w-[220px]">
      <span>💬 {unreadCount > 0 ? `Có ${unreadCount > 99 ? '99+' : unreadCount} tin nhắn mới!` : 'Tham gia trò chuyện cùng mọi người!'}</span>
      <button onClick={dismiss} className="text-[var(--voz-text-muted)] hover:text-[var(--voz-text)] shrink-0 text-[14px] leading-none">✕</button>
    </div>
  );
}

export default function GlobalChatbox({ session }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSending, startTransition] = useTransition();
  const messagesEndRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeReactMsgId, setActiveReactMsgId] = useState(null);
  const [reactEmojiPickerMsgId, setReactEmojiPickerMsgId] = useState(null);
  const { resolvedTheme } = useTheme();
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const [toast, setToast] = useState(null);
  const [isChatPaused, setIsChatPaused] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null); // { id, content, author: { username } }

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Resize State
  const [size, setSize] = useState({ w: 1000, h: 600 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Mặc định bự chà bá hệt như ảnh yêu cầu
      setSize({
        w: Math.min(1000, window.innerWidth * 0.95), // Cho phép vươn tối đa 1000px, hoặc 95% màn hình nếu màn hình nhỏ.
        h: Math.min(650, window.innerHeight * 0.8)
      });
    }
  }, []);

  const handleResize = (e, direction) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = size.w;
    const startH = size.h;

    const onMouseMove = (moveEvent) => {
      let newW = startW;
      let newH = startH;

      if (direction.includes('left')) {
        newW = startW + (startX - moveEvent.clientX);
      }
      if (direction.includes('top')) {
        newH = startH + (startY - moveEvent.clientY);
      }

      // Constraints
      newW = Math.max(320, Math.min(newW, window.innerWidth * 0.9));
      newH = Math.max(350, Math.min(newH, window.innerHeight * 0.9));

      setSize({ w: newW, h: newH });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // Unread count
  const [unreadCount, setUnreadCount] = useState(0);

  // Lightbox
  const [lightboxImage, setLightboxImage] = useState(null);

  useEffect(() => {
    // Load initial messages and chat pause state
    getRecentShouts().then(res => {
      if (res.success) {
        setMessages(res.messages);
      }
      setLoading(false);
    });

    getChatPauseState().then(res => {
      if (res.success) {
        setIsChatPaused(res.isPaused);
      }
    });

    let channel;
    getPusherClient().then(client => {
      if (!client) return;
      channel = client.subscribe('global-chat');

      const handleNewShout = (newShout) => {
        setMessages(prev => {
          if (prev.some(m => m.id === newShout.id)) return prev;
          return [...prev, newShout];
        });
        if (!isOpen) {
          setUnreadCount(prev => prev + 1);
        } else {
          if (messagesEndRef.current) {
            const container = messagesEndRef.current.parentElement;
            if (container) {
              const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
              if (isNearBottom) {
                setTimeout(() => {
                  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            }
          }
        }
      };

      const handleReaction = (data) => {
        setMessages(prev => prev.map(msg => {
          if (msg.id === data.messageId) {
            return { ...msg, reactions: data.reactions };
          }
          return msg;
        }));
      };

      const handleDeleteShout = (data) => {
        setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
      };

      const handleChatLock = (data) => {
        setIsChatPaused(data.isPaused);
      };

      channel.bind('new-shout', handleNewShout);
      channel.bind('shout-reaction', handleReaction);
      channel.bind('delete-shout', handleDeleteShout);
      channel.bind('chat-lock', handleChatLock);

      // Lưu lại tham chiếu để unbind khi unmount
      window._globalChatChannel = channel;
      window._globalChatHandlers = { handleNewShout, handleReaction, handleDeleteShout, handleChatLock };
    });

    return () => {
      if (window._globalChatChannel && window._globalChatHandlers) {
        window._globalChatChannel.unbind('new-shout', window._globalChatHandlers.handleNewShout);
        window._globalChatChannel.unbind('shout-reaction', window._globalChatHandlers.handleReaction);
        window._globalChatChannel.unbind('delete-shout', window._globalChatHandlers.handleDeleteShout);
        window._globalChatChannel.unbind('chat-lock', window._globalChatHandlers.handleChatLock);
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0); // Mở ra thì xóa báo số
    }
  }, [messages, isOpen]);

  useEffect(() => {
    // Chỉ tự động lướt xuống DƯỚI CÙNG khi mới mở chat hoặc sau khi load xong DB
    if (isOpen && !loading) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [isOpen, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    const msgContent = content;
    setContent('');

    const replyId = replyingTo?.id || null;
    setReplyingTo(null);

    startTransition(async () => {
      try {
        const res = await postShout(msgContent, replyId);
        if (res.error) {
           showToast(res.error, 'error');
           setContent(msgContent);
        }
        // Giữ focus vào ô nhập sau khi gửi
        setTimeout(() => textareaRef.current?.focus(), 50);
      } catch (err) {
        showToast(err.message || 'Lỗi máy chủ', 'error');
        setContent(msgContent); // Revert input if error
      }
    });
  };

  const handleReport = async (msgId) => {
    const reason = prompt("Nhập lý do báo cáo tin nhắn này (Ví dụ: Spam, Xúc phạm):");
    if (!reason || reason.trim() === "") return;

    try {
      const res = await submitReport({ reason, shoutboxMessageId: msgId });
      if (res.error) {
        showToast(res.error, 'error');
      } else {
        showToast("Đã gửi báo cáo thành công. Cảm ơn bạn!", 'success');
      }
    } catch (err) {
      showToast(err.message || "Lỗi khi báo cáo", 'error');
    }
  };

  const handleDelete = async (messageId) => {
    if (!confirm('Bạn có chắc muốn xóa tin nhắn này?')) return;
    try {
      const res = await deleteShout(messageId);
      if (res.error) {
        showToast(res.error, 'error');
      }
    } catch (e) {
      showToast(e.message || 'Lỗi khi xóa tin nhắn', 'error');
    }
  };

  const handleToggleChatPause = async () => {
    try {
      const res = await toggleChatPause();
      if (res.error) showToast(res.error, 'error');
    } catch (e) {
      showToast('Lỗi khi thao tác khóa/mở chat', 'error');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isSending && content.trim()) {
        handleSend(e);
      }
    }
  };

  const handleInputText = (e) => {
    setContent(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    if (content === '' && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [content]);

  const onEmojiClick = (emojiObject) => {
    setContent(prev => prev + emojiObject.emoji);
  };

  const onReactEmojiClick = (emojiObject) => {
    if (reactEmojiPickerMsgId) {
      toggleShoutboxReaction(reactEmojiPickerMsgId, emojiObject.emoji);
      setReactEmojiPickerMsgId(null);
      setActiveReactMsgId(null);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        
        if (!data.url) throw new Error("Upload thất bại.");

        const postRes = await postShout(`[IMG]${data.url}[/IMG]`);
        if (postRes.error) {
          showToast(postRes.error, 'error');
        }
        
      } catch (err) {
        showToast('Lỗi gửi ảnh: ' + err.message, 'error');
      }
    });

    // reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const renderMessageContent = (msgContent) => {
    const regex = /\[IMG\](.*?)\[\/IMG\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(msgContent)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={lastIndex} className="whitespace-pre-wrap">{msgContent.substring(lastIndex, match.index)}</span>);
      }
      const imgUrl = match[1]; // Capture URL trước khi closure đóng lại
      parts.push(
        <div key={match.index} className="w-full">
          <img 
            src={imgUrl} 
            alt="Attached image" 
            className="max-w-full rounded-2xl cursor-zoom-in hover:opacity-90 max-h-[300px] object-cover" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setLightboxImage(imgUrl);
            }} 
          />
        </div>
      );
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < msgContent.length) {
      parts.push(<span key={lastIndex} className="whitespace-pre-wrap">{msgContent.substring(lastIndex)}</span>);
    }

    return parts.length > 0 ? parts : <span className="whitespace-pre-wrap">{msgContent}</span>;
  };

  const isOnlyImage = (content) => {
    return /^\[IMG\].*?\[\/IMG\]$/.test(content.trim());
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col items-end">

      {/* Khung Chat */}
      {isOpen && (
        <div
          className="bg-[var(--voz-surface)] border border-[var(--voz-border)] rounded-lg shadow-2xl mb-2 flex flex-col relative"
          style={{
            width: `${size.w}px`,
            height: `${size.h}px`,
          }}
        >
          {/* Resize Handles (Custom) */}
          <div
            className="absolute top-0 left-0 right-0 h-[6px] cursor-ns-resize z-50 hover:bg-[#183254]/20 transition-colors"
            onMouseDown={(e) => handleResize(e, 'top')}
          />
          <div
            className="absolute top-0 left-0 bottom-0 w-[6px] cursor-ew-resize z-50 hover:bg-[#183254]/20 transition-colors"
            onMouseDown={(e) => handleResize(e, 'left')}
          />
          <div
            className="absolute top-0 left-0 w-[12px] h-[12px] cursor-nwse-resize z-[60]"
            onMouseDown={(e) => handleResize(e, 'top-left')}
          />

          {/* Header */}
          <div className="bg-[#183254] text-white px-4 py-3 flex justify-between items-center text-[15px] font-bold cursor-default rounded-t-lg shrink-0">
            <div className="flex items-center gap-2 pointer-events-none">
              <MessageCircle size={18} /> Server Chat
              {isChatPaused && <span className="text-[11px] bg-red-500 text-white px-2 py-0.5 rounded-full uppercase ml-2">Đang khóa</span>}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Nút Khóa/Mở Chat (Chỉ Admin/Mod) */}
              {(session?.user?.isAdmin || session?.user?.isMod) && (
                <button onClick={handleToggleChatPause} className={`hover:text-gray-300 transition-colors p-1 rounded-md ${isChatPaused ? 'text-red-400' : 'text-gray-300'}`} title={isChatPaused ? "Mở khóa chat" : "Khóa kênh chat"}>
                  {isChatPaused ? <Lock size={18} /> : <Unlock size={18} />}
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="hover:text-gray-300 transition-colors p-1">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 flex flex-col bg-[var(--voz-accent)] text-[13px] relative" onClick={() => { setShowEmojiPicker(false); setReactEmojiPickerMsgId(null); setActiveReactMsgId(null); }}>
            {loading ? (
              <div className="text-center text-gray-500 py-4">Đang tải...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500 py-4">Chưa có tin nhắn nào.</div>
            ) : (
              messages.map((msg, index) => {
                const isMine = session?.user?.id === msg.authorId;
                const prevMsg = messages[index - 1];
                const nextMsg = messages[index + 1];

                // Logic gom nhóm tin nhắn
                const isConsecutivePrev = prevMsg && prevMsg.authorId === msg.authorId;
                const isConsecutiveNext = nextMsg && nextMsg.authorId === msg.authorId;
                const showName = !isMine && !isConsecutivePrev;
                const showAvatar = !isMine && !isConsecutiveNext;

                const totalReactions = msg.reactions?.length || 0;

                // Margin: Dính sát nếu liên tiếp. Nhưng nếu có Icon Cảm Xúc thì bắt buộc nới rộng để không đè lên tin dưới!
                let marginBottomClass = isConsecutiveNext ? "mb-[2px]" : "mb-3";
                if (totalReactions > 0) {
                  marginBottomClass = isConsecutiveNext ? "mb-[16px]" : "mb-[24px]";
                }

                const reactionCounts = msg.reactions?.reduce((acc, r) => {
                  acc[r.type] = (acc[r.type] || 0) + 1;
                  return acc;
                }, {}) || {};
                // Sắp xếp icon nhiều người thả nhất lên đầu
                const reactionTypes = Object.keys(reactionCounts).sort((a, b) => reactionCounts[b] - reactionCounts[a]);

                return (
                  <div key={msg.id} className={`group relative flex flex-col ${marginBottomClass}`} style={{ alignItems: isMine ? 'flex-end' : 'flex-start' }}>

                    {/* Tên người gửi (chỉ xuất hiện ở tin đầu của nhóm) */}
                    {showName && (
                      <div className="text-[11px] mb-[2px] ml-[36px] flex items-center gap-1 justify-start">
                        <Link href={`/profile/${msg.author.username}`} className="font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                          {msg.author.username}
                        </Link>
                        {msg.author.userGroups?.some(g => g.name === 'Admin') && (
                          <span className="text-[9px] font-bold bg-red-500 text-white px-1.5 py-[1px] rounded">ADMIN</span>
                        )}
                        {msg.author.userGroups?.some(g => g.name === 'Moderator') && !msg.author.userGroups?.some(g => g.name === 'Admin') && (
                          <span className="text-[9px] font-bold bg-blue-500 text-white px-1.5 py-[1px] rounded">MOD</span>
                        )}
                      </div>
                    )}

                    {/* Khối Avatar + (Bubble & Actions) */}
                    <div className={`flex items-end gap-2 max-w-[90%] ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>

                      {/* Avatar (chỉ xuất hiện ở tin cuối của nhóm, ngược lại chừa chỗ trống) */}
                      {!isMine && (
                        showAvatar ? (
                          <img src={msg.author.avatar || `https://ui-avatars.com/api/?name=${msg.author.username}`} className="w-7 h-7 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-7 h-7 shrink-0" /> /* Giữ layout cho thẳng hàng */
                        )
                      )}

                      {/* Nhóm [Bong bóng] và [Bộ nút Actions] nằm ngang nhau, căn chính giữa */}
                      <div className={`flex items-center gap-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>

                        {/* Bóng Chat và Badge (Không chứa tên) */}
                        <div className="relative w-fit max-w-[260px] md:max-w-[300px]">
                          {/* Reply context */}
                          {msg.replyTo && (
                            <div className={`text-[11px] mb-1 px-3 py-1.5 rounded-xl ${isMine ? 'bg-[#3a4abd] text-white/60' : 'bg-[#e0e0e0] dark:bg-[#1e1e1e] text-gray-500 dark:text-gray-400'}`}>
                              <div className="font-semibold text-[10px] mb-0.5">
                                {isMine ? 'Bạn' : msg.author.username} đã trả lời {msg.replyTo.author?.username === session?.user?.username ? 'bạn' : msg.replyTo.author?.username || '...'}
                              </div>
                              <div className="truncate max-w-[200px] opacity-80">{msg.replyTo.content?.replace(/\[IMG\].*?\[\/IMG\]/g, '[Hình ảnh]').substring(0, 60)}</div>
                            </div>
                          )}
                          <div className={`text-[15px] font-[400] leading-tight ${isOnlyImage(msg.content) ? 'p-0 bg-transparent' : `px-[14px] py-[8px] ${isMine ? 'bg-[#4e5dff] text-white rounded-[20px]' : 'bg-[#efefef] dark:bg-[#262626] text-black dark:text-[#f5f5f5] rounded-[20px]'}`}`} style={{ wordBreak: 'break-word', letterSpacing: '-0.2px' }}>
                            {renderMessageContent(msg.content)}
                          </div>

                          {/* Reaction Badges (Từng icon kèm số riêng biệt) */}
                          {totalReactions > 0 && (
                            <div className={`absolute bottom-[-10px] ${isMine ? 'right-2' : 'left-2'} flex items-center gap-[4px] z-10 scale-90 ${isMine ? 'origin-bottom-right' : 'origin-bottom-left'}`}>
                              {reactionTypes.slice(0, 3).map(t => (
                                <div key={t} className="bg-white dark:bg-[#18191a] border border-gray-200 dark:border-[#3a3b3c] rounded-full px-[6px] py-[2px] text-[12px] flex items-center gap-[4px] shadow-sm whitespace-nowrap">
                                  <span>{t}</span>
                                  <span className="font-bold text-gray-500 dark:text-gray-400 text-[11px]">{reactionCounts[t]}</span>
                                </div>
                              ))}
                              {/* Số lượng các react còn lại (nếu có hơn 3 loại) */}
                              {reactionTypes.length > 3 && (
                                <div className="bg-white dark:bg-[#18191a] border border-gray-200 dark:border-[#3a3b3c] rounded-full px-[6px] py-[2px] text-[12px] flex items-center shadow-sm whitespace-nowrap">
                                  <span className="font-bold text-gray-500 dark:text-gray-400 text-[11px]">+{totalReactions - reactionTypes.slice(0, 3).reduce((sum, type) => sum + reactionCounts[type], 0)}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Hover Actions Menu (Căn đúng giữa Bóng Chat) */}
                        {session?.user?.id && (
                          <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 p-[2px] rounded-full shrink-0 relative ${activeReactMsgId === msg.id ? '!opacity-100' : ''}`}>
                            {/* Nút Thả Cảm Xúc */}
                            <div className="relative flex items-center">
                              <button onClick={(e) => { e.stopPropagation(); setActiveReactMsgId(activeReactMsgId === msg.id ? null : msg.id); setReactEmojiPickerMsgId(null); }} className={`p-1 text-gray-400 hover:text-yellow-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 ${activeReactMsgId === msg.id ? 'text-yellow-500 bg-gray-100 dark:bg-gray-800' : ''}`}>
                                <SmilePlus size={14} />
                              </button>
                              {/* Bảng chọn Cảm xúc nổi (lên trên) - Hiện bằng click */}
                              {activeReactMsgId === msg.id && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 flex items-center bg-white dark:bg-[#262626] shadow-[0_0_10px_rgba(0,0,0,0.1)] rounded-full px-2 py-1 gap-1 border border-gray-200 dark:border-[#3a3b3c] z-50">
                                  {['👍', '❤️', '😂', '😡', '😭'].map(emo => {
                                    const hasReacted = msg.reactions?.some(r => r.userId === session?.user?.id && r.type === emo);
                                    return (
                                      <button
                                        key={emo}
                                        onClick={(e) => { e.stopPropagation(); toggleShoutboxReaction(msg.id, emo); setActiveReactMsgId(null); setReactEmojiPickerMsgId(null); }}
                                        className={`text-[18px] transition-all outline-none rounded-lg p-[4px] ${hasReacted ? 'bg-[#e5e5e5] dark:bg-[#3a3b3c] scale-[1.15]' : 'hover:scale-125 hover:-translate-y-1'}`}
                                      >
                                        {emo}
                                      </button>
                                    )
                                  })}
                                  {/* Dấu + mở full Emoji */}
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setReactEmojiPickerMsgId(reactEmojiPickerMsgId === msg.id ? null : msg.id); setActiveReactMsgId(null); }}
                                    className={`w-[28px] h-[28px] flex items-center justify-center rounded-full bg-gray-100 dark:bg-[#3a3b3c] hover:bg-gray-200 dark:hover:bg-gray-600 ml-1 transition-colors group/plus ${reactEmojiPickerMsgId === msg.id ? 'bg-gray-300 dark:bg-gray-500' : ''}`}
                                  >
                                    <Plus size={16} className="text-gray-600 dark:text-gray-300 group-hover/plus:text-gray-900 dark:group-hover/plus:text-white" />
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Nút Report */}
                            {!isMine && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleReport(msg.id); }}
                                className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                                title="Báo cáo vi phạm"
                              >
                                <AlertTriangle size={14} />
                              </button>
                            )}

                            {/* Nút Reply */}
                            <button
                              onClick={(e) => { e.stopPropagation(); setReplyingTo({ id: msg.id, content: msg.content, author: msg.author }); textareaRef.current?.focus(); }}
                              className="p-1 text-gray-400 hover:text-blue-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                              title="Trả lời"
                            >
                              <Reply size={14} />
                            </button>

                            {/* Nút Xóa (Cho Owner, Admin, Mod) */}
                            {(isMine || session?.user?.isAdmin || session?.user?.isMod) && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(msg.id); }}
                                className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                                title="Xóa tin nhắn"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        )}

                      </div>

                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area (Instagram Style) */}
          <div className="p-3 bg-[var(--voz-surface)] border-t border-[var(--voz-border)] relative" style={{ paddingRight: '22px' }}>

            {/* Reply Preview Bar */}
            {replyingTo && (
              <div className="flex items-center justify-between bg-[#f0f0f0] dark:bg-[#1e1e1e] rounded-xl px-3 py-2 mb-2 text-[12px] border-l-[3px] border-blue-500">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-blue-500 text-[11px]">Đang trả lời {replyingTo.author?.username}</div>
                  <div className="text-gray-500 dark:text-gray-400 truncate">{replyingTo.content?.replace(/\[IMG\].*?\[\/IMG\]/g, '[Hình ảnh]').substring(0, 80)}</div>
                </div>
                <button onClick={() => setReplyingTo(null)} className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 shrink-0">
                  <X size={16} />
                </button>
              </div>
            )}
            {/* Bảng Emoji Full (emoji-picker-react) */}
            {showEmojiPicker && (
              <div className="absolute bottom-full left-0 mb-2 z-[9999] shadow-2xl">
                <EmojiPicker
                  onEmojiClick={onEmojiClick}
                  theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
                  searchDisabled={false}
                  skinTonesDisabled={true}
                  width={320}
                  height={350}
                />
              </div>
            )}

            {/* Input File Ẩn */}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />

            {session?.user ? (
              (isChatPaused && !session?.user?.isAdmin && !session?.user?.isMod) ? (
                <div className="text-center text-[13px] text-red-500 font-medium py-2.5 border border-red-200 dark:border-red-900/30 rounded-3xl bg-red-50 dark:bg-red-900/10">Kênh chat hiện đang bị khóa bởi Quản trị viên.</div>
              ) : (
              <form onSubmit={handleSend} className="relative flex items-end w-full">
                <div className="flex-1 flex items-end border border-[#dbdbdb] dark:border-[#3a3b3c] bg-transparent dark:bg-[#262626] rounded-3xl px-1 justify-between transition-colors focus-within:border-gray-400 dark:focus-within:border-[#555] py-1">

                  {/* Prefix Icon: Bật/Tắt Khay Emoji */}
                  <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-[6px] mb-[2px] text-gray-800 dark:text-gray-300 hover:text-[#4e5dff] dark:hover:text-gray-400 transition-colors shrink-0">
                    <Smile size={20} strokeWidth={1.5} />
                  </button>

                  {/* Text Input */}
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={content}
                    onChange={handleInputText}
                    onKeyDown={handleKeyDown}
                    disabled={isSending}
                    maxLength={1000}
                    placeholder={isSending ? "Đang xử lý..." : "Nhắn tin..."}
                    className="flex-1 bg-transparent px-1 py-[6px] outline-none text-[15px] text-[var(--voz-text)] min-w-0 font-sans disabled:opacity-70 resize-none overflow-y-auto"
                    style={{ minHeight: '34px', maxHeight: '120px' }}
                  />

                  {/* Suffix Icons */}
                  <div className="flex items-center mb-[2px] text-gray-800 dark:text-gray-300 gap-[2px]">
                    {content.trim() ? (
                      <button type="submit" disabled={isSending} className="text-[#4e5dff] font-bold text-[15px] px-3 mr-1 hover:text-[#4250e0] disabled:opacity-50 shrink-0">
                        Gửi
                      </button>
                    ) : (
                      <>
                        <button type="button" className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors shrink-0 tooltip-trigger" title="Tin nhắn thoại (Sắp ra mắt)">
                          <Mic size={20} strokeWidth={1.5} />
                        </button>
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors shrink-0 tooltip-trigger" title="Gửi ảnh">
                          <ImageIcon size={20} strokeWidth={1.5} />
                        </button>
                        <button type="button" className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors mr-1 shrink-0 tooltip-trigger" title="Nhãn dán (Sắp ra mắt)">
                          <Sticker size={20} strokeWidth={1.5} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </form>
              )
            ) : (
              <div className="text-center text-[13px] text-gray-500 py-2 border border-gray-200 dark:border-[#3a3b3c] rounded-full">Vui lòng đăng nhập để tham gia chat.</div>
            )}
            
            {/* Toast Overlay cho trạng thái mở */}
            {toast && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100] animate-fade-in pointer-events-none">
                <div className="bg-[#262626] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-gray-700 min-w-[250px] max-w-[80%] justify-center backdrop-blur-sm bg-opacity-90">
                  {toast.type === 'error' ? <AlertTriangle size={18} className="text-red-400 shrink-0" /> : <MessageCircle size={18} className="text-green-400 shrink-0" />}
                  <span className="text-[14px] font-medium leading-tight">{toast.message}</span>
                </div>
              </div>
            )}
          </div>

          {/* Reaction Emoji Picker Overlay */}
          {reactEmojiPickerMsgId && (
            <div className="absolute inset-0 z-[9999] bg-black/10 dark:bg-black/40 flex items-center justify-center rounded-lg backdrop-blur-[1px]" onClick={() => setReactEmojiPickerMsgId(null)}>
              <div onClick={e => e.stopPropagation()} className="shadow-2xl rounded-lg overflow-hidden animate-fade-in scale-in">
                <EmojiPicker
                  onEmojiClick={onReactEmojiClick}
                  theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
                  searchDisabled={false}
                  skinTonesDisabled={true}
                  width={320}
                  height={350}
                />
              </div>
            </div>
          )}

        </div>
      )}

      {/* Box Nổi Toggle */}
      {!isOpen && (
        <div className="flex items-center gap-2">
          {/* Tooltip gợi ý */}
          <ChatHint unreadCount={unreadCount} />
          
          <button
            onClick={() => setIsOpen(true)}
            className="bg-[#183254] text-white rounded-full shadow-xl hover:bg-[#134970] hover:scale-105 transition-all relative flex items-center gap-2 pl-4 pr-3 py-2.5 group border-2 border-white/40"
          >
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-[#183254] animate-ping opacity-20 pointer-events-none" />
            
            <span className="text-[13px] font-medium relative z-10 hidden sm:inline">Chat</span>
            <MessageCircle size={22} className="relative z-10" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-[6px] py-[2px] rounded-full animate-bounce z-20">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      )}

      {lightboxImage && (
        <Lightbox
          open={!!lightboxImage}
          close={() => setLightboxImage(null)}
          slides={[{ src: lightboxImage }]}
          plugins={[Zoom]}
          carousel={{ finite: true }}
          styles={{ root: { '--yarl__portal_zindex': 999999 } }}
          render={{
            buttonPrev: () => null,
            buttonNext: () => null,
          }}
          zoom={{
            maxZoomPixelRatio: 3,
            zoomInMultiplier: 2,
            doubleTapDelay: 300,
            doubleClickDelay: 300,
            doubleClickMaxStops: 2,
            keyboardMoveDistance: 50,
            wheelZoomDistanceFactor: 100,
            pinchZoomDistanceFactor: 100,
            scrollToZoom: true,
          }}
        />
      )}

    </div>
  );
}
