import { SiteAuditResult } from './types';

export interface GraphNode {
  id: string;
  name: string;
  val: number;
  color?: string;
  type: 'root' | 'pillar' | 'cluster' | 'ghost';
  meta?: {
    url?: string;
    title?: string;
    description?: string;
    h1?: string;
    loadTime?: number;
    wordCount?: number;
    internalLinks?: number;
    hasOgImage?: boolean;
  };
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

/**
 * 从 URL 路径提取层级段
 * e.g. https://scaletotop.com/blog/seo/keyword-research
 *   => ['blog', 'seo', 'keyword-research']
 */
function getPathSegments(url: string): string[] {
  try {
    const { pathname } = new URL(url);
    return pathname.split('/').filter(Boolean);
  } catch {
    return [];
  }
}

export class GraphGeneratorService {
  /**
   * 将全站审计结果转化为基于 URL 层级的 Topic Cluster 图数据
   * 
   * @param result 审计结果（包含详细抓取的数据）
   * @param allUrls可选，所有发现的链接（用于渲染全量骨架）
   * @param marketGaps可选，市场空白话题（用于渲染 Ghost Nodes）
   */
  static generateGraphData(result: SiteAuditResult, allUrls?: string[], marketGaps?: any[]): GraphData {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const addedNodeIds = new Set<string>();

    const addNode = (node: GraphNode) => {
      const existing = nodes.find(n => n.id === node.id);
      if (existing) {
        // 如果已存在展示节点，则尝试合并元数据或升级颜色
        if (node.meta) existing.meta = { ...existing.meta, ...node.meta };
        if (node.color && node.color !== '#444') existing.color = node.color; // 覆盖骨架色
        if (node.val > existing.val) existing.val = node.val;
        if (node.name && node.name !== existing.name && !existing.name.startsWith('/')) {
          existing.name = node.name;
        }
      } else {
        nodes.push(node);
        addedNodeIds.add(node.id);
      }
    };

    const addLink = (source: string, target: string) => {
      const exists = links.find(l => l.source === source && l.target === target);
      if (!exists) links.push({ source, target });
    };

    // 根节点
    const rootId = 'root';
    addNode({
      id: rootId,
      name: result.domain.replace(/^https?:\/\//, ''),
      val: 60,
      color: '#3b82f6', // Bright blue for root on light background
      type: 'root',
    });

    // 1. 处理全量骨架链接 (使用 URL 层级作为基础结构)
    if (allUrls) {
      allUrls.forEach(url => {
        const segments = getPathSegments(url);
        if (segments.length === 0) return;

        const pillarSegment = segments[0];
        const pillarId = `pillar:${pillarSegment}`;

        // 骨架 Pillar
        addNode({
          id: pillarId,
          name: `/${pillarSegment}`,
          val: 30,
          color: '#94a3b8', // light slate for un-audited skeleton pillars
          type: 'pillar',
        });
        addLink(pillarId, rootId);

        if (segments.length > 1) {
          // 骨架 Cluster
          addNode({
            id: url,
            name: `/${segments.slice(-1)[0]}`,
            val: 8,
            color: '#cbd5e1', // very light slate for un-audited skeleton clusters
            type: 'cluster',
            meta: { url }
          });
          addLink(url, pillarId);
        }
      });
    }

    // 2. 处理已审计的页面 (基于语义 Topic 进行重新聚类)
    result.pages.forEach((page) => {
      const segments = getPathSegments(page.url);

      // 处理根路径
      if (segments.length === 0) {
        const rn = nodes.find(n => n.id === rootId);
        if (rn) {
          rn.meta = {
            url: page.url,
            title: page.title,
            description: page.description,
            h1: page.h1,
            loadTime: page.loadTime,
            wordCount: page.wordCount,
            internalLinks: page.internalLinks?.length ?? 0,
            hasOgImage: page.hasOgImage,
          };
        }
        return;
      }

      // 核心：如果有语义 Topic，则使用 Topic 作为 Pillar，否则回退到 URL Pillar
      const topicName = page.topic && page.topic !== 'Uncategorized' ? page.topic : null;
      const originalPillarSegment = segments[0];
      const pillarId = topicName ? `topic:${topicName}` : `pillar:${originalPillarSegment}`;
      const pillarName = topicName || `/${originalPillarSegment}`;

      // 确保 Pillar 节点存在
      addNode({
        id: pillarId,
        name: pillarName,
        val: 35,
        color: topicName ? '#4f46e5' : '#64748b', // Indigo for topics, medium slate for URLs
        type: 'pillar',
        meta: topicName ? { title: `Topic Cluster: ${topicName}` } : undefined
      });
      addLink(pillarId, rootId);

      // 如果这是 Cluster 页面 (层级 > 0 或被标记为 Topic 下的子页)
      addNode({
        id: page.url,
        name: page.title || (segments.length > 0 ? `/${segments.slice(-1)[0]}` : page.url),
        val: 12,
        color: '#059669', // Emerald for audited pages
        type: 'cluster',
        meta: {
          url: page.url,
          title: page.title,
          description: page.description,
          h1: page.h1,
          loadTime: page.loadTime,
          wordCount: page.wordCount,
          internalLinks: page.internalLinks?.length ?? 0,
          hasOgImage: page.hasOgImage,
        },
      });

      // 如果原来已经挂载在物理 Pillar 上，且现在有了语义 Pillar，则移除旧链接 (避免双重挂载)
      // 在 generateGraphData 逻辑中，addLink 会检查唯一性。
      // 但现在同一个 Cluster 可能试图挂载到物理 Pillar 和语义 Pillar。
      // 我们优先挂载到语义 Pillar。
      const physicalPillarId = `pillar:${originalPillarSegment}`;
      if (pillarId !== physicalPillarId) {
        const oldLinkIdx = links.findIndex(l => l.source === page.url && l.target === physicalPillarId);
        if (oldLinkIdx !== -1) links.splice(oldLinkIdx, 1);
      }

      addLink(page.url, pillarId);
    });

    // 3. 处理市场空白 (Ghost Nodes)
    if (marketGaps) {
      marketGaps.forEach((gap, i) => {
        const ghostId = `ghost:${gap.topic}`;
        addNode({
          id: ghostId,
          name: gap.topic,
          val: 20 + (gap.frequency * 2), // 根据竞争频率调整大小
          color: '#f43f5e', // 玫瑰红表示缺失
          type: 'ghost',
          meta: {
            title: `Market Gap: ${gap.topic}`,
            description: `Found in ${gap.competitors?.length || 0} competitors. Intent: ${gap.intent || 'N/A'}`
          }
        });
        // 挂载到根节点，但视觉上会因为力导向图浮动在周围
        addLink(ghostId, rootId);
      });
    }

    return { nodes, links };
  }
}
