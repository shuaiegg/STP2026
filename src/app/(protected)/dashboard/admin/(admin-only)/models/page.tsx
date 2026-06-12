import React from 'react';
import { Cpu } from 'lucide-react';
import { getProviderStatuses, getModelConfigs } from './actions';
import { ProviderStatusCards } from './ProviderStatusCards';
import { ContextModelAssignment } from './ContextModelAssignment';
import { VpsModelList } from './VpsModelList';

const COPY = {
  title: '模型管理',
  subtitle: '管理各 AI Provider 连接状态，并为不同业务上下文分配模型。',
  sections: {
    providers: 'Provider 状态',
    contexts: '业务上下文模型分配',
    vpsModels: 'CLIProxy 可用模型',
  },
};

export default async function ModelsPage() {
  const [providerStatuses, modelConfigs] = await Promise.all([
    getProviderStatuses(),
    getModelConfigs(),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-brand-primary/10 text-brand-primary mt-0.5">
          <Cpu size={22} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-brand-text-primary font-display">{COPY.title}</h1>
          <p className="text-brand-text-secondary mt-1">{COPY.subtitle}</p>
        </div>
      </div>

      {/* Provider status */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-brand-text-muted uppercase tracking-widest">
          {COPY.sections.providers}
        </h2>
        <ProviderStatusCards statuses={providerStatuses} />
        <p className="text-xs text-brand-text-muted">
          API Key 在服务器环境变量中配置（<code className="bg-brand-surface-alt px-1 rounded">.env.local</code> 或 Vercel 面板）。VPS Key 不存入数据库。
        </p>
      </section>

      {/* Context assignments */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-brand-text-muted uppercase tracking-widest">
          {COPY.sections.contexts}
        </h2>
        <ContextModelAssignment initialConfigs={modelConfigs} />
        <p className="text-xs text-brand-text-muted">
          优先级：per-skill SkillConfig.model &gt; ModelConfig[skill:id] &gt; ModelConfig[skill_default] &gt; 代码兜底
        </p>
      </section>

      {/* VPS model list */}
      <section className="space-y-4 bg-brand-surface-alt/50 rounded-xl p-6">
        <h2 className="text-sm font-bold text-brand-text-muted uppercase tracking-widest">
          {COPY.sections.vpsModels}
        </h2>
        <VpsModelList />
        <p className="text-xs text-brand-text-muted">
          点击模型 ID 右侧复制按钮，可将 ID 粘贴到上方「业务上下文」的模型输入框中。
        </p>
      </section>
    </div>
  );
}
