import { UserRecord, ActivationRecord, DiagnosticsData } from '../types';

export const api = {
  async getSession(): Promise<{ user: UserRecord | null; historyCount: number; activeProxy: string }> {
    const res = await fetch('/api/session');
    if (!res.ok) throw new Error('فشل جلب الجلسة');
    return res.json();
  },

  async sendOtp(phone: string, forceSimulation = false): Promise<{
    success: boolean;
    msisdn: string;
    displayNumber: string;
    isLive: boolean;
    message: string;
    demoOtp?: string;
  }> {
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, forceSimulation }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'فشل إرسال رمز التحقق');
    }
    return data;
  },

  async verifyOtp(phone: string, otp: string): Promise<{ success: boolean; user: UserRecord; notice?: string }> {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'فشل التحقق من الرمز');
    }
    return data;
  },

  async logout(): Promise<void> {
    await fetch('/api/auth/logout', { method: 'POST' });
  },

  async activateBundle(): Promise<{
    success: boolean;
    message: string;
    reward: string;
    validity: string;
    source: string;
    history: ActivationRecord[];
  }> {
    const res = await fetch('/api/bundle/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'فشل تفعيل حزمة الإنترنت');
    }
    return data;
  },

  async getHistory(): Promise<{ history: ActivationRecord[]; total: number }> {
    const res = await fetch('/api/history');
    if (!res.ok) throw new Error('فشل جلب السجل');
    return res.json();
  },

  async clearHistory(): Promise<void> {
    await fetch('/api/history', { method: 'DELETE' });
  },

  async getDiagnostics(): Promise<DiagnosticsData> {
    const res = await fetch('/api/diagnostics');
    if (!res.ok) throw new Error('فشل جلب معلومات النظام');
    return res.json();
  },

  async updateProxy(proxy: string): Promise<{ success: boolean; configuredProxy: string }> {
    const res = await fetch('/api/config/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proxy }),
    });
    return res.json();
  },
};
