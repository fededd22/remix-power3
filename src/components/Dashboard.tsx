import React, { useState } from 'react';
import {
  Zap,
  LogOut,
  RefreshCw,
  Sparkles,
  Wifi,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Gift,
  Flame,
  ShieldCheck,
  ChevronRight,
  Loader2,
  Share2
} from 'lucide-react';
import { UserRecord, ActivationRecord } from '../types';
import { api } from '../services/api';

interface DashboardProps {
  user: UserRecord;
  lang: 'ar' | 'en';
  onLogout: () => void;
  onActivationSuccess: (record: ActivationRecord) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  lang,
  onLogout,
  onActivationSuccess,
}) => {
  const isAr = lang === 'ar';

  const [isActivating, setIsActivating] = useState(false);
  const [activationStep, setActivationStep] = useState<number>(0);
  const [activationResult, setActivationResult] = useState<{
    success: boolean;
    message: string;
    reward: string;
    validity: string;
    source: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sessionCount, setSessionCount] = useState<number>(0);

  const stepsAr = [
    'توليد بصمة الجهاز المشفرة وعقدة Checkpoint...',
    'إرسال طلب شراء الباقة المباشرة DATA_1000_KTM...',
    'فحص وتفعيل مكافآت لعبة Power Snake المتاحة...',
    'تأكيد استلام وتثبيت باقة الإنترنت بنجاح!',
  ];

  const stepsEn = [
    'Generating encrypted device fingerprint & checkpoint token...',
    'Purchasing direct bundle package DATA_1000_KTM...',
    'Scanning & redeeming available Power Snake game rewards...',
    'Confirming internet quota delivery successfully!',
  ];

  const currentSteps = isAr ? stepsAr : stepsEn;

  const handleActivateInternet = async () => {
    setIsActivating(true);
    setActivationResult(null);
    setErrorMsg(null);
    setActivationStep(0);

    // Visual step progression
    const stepInterval = setInterval(() => {
      setActivationStep((prev) => {
        if (prev < currentSteps.length - 1) return prev + 1;
        return prev;
      });
    }, 700);

    try {
      const res = await api.activateBundle();
      clearInterval(stepInterval);
      setActivationStep(currentSteps.length);

      if (res.success) {
        setActivationResult(res);
        setSessionCount((prev) => prev + 1);
        if (res.history && res.history.length > 0) {
          onActivationSuccess(res.history[0]);
        }
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      clearInterval(stepInterval);
      setErrorMsg(err.message || (isAr ? '❌ حدث خطأ، يرجى إعادة المحاولة لاحقاً.' : 'Activation failed'));
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Banner: UNLIMITED MODE */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 p-1 shadow-xl">
        <div className="rounded-[14px] bg-slate-950/90 px-4 py-3 sm:px-6 sm:py-3.5 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600/20 text-red-400 rounded-xl ring-1 ring-red-500/40">
              <Flame className="w-5 h-5 fill-red-500 text-red-500 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-white">
                  {isAr ? 'نظام التفعيل غير المحدود (Power3 Unlimited)' : 'Power3 Unlimited Mode Active'}
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  NO LIMITS
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isAr
                  ? 'تم إلغاء كافة القيود والحدود اليومية، يمكنك تفعيل الباقة عدة مرات دون قيود.'
                  : 'All daily limits removed. You can activate bundles repeatedly without restrictions.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 font-medium">
              {isAr ? 'عمليات هذه الجلسة:' : 'Session activations:'}
            </span>
            <span className="px-2.5 py-1 bg-red-600 text-white font-mono font-bold text-xs rounded-lg shadow-sm">
              {sessionCount}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: User Info Card & Activation Trigger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* User Account Card */}
        <div className="lg:col-span-5 rounded-3xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  {isAr ? 'الحساب متصل وجاهز' : 'Connected & Ready'}
                </span>
              </div>
              {user.isSimulated && (
                <span className="text-[10px] bg-sky-500/20 border border-sky-500/40 text-sky-300 px-2 py-0.5 rounded-full font-semibold">
                  {isAr ? 'وضع تجريبي' : 'Demo Mode'}
                </span>
              )}
            </div>

            {/* SIM Card Graphic */}
            <div className="relative rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 border border-rose-900/40 p-5 shadow-inner">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Wifi className="w-5 h-5 text-rose-500" />
                  <span className="font-extrabold text-sm tracking-wide text-white uppercase">
                    Ooredoo DZ
                  </span>
                </div>
                <div className="w-8 h-6 rounded bg-amber-400/80 border border-amber-300 flex items-center justify-center opacity-80">
                  <div className="w-5 h-3 border border-amber-900/40 rounded-sm" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] font-mono uppercase tracking-widest text-slate-400">
                  {isAr ? 'رقم الشريحة' : 'SIM MSISDN'}
                </div>
                <div className="text-2xl font-black font-mono tracking-wider text-white">
                  {user.displayNumber || user.msisdn}
                </div>
                <div className="text-xs font-mono text-slate-500">
                  MSISDN: {user.msisdn}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {isAr ? 'توكن مفعل وآمن' : 'Authorized Token'}
                </span>
                <span>Power3 Engine</span>
              </div>
            </div>

            {/* Fast info stats */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="text-xs text-slate-400">{isAr ? 'حجم الباقة' : 'Bundle Quota'}</div>
                <div className="text-lg font-black text-white mt-0.5">1 GB</div>
                <div className="text-[10px] text-rose-400">{isAr ? 'صالحة لـ 3 أيام' : '3 Days Validity'}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="text-xs text-slate-400">{isAr ? 'سعر التفعيل' : 'Activation Cost'}</div>
                <div className="text-lg font-black text-emerald-400 mt-0.5">{isAr ? '0 دج (مجاناً)' : '0 DZD (Free)'}</div>
                <div className="text-[10px] text-slate-400">{isAr ? 'بدون رصيد مطلوب' : 'No balance required'}</div>
              </div>
            </div>
          </div>

          {/* Relogin / Switch button */}
          <div className="pt-6 border-t border-slate-800/80 mt-4 flex items-center gap-2">
            <button
              onClick={onLogout}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>{isAr ? 'تسجيل الدخول من جديد / تغيير الرقم' : 'Relogin / Switch Number'}</span>
            </button>
          </div>
        </div>

        {/* Central Activation Trigger Box */}
        <div className="lg:col-span-7 rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 flex flex-col justify-between shadow-xl relative overflow-hidden">
          {/* Ambient light */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-6 relative">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold mb-3">
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                <span>{isAr ? 'باقة إنترنت مجانية 1 GB' : 'Free 1 GB Internet Bundle'}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {isAr ? 'تفعيل إنترنت أوريدو فوري ⚡' : 'Instant Ooredoo Internet Activation ⚡'}
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                {isAr
                  ? 'اضغط على الزر أدناه لبدء عملية التفعيل الآلية عبر نقاط BFF ومكافآت Power Snake المتاحة لشريحتك.'
                  : 'Click below to initiate automated activation through Ooredoo BFF and Power Snake gamification sweep.'}
              </p>
            </div>

            {/* BIG ACTION BUTTON */}
            <div className="py-2">
              <button
                onClick={handleActivateInternet}
                disabled={isActivating}
                className="w-full group relative py-6 px-8 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-xl sm:text-2xl shadow-2xl shadow-rose-600/40 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer overflow-hidden ring-2 ring-red-400/40 animate-pulse-glow"
              >
                {/* Gloss effect */}
                <div className="absolute inset-0 w-1/2 h-full bg-white/10 skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition duration-1000" />

                <div className="relative flex items-center justify-center gap-3">
                  {isActivating ? (
                    <>
                      <Loader2 className="w-7 h-7 animate-spin text-white" />
                      <span>{isAr ? 'جاري التفعيل الآن...' : 'Activating Now...'}</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-7 h-7 fill-white stroke-white group-hover:scale-110 transition" />
                      <span>{isAr ? '⚡ تفعيل إنترنت (1 GB)' : '⚡ Activate Internet (1 GB)'}</span>
                    </>
                  )}
                </div>
              </button>
            </div>

            {/* Step Progression (When activating) */}
            {isActivating && (
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 animate-fadeIn">
                <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>{isAr ? 'خطوات تنفيذ الطلب:' : 'Execution Pipeline:'}</span>
                  <span className="text-rose-400 font-mono">{activationStep + 1} / {currentSteps.length}</span>
                </div>
                <div className="space-y-2">
                  {currentSteps.map((stepDesc, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-2.5 text-xs transition-all ${
                        idx < activationStep
                          ? 'text-emerald-400 font-medium'
                          : idx === activationStep
                          ? 'text-rose-300 font-bold'
                          : 'text-slate-600'
                      }`}
                    >
                      {idx < activationStep ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : idx === activationStep ? (
                        <Loader2 className="w-4 h-4 text-rose-400 animate-spin shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-[10px] text-slate-600 shrink-0">
                          {idx + 1}
                        </div>
                      )}
                      <span>{stepDesc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Success Celebration Card */}
            {activationResult && !isActivating && (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/70 to-slate-950 border border-emerald-500/50 text-white shadow-xl animate-fadeIn space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-white">
                        {isAr ? 'تمت عملية التفعيل بنجاح! 🎉' : 'Internet Activated Successfully! 🎉'}
                      </h4>
                      <p className="text-xs text-emerald-300 font-mono mt-0.5">
                        {activationResult.message.split('\n')[0]}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-600 text-white text-[11px] font-black rounded-lg uppercase">
                    ACTIVE
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-emerald-900/30">
                    <span className="text-slate-400 text-[10px] block">{isAr ? 'حجم الإنترنت' : 'Data Quota'}</span>
                    <span className="font-bold text-white text-sm">{activationResult.reward || '1 GB'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-emerald-900/30">
                    <span className="text-slate-400 text-[10px] block">{isAr ? 'مدة الصلاحية' : 'Validity'}</span>
                    <span className="font-bold text-white text-sm">{activationResult.validity || '3'} {isAr ? 'أيام' : 'Days'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-emerald-900/30 col-span-2 sm:col-span-1">
                    <span className="text-slate-400 text-[10px] block">{isAr ? 'المصدر' : 'Source'}</span>
                    <span className="font-bold text-emerald-400 text-xs truncate block">{activationResult.source}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error Alert */}
            {errorMsg && !isActivating && (
              <div className="p-4 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{errorMsg}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
