import React from 'react';
import Link from 'next/link';

const Navigation: React.FC = () => {
  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '20px',
      zIndex: 1000
    }}>
      <Link 
        href="/" 
        style={{
          display: 'inline-block',
          padding: '8px 16px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '5px',
          fontSize: '14px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        ← 返回首页
      </Link>
    </div>
  );
};

export default Navigation; 