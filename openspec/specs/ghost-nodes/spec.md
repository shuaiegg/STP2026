# ghost-nodes Specification

## Purpose
Visualize semantic gaps in the 3D Galaxy Map by identifying topics that are "missing" based on business DNA but present in the ideal market state.

## Requirements
### Requirement: System computes missing logic points from business DNA
系统 SHALL 通过比对 `SiteOntology.idealTopicMap` 与最新审计图谱节点，计算出尚未被现有页面覆盖的逻辑缺口话题，返回带坐标信息的 Ghost Node 数组。

#### Scenario: 有本体数据时返回 Ghost Nodes
- **WHEN** 前端请求 `GET /api/dashboard/sites/[siteId]/ghost-nodes`
- **THEN** 系统返回 `{ nodes: GhostNode[] }`，每个节点包含 `id`、`label`、`type: 'ghost'`、`x`、`y`、`z` 坐标

#### Scenario: 无本体数据时返回空数组
- **WHEN** 站点尚未进行业务 DNA 提取（无 SiteOntology 记录）
- **THEN** 系统返回 `{ nodes: [] }`，不报错

#### Scenario: 理想话题已被现有节点覆盖时不生成 Ghost Node
- **WHEN** idealTopicMap 中某个话题在审计图谱节点中有语义匹配
- **THEN** 该话题不出现在 Ghost Nodes 返回结果中

### Requirement: Ghost Nodes 在 3D 星图中以半透明样式渲染
系统 SHALL 在 GalaxyMap 组件中叠加渲染 Ghost Nodes，视觉上与实体节点明显区分，代表"该有但缺失"的逻辑节点。

#### Scenario: Ghost Node 视觉样式
- **WHEN** GalaxyMap 渲染包含 Ghost Nodes 的图谱
- **THEN** Ghost Nodes 显示为半透明紫色（opacity ≈ 0.35），尺寸小于实体节点约 30%

#### Scenario: Ghost Node 与实体节点共存
- **WHEN** 图谱同时包含已爬取页面节点和 Ghost Nodes
- **THEN** 两类节点可同时展示，不互相遮挡，各自保持物理引擎布局
