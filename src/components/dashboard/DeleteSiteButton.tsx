'use client';

import { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

const COPY = {
  trigger: '移除站点',
  title: '确认删除站点？',
  desc: '此操作将永久删除该站点及其所有审计记录、关键词数据和集成信息，无法恢复。',
  confirmLabel: '输入域名',
  confirmSuffix: '以确认删除：',
  placeholder: '输入域名以确认',
  confirm: '确认删除',
  deleting: '删除中...',
  cancel: '取消',
} as const;

interface DeleteSiteButtonProps {
  siteId: string;
  domain: string;
}

export function DeleteSiteButton({ siteId, domain }: DeleteSiteButtonProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/dashboard/sites/${siteId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('站点已删除');
        // Hard navigation so the layout re-runs Server Components and TopNav refreshes
        window.location.href = '/dashboard/site-intelligence';
      } else {
        toast.error(data.error || '删除失败');
        setOpen(false);
      }
    } catch {
      toast.error('删除失败，请重试');
      setOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => { setOpen(true); setInput(''); }}
        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
        title={COPY.trigger}
      >
        <Trash2 size={15} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-6">
          <div className="max-w-md w-full bg-white rounded-2xl p-8 space-y-6 shadow-2xl border border-rose-100 animate-in zoom-in-95 duration-200 relative">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={18} />
            </button>

            <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mx-auto">
              <Trash2 size={28} />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-black tracking-tight text-slate-900">{COPY.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{COPY.desc}</p>
            </div>

            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {COPY.confirmLabel}{' '}
                <strong className="text-slate-700 font-mono normal-case">{domain}</strong>
                {' '}{COPY.confirmSuffix}
              </label>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={COPY.placeholder}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all font-mono"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
                disabled={deleting}
                className="flex-1 font-bold rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                {COPY.cancel}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || input.trim() !== domain}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl px-4 py-2.5 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleting ? COPY.deleting : COPY.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
