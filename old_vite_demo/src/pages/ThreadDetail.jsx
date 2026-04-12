import React from 'react';
import { Link } from 'react-router-dom';
import { User, MessageSquare, ThumbsUp, MoreHorizontal, ChevronRight, Flag } from 'lucide-react';
import './ThreadDetail.css';

const MOCK_POSTS = [
  {
    id: 1,
    author: 'voz_er',
    joinDate: '12-05-2020',
    messages: 1540,
    avatar: 'https://ui-avatars.com/api/?name=VOZ&background=random',
    time: 'Hôm qua lúc 10:20',
    content: `
      <p>Chào ae,</p>
      <p>Tình hình là em đang tính build dàn PC mới tầm 20tr để phục vụ nhu cầu code và thỉnh thoảng chơi vài game nhẹ. Ae tư vấn giúp em cấu hình với ạ.</p>
      <p>Nhu cầu:</p>
      <ul>
        <li>CPU: Intel hay AMD?</li>
        <li>RAM: Ít nhất 32GB (chạy Docker nhiều).</li>
        <li>Không cần VGA xịn, có thể xài onboard hoặc VGA cũ.</li>
      </ul>
      <p>Cảm ơn ae rất nhiều!</p>
    `,
    likes: 12
  },
  {
    id: 2,
    author: 'tech_guru',
    joinDate: '01-01-2018',
    messages: 8904,
    avatar: 'https://ui-avatars.com/api/?name=TG&background=random',
    time: 'Hôm qua lúc 10:45',
    content: `
      <p>Nếu nhu cầu code nhiều mà cày Docker thì quất AMD Ryzen 5 hoặc 7 (VD: R5 7600X) khá ok nhé thớt. Main B650 + RAM 32GB DDR5 dư sức.</p>
      <p>VGA thì kiếm con RX 6600 cũ tầm 3tr5 hoặc GTX 1660 Super là đẹp.</p>
    `,
    likes: 45
  }
];

const ThreadDetail = () => {
  return (
    <div className="thread-page">
      <div className="breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '16px', color: 'var(--text-muted)' }}>
        <Link to="/">Diễn đàn</Link>
        <ChevronRight size={14} />
        <Link to="/category/1">Phần cứng chung</Link>
        <ChevronRight size={14} />
        <span style={{ color: 'var(--text-primary)' }}>Tư vấn build PC 20 triệu</span>
      </div>

      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>Tư vấn build PC 20 triệu</h1>

      <div className="post-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {MOCK_POSTS.map((post, index) => (
          <div key={post.id} className="card post-item" style={{ display: 'flex' }}>
            <div className="post-user-info" style={{ 
              width: '160px', 
              padding: '16px', 
              backgroundColor: 'var(--bg-surface-hover)', 
              borderRight: '1px solid var(--border-color)',
              textAlign: 'center'
            }}>
              <img src={post.avatar} alt={post.author} style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '12px' }} />
              <div style={{ fontWeight: '600', color: 'var(--primary-color)' }}>{post.author}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Tham gia: {post.joinDate}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Bài viết: {post.messages}</div>
            </div>
            <div className="post-main" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="post-header" style={{ padding: '8px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span>{post.time}</span>
                <span>#{index + 1}</span>
              </div>
              <div className="post-content" style={{ padding: '16px', flex: 1, minHeight: '150px' }} dangerouslySetInnerHTML={{ __html: post.content }} />
              <div className="post-footer" style={{ padding: '8px 16px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-surface-hover)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <ThumbsUp size={16} /> <b>{post.likes}</b> likes
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                   <button className="btn btn-ghost" style={{ fontSize: '13px', padding: '4px 8px' }}><Flag size={14}/> Report</button>
                   <button className="btn btn-ghost" style={{ fontSize: '13px', padding: '4px 8px' }}>Reply</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="reply-box card" style={{ marginTop: '24px', padding: '16px' }}>
        <h3 style={{ marginBottom: '12px', fontSize: '16px' }}>Gửi trả lời</h3>
        <textarea 
          className="input" 
          rows={6} 
          placeholder="Nhập nội dung trả lời của bạn vào đây..."
          style={{ resize: 'vertical', marginBottom: '12px' }}
        ></textarea>
        <button className="btn btn-primary">Đăng trả lời</button>
      </div>
    </div>
  );
};

export default ThreadDetail;
