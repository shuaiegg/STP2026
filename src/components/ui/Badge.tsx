
import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'muted' | 'success';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  const styles = {
    default: "bg-brand-primary-muted text-brand-primary",
    muted: "bg-brand-surface text-brand-text-muted border border-brand-border",
    success: "bg-brand-secondary-muted text-brand-secondary",
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};
