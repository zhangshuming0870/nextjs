import './style.scss';

export default function Three3DLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="demo-container">{children}</div>;
}

