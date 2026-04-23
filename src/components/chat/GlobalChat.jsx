"use client";

import React, { useState } from 'react';
import { MessageCircle, X, Send, Users, VolumeX, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MOCK_MESSAGES = [
  { id: 1, user: 'voz_er', text: 'Ông nào có link trận hôm qua không?', time: '10:02' },
  { id: 2, user: 'ban_lanh_dao', text: 'Lên google mà search thím ơi.', time: '10:03' },
  { id: 3, user: 'bot', text: 'Thành viên mới tech_guru vừa tham gia phòng chat', isSystem: true, time: '10:05' }
];

const GlobalChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [message, setMessage] = useState('');

  return (
    <div className="global-chat-wrapper" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 100 }}>
      {/* Nút bật chat */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="chat-toggle-btn"
            style={{
              width: '60px', height: '60px', borderRadius: '50%',
              backgroundColor: 'var(--primary-color)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-lg)', cursor: 'pointer', border: 'none'
            }}
          >
            <MessageCircle size={30} />
            <span style={{ position: 'absolute', top: 0, right: 0, backgroundColor: 'var(--danger-color)', width: '16px', height: '16px', borderRadius: '50%', border: '2px solid var(--bg-body)' }}></span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Box Chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="chat-box card"
            style={{
              width: '450px', height: '60vh', // Mặc định to hơn (khoảng nửa màn)
              minWidth: '320px', minHeight: '400px', // Không cho kéo quá nhỏ
              maxWidth: '90vw', maxHeight: '90vh', // Không cho tràn ra ngoài màn hình
              display: 'flex', flexDirection: 'column',
              boxShadow: 'var(--shadow-lg)',
              resize: 'both',       // Bật tính năng Kéo / Thu phóng tự do 
              overflow: 'hidden',   // Bắt buộc phải có để resize hoạt động
              backgroundColor: 'var(--bg-surface)'
            }}
          >
            {/* Header */}
            <div className="chat-header" style={{
              padding: '12px 16px', backgroundColor: 'var(--bg-header)', color: '#fff',
              display: 'flex', justify-content: 'space-between', alignItems: 'center',
              cursor: 'default' // Tránh con trỏ kéo tràn lên text
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                <Users size={18} /> Kênh Thế Giới (Online: 42)
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setIsMuted(!isMuted)} className="btn-ghost" style={{ color: '#fff', padding: '4px' }}>
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <button onClick={() => setIsOpen(false)} className="btn-ghost" style={{ color: '#fff', padding: '4px' }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="chat-messages" style={{
              flex: 1, padding: '16px', overflowY: 'auto',
              display: 'flex', flexDirection: 'column', gap: '12px',
              backgroundColor: 'var(--bg-surface-hover)'
            }}>
              {MOCK_MESSAGES.map(msg => (
                <div key={msg.id} style={{ fontSize: '14px' }}>
                  {msg.isSystem ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>
                      {msg.text}
                    </div>
                  ) : (
                    <div>
                      <span style={{ fontWeight: '600', color: 'var(--primary-color)' }}>{msg.user}: </span>
                      <span style={{ color: 'var(--text-primary)' }}>{msg.text}</span>
                      <span style={{ float: 'right', fontSize: '11px', color: 'var(--text-muted)' }}>{msg.time}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Input form */}
            <form 
              className="chat-input" 
              style={{ 
                padding: '12px', 
                paddingRight: '22px', // Để dành góc phải cho Icon Resize của CSS
                borderTop: '1px solid var(--border-color)', 
                display: 'flex', gap: '8px', backgroundColor: 'var(--bg-surface)' 
              }}
              onSubmit={e => {
                e.preventDefault();
                setMessage('');
              }}
            >
              <input 
                type="text" 
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Nhắn tin..." 
                className="input" 
                style={{ flex: 1, borderRadius: '20px', fontSize: '14px' }}
              />
              <button className="btn btn-primary cursor-pointer" type="submit" style={{ borderRadius: '50%', width: '38px', height: '38px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GlobalChat;
