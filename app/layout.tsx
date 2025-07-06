import type { Metadata } from "next";
import './styles/theme.scss';
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
          <main className="main-content">
            {children}
          </main>
        </div>
        <ThemeToggle />
      </body>
    </html>
  );
}
