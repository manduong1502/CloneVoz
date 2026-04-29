"use client";

export default function GlobalError({ error, reset }) {
  return (
    <html>
      <body style={{ backgroundColor: '#0f1214', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center', maxWidth: '500px', padding: '40px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Đã xảy ra lỗi</h2>
          <p style={{ color: '#999', marginBottom: '24px' }}>{error?.message || 'Lỗi không xác định. Vui lòng thử lại.'}</p>
          <button 
            onClick={() => reset()} 
            style={{ backgroundColor: '#183254', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
          >
            Thử lại
          </button>
        </div>
      </body>
    </html>
  );
}
