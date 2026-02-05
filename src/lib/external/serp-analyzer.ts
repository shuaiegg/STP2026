/**
 * SERP Analyzer - Deep SERP Features Analysis
 * Identifies SEO opportunities from Google SERP
 */

import { DataForSEOClient, type MapDataItem } from './dataforseo';

/**
 * Main SERP Analysis Result
 */
export interface SERPAnalysis {
    keyword: string;
    featuredSnippet?: FeaturedSnippetOpportunity;
    peopleAlsoAsk: PAAQuestion[];
    serpFeatures: SERPFeatures;
    recommendations: SERPRecommendation[];
    metadata: SERPMetadata;
}

/**
 * Featured Snippet Opportunity Analysis
 */
export interface FeaturedSnippetOpportunity {
    exists: boolean;
    type?: 'paragraph' | 'list' | 'table' | 'video';
    currentHolder?: {
        domain: string;
        url: string;
        content: string;
    };
    opportunity: 'high' | 'medium' | 'low';
    reason: string;
    recommendedFormat: string;
    actionSteps: string[];
}

/**
 * People Also Ask Question
 */
export interface PAAQuestion {
    question: string;
    answer?: string;
    sourceUrl?: string;
    coveredByCompetitors: boolean;
    difficulty: number;  // 0-100
    priority: 'high' | 'medium' | 'low';
}

/**
 * SERP Features Detection
 */
export interface SERPFeatures {
    hasVideo: boolean;
    hasImages: boolean;
    hasKnowledgePanel: boolean;
    hasFAQ: boolean;
    hasLocalPack: boolean;
    hasShopping: boolean;
    hasNewsResults: boolean;
}

/**
 * SERP Recommendation
 */
export interface SERPRecommendation {
    targetFeature: string;
    opportunity: 'high' | 'medium' | 'low';
    reason: string;
    actionSteps: string[];
    estimatedTraffic?: number;
}

/**
 * SERP Metadata
 */
export interface SERPMetadata {
    totalResults: number;
    searchIntentType: 'informational' | 'transactional' | 'navigational' | 'commercial';
    difficulty: number;  // 0-100
}

/**
 * SERP Analyzer Class
 */
export class SERPAnalyzer {
    /**
     * Main analysis method
     */
    async analyzeSERP(keyword: string, location: string = 'United States'): Promise<SERPAnalysis> {
        try {
            // 1. Fetch SERP data from DataForSEO
            const serpData = await this.fetchSERPData(keyword, location);

            // 2. Parse Featured Snippet
            const featuredSnippet = this.parseFeaturedSnippet(serpData);

            // 3. Extract PAA questions
            const peopleAlsoAsk = this.extractPAAQuestions(serpData);

            // 4. Detect SERP features
            const serpFeatures = this.detectSERPFeatures(serpData);

            // 5. Generate recommendations
            const recommendations = this.generateRecommendations(
                featuredSnippet,
                peopleAlsoAsk,
                serpFeatures
            );

            // 6. Analyze metadata
            const metadata = this.analyzeMetadata(serpData);

            return {
                keyword,
                featuredSnippet,
                peopleAlsoAsk,
                serpFeatures,
                recommendations,
                metadata
            };
        } catch (error) {
            console.error('SERP Analysis failed:', error);
            // Return basic analysis on error
            return this.getEmptyAnalysis(keyword);
        }
    }

    /**
     * Fetch SERP data from DataForSEO API (with mock support)
     */
    private async fetchSERPData(keyword: string, location: string): Promise<any> {
        // Check if mock mode is enabled
        const useMock = process.env.USE_SERP_MOCK === 'true';

        if (useMock) {
            console.log('🎭 SERP Mock Mode: Using realistic test data for UI demonstration');
            return this.getMockSERPData(keyword);
        }

        console.log(`🔍 Calling DataForSEO SERP API for: "${keyword}" in ${location}`);

        try {
            const response = await DataForSEOClient.post('/serp/google/organic/live/advanced', [{
                keyword,
                location_name: location,
                language_code: 'en',
                device: 'desktop',
                depth: 100
            }]);

            console.log('📦 Raw response:', {
                hasTasks: !!response.tasks,
                taskCount: response.tasks?.length,
                task0HasResult: !!response.tasks?.[0]?.result,
                resultLength: response.tasks?.[0]?.result?.length
            });

            if (!response.tasks || response.tasks.length === 0) {
                console.error('❌ No tasks in response');
                throw new Error('Invalid SERP API response: no tasks');
            }

            const task = response.tasks[0];
            if (!task.result || task.result.length === 0) {
                console.error('❌ No result in task');
                throw new Error('Invalid SERP API response: empty result');
            }

            return task.result[0];
        } catch (error) {
            console.error('❌ DataForSEO SERP API failed:', error);
            throw error;
        }
    }

    /**
     * Generate mock SERP data for testing UI
     */
    private getMockSERPData(keyword: string): any {
        return {
            items: [
                // Featured Snippet (exists - medium authority holder)
                {
                    type: 'featured_snippet',
                    domain: 'projectmanagement.com',
                    url: 'https://projectmanagement.com/guide',
                    description: `${keyword} is a comprehensive approach to planning, organizing, and managing resources to achieve specific goals. It involves coordinating team efforts, tracking progress, and ensuring timely delivery of projects.`,
                    text: 'Featured snippet content'
                },
                // People Also Ask - 6 questions with varying coverage
                {
                    type: 'people_also_ask',
                    items: [
                        {
                            title: `What is the best ${keyword}?`,
                            text: '', // Not covered - high priority!
                            url: ''
                        },
                        {
                            title: `How to choose ${keyword}?`,
                            text: 'Detailed answer from competitor with examples and best practices...',
                            url: 'https://competitor1.com/guide'
                        },
                        {
                            title: `${keyword} for small teams?`,
                            text: '', // Not covered - high priority!
                            url: ''
                        },
                        {
                            title: `Free ${keyword} tools?`,
                            text: 'Long detailed answer with screenshots and pricing comparisons from authoritative source...',
                            url: 'https://techcrunch.com/review'
                        },
                        {
                            title: `${keyword} vs spreadsheets?`,
                            text: '', // Not covered - high priority!
                            url: ''
                        },
                        {
                            title: `How much does ${keyword} cost?`,
                            text: 'Pricing varies from free to enterprise with detailed breakdown...',
                            url: 'https://forbes.com/pricing'
                        }
                    ]
                },
                // SERP Features - Various types detected
                { type: 'video', title: 'Top 10 Project Management Tools - Video Tutorial' },
                { type: 'images', title: 'Project Management Software Screenshots' },
                { type: 'shopping', title: 'Buy project management software' },
                // Organic results
                { type: 'organic', domain: 'asana.com', url: 'https://asana.com' },
                { type: 'organic', domain: 'monday.com', url: 'https://monday.com' },
                { type: 'organic', domain: 'trello.com', url: 'https://trello.com' }
            ],
            se_results_count: 2450000
        };
    }

    /**
     * Parse Featured Snippet from SERP data
     */
    private parseFeaturedSnippet(serpData: any): FeaturedSnippetOpportunity | undefined {
        const snippet = serpData.items?.find((item: any) => item.type === 'featured_snippet');

        if (!snippet) {
            // No featured snippet exists - opportunity!
            return {
                exists: false,
                opportunity: 'high',
                reason: 'No featured snippet currently exists for this keyword',
                recommendedFormat: 'Use clear headings and concise paragraphs. Answer the question directly in the first 40-60 words.',
                actionSteps: [
                    'Structure content with H2/H3 headings',
                    'Provide direct answer in first paragraph (40-60 words)',
                    'Use numbered or bulleted lists where appropriate',
                    'Add FAQ schema markup'
                ]
            };
        }

        // Featured snippet exists - analyze
        const type = this.detectSnippetType(snippet);
        const opportunity = this.evaluateSnippetOpportunity(snippet);

        return {
            exists: true,
            type,
            currentHolder: {
                domain: snippet.domain || 'Unknown',
                url: snippet.url || '',
                content: snippet.description || snippet.text || ''
            },
            opportunity,
            reason: this.getOpportunityReason(opportunity, snippet),
            recommendedFormat: this.getRecommendedFormat(type),
            actionSteps: this.getActionSteps(type)
        };
    }

    /**
     * Extract People Also Ask questions
     */
    private extractPAAQuestions(serpData: any): PAAQuestion[] {
        const paaItems = serpData.items?.filter((item: any) => item.type === 'people_also_ask') || [];

        if (!paaItems.length) return [];

        const questions: PAAQuestion[] = [];

        paaItems.forEach((paa: any) => {
            paa.items?.forEach((item: any) => {
                const difficulty = this.estimateQuestionDifficulty(item);
                const covered = this.checkCompetitorCoverage(item);

                questions.push({
                    question: item.title || item.xpath || 'Unknown question',
                    answer: item.text || item.description,
                    sourceUrl: item.url,
                    coveredByCompetitors: covered,
                    difficulty,
                    priority: this.calculateQuestionPriority(difficulty, covered)
                });
            });
        });

        // Sort by priority
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return questions.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
    }

    /**
     * Detect SERP features
     */
    private detectSERPFeatures(serpData: any): SERPFeatures {
        const itemTypes = new Set(serpData.items?.map((item: any) => item.type) || []);

        return {
            hasVideo: itemTypes.has('video') || itemTypes.has('video_carousel'),
            hasImages: itemTypes.has('images') || itemTypes.has('image_pack'),
            hasKnowledgePanel: itemTypes.has('knowledge_graph') || itemTypes.has('knowledge_panel'),
            hasFAQ: itemTypes.has('faq'),
            hasLocalPack: itemTypes.has('local_pack') || itemTypes.has('map'),
            hasShopping: itemTypes.has('shopping') || itemTypes.has('paid_shopping'),
            hasNewsResults: itemTypes.has('top_stories') || itemTypes.has('news_results')
        };
    }

    /**
     * Generate recommendations based on analysis
     */
    private generateRecommendations(
        snippet: FeaturedSnippetOpportunity | undefined,
        paa: PAAQuestion[],
        features: SERPFeatures
    ): SERPRecommendation[] {
        const recommendations: SERPRecommendation[] = [];

        // Featured Snippet recommendation
        if (snippet && snippet.opportunity !== 'low') {
            recommendations.push({
                targetFeature: 'Featured Snippet',
                opportunity: snippet.opportunity,
                reason: snippet.reason,
                actionSteps: snippet.actionSteps.slice(0, 3),
                estimatedTraffic: snippet.exists ? 25 : 35
            });
        }

        // PAA recommendations
        const highPriorityPAA = paa.filter(q => q.priority === 'high');
        if (highPriorityPAA.length > 0) {
            recommendations.push({
                targetFeature: 'People Also Ask',
                opportunity: 'high',
                reason: `${highPriorityPAA.length} high-priority questions with low competition`,
                actionSteps: [
                    'Create dedicated H2/H3 sections for each question',
                    'Provide direct, concise answers (40-60 words)',
                    'Add supporting details and examples',
                    'Use FAQ schema markup'
                ],
                estimatedTraffic: highPriorityPAA.length * 3
            });
        }

        // Video opportunity
        if (features.hasVideo) {
            recommendations.push({
                targetFeature: 'Video Results',
                opportunity: 'medium',
                reason: 'Video carousel present - video content opportunity',
                actionSteps: [
                    'Create 1-3 minute explanatory video',
                    'Optimize video title and description with keyword',
                    'Add VideoObject schema markup',
                    'Embed video in article with transcript'
                ],
                estimatedTraffic: 10
            });
        }

        // Image pack opportunity
        if (features.hasImages) {
            recommendations.push({
                targetFeature: 'Image Pack',
                opportunity: 'low',
                reason: 'Image pack present - optimize images for visibility',
                actionSteps: [
                    'Create high-quality, unique images',
                    'Use descriptive file names (keyword-based)',
                    'Add detailed alt text',
                    'Use ImageObject schema'
                ],
                estimatedTraffic: 5
            });
        }

        // Sort by opportunity and estimated traffic
        return recommendations.sort((a, b) => {
            const priority = { high: 3, medium: 2, low: 1 };
            const priorityDiff = priority[b.opportunity] - priority[a.opportunity];
            if (priorityDiff !== 0) return priorityDiff;
            return (b.estimatedTraffic || 0) - (a.estimatedTraffic || 0);
        });
    }

    /**
     * Analyze SERP metadata
     */
    private analyzeMetadata(serpData: any): SERPMetadata {
        return {
            totalResults: serpData.se_results_count || 0,
            searchIntentType: this.detectSearchIntent(serpData),
            difficulty: this.calculateSerpDifficulty(serpData)
        };
    }

    // ========== Helper Methods ==========

    private detectSnippetType(snippet: any): 'paragraph' | 'list' | 'table' | 'video' {
        if (snippet.table) return 'table';
        if (snippet.links || snippet.list) return 'list';
        if (snippet.video) return 'video';
        return 'paragraph';
    }

    private evaluateSnippetOpportunity(snippet: any): 'high' | 'medium' | 'low' {
        const domain = (snippet.domain || '').toLowerCase();

        // Very high authority domains - low opportunity
        const veryHighAuthority = ['wikipedia.org', 'youtube.com', 'amazon.com'];
        if (veryHighAuthority.some(d => domain.includes(d))) {
            return 'low';
        }

        // Government and educational sites - low opportunity
        if (domain.endsWith('.gov') || domain.endsWith('.edu')) {
            return 'low';
        }

        // Major authority sites - medium opportunity
        const highAuthority = ['forbes.com', 'healthline.com', 'webmd.com', 'mayoclinic.org'];
        if (highAuthority.some(d => domain.includes(d))) {
            return 'medium';
        }

        // Smaller sites - high opportunity
        return 'high';
    }

    private getOpportunityReason(opportunity: string, snippet: any): string {
        const domain = snippet.domain || 'Unknown';

        if (opportunity === 'high') {
            return `Current holder (${domain}) has medium authority - winnable with quality content`;
        } else if (opportunity === 'medium') {
            return `Current holder (${domain}) has strong authority but can be challenged`;
        } else {
            return `Current holder (${domain}) has very high authority - difficult to outrank`;
        }
    }

    private getRecommendedFormat(type: 'paragraph' | 'list' | 'table' | 'video'): string {
        const formats = {
            paragraph: '使用清晰的段落结构，在前40-60词内直接回答问题',
            list: '使用编号列表或项目符号列表，6-8个步骤最佳',
            table: '使用表格格式对比数据或特征，3-5列',
            video: '创建1-3分钟视频内容并优化Schema标记'
        };

        return formats[type];
    }

    private getActionSteps(type: 'paragraph' | 'list' | 'table' | 'video'): string[] {
        const steps: Record<string, string[]> = {
            paragraph: [
                'Place answer directly under H2 heading',
                'Keep first paragraph concise (40-60 words)',
                'Add detailed explanation in subsequent paragraphs',
                'Use FAQ schema markup'
            ],
            list: [
                'Use <ol> or <ul> tags for structure',
                'Create 6-8 clear, actionable steps',
                'Keep each step concise (10-15 words)',
                'Add HowTo schema markup'
            ],
            table: [
                'Create clean HTML table with <table> tags',
                'Use 3-5 columns, 5-10 rows',
                'Include table headers with <th>',
                'Ensure data is accurate and verifiable'
            ],
            video: [
                'Create 1-3 minute video content',
                'Optimize video title and description',
                'Add VideoObject schema markup',
                'Embed in page with text transcript'
            ]
        };

        return steps[type] || steps.paragraph;
    }

    private checkCompetitorCoverage(paaItem: any): boolean {
        // Has answer = covered by competitor
        return !!(paaItem.text || paaItem.description);
    }

    private estimateQuestionDifficulty(paaItem: any): number {
        const answerLength = (paaItem.text || paaItem.description || '').length;
        const domain = (paaItem.url || '').toLowerCase();

        let difficulty = 40;  // Base difficulty

        // Longer answer = higher difficulty
        if (answerLength > 300) difficulty += 20;
        else if (answerLength > 150) difficulty += 10;

        // High authority source = higher difficulty
        if (domain.includes('wikipedia') || domain.endsWith('.gov') || domain.endsWith('.edu')) {
            difficulty += 30;
        } else if (domain.includes('healthline') || domain.includes('webmd')) {
            difficulty += 20;
        }

        return Math.min(100, difficulty);
    }

    private calculateQuestionPriority(difficulty: number, covered: boolean): 'high' | 'medium' | 'low' {
        // Not covered + low difficulty = high priority
        if (!covered && difficulty < 50) return 'high';

        // Not covered + medium difficulty = high priority
        if (!covered && difficulty < 70) return 'high';

        // Covered but low difficulty = medium priority
        if (covered && difficulty < 50) return 'medium';

        // Not covered + high difficulty = medium priority
        if (!covered) return 'medium';

        return 'low';
    }

    private detectSearchIntent(serpData: any): 'informational' | 'transactional' | 'navigational' | 'commercial' {
        const features = this.detectSERPFeatures(serpData);

        if (features.hasShopping) return 'transactional';
        if (features.hasLocalPack) return 'commercial';
        if (features.hasKnowledgePanel) return 'informational';

        // Check top results for intent signals
        const top5 = serpData.items?.slice(0, 5) || [];
        const titles = top5.map((item: any) => (item.title || '').toLowerCase()).join(' ');

        if (titles.includes('buy') || titles.includes('price') || titles.includes('shop')) {
            return 'transactional';
        }

        if (titles.includes('how') || titles.includes('what') || titles.includes('why')) {
            return 'informational';
        }

        return 'informational';
    }

    private calculateSerpDifficulty(serpData: any): number {
        const top10 = serpData.items?.slice(0, 10) || [];
        const authoritativeDomains = ['wikipedia.org', 'youtube.com', 'amazon.com', 'forbes.com', 'healthline.com'];

        const authorityCount = top10.filter((item: any) =>
            authoritativeDomains.some(d => (item.domain || '').includes(d))
        ).length;

        // More authority sites = higher difficulty
        return Math.min(100, 30 + (authorityCount * 10));
    }

    private getEmptyAnalysis(keyword: string): SERPAnalysis {
        return {
            keyword,
            featuredSnippet: {
                exists: false,
                opportunity: 'high',
                reason: 'SERP analysis unavailable - basic opportunity assumed',
                recommendedFormat: 'Use clear structure with headings',
                actionSteps: ['Create well-structured content']
            },
            peopleAlsoAsk: [],
            serpFeatures: {
                hasVideo: false,
                hasImages: false,
                hasKnowledgePanel: false,
                hasFAQ: false,
                hasLocalPack: false,
                hasShopping: false,
                hasNewsResults: false
            },
            recommendations: [],
            metadata: {
                totalResults: 0,
                searchIntentType: 'informational',
                difficulty: 50
            }
        };
    }
}

/**
 * Factory function for easy use
 */
export async function analyzeSERP(keyword: string, location?: string): Promise<SERPAnalysis> {
    const analyzer = new SERPAnalyzer();
    return analyzer.analyzeSERP(keyword, location);
}
