import React from 'react';

const Footer = () => {
  return (
    <footer style={{
      backgroundColor: 'var(--bg-surface)',
      borderTop: '1px solid var(--border-color)',
      padding: '24px 0',
      marginTop: 'auto',
      textAlign: 'center',
      color: 'var(--text-muted)',
      fontSize: '14px'
    }}>
      <div className="container">
        <p>&copy; {new Date().getFullYear()} VOZ Clone. Giao diện được phát triển trên mục đích học tập.</p>
        <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <a href="#" style={{ color: 'var(--text-secondary)' }}>Điều khoản chung</a>
          <a href="#" style={{ color: 'var(--text-secondary)' }}>Trợ giúp</a>
          <a href="#" style={{ color: 'var(--text-secondary)' }}>Liên hệ</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
