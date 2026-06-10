# Sprint 6-7 — SEM 广告数据分析规格

## 产品定位

```
两种使用场景：

自用（内部）                        客户使用（多租户）
────────────────                   ────────────────────
连接自己的 Google Ads / Meta        客户在 Dashboard 连接自己的广告账户
监控广告 ROI、CPC、转化             客户看到自己的广告数据
与 GSC 关键词对比                   与 GSC/GA4 数据联合分析
                                   同一套代码，按 siteId 隔离
```

## 数据模型

```prisma
model GoogleAdsConnection {
  id            String   @id @default(uuid())
  siteId        String   @unique
  accessToken   String
  refreshToken  String
  tokenExpiry   DateTime
  customerId    String   // Google Ads Customer ID (xxx-xxx-xxxx)
  accountName   String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  site          Site     @relation(fields: [siteId], references: [id], onDelete: Cascade)
}

model MetaAdsConnection {
  id            String   @id @default(uuid())
  siteId        String   @unique
  accessToken   String
  adAccountId   String   // act_xxxxx
  accountName   String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  site          Site     @relation(fields: [siteId], references: [id], onDelete: Cascade)
}

model AdsCampaign {
  id          String      @id @default(uuid())
  siteId      String
  provider    AdsProvider // GOOGLE | META
  campaignId  String      // 外部 ID
  name        String
  status      String
  channel     String?     // SEARCH | DISPLAY | VIDEO | SOCIAL
  createdAt   DateTime    @default(now())
  metrics     AdsMetric[]
  site        Site        @relation(fields: [siteId], references: [id], onDelete: Cascade)

  @@unique([siteId, provider, campaignId])
}

model AdsMetric {
  id            String      @id @default(uuid())
  campaignId    String
  date          DateTime    @db.Date
  impressions   Int         @default(0)
  clicks        Int         @default(0)
  costMicros    BigInt      @default(0) // 存储微单位（Google 惯例），/1_000_000 得 USD
  conversions   Float       @default(0)
  conversionValue Float     @default(0)
  campaign      AdsCampaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)

  @@unique([campaignId, date])
  @@index([campaignId, date])
}

enum AdsProvider {
  GOOGLE
  META
}
```

## API 路由结构

```
/api/dashboard/sites/[siteId]/
  google-ads/
    connect/route.ts     GET → 生成 OAuth URL
    callback/route.ts    GET → 处理授权回调
    sync/route.ts        POST → 触发数据同步
    status/route.ts      GET → 连接状态 + 最新数据
  meta-ads/
    connect/route.ts
    callback/route.ts
    sync/route.ts
    status/route.ts
  ads/
    overview/route.ts    GET → 合并 Google + Meta KPI
    campaigns/route.ts   GET → 广告系列列表（支持 provider 过滤）
    keyword-overlap/route.ts  GET → 广告关键词 vs GSC 关键词对比
```

## 广告看板 UI 布局

```
Site Intelligence 页面 → 新增 "广告" 标签

┌─────────────────────────────────────────────────────────┐
│  广告分析                         [连接 Google Ads] [连接 Meta]│
├────────────┬────────────┬────────────┬──────────────────┤
│  总花费     │  总点击     │  平均 CPC   │  ROAS            │
│  $1,234    │  4,567     │  $0.27     │  3.2x            │
├────────────┴────────────┴────────────┴──────────────────┤
│  ○ 全部  ● Google Ads  ○ Meta Ads   [本月▾]            │
├─────────────────────────────────────────────────────────┤
│  关键词重叠分析                                           │
│  ■ 广告 + SEO 同时覆盖 (23)  □ 纯 SEO (45)  □ 空白 (12)│
│  ┌─────────────────────────────────────────────────────┐│
│  │  关键词       广告位置  SEO 位置  广告花费  自然点击  ││
│  │  "海外seo"    1        3        $45      234      ││
│  └─────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────┤
│  广告系列列表（按花费排序）                                │
│  [系列名]  [状态]  [花费]  [点击]  [CPC]  [转化率]       │
└─────────────────────────────────────────────────────────┘
```

## Meta App Review 申请清单

Sprint 6 开始时同步提交，约 2-3 周审核：

- [ ] 创建 Facebook App（类型：Business）
- [ ] 申请权限：`ads_read`, `business_management`, `ads_management`（只读够用）
- [ ] 准备 Privacy Policy URL（已有 `/privacy`）
- [ ] 准备使用案例说明（为出海企业提供广告数据分析服务）
- [ ] 提交 App Review

## Google Ads API 注意事项

- 需要 Google Ads Developer Token（申请地址：ads.google.com/aw/apicenter）
- 测试账户使用测试 Customer ID 免费访问
- 生产 Token 需要 Google 审核（约 1 周），提前申请
- OAuth scope：`https://www.googleapis.com/auth/adwords`
- 可复用现有 `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`（无需新建 App）
