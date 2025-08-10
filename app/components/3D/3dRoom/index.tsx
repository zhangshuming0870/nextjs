import React from 'react';
import ThreeScene from './ThreeScene';

const ThreeDRoom: React.FC = () => {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <ThreeScene />
      {/* <Navigation /> */}
    </div>
  );
};

export default ThreeDRoom; 