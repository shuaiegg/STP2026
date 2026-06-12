export const SYSTEME_TRIGGERS = [
  {
    key: 'SYSTEME_TAG_ON_REGISTER',
    label: '注册成功',
    description: '新用户完成注册时自动添加',
    legacyKey: 'SYSTEME_NEW_USER_TAG', // backward compat with Sprint 2
  },
  {
    key: 'SYSTEME_TAG_ON_ONBOARDING',
    label: 'Onboarding 完成',
    description: '用户完成首次站点分析时添加',
  },
  {
    key: 'SYSTEME_TAG_ON_PURCHASE',
    label: '付款成功',
    description: '用户购买积分或订阅时添加',
  },
  {
    key: 'SYSTEME_TAG_ON_CREDITS_LOW',
    label: '积分不足',
    description: '用户积分低于 50 时添加',
  },
  {
    key: 'SYSTEME_TAG_ON_CONSULTATION',
    label: '咨询提交',
    description: '用户通过公开表单提交咨询需求时添加',
  },
] as const;

export type SystemeTriggerKey = (typeof SYSTEME_TRIGGERS)[number]['key'];
