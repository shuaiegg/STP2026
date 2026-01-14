
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-semibold transition-all duration-300 rounded-lg active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none tracking-tight";
  
  const variants = {
    primary: "bg-brand-primary text-white hover:bg-brand-primary-hover shadow-lg shadow-brand-primary/20",
    secondary: "bg-brand-secondary text-white hover:opacity-90 shadow-lg shadow-brand-secondary/20",
    gradient: "bg-gradient-brand text-white hover:opacity-90 shadow-xl shadow-brand-primary/25",
    outline: "border border-brand-border text-brand-text-secondary hover:bg-brand-surface hover:text-brand-primary hover:border-brand-primary/30",
    ghost: "text-brand-text-secondary hover:bg-brand-surface hover:text-brand-primary",
  };

  const sizes = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-2.5 text-sm",
    lg: "px-8 py-3.5 text-base",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
