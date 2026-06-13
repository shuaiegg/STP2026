import React from 'react';
import { Mail, Activity, Workflow, Database, MessageSquare } from 'lucide-react';
import { IntegrationCard, type IntegrationStatus } from './IntegrationCard';
import { SystemeTagRules } from './SystemeTagRules';
import {
  sendTestEmail,
  testSystemeIoConnection,
  saveSystemeApiKey,
  deleteSystemeApiKey,
  getSystemeKeyMasked,
  isSystemeConfiguredInDb,
  testSystemeIoConnectionEn,
  saveSystemeApiKeyEn,
  deleteSystemeApiKeyEn,
  getSystemeKeyMaskedEn,
  isSystemeConfiguredInDbEn,
  getTagRules,
} from './actions';

// ─── COPY ─────────────────────────────────────────────────────────────────────

const COPY = {
  title: '集成管理',
  subtitle: '管理外部服务连接。API Key 加密存储于数据库，优先级高于环境变量。',
  sections: {
    email: '邮件与营销',
    analytics: '数据分析',
    automation: '自动化',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function envStatus(envVar: string): 'connected' | 'missing' {
  return process.env[envVar] ? 'connected' : 'missing';
}

function resolvedStatus(dbConfigured: boolean, envVar: string): IntegrationStatus {
  if (dbConfigured) return 'connected';
  return envStatus(envVar);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function IntegrationsPage() {
  const resendStatus = envStatus('RESEND_API_KEY');
  const posthogStatus = envStatus('NEXT_PUBLIC_POSTHOG_KEY');
  const notionStatus = envStatus('NOTION_API_KEY');

  // systeme.io: check DB first（双账户：默认/中文 + 英文）
  const [systemeInDb, systemeKeyMasked, systemeEnInDb, systemeEnKeyMasked, tagRules] = await Promise.all([
    isSystemeConfiguredInDb(),
    getSystemeKeyMasked(),
    isSystemeConfiguredInDbEn(),
    getSystemeKeyMaskedEn(),
    getTagRules(),
  ]);
  const systemeStatus = resolvedStatus(systemeInDb, 'SYSTEME_IO_API_KEY');
  const systemeEnStatus = resolvedStatus(systemeEnInDb, 'SYSTEME_IO_API_KEY_EN');

  const envRows: [string, IntegrationStatus][] = [
    ['RESEND_API_KEY', resendStatus],
    ['SYSTEME_IO_API_KEY', systemeStatus],
    ['NEXT_PUBLIC_POSTHOG_KEY', posthogStatus],
    ['NOTION_API_KEY', notionStatus],
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-brand-text-primary mb-2 font-display">{COPY.title}</h1>
        <p className="text-brand-text-secondary">{COPY.subtitle}</p>
      </div>

      {/* Email & Marketing */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-brand-text-muted uppercase tracking-widest">{COPY.sections.email}</h2>

        <IntegrationCard
          name="Resend"
          description="事务邮件服务：欢迎邮件、积分预警、购买确认、审计完成通知。发件地址为 noreply@mail.scaletotop.com。"
          status={resendStatus}
          envVar="RESEND_API_KEY"
          testAction={sendTestEmail}
          testLabel="发送测试邮件"
          notes="触发点：注册成功 / 积分 <50（24h 节流）/ 购买成功 / 审计完成"
          icon={<Mail size={20} />}
        />

        <IntegrationCard
          name="systeme.io（中文 / 默认账户）"
          description="营销自动化平台 — 中文联系人账户。中文用户注册/咨询后自动同步为联系人并打标签，触发中文自动化邮件序列。"
          status={systemeStatus}
          testAction={systemeInDb ? testSystemeIoConnection : undefined}
          testLabel="测试连接"
          notes="触发点：注册成功 / 首次站点保存（onboarding_completed）。locale≠en 的联系人进此账户。"
          apiKeyEditor={{
            maskedValue: systemeKeyMasked,
            onSave: saveSystemeApiKey,
            onDelete: deleteSystemeApiKey,
          }}
          extra={systemeInDb ? <SystemeTagRules initialRules={tagRules} /> : undefined}
          icon={<MessageSquare size={20} />}
        />

        <IntegrationCard
          name="systeme.io（English 账户）"
          description="营销自动化平台 — 英文联系人账户。locale=en 的用户注册/咨询后进入此独立账户，便于维护独立的英文邮件序列。未配置时英文联系人将跳过同步（不污染中文账户）。"
          status={systemeEnStatus}
          testAction={systemeEnInDb ? testSystemeIoConnectionEn : undefined}
          testLabel="测试连接"
          notes="标签规则与中文账户共用同一套触发→标签名映射（上方配置），两个账户内需各自建好相同的基础标签名。"
          apiKeyEditor={{
            maskedValue: systemeEnKeyMasked,
            onSave: saveSystemeApiKeyEn,
            onDelete: deleteSystemeApiKeyEn,
          }}
          icon={<MessageSquare size={20} />}
        />
      </section>

      {/* Analytics */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-brand-text-muted uppercase tracking-widest">{COPY.sections.analytics}</h2>

        <IntegrationCard
          name="PostHog"
          description="产品分析平台：追踪获客→激活→付费全链路事件，覆盖注册、onboarding、首次站点、GSC/GA4 连接、积分充值、AI Skill 调用等 11 类事件。"
          status={posthogStatus}
          envVar="NEXT_PUBLIC_POSTHOG_KEY"
          notes="通过环境变量配置，暂不支持 DB 管理。客户端 posthog-js + 服务端 posthog-node 双路追踪。"
          icon={<Activity size={20} />}
        />

        <IntegrationCard
          name="Notion"
          description="内容数据源：通过 NOTION_API_KEY 和 NOTION_DATABASE_ID 定期同步文章内容，支持增量同步和图片自动迁移到 MinIO。"
          status={notionStatus}
          envVar="NOTION_API_KEY"
          notes="管理入口：/admin/sync"
          icon={<Database size={20} />}
        />
      </section>

      {/* Automation */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-brand-text-muted uppercase tracking-widest">{COPY.sections.automation}</h2>

        <IntegrationCard
          name="n8n"
          description="工作流自动化：计划用于再营销 Workflow（7天/14天未活跃用户打标签）和知识库同步（pgvector embedding 批量生成）。代码端接口已就绪，Workflow 配置待完成。"
          status="placeholder"
          notes="待配置：inactive_7d / inactive_14d 再营销 Workflow（Sprint 2.5）"
          icon={<Workflow size={20} />}
        />
      </section>

      {/* Environment Guide */}
      <section className="bg-brand-surface-alt rounded-xl p-6 space-y-3">
        <h3 className="text-sm font-bold text-brand-text-primary">配置状态总览</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
          {envRows.map(([key, status]) => (
            <div key={key} className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                status === 'connected' ? 'bg-brand-success' : 'bg-brand-error'
              }`} />
              <span className="text-brand-text-secondary">{key}</span>
              {key === 'SYSTEME_IO_API_KEY' && systemeInDb && (
                <span className="text-brand-success text-[10px] font-sans">（DB）</span>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-brand-text-muted">
          systeme.io API Key 可直接在上方配置。其他 Key 在{' '}
          <code className="bg-brand-surface px-1 rounded">.env.local</code>（本地）或 Vercel 环境变量面板（生产）中设置。
        </p>
      </section>
    </div>
  );
}
