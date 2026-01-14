
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-white border border-brand-border rounded-xl overflow-hidden transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-1' : ''} ${className}`}
    >
      {children}
    </div>
  );
};
