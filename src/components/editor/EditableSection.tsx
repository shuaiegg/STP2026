"use client";

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Edit2, Save, X, RefreshCw, Wand2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ContentSection } from '@/lib/utils/markdown-sections';
import { Mermaid } from '@/components/ui/Mermaid';

interface EditableSectionProps {
    section: ContentSection;
    onSave: (id: string, newBody: string) => void;
    onRegenerate?: (instruction: string) => Promise<boolean>;
    className?: string;
}

export function EditableSection({ section, onSave, onRegenerate, className = "" }: EditableSectionProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [body, setBody] = useState(section.body);
    const [isCopied, setIsCopied] = useState(false);

    // Regeneration State
    const [isRegenOpen, setIsRegenOpen] = useState(false);
    const [regenInstruction, setRegenInstruction] = useState('');
    const [isRegenerating, setIsRegenerating] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [isEditing, body]);

    // Update body when section prop changes (e.g. after regeneration)
    useEffect(() => {
        setBody(section.body);
    }, [section.body]);

    const handleSave = () => {
        onSave(section.id, body);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setBody(section.body);
        setIsEditing(false);
    };

    const handleCopy = () => {
        const textToCopy = section.heading === 'Intro'
            ? section.body
            : `## ${section.heading}\n\n${section.body}`;

        navigator.clipboard.writeText(textToCopy);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleRegenerateSubmit = async () => {
        if (!onRegenerate || !regenInstruction.trim()) return;
        setIsRegenerating(true);
        try {
            await onRegenerate(regenInstruction);
            setIsRegenOpen(false);
            setRegenInstruction('');
            // Body update will happen via parent prop update
        } finally {
            setIsRegenerating(false);
        }
    };

    // If it's the specific "Intro" section, we might style it differently or just generic
    const isIntro = section.heading === 'Intro';

    return (
        <div className={`group relative rounded-2xl transition-all duration-300 ${isEditing || isRegenOpen
            ? 'bg-white ring-2 ring-brand-primary/20 shadow-lg p-6 my-6'
            : 'hover:bg-brand-surface/30 p-4 -mx-4 rounded-xl border border-transparent hover:border-slate-100'
            } ${className}`}>

            {/* Header / Controls */}
            <div className={`flex items-center justify-between mb-4 ${isEditing ? 'border-b border-slate-100 pb-3' : ''}`}>
                <div className="flex items-center gap-3">
                    {/* H2 Badge */}
                    {!isIntro && (
                        <span className="px-2 py-1 rounded-md bg-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            H2
                        </span>
                    )}
                    <h3 className={`font-black text-slate-800 ${isIntro ? 'text-lg italic text-slate-400' : 'text-xl'}`}>
                        {section.heading === 'Intro' ? 'Introduction' : section.heading}
                    </h3>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!isEditing && !isRegenOpen ? (
                        <>
                            {onRegenerate && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setIsRegenOpen(true)}
                                    className="h-8 px-3 rounded-full bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-100 mr-1"
                                    title="AI 重写本段"
                                >
                                    <Wand2 size={12} className="mr-1.5" /> AI重写
                                </Button>
                            )}
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCopy}
                                className="h-8 w-8 p-0 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                                title="复制本段"
                            >
                                {isCopied ? <Check size={14} /> : <Copy size={14} />}
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setIsEditing(true)}
                                className="h-8 px-3 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-brand-primary hover:border-brand-primary shadow-sm"
                            >
                                <Edit2 size={12} className="mr-2" /> 编辑
                            </Button>
                        </>
                    ) : isRegenOpen ? (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setIsRegenOpen(false)}
                            className="h-8 w-8 p-0 rounded-full hover:bg-slate-100 text-slate-400"
                        >
                            <X size={16} />
                        </Button>
                    ) : (
                        <>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancel}
                                className="h-8 w-8 p-0 rounded-full hover:bg-slate-100 text-slate-400"
                            >
                                <X size={16} />
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSave}
                                className="h-8 px-4 rounded-full bg-brand-primary text-white hover:bg-brand-primary/90 shadow-brand-primary/20 shadow-lg"
                            >
                                <Save size={14} className="mr-2" /> 保存
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* AI Regeneration Input Area */}
            {isRegenOpen && (
                <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-100 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 mb-2 text-purple-700 font-bold text-xs uppercase tracking-widest">
                        <Wand2 size={12} /> AI 指令
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="flex-1 bg-white border border-purple-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                            placeholder="例如：添加更多数据支持，或写得更通俗易懂..."
                            value={regenInstruction}
                            onChange={(e) => setRegenInstruction(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRegenerateSubmit()}
                            autoFocus
                        />
                        <Button
                            onClick={() => setIsRegenOpen(false)}
                            variant="ghost"
                            className="text-purple-400 hover:text-purple-600 hover:bg-purple-100 px-3 rounded-lg"
                        >
                            取消
                        </Button>
                        <Button
                            onClick={handleRegenerateSubmit}
                            disabled={isRegenerating || !regenInstruction}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 rounded-lg shadow-purple-200 shadow-md"
                        >
                            {isRegenerating ? <RefreshCw size={14} className="animate-spin" /> : '开始重写'}
                        </Button>
                    </div>
                </div>
            )}

            {/* Content Area */}
            {isEditing ? (
                <textarea
                    ref={textareaRef}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full bg-slate-50 border-0 rounded-xl p-4 text-slate-700 font-medium leading-relaxed focus:ring-0 focus:outline-none resize-none font-mono text-sm"
                    placeholder="在此输入内容..."
                    spellCheck={false}
                />
            ) : (
                <div className={`prose prose-slate max-w-none prose-p:leading-relaxed prose-headings:hidden ${isRegenerating ? 'opacity-50 blur-[1px] transition-all' : ''}`}>
                    {/* We rely on ReactMarkdown but render pure body (headings stripped) */}
                    <ReactMarkdown
                        components={{
                            blockquote: ({ node, ...props }) => (
                                <div className="border-l-4 border-brand-primary bg-brand-surface/50 p-4 rounded-r-xl my-4 not-italic">
                                    <div className="flex gap-2">
                                        <div className="text-brand-primary font-bold">💡</div>
                                        <div className="text-slate-700">{props.children}</div>
                                    </div>
                                </div>
                            ),
                            code({ node, inline, className, children, ...props }: any) {
                                const match = /language-(\w+)/.exec(className || '');
                                const isMermaid = match && match[1] === 'mermaid';

                                if (!inline && isMermaid) {
                                    return <Mermaid chart={String(children).replace(/\n$/, '')} />;
                                }

                                return !inline && match ? (
                                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto my-4 text-xs font-mono">
                                        <code className={className} {...props}>
                                            {children}
                                        </code>
                                    </pre>
                                ) : (
                                    <code className="bg-slate-100 px-1.5 py-0.5 rounded text-brand-primary font-mono text-xs" {...props}>
                                        {children}
                                    </code>
                                );
                            }
                        }}
                        remarkPlugins={[remarkGfm]}
                    >
                        {section.body}
                    </ReactMarkdown>
                </div>
            )
            }
        </div >
    );
}
