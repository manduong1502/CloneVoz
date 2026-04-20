"use client";

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { pusherClient } from '@/lib/pusher.client';
import { getRecentShouts, postShout, toggleShoutboxReaction } from '@/actions/shoutboxActions';
import { MessageCircle, X, AlertTriangle, Send, SmilePlus, Image as ImageIcon, Mic, Sticker, Smile } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { submitReport } from '@/actions/reportActions';

export default function GlobalChatbox({ session }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSending, startTransition] = useTransition();
  const messagesEndRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeReactMsgId, setActiveReactMsgId] = useState(null);
  const { resolvedTheme } = useTheme();
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Unread count
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Load initial messages
    getRecentShouts().then(res => {
      if (res.success) {
        setMessages(res.messages);
      }
      setLoading(false);
    });

    const channel = pusherClient.subscribe('global-chat');
    
    const handleNewShout = (newShout) => {
      setMessages(prev => {
        // Chống lặp tin nhắn nếu Pusher bắn double event
        if (prev.some(m => m.id === newShout.id)) return prev;
        return [...prev, newShout];
      });
      if (!isOpen) { // Nếu đóng khung chat thì tăng số thông báo
        setUnreadCount(prev => prev + 1);
      } else {
        // Nếu mở chat và người dùng MỚI là người được auto scroll (đang ở sát bottom)
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

    channel.bind('new-shout', handleNewShout);
    channel.bind('shout-reaction', handleReaction);

    return () => {
      channel.unbind('new-shout', handleNewShout);
      channel.unbind('shout-reaction', handleReaction);
      // Không gọi unsubscribe toàn cục ở đây vì GlobalChat tồn tại liên tục, 
      // gọi sẽ gây lỗi WebSocket CLOSED nếu re-render nhanh (Fast Reload).
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

    startTransition(async () => {
      try {
        await postShout(msgContent);
      } catch (err) {
        alert(err.message);
        setContent(msgContent); // Revert input if error
      }
    });
  };

  const handleReport = async (msgId) => {
    const reason = prompt("Nhập lý do báo cáo tin nhắn này (Ví dụ: Spam, Xúc phạm):");
    if (!reason || reason.trim() === "") return;

    try {
      await submitReport({ reason, shoutboxMessageId: msgId });
      alert("Đã gửi báo cáo thành công. Cảm ơn bạn!");
    } catch (err) {
      alert(err.message);
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
        if (data.url) {
          await postShout(`[IMG]${data.url}[/IMG]`);
        } else {
          alert(data.error || "Lỗi tải ảnh");
        }
      } catch (error) {
        alert("Không thể tải ảnh. Vui lòng thử lại.");
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
      parts.push(
        <div key={match.index} className="w-full">
          <img src={match[1]} alt="Attached image" className="max-w-full rounded-2xl cursor-pointer hover:opacity-90 max-h-[300px] object-cover" onClick={() => window.open(match[1], '_blank')} />
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
        <div className="bg-[var(--voz-surface)] border border-[var(--voz-border)] rounded-lg shadow-2xl mb-2 w-[calc(100vw-32px)] sm:w-[360px] md:w-[400px] flex flex-col overflow-hidden" style={{ height: '480px' }}>

          {/* Header */}
          <div className="bg-[#185886] text-white px-4 py-3 flex justify-between items-center text-[15px] font-bold">
            <div className="flex items-center gap-2">
              <MessageCircle size={18} /> Server Chat
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:text-gray-300 transition-colors p-1">
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 flex flex-col bg-[var(--voz-accent)] text-[13px] relative" onClick={() => setShowEmojiPicker(false)}>
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
                      <div className="text-[11px] mb-[2px] ml-[36px] flex justify-start">
                        <Link href={`/profile/${msg.author.username}`} className="font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                          {msg.author.username}
                        </Link>
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
                              <button onClick={() => setActiveReactMsgId(activeReactMsgId === msg.id ? null : msg.id)} className="p-1 text-gray-400 hover:text-yellow-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                                <SmilePlus size={14} />
                              </button>
                              {/* Bảng chọn Cảm xúc nổi (lên trên) - Hiện bằng click */}
                              {activeReactMsgId === msg.id && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 flex bg-white dark:bg-[#262626] shadow-[0_0_10px_rgba(0,0,0,0.1)] rounded-full px-2 py-1 gap-1 border border-gray-200 dark:border-[#3a3b3c] z-50">
                                  {['👍', '❤️', '😂', '😡', '😭'].map(emo => {
                                    const hasReacted = msg.reactions?.some(r => r.userId === session?.user?.id && r.type === emo);
                                    return (
                                      <button
                                        key={emo}
                                        onClick={() => { toggleShoutboxReaction(msg.id, emo); setActiveReactMsgId(null); }}
                                        className={`text-[18px] transition-all outline-none rounded-lg p-[4px] ${hasReacted ? 'bg-[#e5e5e5] dark:bg-[#3a3b3c] scale-[1.15]' : 'hover:scale-125 hover:-translate-y-1'}`}
                                      >
                                        {emo}
                                      </button>
                                    )
                                  })}
                                </div>
                              )}
                            </div>

                            {/* Nút Report */}
                            {!isMine && (
                              <button
                                onClick={() => handleReport(msg.id)}
                                className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                                title="Báo cáo vi phạm"
                              >
                                <AlertTriangle size={14} />
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
          <div className="p-3 bg-[var(--voz-surface)] border-t border-[var(--voz-border)] relative">

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
            ) : (
              <div className="text-center text-[13px] text-gray-500 py-2 border border-gray-200 dark:border-[#3a3b3c] rounded-full">Vui lòng đăng nhập để tham gia chat.</div>
            )}
          </div>

        </div>
      )}

      {/* Box Nổi Toggle */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-[#185886] text-white p-3 rounded-full shadow-xl hover:bg-[#134970] hover:scale-105 transition-all relative"
        >
          <MessageCircle size={24} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-[6px] py-[2px] rounded-full animate-bounce">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

    </div>
  );
}
