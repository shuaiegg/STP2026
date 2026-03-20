'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ChevronDown, ChevronUp, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export type Severity = 'critical' | 'warning' | 'info';

export interface AffectedPage {
  url: string;
  detail?: string;
}

export interface IssueCardProps {
  code: string;
  severity: Severity;
  title: string;
  explanation: string;
  howToFix: string;
  affectedPages: AffectedPage[];
}

export default function IssueCard({
  severity,
  title,
  explanation,
  howToFix,
  affectedPages
}: IssueCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getSeverityStyles = (sev: Severity) => {
    switch (sev) {
      case 'critical':
        return {
          badge: 'bg-red-500/10 text-red-600 border-red-200',
          icon: <AlertCircle className="w-5 h-5 text-red-500" />,
          label: '严重'
        };
      case 'warning':
        return {
          badge: 'bg-amber-500/10 text-amber-600 border-amber-200',
          icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
          label: '警告'
        };
      case 'info':
      default:
        return {
          badge: 'bg-blue-500/10 text-blue-600 border-blue-200',
          icon: <Info className="w-5 h-5 text-blue-500" />,
          label: '提示'
        };
    }
  };

  const styles = getSeverityStyles(severity);

  return (
    <Card className="bg-white border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div 
        className="p-4 cursor-pointer flex items-start justify-between gap-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex gap-3 items-start">
          <div className="mt-0.5">{styles.icon}</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className={`${styles.badge} text-[10px] py-0 px-1.5 font-bold border`}>
                {styles.label}
              </Badge>
              <h4 className="text-sm font-bold text-slate-900">{title}</h4>
            </div>
            <p className="text-xs text-slate-500 line-clamp-1">
              影响 {affectedPages.length} 个页面
            </p>
          </div>
        </div>
        <div className="text-slate-400 mt-1">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-50 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="space-y-2">
            <h5 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">问题说明</h5>
            <p className="text-xs text-slate-600 leading-relaxed">{explanation}</p>
          </div>

          <div className="space-y-2">
            <h5 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">修复建议</h5>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <p className="text-xs text-slate-700 font-medium leading-relaxed">{howToFix}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h5 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">受影响页面 ({affectedPages.length})</h5>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {affectedPages.map((page, idx) => (
                <div key={idx} className="flex flex-col gap-0.5 py-1.5 px-2 bg-slate-50/50 rounded-md border border-slate-100/50">
                  <a 
                    href={page.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[11px] text-brand-primary hover:underline font-mono break-all line-clamp-1"
                  >
                    {page.url}
                  </a>
                  {page.detail && (
                    <span className="text-[10px] text-slate-400 font-medium">{page.detail}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
