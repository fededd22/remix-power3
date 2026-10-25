import React, { useState, useEffect } from 'react';
import { X, Server, Shield, CheckCircle, AlertTriangle, RefreshCw, Globe, Key, Lock } from 'lucide-react';
import { DiagnosticsData } from '../types';
import { api } from '../services/api';

interface NetworkDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'en';
}

export const NetworkDiagnosticsModal: React.FC<NetworkDiagnosticsModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  const isAr = lang === 'ar';
  const [data, setData] = useState<DiagnosticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [proxyInput, setProxyInput] = useState('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const fetchDiagnostics = async () => {
    setIsLoading(true);
    try {
      const res = await api.getDiagnostics();
      setData(res);
      if (res.proxyHost) {
        setProxyInput(res.proxyHost);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDiagnostics();
    }
  }, [isOpen]);

  const handleUpdateProxy = async () => {
    if (!proxyInput.trim()) return;
    try {
      await api.updateProxy(proxyInput.trim());
      setSaveStatus(isAr ? 'تم تحديث البروكسي بنجاح' : 'Proxy updated');
      setTimeout(() => setSaveStatus(null), 3000);
      fetchDiagnostics();
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-800 text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {isAr ? 'فحص تشخيص الشبكة وبوابات أوريدو' : 'Network Diagnostics & Gateway Status'}
              </h3>
              <p className="text-xs text-slate-400">
                {isAr ? 'حالة الاتصال بنقاط Ooredoo BFF ومفاتيح التحقق المشفرة' : 'Telecom endpoint health & integrity keys'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4 overflow-y-auto pr-1">
          {isLoading && !data ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-rose-500" />
              <span className="text-xs">{isAr ? 'جاري فحص الاتصال...' : 'Checking connection...'}</span>
            </div>
          ) : data ? (
            <>
              {/* Endpoint Status Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <div className="text-slate-400">{isAr ? 'بوابة Ooredoo BFF' : 'Ooredoo BFF Gateway'}</div>
                  <div className="font-mono font-bold text-white truncate">{data.bffUrl}</div>
                  <div className="text-[11px] text-emerald-400 font-semibold">{data.endpointHealth}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <div className="text-slate-400">{isAr ? 'بوابة التحقق Keycloak' : 'Keycloak Auth Realm'}</div>
                  <div className="font-mono font-bold text-white truncate">myooredoo / openid-connect</div>
                  <div className="text-[11px] text-emerald-400 font-semibold">{isAr ? 'نشط ومشفر' : 'Active & Encrypted'}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <div className="text-slate-400">{isAr ? 'إصدار العميل (x-version)' : 'Client App Version'}</div>
                  <div className="font-mono font-bold text-white">{data.xVersion}</div>
                  <div className="text-[11px] text-slate-400">Platform: Android Mobile</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <div className="text-slate-400">{isAr ? 'بصمة التوقيع (x-signature)' : 'Signature Hash'}</div>
                  <div className="font-mono font-bold text-white">{data.signature}</div>
                  <div className="text-[11px] text-slate-400">SHA-256 Checksum Verified</div>
                </div>
              </div>

              {/* Geographic Proxy Configuration */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-bold text-white">
                      {isAr ? 'بروكسي سكني جزائري (Residential Algerian Proxy)' : 'Algerian Residential Proxy'}
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    {data.proxyConfigured ? (isAr ? 'مفعل' : 'Configured') : (isAr ? 'مباشر' : 'Direct')}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isAr
                    ? 'تقوم خوادم أوريدو بحظر طلبات مراكز البيانات غير الجزائرية تلقائياً. يستخدم هذا المحرك بروكسي سكني لتجاوز الحظر الجغرافي وتنفيذ طلبات الـ OTP والباقات بشكل مباشر.'
                    : 'Ooredoo servers restrict non-Algerian datacenter IPs. Power3 utilizes proxy tunneling to bypass geo-blocks seamlessly.'}
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    dir="ltr"
                    value={proxyInput}
                    onChange={(e) => setProxyInput(e.target.value)}
                    placeholder="host:port:user:pass"
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                  <button
                    onClick={handleUpdateProxy}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    {isAr ? 'حفظ' : 'Save'}
                  </button>
                </div>
                {saveStatus && <p className="text-xs text-emerald-400 font-semibold">{saveStatus}</p>}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
