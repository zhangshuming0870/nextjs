'use client'

import React from 'react';
import Bedroom from './bedroom';

export default function BedroomPage() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'fixed', top: '0', left: '0', zIndex: 1000 }}>
      <Bedroom />
      {/* <Navigation /> */}
    </div>
  );
} 