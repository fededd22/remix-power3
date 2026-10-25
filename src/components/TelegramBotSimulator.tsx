import React, { useState } from 'react';
import { X, Send, Bot, Terminal, CheckCircle2, RefreshCw, Flame, ExternalLink } from 'lucide-react';
import { UserRecord } from '../types';

interface TelegramBotSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'en';
  user: UserRecord | null;
  onTriggerActivation: () => void;
  onTriggerRelogin: () => void;
}

export const TelegramBotSimulator: React.FC<TelegramBotSimulatorProps> = ({
  isOpen,
  onClose,
  lang,
  user,
  onTriggerActivation,
  onTriggerRelogin,
}) => {
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState<'chat' | 'channel' | 'terminal'>('chat');

  if (!isOpen) return null;

  const maskedPhone = user ? user.msisdn.slice(0, 4) + '******' + user.msisdn.slice(-2) : '213550******';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">Ooredoo DZ Bot</span>
                <span className="text-[10px] bg-sky-500/20 text-sky-300 font-semibold px-2 py-0.5 rounded-full border border-sky-500/30">
                  by moon
                </span>
              </div>
              <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>bot listening (manual getUpdates loop)</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-2.5 text-center transition border-b-2 ${
              activeTab === 'chat'
                ? 'border-sky-500 text-sky-400 bg-sky-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {isAr ? 'محادثة البوت' : 'Bot Chat UI'}
          </button>
          <button
            onClick={() => setActiveTab('channel')}
            className={`flex-1 py-2.5 text-center transition border-b-2 ${
              activeTab === 'channel'
                ? 'border-sky-500 text-sky-400 bg-sky-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {isAr ? 'قناة الإشعارات (@ooredoodz6)' : 'Channel Logs (@ooredoodz6)'}
          </button>
          <button
            onClick={() => setActiveTab('terminal')}
            className={`flex-1 py-2.5 text-center transition border-b-2 ${
              activeTab === 'terminal'
                ? 'border-sky-500 text-sky-400 bg-sky-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {isAr ? 'سجل الأوامر (Terminal)' : 'Terminal Logs'}
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          {activeTab === 'chat' && (
            <div className="space-y-4">
              {/* Bot greeting bubble */}
              <div className="flex gap-2.5 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  Bot
                </div>
                <div className="p-3.5 rounded-2xl rounded-tl-none bg-slate-800 border border-slate-700/80 text-white text-xs sm:text-sm space-y-2">
                  <p className="font-semibold text-rose-300">
                    {user
                      ? `مرحباً بك مجدداً 🚀\n\nحسابك المرتبط حالياً: (${user.msisdn})\nاختر ما تحتاجه من القائمة أدناه:`
                      : 'مرحبًا بك! 💜\nبوت لتفعيل الإنترنت بسهولة وسرعة 🚀\nأرسل رقم هاتفك (10 أرقام) لبدء التفعيل 📱.'}
                  </p>
                </div>
              </div>

              {/* Bot Inline Keyboard Buttons */}
              {user && (
                <div className="pt-2 pl-10 space-y-2">
                  <button
                    onClick={() => {
                      onTriggerActivation();
                      onClose();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition"
                  >
                    <span>⚡ تفعيل إنترنت (1 GB)</span>
                  </button>
                  <button
                    onClick={() => {
                      onTriggerRelogin();
                      onClose();
                    }}
                    className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs flex items-center justify-center gap-2 cursor-pointer transition"
                  >
                    <span>🔄 تسجيل الدخول من جديد</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'channel' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-800/40 text-xs text-sky-200 flex items-center gap-2">
                <Send className="w-4 h-4 text-sky-400" />
                <span>
                  {isAr
                    ? 'يتم إرسال إشعارات العمليات الناجحة تلقائياً إلى قناة @ooredoodz6'
                    : 'Successful activations are broadcast to telegram channel @ooredoodz6'}
                </span>
              </div>

              {/* Channel Message Card */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2 font-mono">
                <div className="text-emerald-400 font-bold text-sm">🎉 عملية تفعيل ناجحة</div>
                <div className="text-slate-300">👤 المستخدم: @algerian_user</div>
                <div className="text-slate-300">📱 الرقم: <span className="text-amber-400 font-bold">{maskedPhone}</span></div>
                <div className="text-slate-300">📦 التفاصيل: ✅ تم تفعيل إنترنت صالح لمدة 3 أيام - حجم الإنترنت: 1 GB</div>
                <div className="pt-2 text-rose-400 font-bold text-[11px]">⚡ by moon - Power3 v1.5.21</div>
              </div>
            </div>
          )}

          {activeTab === 'terminal' && (
            <div className="p-3.5 rounded-2xl bg-black border border-slate-800 font-mono text-[11px] text-emerald-400 space-y-1.5 overflow-x-auto">
              <div className="text-slate-500">============================================================</div>
              <div className="text-yellow-400">🚀 by moon - UNLIMITED MODE - MANUAL POLLING</div>
              <div className="text-slate-500">============================================================</div>
              <div>✅ Webhook deleted</div>
              <div>✅ Pending updates cleared</div>
              <div>✅ Listening for updates...</div>
              <div>✅ التفعيل غير محدود - لا يوجد حد أقصى</div>
              <div className="text-slate-500">------------------------------------------------------------</div>
              <div className="text-sky-300">📥 System ready on port 3000</div>
              <div className="text-slate-400">⚡ BFF Target: apis.ooredoo.dz/api/ooredoo-bff</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
