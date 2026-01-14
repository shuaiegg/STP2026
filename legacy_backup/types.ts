
export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  readTime: string;
  content?: string;
  coverImage?: string;
}

export interface Category {
  name: string;
  slug: string;
  description: string;
}
