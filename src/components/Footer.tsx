import React from 'react';
import { Zap, Heart, Shield, Radio } from 'lucide-react';

interface FooterProps {
  lang: 'ar' | 'en';
}

export const Footer: React.FC<FooterProps> = ({ lang }) => {
  const isAr = lang === 'ar';

  return (
    <footer className="mt-16 border-t border-slate-900 bg-slate-950/90 text-slate-400 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-red-600 flex items-center justify-center text-white font-black text-[10px]">
            P3
          </div>
          <span className="font-bold text-white">Power3</span>
          <span>•</span>
          <span>{isAr ? 'نسخة الويب السريعة (v1.5.21)' : 'High-Performance Web Edition (v1.5.21)'}</span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-rose-400 font-semibold hidden sm:inline">by moon</span>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <span className="flex items-center gap-1">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ooredoo DZ BFF Engine</span>
          </span>
          <span>•</span>
          <span className="text-emerald-400 font-semibold">{isAr ? 'تفعيل غير محدود (UNLIMITED)' : 'UNLIMITED NO LIMITS'}</span>
        </div>
      </div>
    </footer>
  );
};
