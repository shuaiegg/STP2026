"use client";

import React, { useEffect } from 'react';
import { Button } from './Button';
import { AlertTriangle, X } from 'lucide-react';

interface AlertDialogProps {
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDestructive?: boolean;
}

export function AlertDialog({
    isOpen,
    title,
    description,
    confirmLabel = "确定",
    cancelLabel = "取消",
    onConfirm,
    onCancel,
    isDestructive = false
}: AlertDialogProps) {
    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        }
        return () => {
            window.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
                onClick={onCancel}
            />

            {/* Dialog Content */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border-2 border-slate-100 transform transition-all animate-in zoom-in-95 slide-in-from-bottom-2 duration-200">
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="mb-6">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isDestructive ? 'bg-red-50 text-red-500' : 'bg-brand-primary/10 text-brand-primary'
                        }`}>
                        <AlertTriangle size={24} />
                    </div>

                    <h3 className="text-lg font-black text-slate-800 mb-2">
                        {title}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                        {description}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={onCancel}
                        className="flex-1 font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        onClick={onConfirm}
                        className={`flex-1 font-black shadow-md transition-transform active:scale-95 ${isDestructive
                                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
                                : 'bg-brand-primary hover:bg-brand-primary/90 text-white'
                            }`}
                    >
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}
