import React from 'react';

interface HealthScoreBadgeProps {
  score: number | null;
  className?: string;
}

export function HealthScoreBadge({ score, className = "" }: HealthScoreBadgeProps) {
  if (score === null) {
    return (
      <span className={`inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500 ${className}`}>
        未评分
      </span>
    );
  }

  let colorClass = "";
  if (score >= 80) {
    colorClass = "bg-emerald-100 text-emerald-700";
  } else if (score >= 60) {
    colorClass = "bg-amber-100 text-amber-700";
  } else {
    colorClass = "bg-red-100 text-red-600";
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass} ${className}`}>
      {score}
    </span>
  );
}
