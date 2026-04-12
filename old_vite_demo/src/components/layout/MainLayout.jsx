import React from 'react';
import Header from './Header';
import Footer from './Footer';

const MainLayout = ({ children }) => {
  return (
    <div className="layout-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main className="container" style={{ flex: 1, padding: '20px 16px', marginTop: '60px' }}>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
