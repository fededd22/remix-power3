import React from 'react';
import { Zap, Activity, Globe, Send, ShieldCheck, Terminal } from 'lucide-react';
import { UserRecord } from '../types';

interface NavbarProps {
  user: UserRecord | null;
  lang: 'ar' | 'en';
  setLang: (lang: 'ar' | 'en') => void;
  onOpenDiagnostics: () => void;
  onOpenTelegramModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  lang,
  setLang,
  onOpenDiagnostics,
  onOpenTelegramModal,
}) => {
  const isAr = lang === 'ar';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-rose-900/30 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-red-600 via-rose-600 to-red-800 text-white shadow-lg shadow-red-600/30 ring-1 ring-red-400/40">
            <Zap className="w-6 h-6 fill-white stroke-white animate-pulse" />
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-950" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-white">Power3</span>
              <span className="bg-gradient-to-r from-red-500 to-rose-600 text-white text-[11px] font-black px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">
                Ooredoo DZ
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
              <span>{isAr ? 'بواسطة moon' : 'by moon'}</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-semibold">{isAr ? 'تفعيل غير محدود (v1.5.21)' : 'UNLIMITED (v1.5.21)'}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Telegram bot preview button */}
          <button
            onClick={onOpenTelegramModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition"
            title={isAr ? 'محاكي بوت تيليجرام' : 'Telegram Bot Bridge'}
          >
            <Send className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">@ooredoodz6</span>
          </button>

          {/* Network diagnostics button */}
          <button
            onClick={onOpenDiagnostics}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition"
            title={isAr ? 'فحص الاتصال والبروكسي' : 'Network & Proxy Diagnostics'}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">{isAr ? 'فحص الشبكة' : 'Diagnostics'}</span>
          </button>

          {/* Language toggle */}
          <button
            onClick={() => setLang(isAr ? 'en' : 'ar')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition"
          >
            <Globe className="w-3.5 h-3.5 text-rose-400" />
            <span>{isAr ? 'English' : 'العربية'}</span>
          </button>

          {/* User state badge if logged in */}
          {user && (
            <div className="hidden md:flex items-center gap-2 pl-2 pr-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{user.displayNumber}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
