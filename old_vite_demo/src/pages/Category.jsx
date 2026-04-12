import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileText, ChevronRight } from 'lucide-react';
import './Category.css';

const Category = () => {
  const { id } = useParams();

  // Mock data for a category
  const threads = [
    { id: 1, title: 'Đánh giá CPU Intel đời mới, liệu có đáng mua?', author: 'voz_er', replies: 142, views: 5040, lastPost: 'Vừa xong' },
    { id: 2, title: '[Tư vấn] Màn hình 2K 144Hz dưới 7 triệu', author: 'tech_guru', replies: 89, views: 2311, lastPost: '5 phút trước' },
    { id: 3, title: 'Góc khoe góc làm việc (Workspace) của anh em VOZ', author: 'setup_pro', replies: 450, views: 15403, lastPost: '10 phút trước' },
  ];

  return (
    <div className="category-page">
      <div className="breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '16px', color: 'var(--text-muted)' }}>
        <Link to="/">Diễn đàn</Link>
        <ChevronRight size={14} />
        <Link to="#">Chuyên mục</Link>
        <ChevronRight size={14} />
        <span style={{ color: 'var(--text-primary)' }}>Chuyện trò linh tinh</span>
      </div>

      <div className="action-bar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <button className="btn btn-primary">Tạo chủ đề mới</button>
        <div className="pagination">
          {/* Mock Pagination */}
          <span className="btn" style={{ fontSize: '13px', background: 'var(--bg-surface)' }}>1</span>
          <span className="btn" style={{ fontSize: '13px' }}>2</span>
          <span className="btn" style={{ fontSize: '13px' }}>3</span>
        </div>
      </div>

      <div className="card">
        <div className="category-header" style={{ display: 'grid', gridTemplateColumns: '4fr 1fr 1fr 2fr', padding: '12px 16px' }}>
          <div>Tiêu đề</div>
          <div style={{ textAlign: 'center' }}>Người gửi</div>
          <div style={{ textAlign: 'center' }}>Trả lời / Xem</div>
          <div style={{ textAlign: 'right' }}>Bài cuối</div>
        </div>
        
        <div className="thread-list">
          {threads.map(thread => (
            <div key={thread.id} className="thread-item" style={{ 
              display: 'grid', 
              gridTemplateColumns: '4fr 1fr 1fr 2fr', 
              padding: '16px', 
              borderBottom: '1px solid var(--border-color)',
              alignItems: 'center'
            }}>
              <div className="thread-main" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <FileText size={20} color="var(--primary-color)" />
                <Link to={`/thread/${thread.id}`} style={{ fontWeight: '500', fontSize: '15px' }}>{thread.title}</Link>
              </div>
              <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
                {thread.author}
              </div>
              <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                {thread.replies} / {thread.views.toLocaleString()}
              </div>
              <div style={{ textAlign: 'right', fontSize: '13px', color: 'var(--text-secondary)' }}>
                {thread.lastPost}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Category;
