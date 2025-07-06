export default function BlogPage() {
  const blogPosts = [
    {
      id: 1,
      title: 'Next.js 13 新特性详解',
      excerpt: '探索 Next.js 13 中的 App Router、Server Components 等新功能...',
      date: '2024-01-15',
      author: '张三',
      category: '技术',
      readTime: '5分钟'
    },
    {
      id: 2,
      title: 'TypeScript 最佳实践',
      excerpt: '分享在大型项目中使用 TypeScript 的经验和技巧...',
      date: '2024-01-10',
      author: '李四',
      category: '编程',
      readTime: '8分钟'
    },
    {
      id: 3,
      title: '现代 CSS 技术趋势',
      excerpt: '了解最新的 CSS 技术，包括 Grid、Flexbox 和 CSS 变量...',
      date: '2024-01-05',
      author: '王五',
      category: '前端',
      readTime: '6分钟'
    },
    {
      id: 4,
      title: 'React 性能优化指南',
      excerpt: '深入探讨 React 应用性能优化的各种技巧和方法...',
      date: '2024-01-01',
      author: '赵六',
      category: 'React',
      readTime: '10分钟'
    }
  ];

  return (
    <div className="blog-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">博客文章</h1>
          <p className="page-subtitle">分享技术见解和开发经验</p>
        </div>

        <div className="blog-filters">
          <div className="filter-group">
            <label>分类：</label>
            <select className="filter-select">
              <option value="">全部</option>
              <option value="技术">技术</option>
              <option value="编程">编程</option>
              <option value="前端">前端</option>
              <option value="React">React</option>
            </select>
          </div>
          <div className="filter-group">
            <label>排序：</label>
            <select className="filter-select">
              <option value="latest">最新</option>
              <option value="oldest">最早</option>
              <option value="popular">最热</option>
            </select>
          </div>
        </div>

        <div className="blog-grid">
          {blogPosts.map((post) => (
            <article key={post.id} className="blog-card">
              <div className="blog-card-header">
                <span className="blog-category">{post.category}</span>
                <span className="blog-read-time">{post.readTime}</span>
              </div>
              <h2 className="blog-title">{post.title}</h2>
              <p className="blog-excerpt">{post.excerpt}</p>
              <div className="blog-meta">
                <span className="blog-author">作者：{post.author}</span>
                <span className="blog-date">{post.date}</span>
              </div>
              <button className="btn btn-outline">阅读更多</button>
            </article>
          ))}
        </div>

        <div className="pagination">
          <button className="btn btn-outline" disabled>上一页</button>
          <span className="page-info">第 1 页，共 1 页</span>
          <button className="btn btn-outline" disabled>下一页</button>
        </div>
      </div>
    </div>
  );
} 