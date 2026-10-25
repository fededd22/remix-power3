import React, { useState, useEffect } from 'react';
import { Smartphone, KeyRound, ArrowRight, ArrowLeft, Loader2, AlertCircle, CheckCircle2, Sparkles, Shield, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { UserRecord } from '../types';

interface AuthSectionProps {
  lang: 'ar' | 'en';
  onLoginSuccess: (user: UserRecord) => void;
}

export const AuthSection: React.FC<AuthSectionProps> = ({ lang, onLoginSuccess }) => {
  const isAr = lang === 'ar';

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [suggestedOtp, setSuggestedOtp] = useState<string | null>(null);

  // Countdown timer for 40s cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handlePhoneSubmit = async (e?: React.FormEvent, forceTest = false) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const targetPhone = forceTest ? '0550000000' : phoneNumber;
    const clean = targetPhone.replace(/\D/g, '');

    if (!clean.startsWith('05') || clean.length !== 10) {
      setErrorMsg(
        isAr
          ? '❌ رقم غير صحيح. أرسل رقم أوريدو (05XXXXXXXX) مكون من 10 أرقام.'
          : '❌ Invalid number. Enter an Algerian Ooredoo number (05XXXXXXXX) with 10 digits.'
      );
      return;
    }

    if (cooldown > 0) {
      setErrorMsg(
        isAr
          ? `⚠️ يرجى الانتظار ${cooldown} ثانية قبل طلب رمز تحقق جديد.`
          : `⚠️ Please wait ${cooldown}s before requesting a new OTP.`
      );
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.sendOtp(clean, forceTest);
      setStep('otp');
      setCooldown(40);
      setPhoneNumber(clean);
      setInfoMsg(res.message);
      if (res.demoOtp) {
        setSuggestedOtp(res.demoOtp);
      } else {
        setSuggestedOtp(null);
      }
    } catch (err: any) {
      setErrorMsg(err.message || (isAr ? '❌ حدث خطأ، يرجى المحاولة لاحقاً.' : 'Error requesting OTP'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e?: React.FormEvent, overrideCode?: string) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    const code = (overrideCode || otpCode).trim();
    if (!/^\d{6}$/.test(code)) {
      setErrorMsg(isAr ? '❌ الرمز يجب أن يكون 6 أرقام صحيحة.' : '❌ OTP must be exactly 6 digits.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.verifyOtp(phoneNumber, code);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      }
    } catch (err: any) {
      setErrorMsg(err.message || (isAr ? '❌ رمز التحقق خاطئ، يرجى المحاولة مرة أخرى.' : 'Wrong OTP code'));
    } finally {
      setIsLoading(false);
    }
  };

  const quickFillTestAccount = () => {
    setPhoneNumber('0550000000');
    handlePhoneSubmit(undefined, true);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl p-6 sm:p-8">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -left-24 w-52 h-52 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-52 h-52 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 text-white shadow-lg shadow-rose-600/30 mb-3 ring-4 ring-rose-500/10">
            {step === 'phone' ? <Smartphone className="w-7 h-7" /> : <KeyRound className="w-7 h-7" />}
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            {step === 'phone'
              ? isAr ? 'تسجيل الدخول برقم أوريدو' : 'Sign in with Ooredoo DZ'
              : isAr ? 'أدخل رمز التحقق (OTP)' : 'Enter Verification Code'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {step === 'phone'
              ? isAr
                ? 'أدخل رقم شريحتك لبدء تفعيل باقات الإنترنت غير المحدودة 🚀'
                : 'Enter your SIM phone number to start unlimited activations 🚀'
              : isAr
                ? `تم إرسال رمز الأمان إلى الرقم ${phoneNumber}`
                : `Verification code sent to ${phoneNumber}`}
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs sm:text-sm flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {/* Info Alert */}
        {infoMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-200 text-xs sm:text-sm flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{infoMsg}</div>
          </div>
        )}

        {/* STEP 1: PHONE NUMBER FORM */}
        {step === 'phone' && (
          <form onSubmit={(e) => handlePhoneSubmit(e, false)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                {isAr ? 'رقم الهاتف (أوريدو الجزائر)' : 'Phone Number (Ooredoo DZ)'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-mono text-sm">
                  +213
                </div>
                <input
                  type="tel"
                  dir="ltr"
                  placeholder="05XXXXXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  maxLength={10}
                  className="w-full pl-16 pr-4 py-3.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white font-mono text-base placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition shadow-inner"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between">
                <span>{isAr ? 'مثال: 0550123456' : 'e.g. 0550123456'}</span>
                <span className="text-slate-400 font-mono">{phoneNumber.length}/10</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || cooldown > 0}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 shadow-lg shadow-rose-600/30 active:scale-[0.99] transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{isAr ? 'جاري إرسال الرمز...' : 'Sending OTP...'}</span>
                </>
              ) : cooldown > 0 ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>
                    {isAr ? `انتظر ${cooldown} ثانية` : `Wait ${cooldown}s`}
                  </span>
                </>
              ) : (
                <>
                  <span>{isAr ? 'إرسال رمز التحقق (OTP)' : 'Send Verification OTP'}</span>
                  {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </>
              )}
            </button>

            {/* Quick Test Demo Button */}
            <div className="pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={quickFillTestAccount}
                className="w-full py-2.5 px-3 rounded-lg text-xs font-semibold text-rose-300 bg-rose-950/30 hover:bg-rose-950/60 border border-rose-900/50 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                <span>
                  {isAr ? 'تجربة سريعة بدون شريحة (حساب تجريبي 0550000000)' : 'Quick Test Demo (0550000000)'}
                </span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: OTP VERIFICATION FORM */}
        {step === 'otp' && (
          <form onSubmit={(e) => handleOtpSubmit(e)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                {isAr ? 'رمز التحقق (6 أرقام)' : 'Verification Code (6 Digits)'}
              </label>
              <input
                type="text"
                dir="ltr"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="• • • • • •"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3.5 text-center bg-slate-950/80 border border-slate-700/80 rounded-xl text-white font-mono text-2xl tracking-[0.5em] placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition shadow-inner"
                autoFocus
              />
            </div>

            {/* Quick fill suggestion for testing */}
            {suggestedOtp && (
              <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/40 text-amber-200 text-xs flex items-center justify-between">
                <span>{isAr ? `رمز الاختبار التلقائي:` : 'Suggested test code:'} <strong>{suggestedOtp}</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    setOtpCode(suggestedOtp);
                    handleOtpSubmit(undefined, suggestedOtp);
                  }}
                  className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded font-bold text-[11px] transition cursor-pointer"
                >
                  {isAr ? 'تعبئة وتأكيد' : 'Auto-fill & Submit'}
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || otpCode.length !== 6}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 shadow-lg shadow-rose-600/30 active:scale-[0.99] transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{isAr ? 'جاري التحقق...' : 'Verifying OTP...'}</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>{isAr ? 'تأكيد الرمز وتسجيل الدخول' : 'Verify Code & Sign In'}</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setOtpCode('');
                  setErrorMsg(null);
                }}
                className="text-slate-400 hover:text-white transition flex items-center gap-1 cursor-pointer"
              >
                {isAr ? 'تغيير الرقم' : 'Change Phone'}
              </button>

              <button
                type="button"
                disabled={cooldown > 0 || isLoading}
                onClick={() => handlePhoneSubmit(undefined, phoneNumber === '0550000000')}
                className="text-rose-400 hover:text-rose-300 disabled:text-slate-600 disabled:cursor-not-allowed transition cursor-pointer"
              >
                {cooldown > 0
                  ? isAr ? `إعادة الإرسال بعد ${cooldown}ث` : `Resend in ${cooldown}s`
                  : isAr ? 'إعادة إرسال الرمز' : 'Resend Code'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
