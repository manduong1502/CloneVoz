import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Pin } from 'lucide-react';
import './Home.css';

const MOCK_CATEGORIES = [
  {
    id: 1,
    title: 'Sảnh chính Lễ tân',
    nodes: [
      { id: 101, title: 'Thông báo', description: 'Các thông báo từ BQT.', posts: 124, messages: 5403, lastPost: '2 phút trước' },
      { id: 102, title: 'Góp ý & Báo lỗi', description: 'Nơi tiếp nhận ý kiến đóng góp.', posts: 42, messages: 1205, lastPost: '1 giờ trước' }
    ]
  },
  {
    id: 2,
    title: 'Giải trí',
    nodes: [
      { id: 201, title: 'Chuyện trò linh tinh', description: 'Nơi thảo luận mọi thứ trên đời.', posts: 15403, messages: 245043, lastPost: 'Vừa xong' },
      { id: 202, title: 'Phim ảnh - Music', description: 'Bình luận phim, chia sẻ nhạc.', posts: 3204, messages: 43250, lastPost: '5 phút trước' }
    ]
  },
  {
    id: 3,
    title: 'Mua bán',
    nodes: [
      { id: 301, title: 'Máy tính để bàn', description: 'Mua bán linh kiện PC.', posts: 5403, messages: 84032, lastPost: '10 phút trước' },
      { id: 302, title: 'Sản phẩm Apple', description: 'Mua bán iPhone, iPad, Mac.', posts: 8930, messages: 120400, lastPost: '15 phút trước' }
    ]
  }
];

const PinnedThreads = () => (
  <div className="card pinned-module">
    <div className="module-header">
      <Pin size={18} />
      <h3>Bài viết ghim</h3>
    </div>
    <div className="module-list">
      <div className="module-item">
        <Link to="/thread/1" className="pinned-link">[Nội quy] Cập nhật quy định mới năm 2026</Link>
      </div>
      <div className="module-item">
        <Link to="/thread/2" className="pinned-link">Hướng dẫn sử dụng tính năng Chat Real-time mới</Link>
      </div>
    </div>
  </div>
);

const Home = () => {
  return (
    <div className="home-layout" style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '24px' }}>
      <div className="main-content">
        {MOCK_CATEGORIES.map(category => (
          <div key={category.id} className="card category-block" style={{ marginBottom: '24px' }}>
            <div className="category-header">
              <h2>{category.title}</h2>
            </div>
            <div className="node-list">
              {category.nodes.map(node => (
                <div key={node.id} className="node-item">
                  <div className="node-icon">
                    <MessageSquare size={24} color="var(--primary-color)" />
                  </div>
                  <div className="node-main">
                    <h3><Link to={`/category/${node.id}`}>{node.title}</Link></h3>
                    <p>{node.description}</p>
                  </div>
                  <div className="node-stats">
                    <div className="stat"><span>Chủ đề:</span> {node.posts.toLocaleString()}</div>
                    <div className="stat"><span>Bài viết:</span> {node.messages.toLocaleString()}</div>
                  </div>
                  <div className="node-last">
                    <span>Mới nhất:</span>
                    <a href="#">{node.lastPost}</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="sidebar">
        <PinnedThreads />
        
        <div className="card widget" style={{ marginTop: '24px' }}>
          <div className="widget-header">
            <h3>Bài viết mới</h3>
          </div>
          <div className="widget-content">
            <ul className="recent-list">
              <li><Link to="/thread/3">Tư vấn build PC 20 triệu</Link></li>
              <li><Link to="/thread/4">Review nhanh iPhone 17 Pro Max</Link></li>
              <li><Link to="/thread/5">Share khóa học lập trình ReactJS</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
