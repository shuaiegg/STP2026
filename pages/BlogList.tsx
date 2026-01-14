
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MOCK_POSTS, CATEGORIES } from '../constants';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const BlogList: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredPosts = activeCategory === 'all' 
    ? MOCK_POSTS 
    : MOCK_POSTS.filter(p => p.category === CATEGORIES.find(c => c.slug === activeCategory)?.name);

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <header className="mb-16">
        <h1 className="text-4xl sm:text-5xl font-bold text-brand-text-primary mb-4 tracking-tight">博客文章</h1>
        <p className="text-xl text-brand-text-secondary max-w-2xl leading-relaxed">
          深入解析数字化营销中的工程实践、SEO 算法与增长模型。
        </p>
      </header>

      <div className="flex overflow-x-auto no-scrollbar gap-2 mb-12 border-b border-brand-border pb-4">
        <button 
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 text-sm font-bold transition-all whitespace-nowrap border-b-2 ${activeCategory === 'all' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-text-muted hover:text-brand-text-secondary'}`}
        >
          全部文章
        </button>
        {CATEGORIES.map(cat => (
          <button 
            key={cat.slug}
            onClick={() => setActiveCategory(cat.slug)}
            className={`px-4 py-2 text-sm font-bold transition-all whitespace-nowrap border-b-2 ${activeCategory === cat.slug ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-text-muted hover:text-brand-text-secondary'}`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {filteredPosts.map(post => (
          <Link key={post.slug} to={`/blog/${post.slug}`}>
            <Card className="h-full flex flex-col group">
              <div className="aspect-[16/9] overflow-hidden bg-brand-surface relative">
                <img 
                  src={post.coverImage} 
                  alt={post.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-4 left-4">
                  <Badge variant="default">{post.category}</Badge>
                </div>
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <h3 className="text-2xl font-bold text-brand-text-primary mb-4 group-hover:text-brand-primary transition-colors leading-snug">
                  {post.title}
                </h3>
                <p className="text-brand-text-secondary text-sm leading-relaxed mb-6 line-clamp-2">
                  {post.excerpt}
                </p>
                <div className="mt-auto flex items-center justify-between pt-6 border-t border-brand-border text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
                  <span>{post.publishedAt}</span>
                  <span>阅读时间 {post.readTime}</span>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="flex justify-center">
        <Button variant="outline">加载更多文章</Button>
      </div>
    </div>
  );
};
