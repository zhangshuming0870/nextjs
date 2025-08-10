import React from 'react';
import Link from 'next/link';

const Home: React.FC = () => {
  return (
    <div style={{ 
      padding: '50px', 
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      
      <div style={{ 
        marginTop: '40px',
        padding: '30px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '15px',
        backdropFilter: 'blur(10px)',
        maxWidth: '600px',
        margin: '40px auto 0'
      }}>
        <h3>房间特色</h3>
        <ul style={{ textAlign: 'left', lineHeight: '1.8' }}>
          <li>舒适的床铺和床头柜</li>
          <li>经典的闹钟</li>
          <li>学习用的书桌和椅子</li>
          <li>实用的衣柜</li>
          <li>温馨的台灯照明</li>
          <li> 自然采光的窗户</li>
        </ul>
      </div>

      <div style={{ 
        marginTop: '30px',
        padding: '20px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '15px',
        backdropFilter: 'blur(10px)',
        maxWidth: '600px',
        margin: '20px auto 0'
      }}>
        <h3>🎮 控制说明</h3>
        <div style={{ textAlign: 'left', lineHeight: '1.8' }}>
          <p><strong>鼠标控制：</strong></p>
          <ul>
            <li>点击屏幕锁定鼠标</li>
            <li>移动鼠标控制视角</li>
            <li>按ESC退出鼠标锁定</li>
          </ul>
          <p><strong>键盘控制：</strong></p>
          <ul>
            <li>W - 前进</li>
            <li>S - 后退</li>
            <li>A - 左移</li>
            <li>D - 右移</li>
            <li>空格 - 上升</li>
            <li>Shift - 下降</li>
          </ul>
        </div>
      </div>
      
      <div style={{ marginTop: '30px' }}>
        <Link 
          href="/" 
          style={{
            display: 'inline-block',
            padding: '15px 30px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '25px',
            fontSize: '18px',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          进入房间 →
        </Link>
        <Link 
          href="/3D/bedroom" 
          style={{
            display: 'inline-block',
            padding: '15px 30px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '25px',
            fontSize: '18px',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)',
            marginRight: '15px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          进入房间 →
        </Link>
        <Link 
          href="/3D/panoramicMap" 
          style={{
            display: 'inline-block',
            padding: '15px 30px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '25px',
            fontSize: '18px',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          全景地图 →
        </Link>
      </div>
      
      <div style={{ marginTop: '20px', fontSize: '14px', opacity: 0.8 }}>
        <p>💡 提示：点击进入房间后，再次点击屏幕开始自由探索</p>
      </div>
    </div>
  );
};

export default Home; 