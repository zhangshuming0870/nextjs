import type { Metadata } from "next";
import './styles/theme.scss';
import './style.scss';
import 'bootstrap-icons/font/bootstrap-icons.css';
import ThemeToggle from './components/ThemeToggle';
import Navigation from './components/Navigation';

export const metadata: Metadata = {
  title: "Next.js 应用",
  description: "基于Next.js的现代化Web应用",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="app-layout">
          <Navigation />
          <div className="main-content">
            {children}
          </div>
        </div>
        <ThemeToggle />
      </body>
    </html>
  );
}
