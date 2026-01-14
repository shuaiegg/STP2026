
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { CATEGORIES, MOCK_POSTS } from '../constants';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const category = CATEGORIES.find(c => c.slug === slug);
  const posts = MOCK_POSTS.filter(p => p.category === category?.name);

  if (!category) return <div className="p-20 text-center">分类不存在</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <header className="mb-16 max-w-3xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-1.5 h-10 bg-brand-primary rounded-full"></div>
          <h1 className="text-4xl font-bold text-brand-text-primary tracking-tight">{category.name}</h1>
        </div>
        <p className="text-xl text-brand-text-secondary leading-relaxed">
          {category.description}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map(post => (
          <Link key={post.slug} to={`/blog/${post.slug}`}>
            <Card className="h-full flex flex-col group">
              <div className="aspect-[16/10] bg-brand-surface overflow-hidden">
                <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-brand-text-primary mb-3 group-hover:text-brand-primary transition-colors">
                  {post.title}
                </h3>
                <p className="text-sm text-brand-text-secondary mb-4 line-clamp-2 leading-relaxed">
                  {post.excerpt}
                </p>
                <div className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">
                  {post.publishedAt}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-20 p-12 bg-brand-primary rounded-2xl text-white flex flex-col md:flex-row items-center gap-8 shadow-xl shadow-brand-primary/10">
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-2xl font-bold mb-2">掌握规模化 {category.name} 技术</h3>
          <p className="text-brand-primary-muted">领取我们的内部实战框架，专为高增长工程团队设计。</p>
        </div>
        <button className="bg-white text-brand-primary px-8 py-3 rounded-lg font-bold hover:bg-brand-primary-muted transition-colors">
          立即免费获取
        </button>
      </div>
    </div>
  );
};
