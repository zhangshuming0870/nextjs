import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="not-found-page">
      <div className="container">
        <div className="not-found-content">
          <div className="not-found-icon"><i className="bi bi-search"></i></div>
          <h1 className="not-found-title">404</h1>
          <h2 className="not-found-subtitle">页面未找到</h2>
          <p className="not-found-description">
            抱歉，您访问的页面不存在或已被移动。
          </p>
          <div className="not-found-actions">
            <Link href="/" className="btn btn-primary">
              返回首页
            </Link>
            <Link href="/contact" className="btn btn-outline">
              联系我们
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 