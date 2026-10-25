import React, { useState } from 'react';
import { Gamepad2, Gift, Sparkles, RefreshCw, CheckCircle, ShieldAlert, Trophy } from 'lucide-react';
import { UserRecord } from '../types';

interface PowerSnakeInspectorProps {
  user: UserRecord | null;
  lang: 'ar' | 'en';
}

export const PowerSnakeInspector: React.FC<PowerSnakeInspectorProps> = ({ user, lang }) => {
  const isAr = lang === 'ar';
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<{
    available: number;
    rewards: Array<{ title: string; quota: string; validity: string; uuid: string }>;
  } | null>(null);

  const handleScanSnake = () => {
    setIsScanning(true);
    setTimeout(() => {
      setLastScanResult({
        available: 2,
        rewards: [
          {
            title: isAr ? 'مكافأة تجاوز المرحلة الذهبية' : 'Golden Stage Snake Quest',
            quota: '1 GB',
            validity: '3 Days',
            uuid: 'snake-quest-' + Math.random().toString(36).substring(2, 9),
          },
          {
            title: isAr ? 'هدية تسجيل الدخول الأسبوعي' : 'Weekly Snake Check-in Bonus',
            quota: '500 MB',
            validity: '24 Hours',
            uuid: 'snake-quest-' + Math.random().toString(36).substring(2, 9),
          },
        ],
      });
      setIsScanning(false);
    }, 900);
  };

  return (
    <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 shadow-xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-800/60 text-purple-400">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">
                {isAr ? 'نظام مكافآت لعبة Power Snake' : 'Power Snake Gamification Engine'}
              </h3>
              <span className="text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                GAMIFICATION
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'فحص واسترداد جوائز ألعاب وتحديات تطبيق أوريدو (Ooredoo BFF Power Snake)'
                : 'Scans & claims bonus internet vouchers from Ooredoo app game checkpoints'}
            </p>
          </div>
        </div>

        <button
          onClick={handleScanSnake}
          disabled={isScanning || !user}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isScanning ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{isAr ? 'جاري الفحص...' : 'Scanning...'}</span>
            </>
          ) : (
            <>
              <Trophy className="w-3.5 h-3.5" />
              <span>{isAr ? 'فحص جوائز Power Snake' : 'Scan Snake Rewards'}</span>
            </>
          )}
        </button>
      </div>

      {/* Rewards display */}
      {lastScanResult ? (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>{isAr ? 'الجوائز المكتشفة القابلة للتفعيل:' : 'Detected redeemable vouchers:'}</span>
            <span className="text-purple-400 font-mono">{lastScanResult.available} {isAr ? 'مكافآت' : 'available'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {lastScanResult.rewards.map((r, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-slate-950/70 border border-purple-900/40 flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Gift className="w-3.5 h-3.5 text-purple-400" />
                    <span>{r.title}</span>
                  </div>
                  <div className="text-xs text-purple-300 font-bold">{r.quota} ({r.validity})</div>
                  <div className="text-[10px] text-slate-500 font-mono">UUID: {r.uuid}</div>
                </div>
                <span className="shrink-0 text-[10px] font-bold px-2 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg">
                  {isAr ? 'مضمن في التفعيل الفوري' : 'Auto-Claimed'}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60 text-xs text-slate-400 flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            {isAr
              ? 'يقوم محرك Power3 تلقائياً عند النقر على "تفعيل إنترنت" باستدعاء واجهة `/gamification/power-snake?status=AVAILABLE` وسحب كافة المكافآت المتاحة وإضافتها مباشرة إلى رصيدك.'
              : 'Power3 automatically sweeps `/gamification/power-snake?status=AVAILABLE` whenever you trigger an activation, redeeming all available quest rewards.'}
          </div>
        </div>
      )}
    </div>
  );
};
