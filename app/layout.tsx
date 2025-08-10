import type { Metadata } from "next";
import './styles/theme.scss';
import './style.scss';
import 'bootstrap-icons/font/bootstrap-icons.css';
import ThemeToggle from './components/ThemeToggle';
import Navigation from './components/Navigation';
import Record from "./components/Record";
import Script from "next/script";

export const metadata: Metadata = {
  title: "zhangshuming-site",
  description: "基于Next.js的现代化Web应用",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        {/*Google tag (gtag.js) */}
        <Script strategy="afterInteractive" src="https://www.googletagmanager.com/gtag/js?id=G-QBQNS3Q63T"></Script>
        <Script strategy="afterInteractive">
          {
            `
              window.dataLayer = window.dataLayer || [];
              function gtag(){console.log(arguments);dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-QBQNS3Q63T');
            `
          }

        </Script>
        <Script>
          {
            `
            <!-- Google Tag Manager -->
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-N39TQ8TD');
<!-- End Google Tag Manager -->
            `
          }
        </Script>

      </head>
      <body>
        {/* <!-- Google Tag Manager (noscript) --> */}
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-N39TQ8TD"
          height="0" width="0" style={{ display: 'none', visibility: 'hidden' }}></iframe></noscript>
        {/* <!-- Google Tag Manager (noscript) --> */}
        <div className="app-layout">
          <Navigation />
          <div className="main-content">
            {children}
          </div>
          <Record />
        </div>
        <ThemeToggle />
      </body>
    </html>
  );
}
