'use server';

import prisma from '@/lib/prisma';
import { sendConsultationNotification, sendConsultationConfirmation } from '@/lib/email';
import { addContact } from '@/lib/email/systeme';
import { getIntegrationValue } from '@/lib/integrations/config';

// ─── Service-specific detail types ───────────────────────────────────────────

export interface AIDetails {
  scenario: string;       // 想自动化的业务场景 (→ description)
  tools?: string;         // 目前在用的工具/系统
  painPoints?: string;    // 主要痛点
  deliveryType?: string;  // 期望交付形式
}

export interface CrawlerDetails {
  dataSources: string;      // 目标数据来源 (→ description)
  dataUse?: string;         // 数据用途
  frequency?: string;       // 采集频率
  deliveryFormat?: string;  // 交付格式
  dataVolume?: string;      // 数据量估算
}

export interface GrowthDetails {
  website?: string;         // 网站地址 (→ website field)
  competitors: string;      // 竞争对手/参考网站 (→ description)
  targetMarket?: string;    // 目标市场
  currentTraffic?: string;  // 当前月访问量
  mainGoal?: string;        // 主要目标
  adPlatforms?: string[];   // 已投放的广告平台
  adStatus?: string;        // 投放状态
}

export type ServiceDetails = AIDetails | CrawlerDetails | GrowthDetails;

export interface ConsultationFormData {
  serviceType: 'ai' | 'crawler' | 'growth';
  budget?: string;
  name: string;
  email: string;
  wechat?: string;
  details: ServiceDetails;
}

export async function submitConsultation(data: ConsultationFormData): Promise<{
  success: boolean;
  message: string;
  id?: string;
}> {
  if (!data.serviceType || !data.name?.trim() || !data.email?.trim()) {
    return { success: false, message: '请填写所有必填字段' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return { success: false, message: '请输入有效的邮箱地址' };
  }

  // Extract common fields from details
  let description = '';
  let website: string | null = null;
  let targetMarket: string | null = null;

  if (data.serviceType === 'ai') {
    const d = data.details as AIDetails;
    description = d.scenario?.trim() ?? '';
  } else if (data.serviceType === 'crawler') {
    const d = data.details as CrawlerDetails;
    description = d.dataSources?.trim() ?? '';
  } else if (data.serviceType === 'growth') {
    const d = data.details as GrowthDetails;
    description = d.competitors?.trim() ?? '';
    website = d.website?.trim() || null;
    targetMarket = d.targetMarket?.trim() || null;
  }

  if (!description) {
    return { success: false, message: '请填写必填内容' };
  }

  let record;
  try {
    record = await prisma.consultationRequest.create({
      data: {
        serviceType: data.serviceType,
        description,
        website,
        targetMarket,
        budget: data.budget || null,
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        wechat: data.wechat?.trim() || null,
        details: data.details as object,
      },
    });
  } catch (err) {
    console.error('[consultation] DB error:', err);
    return { success: false, message: '提交失败，请稍后重试' };
  }

  const tagName = await getIntegrationValue('SYSTEME_TAG_ON_CONSULTATION');
  const tags = tagName ? [tagName] : [];

  const [emailNotify, emailConfirm, systemeResult] = await Promise.allSettled([
    sendConsultationNotification({ ...record, details: record.details as Record<string, any> | null }),
    sendConsultationConfirmation({ email: record.email, name: record.name }, record.serviceType),
    addContact(record.email, record.name, tags),
  ]);

  if (emailNotify.status === 'rejected') console.error('[consultation] admin email failed:', emailNotify.reason);
  if (emailConfirm.status === 'rejected') console.error('[consultation] confirm email failed:', emailConfirm.reason);
  if (systemeResult.status === 'rejected') console.error('[consultation] systeme.io failed:', systemeResult.reason);

  return { success: true, message: '提交成功', id: record.id };
}
