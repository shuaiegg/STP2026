
import React from 'react';
import { Button } from './ui/Button';

interface CTAProps {
  title: string;
  description: string;
  buttonText: string;
  variant?: 'inline' | 'section';
}

export const CTA: React.FC<CTAProps> = ({ title, description, buttonText, variant = 'section' }) => {
  if (variant === 'inline') {
    return (
      <div className="my-12 p-8 bg-brand-surface border border-brand-border rounded-xl flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1">
          <h4 className="text-xl font-bold text-brand-text-primary mb-2">{title}</h4>
          <p className="text-brand-text-secondary text-sm">{description}</p>
        </div>
        <Button size="md">{buttonText}</Button>
      </div>
    );
  }

  return (
    <section className="py-16 bg-brand-primary text-white text-center">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="text-3xl font-bold mb-4">{title}</h2>
        <p className="text-brand-primary-muted mb-8 max-w-2xl mx-auto">
          {description}
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <input 
            type="email" 
            placeholder="输入您的邮箱" 
            className="px-6 py-2.5 rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary-muted w-full sm:w-64"
          />
          <Button variant="secondary">{buttonText}</Button>
        </div>
      </div>
    </section>
  );
};
