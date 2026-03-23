
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps & { as?: React.ElementType }> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  as: Component = 'button',
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-semibold transition-all duration-300 rounded-lg active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none tracking-tight";

  const variants = {
    primary: "bg-brand-secondary text-white hover:bg-brand-secondary-hover shadow-sm",
    secondary: "bg-brand-accent text-white hover:bg-brand-accent-hover shadow-sm",
    gradient: "bg-brand-primary text-white hover:bg-brand-primary-hover shadow-sm",
    outline: "border border-brand-border text-brand-text-secondary hover:bg-brand-surface hover:text-brand-text-primary hover:border-brand-text-muted",
    ghost: "text-brand-text-secondary hover:bg-brand-surface hover:text-brand-text-primary",
  };

  const sizes = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-2.5 text-sm",
    lg: "px-8 py-3.5 text-base",
  };

  return (
    <Component
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};
