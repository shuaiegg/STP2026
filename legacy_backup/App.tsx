
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { MainLayout } from './layout/MainLayout';
import { Home } from './pages/Home';
import { BlogList } from './pages/BlogList';
import { BlogPost } from './pages/BlogPost';
import { CategoryPage } from './pages/CategoryPage';
import { PreviewPage } from './pages/PreviewPage';

const App: React.FC = () => {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blog" element={<BlogList />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/blog/category/:slug" element={<CategoryPage />} />
          <Route path="/preview/:token" element={<PreviewPage />} />
          {/* Placeholder routes for future expansion */}
          <Route path="/course" element={<div className="p-20 text-center font-bold min-h-[60vh]">课程模块正在紧张开发中，敬请期待。</div>} />
          <Route path="/tools" element={<div className="p-20 text-center font-bold min-h-[60vh]">数字化工具包开发中...</div>} />
        </Routes>
      </MainLayout>
    </Router>
  );
};

export default App;
