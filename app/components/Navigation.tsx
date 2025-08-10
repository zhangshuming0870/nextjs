'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Navigation = () => {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: '首页', icon: 'bi-house' },
    { href: '/blog', label: '博客', icon: 'bi-journal-text', external: 'https://zhangshuming-blog.vercel.app/post.html' },
    { href: '/projects', label: '项目', icon: 'bi-briefcase' },
    { href: '/work', label: '工作台', icon: 'bi-info-circle'},
    { href: '/about', label: '关于我', icon: 'bi-info-circle', external: 'https://zhangshuming-blog.vercel.app/me.html' },
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
            <span className="logo-icon"><i className="bi bi-lightning-charge-fill"></i></span>
            <span className="logo-text">zhangshuming的网站</span>
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
                    <span className="nav-icon"><i className={`bi ${item.icon}`}></i></span>
                    <span className="nav-label">{item.label}</span>
                  </a>
                ) : item.href === '/projects' ? (
                  <a 
                    href="#"
                    className={`nav-link ${pathname === item.href ? 'active' : ''}`}
                    onClick={handleProjectClick}
                  >
                    <span className="nav-icon"><i className={`bi ${item.icon}`}></i></span>
                    <span className="nav-label">{item.label}</span>
                  </a>
                ) : (
                  <Link 
                    href={item.href}
                    className={`nav-link ${pathname === item.href ? 'active' : ''}`}
                  >
                    <span className="nav-icon"><i className={`bi ${item.icon}`}></i></span>
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