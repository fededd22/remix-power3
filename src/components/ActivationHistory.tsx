import React from 'react';
import { History, CheckCircle, Clock, Trash2, ArrowUpRight, ShieldCheck, Database } from 'lucide-react';
import { ActivationRecord } from '../types';

interface ActivationHistoryProps {
  history: ActivationRecord[];
  lang: 'ar' | 'en';
  onClearHistory: () => void;
}

export const ActivationHistory: React.FC<ActivationHistoryProps> = ({
  history,
  lang,
  onClearHistory,
}) => {
  const isAr = lang === 'ar';

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + d.toLocaleDateString();
  };

  return (
    <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 shadow-xl space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300">
            <History className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {isAr ? 'سجل عمليات التفعيل' : 'Activation History'}
            </h3>
            <p className="text-xs text-slate-400">
              {isAr ? 'قائمة بجميع باقات الإنترنت التي تم تفعيلها بنجاح' : 'Log of all internet bundles successfully activated'}
            </p>
          </div>
        </div>

        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-slate-800/80 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isAr ? 'إفراغ السجل' : 'Clear Log'}</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="py-12 text-center rounded-2xl bg-slate-950/40 border border-slate-800/60 p-6 space-y-2">
          <Database className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-400">
            {isAr ? 'لا توجد عمليات تفعيل مسجلة حتى الآن' : 'No activation records yet'}
          </p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {isAr
              ? 'اضغط على زر "⚡ تفعيل إنترنت" بالأعلى لبدء أول عملية تفعيل مجانية 1 GB'
              : 'Click "⚡ Activate Internet" above to trigger your first free 1 GB package'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/80 transition gap-3"
            >
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-white">{item.reward}</span>
                    <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-md">
                      {isAr ? `صالحة ${item.validity} أيام` : `${item.validity} Days`}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                    <span>{item.source}</span>
                    <span className="text-slate-600">•</span>
                    <span className="font-mono text-slate-400">{item.msisdn}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60 text-xs text-slate-400 font-mono">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{formatTimestamp(item.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
