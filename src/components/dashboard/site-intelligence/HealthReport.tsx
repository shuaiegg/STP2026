'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import IssueCard from './IssueCard';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface HealthReportProps {
  issueReport: {
    techScore: number;
    contentScore: number;
    seoScore: number;
    issues: any[];
    stats: {
      critical: number;
      warning: number;
      info: number;
    };
  } | null;
  previousIssueReport?: HealthReportProps['issueReport'] | null;
}

export default function HealthReport({ issueReport, previousIssueReport }: HealthReportProps) {
  if (!issueReport) {
    return (
      <Card className="bg-slate-50 border-slate-200 border-dashed p-12 shadow-sm flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <span className="text-xl text-slate-400">?</span>
        </div>
        <h3 className="text-sm font-bold text-slate-900 mb-1">无体检数据</h3>
        <p className="text-xs text-slate-500 max-w-xs">
          此次历史审计无体检数据，请重新扫描网站以生成最新的健康报告。
        </p>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-100';
    if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-red-600 bg-red-50 border-red-100';
  };

  const scoreCards = [
    { label: '技术健康', score: issueReport.techScore },
    { label: '内容质量', score: issueReport.contentScore },
    { label: 'SEO 合规', score: issueReport.seoScore },
  ];

  // Calculate Delta
  let deltaInfo = null;
  if (previousIssueReport) {
    const currentCodes = new Set(issueReport.issues.map(i => i.code));
    const previousCodes = new Set(previousIssueReport.issues.map(i => i.code));

    const newIssues = Array.from(currentCodes).filter(code => !previousCodes.has(code));
    const fixedIssues = Array.from(previousCodes).filter(code => !currentCodes.has(code));

    deltaInfo = {
      newCount: newIssues.length,
      fixedCount: fixedIssues.length
    };
  }

  return (
    <div className="space-y-6">
      {/* Delta Banner */}
      {deltaInfo && (
        <Card className="px-4 py-3 border-slate-200 bg-slate-50/50 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">对比上次审计</span>
            <div className="h-3 w-[1px] bg-slate-200 mx-1" />
            <div className="flex items-center gap-4">
              {deltaInfo.newCount === 0 && deltaInfo.fixedCount === 0 ? (
                <div className="flex items-center gap-1.5">
                  <Minus className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-bold text-slate-600">与上次审计相比无变化</span>
                </div>
              ) : (
                <>
                  {deltaInfo.newCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                      <span className="text-xs font-bold text-slate-700">新增 {deltaInfo.newCount} 个问题</span>
                    </div>
                  )}
                  {deltaInfo.fixedCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-xs font-bold text-slate-700">修复了 {deltaInfo.fixedCount} 个问题</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          {deltaInfo.fixedCount > 0 && deltaInfo.newCount === 0 && issueReport.issues.length === 0 && (
            <Badge className="bg-emerald-500 text-white border-0 text-[10px] font-bold animate-pulse">
              全部修复 ✓
            </Badge>
          )}
        </Card>
      )}

      {/* Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scoreCards.map((card, idx) => (
          <Card key={idx} className={`p-6 flex flex-col items-center justify-center gap-2 border shadow-sm ${getScoreColor(card.score)}`}>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{card.label}</span>
            <div className="text-4xl font-black tracking-tight">{card.score}</div>
          </Card>
        ))}
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">检测发现的问题 ({issueReport.issues.length})</h3>
          <div className="flex gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-[10px] font-bold text-slate-500">{issueReport.stats.critical} 严重</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[10px] font-bold text-slate-500">{issueReport.stats.warning} 警告</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[10px] font-bold text-slate-500">{issueReport.stats.info} 提示</span>
            </div>
          </div>
        </div>

        {issueReport.issues.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {issueReport.issues.map((issue, idx) => (
              <IssueCard key={idx} {...issue} />
            ))}
          </div>
        ) : (
          <Card className="p-12 border-dashed border-green-200 bg-green-50/30 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <span className="text-xl text-green-600">✓</span>
            </div>
            <h3 className="text-sm font-bold text-green-800">未发现问题</h3>
            <p className="text-xs text-green-600/70">
              您的网站在本次审计中表现完美，未检测到任何 SEO 风险。
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
