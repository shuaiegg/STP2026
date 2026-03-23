
import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'default' | 'muted' | 'success';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '', ...props }) => {
  const styles = {
    default: "bg-brand-primary-muted text-brand-primary",
    muted: "bg-brand-surface text-brand-text-muted border border-brand-border",
    success: "bg-brand-success/10 text-brand-success",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
