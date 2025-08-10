'use client'

import React, { Suspense } from 'react';
import PanoramicMap from './panoramicMap';

export default function PanoramicMapPage() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'fixed', top: '0', left: '0', zIndex: 1000 }}>
      <Suspense fallback={<div>加载中...</div>}>
        <PanoramicMap />
      </Suspense>
    </div>
  );
} 