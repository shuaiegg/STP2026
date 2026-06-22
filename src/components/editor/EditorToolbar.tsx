"use client";

import React from 'react';
import {
    Bold, Italic, Code, Link2, Heading2, Heading3,
    List, ListOrdered, Quote, FileCode, ImagePlus, Link as LinkIcon
} from 'lucide-react';

export interface ToolbarAction {
    icon: React.ReactNode;
    label: string;
    action: (textarea: HTMLTextAreaElement, body: string) => { newBody: string; cursorPos: number };
}

interface EditorToolbarProps {
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
    body: string;
    onBodyChange: (newBody: string) => void;
    onOpenMediaLibrary?: () => void;
    onInsertInternalLink?: () => void;
}

/* ── helpers ─────────────────────────────────────────────────── */

/** Wrap selection with prefix/suffix. If no selection, insert placeholder. */
function wrapSelection(
    textarea: HTMLTextAreaElement,
    body: string,
    prefix: string,
    suffix: string,
    placeholder: string,
): { newBody: string; cursorPos: number } {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = body.substring(start, end);

    if (selected) {
        const wrapped = `${prefix}${selected}${suffix}`;
        const newBody = body.substring(0, start) + wrapped + body.substring(end);
        return { newBody, cursorPos: start + wrapped.length };
    }

    // No selection → insert placeholder and position cursor inside
    const inserted = `${prefix}${placeholder}${suffix}`;
    const newBody = body.substring(0, start) + inserted + body.substring(end);
    return { newBody, cursorPos: start + prefix.length + placeholder.length };
}

/** Prepend a prefix to each line in the selection (for lists, quotes, headings). */
function prependLines(
    textarea: HTMLTextAreaElement,
    body: string,
    linePrefix: string,
    placeholder: string,
): { newBody: string; cursorPos: number } {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = body.substring(start, end);

    if (selected) {
        const lines = selected.split('\n');
        const transformed = lines.map(line => `${linePrefix}${line}`).join('\n');
        const newBody = body.substring(0, start) + transformed + body.substring(end);
        return { newBody, cursorPos: start + transformed.length };
    }

    // No selection → insert a single prefixed placeholder
    const inserted = `${linePrefix}${placeholder}`;
    const newBody = body.substring(0, start) + inserted + body.substring(end);
    return { newBody, cursorPos: start + inserted.length };
}

/** Prepend ordered list numbers to each line. */
function prependOrderedList(
    textarea: HTMLTextAreaElement,
    body: string,
    placeholder: string,
): { newBody: string; cursorPos: number } {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = body.substring(start, end);

    if (selected) {
        const lines = selected.split('\n');
        const transformed = lines.map((line, i) => `${i + 1}. ${line}`).join('\n');
        const newBody = body.substring(0, start) + transformed + body.substring(end);
        return { newBody, cursorPos: start + transformed.length };
    }

    const inserted = `1. ${placeholder}`;
    const newBody = body.substring(0, start) + inserted + body.substring(end);
    return { newBody, cursorPos: start + inserted.length };
}

/** Insert a fenced code block. */
function insertCodeBlock(
    textarea: HTMLTextAreaElement,
    body: string,
): { newBody: string; cursorPos: number } {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = body.substring(start, end);
    const code = selected || '代码';

    const block = `\n\`\`\`\n${code}\n\`\`\`\n`;
    const newBody = body.substring(0, start) + block + body.substring(end);
    // cursor at end of code content
    return { newBody, cursorPos: start + 5 + code.length };
}

/** Insert heading at line start (works for H2, H3). */
function insertHeading(
    textarea: HTMLTextAreaElement,
    body: string,
    level: string,
    placeholder: string,
): { newBody: string; cursorPos: number } {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = body.substring(start, end);

    // Find the start of the current line
    const lineStart = body.lastIndexOf('\n', start - 1) + 1;
    const prefix = `${level} `;

    if (selected) {
        // Replace selection with heading
        const newBody = body.substring(0, start) + `${prefix}${selected}` + body.substring(end);
        return { newBody, cursorPos: start + prefix.length + selected.length };
    }

    const inserted = `\n${prefix}${placeholder}`;
    const newBody = body.substring(0, start) + inserted + body.substring(end);
    return { newBody, cursorPos: start + inserted.length };
}

/** Insert a markdown link. */
function insertLink(
    textarea: HTMLTextAreaElement,
    body: string,
): { newBody: string; cursorPos: number } {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = body.substring(start, end);

    const text = selected || '链接文字';
    const inserted = `[${text}](url)`;
    const newBody = body.substring(0, start) + inserted + body.substring(end);
    // Position cursor at 'url' placeholder
    return { newBody, cursorPos: start + text.length + 3 };
}

/* ── toolbar actions ─────────────────────────────────────────── */

const TOOLBAR_ACTIONS: ToolbarAction[] = [
    {
        icon: <Bold size={14} />,
        label: '加粗',
        action: (ta, body) => wrapSelection(ta, body, '**', '**', '粗体文字'),
    },
    {
        icon: <Italic size={14} />,
        label: '斜体',
        action: (ta, body) => wrapSelection(ta, body, '*', '*', '斜体文字'),
    },
    {
        icon: <Code size={14} />,
        label: '行内代码',
        action: (ta, body) => wrapSelection(ta, body, '`', '`', 'code'),
    },
    {
        icon: <Link2 size={14} />,
        label: '链接',
        action: (ta, body) => insertLink(ta, body),
    },
    {
        icon: <Heading2 size={14} />,
        label: 'H2',
        action: (ta, body) => insertHeading(ta, body, '##', '二级标题'),
    },
    {
        icon: <Heading3 size={14} />,
        label: 'H3',
        action: (ta, body) => insertHeading(ta, body, '###', '三级标题'),
    },
    {
        icon: <List size={14} />,
        label: '无序列表',
        action: (ta, body) => prependLines(ta, body, '- ', '列表项'),
    },
    {
        icon: <ListOrdered size={14} />,
        label: '有序列表',
        action: (ta, body) => prependOrderedList(ta, body, '列表项'),
    },
    {
        icon: <Quote size={14} />,
        label: '引用',
        action: (ta, body) => prependLines(ta, body, '> ', '引用文字'),
    },
    {
        icon: <FileCode size={14} />,
        label: '代码块',
        action: (ta, body) => insertCodeBlock(ta, body),
    },
];

/* ── component ───────────────────────────────────────────────── */

export function EditorToolbar({
    textareaRef,
    body,
    onBodyChange,
    onOpenMediaLibrary,
    onInsertInternalLink,
}: EditorToolbarProps) {

    const handleAction = (action: ToolbarAction['action']) => {
        const ta = textareaRef.current;
        if (!ta) return;

        const { newBody, cursorPos } = action(ta, body);
        onBodyChange(newBody);

        // Restore focus and set cursor after React re-render
        requestAnimationFrame(() => {
            ta.focus();
            ta.setSelectionRange(cursorPos, cursorPos);
        });
    };

    return (
        <div className="flex items-center gap-0.5 flex-wrap px-2 py-1.5 bg-brand-surface-alt border border-brand-border rounded-lg mb-2">
            {TOOLBAR_ACTIONS.map((item) => (
                <button
                    key={item.label}
                    type="button"
                    onClick={() => handleAction(item.action)}
                    className="p-1.5 rounded-md text-brand-text-secondary hover:text-brand-primary hover:bg-white transition-colors"
                    title={item.label}
                >
                    {item.icon}
                </button>
            ))}

            {/* Separator */}
            {(onOpenMediaLibrary || onInsertInternalLink) && (
                <div className="w-px h-5 bg-brand-border mx-1" />
            )}

            {/* Media Library — only shown when prop is provided (admin) */}
            {onOpenMediaLibrary && (
                <button
                    type="button"
                    onClick={onOpenMediaLibrary}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-md text-brand-text-secondary hover:text-brand-primary hover:bg-white transition-colors text-xs font-medium"
                    title="媒体库"
                >
                    <ImagePlus size={14} />
                    <span className="hidden sm:inline">媒体库</span>
                </button>
            )}

            {/* Internal Link — only shown when prop is provided (admin) */}
            {onInsertInternalLink && (
                <button
                    type="button"
                    onClick={onInsertInternalLink}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-md text-brand-text-secondary hover:text-brand-primary hover:bg-white transition-colors text-xs font-medium"
                    title="内链"
                >
                    <LinkIcon size={14} />
                    <span className="hidden sm:inline">内链</span>
                </button>
            )}
        </div>
    );
}
