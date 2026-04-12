import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, User, Bell, Menu, X } from 'lucide-react';
import './Header.css';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="header" style={{
      position: 'fixed',
      top: 0,
      width: '100%',
      backgroundColor: 'var(--bg-header)',
      color: '#ffffff',
      zIndex: 50,
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div className="container header-container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '60px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button 
            className="mobile-menu-btn btn-ghost" 
            style={{ color: '#ffffff', padding: '0' }}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <Link to="/" style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>
            VOZ<span style={{ color: 'var(--primary-hover)' }}>.vn</span>
          </Link>
          <nav className={`main-nav ${isMobileMenuOpen ? 'open' : ''}`}>
            <Link to="/" className="nav-link">Diễn đàn</Link>
            <Link to="#" className="nav-link">Có gì mới</Link>
            <Link to="#" className="nav-link">Thành viên</Link>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="search-bar" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input 
              type="text" 
              placeholder="Tìm kiếm..." 
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(255,255,255,0.2)',
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: '#fff',
                outline: 'none',
                width: '200px'
              }} 
            />
            <Search size={16} style={{ position: 'absolute', right: '10px', color: '#ccc' }} />
          </div>
          
          <div className="auth-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="btn btn-ghost" style={{ color: '#fff', padding: '4px' }}>
              <Bell size={20} />
            </button>
            <Link to="/profile" className="btn btn-ghost" style={{ color: '#fff', padding: '4px' }}>
              <User size={20} />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
