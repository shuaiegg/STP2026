'use client';

import { useState, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { X, Plus, ChevronDown, ChevronUp, RefreshCw, CheckCircle2, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { toast } from 'sonner';
import { saveOntologyEdits } from '@/app/actions/ontology';

type Locale = 'zh' | 'en';

const COPY = {
    title: { zh: '业务基因', en: 'Business DNA' },
    subtitle: { zh: '核心产品/服务、目标客户和解决的痛点', en: 'Core offerings, target audience, and pain points solved' },
    coreOfferings: { zh: '核心产品/服务', en: 'Core offerings' },
    targetAudience: { zh: '目标受众', en: 'Target audience' },
    painPointsSolved: { zh: '解决的痛点', en: 'Pain points solved' },
    idealTopicMap: { zh: '理想话题图谱', en: 'Ideal topic map' },
    logicChains: { zh: '逻辑链（Problem → Solution → Proof）', en: 'Logic chains (Problem → Solution → Proof)' },
    addItem: { zh: '+ 添加', en: '+ Add' },
    addTopic: { zh: '+ 添加话题', en: '+ Add topic' },
    addSubtopic: { zh: '+ 子话题', en: '+ Subtopic' },
    confirmBtn: { zh: '确认业务基因', en: 'Confirm Business DNA' },
    reExtractBtn: { zh: '让 AI 重新分析', en: 'Re-analyze with AI' },
    savingBtn: { zh: '保存中...', en: 'Saving...' },
    extractingBtn: { zh: 'AI 分析中...', en: 'Analyzing...' },
    confirmed: { zh: '已确认', en: 'Confirmed' },
    notConfirmed: { zh: '待确认', en: 'Unconfirmed' },
    noOntology: { zh: '尚未分析业务基因', en: 'Business DNA not analyzed yet' },
    noOntologyDesc: { zh: '运行 AI 分析，自动提取您的核心业务特征', en: 'Run AI analysis to extract your core business profile' },
    subtopicsLabel: { zh: '子话题', en: 'subtopics' },
    deleteTopic: { zh: '删除此话题', en: 'Delete this topic' },
    delete: { zh: '删除', en: 'Delete' },
    add: { zh: '添加', en: 'Add' },
    collapse: { zh: '收起', en: 'Collapse' },
    expand: { zh: '展开', en: 'Expand' },
    addSubtopicAria: { zh: '添加子话题', en: 'Add subtopic' },
    deleteSubtopic: { zh: '删除子话题', en: 'Delete subtopic' },
    addTopicAria: { zh: '添加话题', en: 'Add topic' },
    saveFailed: { zh: '保存失败，请重试', en: 'Save failed, please retry' },
    problem: { zh: '问题', en: 'Problem' },
    solution: { zh: '方案', en: 'Solution' },
    proof: { zh: '证明', en: 'Proof' },
} as const;

const tr = (key: keyof typeof COPY, locale: Locale) => COPY[key][locale];

interface TopicEntry {
    topic: string;
    subtopics: string[];
}

interface LogicChain {
    problem: string;
    solution: string;
    proof: string;
}

interface OntologyData {
    id: string;
    version: number;
    coreOfferings: string[];
    targetAudience: string[];
    painPointsSolved: string[];
    idealTopicMap: TopicEntry[];
    logicChains?: LogicChain[];
    confirmedAt?: string | null;
}

interface DnaEditorProps {
    siteId: string;
    ontology: OntologyData | null;
    isExtracting: boolean;
    onExtract: () => void;
    onSaved: (updated: OntologyData) => void;
}

function ChipList({
    items,
    onChange,
    locale,
}: {
    items: string[];
    onChange: (items: string[]) => void;
    locale: Locale;
}) {
    const [draft, setDraft] = useState('');

    const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));

    const add = () => {
        const v = draft.trim();
        if (v && !items.includes(v)) {
            onChange([...items, v]);
            setDraft('');
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
                {items.map((item, i) => (
                    <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-primary/10 text-brand-primary text-xs font-medium border border-brand-primary/20"
                    >
                        {item}
                        <button
                            onClick={() => remove(i)}
                            className="hover:text-rose-500 transition-colors"
                            aria-label={`${tr('delete', locale)} ${item}`}
                        >
                            <X size={10} />
                        </button>
                    </span>
                ))}
            </div>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
                    placeholder={tr('addItem', locale)}
                    className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-primary bg-white text-slate-800 placeholder-slate-400"
                />
                <button
                    onClick={add}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                    aria-label={tr('add', locale)}
                >
                    <Plus size={14} />
                </button>
            </div>
        </div>
    );
}

function TopicMapEditor({
    topics,
    onChange,
    locale,
}: {
    topics: TopicEntry[];
    onChange: (topics: TopicEntry[]) => void;
    locale: Locale;
}) {
    const [expanded, setExpanded] = useState<Set<number>>(new Set([0]));
    const [subtopicDraft, setSubtopicDraft] = useState<Record<number, string>>({});
    const [topicDraft, setTopicDraft] = useState('');

    const toggleExpand = (i: number) => {
        const next = new Set(expanded);
        next.has(i) ? next.delete(i) : next.add(i);
        setExpanded(next);
    };

    const updateTopicName = (i: number, name: string) => {
        const next = [...topics];
        next[i] = { ...next[i], topic: name };
        onChange(next);
    };

    const removeTopic = (i: number) => onChange(topics.filter((_, idx) => idx !== i));

    const addSubtopic = (i: number) => {
        const v = (subtopicDraft[i] ?? '').trim();
        if (!v) return;
        const next = [...topics];
        next[i] = { ...next[i], subtopics: [...next[i].subtopics, v] };
        onChange(next);
        setSubtopicDraft((d) => ({ ...d, [i]: '' }));
    };

    const removeSubtopic = (topicIdx: number, subIdx: number) => {
        const next = [...topics];
        next[topicIdx] = {
            ...next[topicIdx],
            subtopics: next[topicIdx].subtopics.filter((_, idx) => idx !== subIdx),
        };
        onChange(next);
    };

    const addTopic = () => {
        const v = topicDraft.trim();
        if (!v) return;
        onChange([...topics, { topic: v, subtopics: [] }]);
        setTopicDraft('');
        setExpanded((prev) => new Set([...prev, topics.length]));
    };

    return (
        <div className="space-y-2">
            {topics.map((entry, i) => (
                <div key={i} className="border border-slate-200 rounded-lg bg-white overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2">
                        <button
                            onClick={() => toggleExpand(i)}
                            className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
                            aria-label={expanded.has(i) ? tr('collapse', locale) : tr('expand', locale)}
                        >
                            {expanded.has(i) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                        <input
                            type="text"
                            value={entry.topic}
                            onChange={(e) => updateTopicName(i, e.target.value)}
                            className="flex-1 text-xs font-semibold text-slate-800 bg-transparent focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-400 font-mono">{entry.subtopics.length} {tr('subtopicsLabel', locale)}</span>
                        <button
                            onClick={() => removeTopic(i)}
                            className="text-slate-300 hover:text-rose-500 transition-colors"
                            aria-label={tr('deleteTopic', locale)}
                        >
                            <X size={14} />
                        </button>
                    </div>

                    {expanded.has(i) && (
                        <div className="px-8 pb-3 space-y-2 border-t border-slate-100 pt-2 bg-slate-50/50">
                            <div className="flex flex-wrap gap-1.5">
                                {entry.subtopics.map((sub, si) => (
                                    <span
                                        key={si}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium border border-slate-200"
                                    >
                                        {sub}
                                        <button
                                            onClick={() => removeSubtopic(i, si)}
                                            className="hover:text-rose-500 transition-colors"
                                            aria-label={`${tr('deleteSubtopic', locale)} ${sub}`}
                                        >
                                            <X size={9} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={subtopicDraft[i] ?? ''}
                                    onChange={(e) =>
                                        setSubtopicDraft((d) => ({ ...d, [i]: e.target.value }))
                                    }
                                    onKeyDown={(e) =>
                                        e.key === 'Enter' && (e.preventDefault(), addSubtopic(i))
                                    }
                                    placeholder={tr('addSubtopic', locale)}
                                    className="flex-1 text-[11px] px-2.5 py-1 rounded-md border border-slate-200 focus:outline-none focus:border-brand-primary bg-white placeholder-slate-400"
                                />
                                <button
                                    onClick={() => addSubtopic(i)}
                                    className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                                    aria-label={tr('addSubtopicAria', locale)}
                                >
                                    <Plus size={12} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ))}

            <div className="flex gap-2 mt-1">
                <input
                    type="text"
                    value={topicDraft}
                    onChange={(e) => setTopicDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic())}
                    placeholder={tr('addTopic', locale)}
                    className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-dashed border-slate-300 focus:outline-none focus:border-brand-primary bg-white text-slate-800 placeholder-slate-400"
                />
                <button
                    onClick={addTopic}
                    className="px-2.5 py-1.5 rounded-lg border border-dashed border-slate-300 hover:bg-slate-50 text-slate-500 transition-colors"
                    aria-label={tr('addTopicAria', locale)}
                >
                    <Plus size={14} />
                </button>
            </div>
        </div>
    );
}

function LogicChainsView({ chains, locale }: { chains: LogicChain[]; locale: Locale }) {
    if (!chains || chains.length === 0) return null;
    return (
        <div className="space-y-3">
            {chains.map((chain, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex gap-2">
                        <span className="font-black text-rose-500 w-14 flex-shrink-0">{tr('problem', locale)}</span>
                        <span className="text-slate-700">{chain.problem}</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="font-black text-brand-primary w-14 flex-shrink-0">{tr('solution', locale)}</span>
                        <span className="text-slate-700">{chain.solution}</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="font-black text-emerald-600 w-14 flex-shrink-0">{tr('proof', locale)}</span>
                        <span className="text-slate-700">{chain.proof}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function DnaEditor({ siteId, ontology, isExtracting, onExtract, onSaved }: DnaEditorProps) {
    const locale = useLocale() as Locale;
    const [coreOfferings, setCoreOfferings] = useState<string[]>(ontology?.coreOfferings ?? []);
    const [targetAudience, setTargetAudience] = useState<string[]>(ontology?.targetAudience ?? []);
    const [painPointsSolved, setPainPointsSolved] = useState<string[]>(ontology?.painPointsSolved ?? []);
    const [idealTopicMap, setIdealTopicMap] = useState<TopicEntry[]>(
        (ontology?.idealTopicMap as TopicEntry[]) ?? [],
    );
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = useCallback(async () => {
        setIsSaving(true);
        try {
            const result = await saveOntologyEdits({
                siteId,
                coreOfferings,
                targetAudience,
                painPointsSolved,
                idealTopicMap,
            });
            if (result.success) {
                toast.success(result.message);
                onSaved({
                    id: result.data?.ontologyId ?? '',
                    version: result.data?.version ?? 1,
                    coreOfferings,
                    targetAudience,
                    painPointsSolved,
                    idealTopicMap,
                    logicChains: ontology?.logicChains,
                    confirmedAt: new Date().toISOString(),
                });
            } else {
                toast.error(result.message);
            }
        } catch {
            toast.error(tr('saveFailed', locale));
        } finally {
            setIsSaving(false);
        }
    }, [siteId, coreOfferings, targetAudience, painPointsSolved, idealTopicMap, ontology, onSaved, locale]);

    if (!ontology) {
        return (
            <Card className="p-8 border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-3">
                <p className="text-sm font-semibold text-slate-600">{tr('noOntology', locale)}</p>
                <p className="text-xs text-slate-400">{tr('noOntologyDesc', locale)}</p>
                <button
                    onClick={onExtract}
                    disabled={isExtracting}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-black uppercase hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                    {isExtracting ? (
                        <><Loader2 size={14} className="animate-spin" />{tr('extractingBtn', locale)}</>
                    ) : (
                        <><RefreshCw size={14} />{tr('reExtractBtn', locale)}</>
                    )}
                </button>
            </Card>
        );
    }

    const isConfirmed = !!ontology.confirmedAt;

    return (
        <Card className="p-6 border-slate-200 shadow-sm space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{tr('title', locale)}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{tr('subtitle', locale)}</p>
                </div>
                <span
                    className={`flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wide border ${
                        isConfirmed
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                >
                    {isConfirmed ? (
                        <><CheckCircle2 size={11} />{tr('confirmed', locale)}</>
                    ) : (
                        tr('notConfirmed', locale)
                    )}
                </span>
            </div>

            {/* Core Offerings */}
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {tr('coreOfferings', locale)}
                </label>
                <ChipList items={coreOfferings} onChange={setCoreOfferings} locale={locale} />
            </div>

            {/* Target Audience */}
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {tr('targetAudience', locale)}
                </label>
                <ChipList items={targetAudience} onChange={setTargetAudience} locale={locale} />
            </div>

            {/* Pain Points */}
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {tr('painPointsSolved', locale)}
                </label>
                <ChipList items={painPointsSolved} onChange={setPainPointsSolved} locale={locale} />
            </div>

            {/* Ideal Topic Map */}
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {tr('idealTopicMap', locale)}
                </label>
                <TopicMapEditor topics={idealTopicMap} onChange={setIdealTopicMap} locale={locale} />
            </div>

            {/* Logic Chains — read-only */}
            {ontology.logicChains && ontology.logicChains.length > 0 && (
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {tr('logicChains', locale)}
                    </label>
                    <LogicChainsView chains={ontology.logicChains} locale={locale} />
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-brand-secondary text-slate-900 rounded-lg text-xs font-black uppercase hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                    {isSaving ? (
                        <><Loader2 size={14} className="animate-spin" />{tr('savingBtn', locale)}</>
                    ) : (
                        <><CheckCircle2 size={14} />{tr('confirmBtn', locale)}</>
                    )}
                </button>
                <button
                    onClick={onExtract}
                    disabled={isExtracting || isSaving}
                    className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-xs font-black text-slate-600 uppercase hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                    {isExtracting ? (
                        <><Loader2 size={14} className="animate-spin" />{tr('extractingBtn', locale)}</>
                    ) : (
                        <><RefreshCw size={14} />{tr('reExtractBtn', locale)}</>
                    )}
                </button>
            </div>
        </Card>
    );
}
