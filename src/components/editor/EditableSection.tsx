"use client";

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Edit2, Save, X, RefreshCw, Wand2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ContentSection } from '@/lib/utils/markdown-sections';

interface EditableSectionProps {
    section: ContentSection;
    onSave: (id: string, newBody: string) => void;
    className?: string;
}

export function EditableSection({ section, onSave, className = "" }: EditableSectionProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [body, setBody] = useState(section.body);
    const [isCopied, setIsCopied] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [isEditing, body]);

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

    // If it's the specific "Intro" section, we might style it differently or just generic
    const isIntro = section.heading === 'Intro';

    return (
        <div className={`group relative rounded-2xl transition-all duration-300 ${isEditing
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
                    {!isEditing ? (
                        <>
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
                <div className="prose prose-slate max-w-none prose-p:leading-relaxed prose-headings:hidden">
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
                            )
                        }}
                        remarkPlugins={[remarkGfm]}
                    >
                        {section.body}
                    </ReactMarkdown>
                </div>
            )}
        </div>
    );
}
