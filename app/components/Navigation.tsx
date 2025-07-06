'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Navigation = () => {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: '首页', icon: '🏠' },
    { href: '/blog', label: '博客', icon: '📝', external: 'https://zhangshuming0870.github.io/post' },
    { href: '/projects', label: '项目', icon: '💼' },
    { href: '/about', label: '关于我', icon: 'ℹ️', external: 'https://zhangshuming0870.github.io/me' },
  ];

  const handleProjectClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    alert('暂未开启');
  };

  return (
    <nav className="navigation">
      <div className="container">
        <div className="nav-content">
          <Link href="/" className="nav-logo">
            <span className="logo-icon">🚀</span>
            <span className="logo-text">NextApp</span>
          </Link>
          
          <ul className="nav-menu">
            {navItems.map((item) => (
              <li key={item.href}>
                {item.external ? (
                  <a
                    href={item.external}
                    className={`nav-link ${pathname === item.href ? 'active' : ''}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </a>
                ) : item.href === '/projects' ? (
                  <a 
                    href="#"
                    className={`nav-link ${pathname === item.href ? 'active' : ''}`}
                    onClick={handleProjectClick}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </a>
                ) : (
                  <Link 
                    href={item.href}
                    className={`nav-link ${pathname === item.href ? 'active' : ''}`}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 