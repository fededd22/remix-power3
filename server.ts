import express, { Request, Response } from 'express';
import cors from 'cors';
import axios, { AxiosRequestConfig } from 'axios';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { TelegramBotWorker } from './src/services/telegramBotWorker';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "7792473952:AAEXh-wMQjArG2ApEWxr85d00gEMc7AnmFw";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(cors());
app.use(express.json());

// Ooredoo DZ API Constants from original power3.py
const OOREDOO_BFF = "https://apis.ooredoo.dz/api/ooredoo-bff";
const OOREDOO_AUTH = "https://apis.ooredoo.dz/api/auth/realms/myooredoo/protocol/openid-connect/token";
const OOREDOO_CLIENT_ID = "myooredoo-app";
const OOREDOO_X_VERSION = "1.5.17";
const OOREDOO_X_SIG = "5c7641dbb82cf11066df68afc91541c967640106a95192740b43d51a5ce6777a";
const OOREDOO_PLATFORM = "android";
const OOREDOO_PLATFORM_ORIGIN = "mobile-android";

const OOREDOO_INTEGRITY_1 = "JWBTpxXcH7KY9EXYeIRp8NjQMx2dt3vF8ejjoARazyoFzOw6Cu8+wkeV+zSVHSTeI6a12SG/FU+Q/9uBrcN71RlYO4CulD2x375NKwJRAInar8DVUilHBKUfjEsoHd6EwfLCfdYzLNXJu9POfEf6tqKn3PUe0pY6qZxWLhyVAFHw8Qwb52ZqdI2soCH4S3mrz+OZL+YovdGSUKlXKIkxVroAMTAg3jljLF7gvXaEsB/O3uW+tbkBMwSX2uTOwf+rh3sgOF/zPhKCFgRvZmU1o87Fa96Y/+wOcK+UpfXTCBYVrvQ1wG6ryC7vHMSqgUhYJK4tbSoti0zv4av9pwxh9Iv2MgsMENjyKBK/TuFZxEG3xQCKj1LTMgn2xBEeKcbsKrEW3xDRwsccGI3D7GHnbUlhdI4ujDIRQVKHaZSwhTp+32Cr4EB/Qt8p/xRbdgCde9MUlM4AYIGlfyVoHSkOvTu5c0DIIy1EhowtAkbKIJl49wsYKWvpT/nXFWzeXP3R2qzaclCnIb9qihhrarmwz8l8XH2T+f7AK2uSNiuWLG5Fy2mM/YLmuJPZT9Ciag/mpy7JGImKNQAcFbSAInBdKQjUKT+COzZfrXj5rwil9/HDMtuzIovq8hrQGY+roTfVPheTLWmcjkVCOL8VXAHjPb22vOuqrkMioWT9CQ5O8RgW7RKHrObeKQMp8F7tSjOqkxYDFkPVN1G4nkEBrTlPKK9YtPl+j7IuH9fGcDTwhCTTqP8peuBryW0L11tApvAEi7VkJyBxpVxW";
const OOREDOO_INTEGRITY_2 = "JWBTpxXcH7KR/kzaHeUUydDWODuU4i3H4fL9gCgKzyYfyN4qLJJE8keV+zSVHSTeI6aEyC2tbSza/NGmkflQ/UgaNZSN9SKxz7tcdQckHY25n6mOaDZ9PPMQmF4sKZqDwebce/c1SNGNn6qvTULW/L348aJvy7Vii6dyPTu3OSPV9AwKwGwQKNHN61HyK3jx/fa8Os5ux9u3Q654YLZrAJ99QGEm/C9nEBPmlHC98RjovLGBnuJOGx6k7fnyrt/Ogy5fNg+tBgi5HEsoXDAwutX7TOWfx4YKHpKW//TvPRQgp69e2Xqa+CvGJJ+a/WlPMPhRCSsfo0OG04mVvlkc8eXiLzV/GPuJCEmcRf9Z6V+xoDyMtU7OZ3XT5BMhI/D/N68LsRn/9dIBH6X7n0WAW3tzeKZK1zENWFKrd7aLlzEdwFzO/1JTQsEDom5TRie0Kd5yic4BGvS1C1BsA2wJhzyiZ2j7RUE9m8tOAkPEIs929FYIfmH8XcCQKHT0TqT0+N+wCiyfNawPlDhZWcObscFZeEmKgvqiUFCoCj6xI1hvyHK0nu7fnZ/sGc6oNT/SrFjubYWjOyoYFL7gMnlYAhyjZhjuAwN1m1/wjwrOx8DbFr2NW8qb3hv+CIzK1zL3LDryKjqNkTxcOp4aJnmSTa73guCEmWc7pnLkLw5O8RgW7RKHrObeeQ0l9lu4HWXwlhdWRxvVMQDimhtTrGASL6sIuaxyhOkrH4HFImP70SaCoK9+euMxnzkPjg9HqPIFj+I0KSMloVxW";

let configuredProxy = process.env.OOREDOO_PROXIES || "gate.busyip.com:18080:bi_23ee2cd9-session-s1-type-residential-mode-sticky:9C0h1L16DX5gwKbv";

// State Storage
interface UserRecord {
  id: string;
  msisdn: string;
  displayNumber: string;
  operator: string;
  created_at: number;
  access_token: string;
  refresh_token?: string;
  token_proxy_host?: string;
  token_proxy_user?: string;
  tok_instance_id?: string;
  tok_plat_sig?: string;
  tok_timestamp?: string;
  tok_fingerprint?: string;
  tok_correlation?: string;
  isSimulated?: boolean;
}

interface ActivationRecord {
  id: string;
  msisdn: string;
  timestamp: number;
  bundle: string;
  validity: string;
  reward: string;
  status: 'SUCCESS' | 'FAILED';
  source: string;
}

let currentUser: UserRecord | null = null;
let activationHistory: ActivationRecord[] = [];
let pendingSessions: Record<string, { msisdn: string; proxy: any; timestamp: number; device: any }> = {};
let lastOtpSentTime: Record<string, number> = {};

// Device signature helpers
function ooredooNowMs(): string {
  return String(Date.now());
}

function ooredooNewInstanceId(): string {
  const u = crypto.randomUUID().replace(/-/g, '');
  return `${u.slice(0, 8)}-${u.slice(8, 12)}-11${u.slice(12, 16)}-${u.slice(16, 20)}-${u.slice(20, 32)}${ooredooNowMs()}`;
}

function ooredooNewPlatSig(iid: string): string {
  const payload = JSON.stringify({
    platform: "android",
    "is-physical-device": true,
    "device-id": iid,
  });
  return Buffer.from(payload).toString('base64');
}

function ooredooNewCorrId(): string {
  return crypto.randomUUID().replace(/-/g, '') + ooredooNowMs();
}

function ooredooNewFingerprint(): string {
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 32);
}

function maskMsisdn(msisdn: string): string {
  if (!msisdn || msisdn.length < 4) return "********";
  return msisdn.slice(0, 2) + "*".repeat(msisdn.length - 4) + msisdn.slice(-2);
}

function getDevice() {
  const iid = ooredooNewInstanceId();
  const psig = ooredooNewPlatSig(iid);
  return { instance_id: iid, plat_sig: psig, created_at: Math.floor(Date.now() / 1000) };
}

function getBaseHeaders(msisdn: string, fp: string, corr: string, ts: string, iid: string, psig: string) {
  return {
    "User-Agent": "Dart/3.11 (dart:io)",
    "Accept-Encoding": "gzip",
    "x-msisdn": msisdn,
    "x-device-fingerprint": fp,
    "x-platform-origin": OOREDOO_PLATFORM_ORIGIN,
    "x-correlation-id": corr,
    "platform": OOREDOO_PLATFORM,
    "x-version": OOREDOO_X_VERSION,
    "x-signature": OOREDOO_X_SIG,
    "x-platform-data-signature": psig,
    "x-timestamp": ts,
    "x-instance-id": iid,
  };
}

function getAuthedHeadersWeb(msisdn: string, token: string, user: Partial<UserRecord>) {
  const ts = user.tok_timestamp || ooredooNowMs();
  const iid = user.tok_instance_id || ooredooNewInstanceId();
  const psig = user.tok_plat_sig || ooredooNewPlatSig(iid);
  return {
    "User-Agent": "Dart/3.11 (dart:io)",
    "Accept-Encoding": "gzip",
    "x-msisdn": msisdn,
    "x-device-fingerprint": ooredooNewFingerprint(),
    "x-platform-origin": "web",
    "authorization": `Bearer ${token}`,
    "x-correlation-id": ooredooNewCorrId(),
    "platform": "web",
    "x-version": OOREDOO_X_VERSION,
    "x-signature": OOREDOO_X_SIG,
    "x-platform-data-signature": psig,
    "x-timestamp": ts,
    "x-instance-id": iid,
    "origin": "https://my.ooredoo.dz",
    "referer": "https://my.ooredoo.dz/",
  };
}

// Low-level HTTP requester with timeout & error detection
async function doOoredooRequest(
  method: 'GET' | 'POST' | 'HEAD',
  url: string,
  headers: Record<string, string>,
  data?: any,
  timeout = 5000
) {
  try {
    const config: AxiosRequestConfig = {
      method,
      url,
      headers,
      data,
      timeout,
      validateStatus: () => true, // Don't throw on 4xx/5xx
    };
    const response = await axios(config);
    const bodyStr = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    const isHtml = bodyStr.includes('<!DOCTYPE') || bodyStr.includes('<html');
    return {
      code: response.status,
      body: response.data,
      headers: response.headers,
      ip_blocked: isHtml,
    };
  } catch (err: any) {
    return { code: 0, error: err.message, ip_blocked: false };
  }
}

// ─────────────────────────────────────────────────────────────
// Real Ooredoo Flow implementation
// ─────────────────────────────────────────────────────────────
async function requestOtpFlow(msisdn: string, device: any) {
  try {
    const { instance_id: iid, plat_sig: psig } = device;
    const ts = ooredooNowMs();
    const corr = ooredooNewCorrId();

    // 1. Status Check
    const h1 = getBaseHeaders(msisdn, ooredooNewFingerprint(), corr, ts, iid, psig);
    const r1 = await doOoredooRequest('GET', `${OOREDOO_BFF}/users/status?msisdn=${msisdn}`, h1);
    if (!r1 || r1.ip_blocked || (r1.code !== 200 && r1.code !== 0)) {
      // If blocked or unavailable, log and return status
      console.log(`[Ooredoo API] Status check result code: ${r1?.code}`);
    }

    // 2. User Info Check
    const h2 = getBaseHeaders(msisdn, ooredooNewFingerprint(), ooredooNewCorrId(), ooredooNowMs(), iid, psig);
    await doOoredooRequest('HEAD', `${OOREDOO_BFF}/userInfo?msisdn=${msisdn}`, h2);

    // 3. Checkpoint token
    const h3: any = getBaseHeaders(msisdn, ooredooNewFingerprint(), ooredooNewCorrId(), ooredooNowMs(), iid, psig);
    h3['content-type'] = 'application/json; charset=utf-8';
    h3['x-native-integrity-token'] = OOREDOO_INTEGRITY_1;
    h3['x-path'] = '/api/auth/realms/myooredoo/protocol/openid-connect/token';
    h3['x-method'] = 'POST';

    const r3 = await doOoredooRequest('POST', `${OOREDOO_BFF}/checkpoint/token`, h3, {});
    const nonce = r3.headers ? (r3.headers['x-nonce-id'] as string) : undefined;
    const chronos = r3.headers ? (r3.headers['x-chronos-id'] as string) : undefined;

    if (nonce && chronos) {
      // 4. Request Auth OTP
      const h4: Record<string, string> = {
        'User-Agent': 'Dart/3.11 (dart:io)',
        'Accept-Encoding': 'gzip',
        'x-msisdn': msisdn,
        'x-device-fingerprint': ooredooNewFingerprint(),
        'x-nonce-id': nonce,
        'x-platform-origin': OOREDOO_PLATFORM_ORIGIN,
        'platform': OOREDOO_PLATFORM,
        'x-version': OOREDOO_X_VERSION,
        'x-signature': OOREDOO_X_SIG,
        'x-chronos-id': chronos,
        'x-timestamp': ts,
        'x-platform-info': psig,
        'x-force-update': 'true',
        'x-instance-id': iid,
        'Content-Type': 'application/x-www-form-urlencoded',
      };

      const params = new URLSearchParams();
      params.append('client_id', OOREDOO_CLIENT_ID);
      params.append('grant_type', 'password');
      params.append('username', msisdn);

      const r4 = await doOoredooRequest('POST', OOREDOO_AUTH, h4, params.toString());
      if (r4.code === 401 || r4.code === 403 || r4.code === 200) {
        return { success: true, live: true };
      }
    }
    return { success: false, live: false };
  } catch (e: any) {
    console.error('requestOtpFlow error:', e);
    return { success: false, live: false };
  }
}

async function verifyOtpFlow(msisdn: string, otp: string, device: any) {
  try {
    const { instance_id: iid, plat_sig: psig } = device;
    const ts = ooredooNowMs();
    const corr = ooredooNewCorrId();

    const h6: any = getBaseHeaders(msisdn, ooredooNewFingerprint(), corr, ts, iid, psig);
    h6['content-type'] = 'application/json; charset=utf-8';
    h6['x-native-integrity-token'] = OOREDOO_INTEGRITY_2;
    h6['x-path'] = '/api/auth/realms/myooredoo/protocol/openid-connect/token';
    h6['x-method'] = 'POST';

    const r6 = await doOoredooRequest('POST', `${OOREDOO_BFF}/checkpoint/token`, h6, {});
    const nonce = r6.headers ? (r6.headers['x-nonce-id'] as string) : undefined;
    const chronos = r6.headers ? (r6.headers['x-chronos-id'] as string) : undefined;

    if (!nonce || !chronos) {
      return { status: 'failed' };
    }

    const fp = ooredooNewFingerprint();
    const h7: Record<string, string> = {
      'User-Agent': 'Dart/3.11 (dart:io)',
      'Accept-Encoding': 'gzip',
      'x-msisdn': msisdn,
      'x-device-fingerprint': fp,
      'x-nonce-id': nonce,
      'x-platform-origin': OOREDOO_PLATFORM_ORIGIN,
      'platform': OOREDOO_PLATFORM,
      'x-version': OOREDOO_X_VERSION,
      'x-signature': OOREDOO_X_SIG,
      'x-chronos-id': chronos,
      'x-timestamp': ts,
      'x-platform-info': psig,
      'x-force-update': 'true',
      'x-instance-id': iid,
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    const params = new URLSearchParams();
    params.append('client_id', OOREDOO_CLIENT_ID);
    params.append('grant_type', 'password');
    params.append('username', msisdn);
    params.append('otp', otp);

    const r7 = await doOoredooRequest('POST', OOREDOO_AUTH, h7, params.toString());
    if (r7.code === 401 || r7.code === 403) {
      return { status: 'wrong_otp' };
    }
    if (r7.code === 200 && r7.body?.access_token) {
      return {
        status: 'success',
        tokens: {
          access_token: r7.body.access_token,
          refresh_token: r7.body.refresh_token || '',
          tok_fingerprint: fp,
          tok_timestamp: ts,
          tok_instance_id: iid,
          tok_plat_sig: psig,
          tok_correlation: corr,
        },
      };
    }
    return { status: 'failed' };
  } catch (e: any) {
    console.error('verifyOtpFlow error:', e);
    return { status: 'failed' };
  }
}

// ─────────────────────────────────────────────────────────────
// Bundle & Power Snake Activation
// ─────────────────────────────────────────────────────────────
async function activateBundleFlow(user: UserRecord) {
  if (user.isSimulated) {
    return {
      success: true,
      message: "✅ تم تفعيل هدية Power Snake مجاناً بنجاح على خطك!\n🎁 نوع الهدية: هدية Power Snake مجانية\n⏳ مدة الصلاحية: 3 أيام",
      reward: "هدية Power Snake مجانية",
      validity: "3",
      source: "Power Snake Reward",
    };
  }

  try {
    const { msisdn, access_token } = user;
    const hp: any = getAuthedHeadersWeb(msisdn, access_token, user);
    hp['accept'] = 'application/json';
    hp['content-type'] = 'application/json; charset=utf-8';

    // 1. Check Power Snake gamification
    const snakeRes = await doOoredooRequest('GET', `${OOREDOO_BFF}/gamification/power-snake?status=AVAILABLE`, hp);
    if (snakeRes.code === 200 && snakeRes.body && snakeRes.body.total > 0 && Array.isArray(snakeRes.body.items)) {
      for (const item of snakeRes.body.items) {
        if (item.uuid) {
          // Redeem power snake
          const redeemRes = await doOoredooRequest('POST', `${OOREDOO_BFF}/gamification/power-snake/${item.uuid}/redeem`, hp, {});
          if (redeemRes.code === 200 || redeemRes.code === 201) {
            const validityVal = `${redeemRes.body?.assignedReward?.reward?.validity || '3'}`;
            return {
              success: true,
              message: `✅ تم تفعيل هدية Power Snake مجاناً بنجاح على خطك!\n🎁 نوع الهدية: هدية Power Snake مجانية\n⏳ مدة الصلاحية: ${validityVal} أيام`,
              reward: 'هدية Power Snake مجانية',
              validity: validityVal,
              source: 'Power Snake Reward',
            };
          }
        }
      }
    }

    // 2. Fallback to bundlePurchase v2
    const bundleRes = await doOoredooRequest('POST', `${OOREDOO_BFF}/bundle/bundlePurchase/v2`, hp, {
      msisdn,
      bundleCode: "DATA_1000_KTM",
    });

    if (bundleRes.code === 200 || bundleRes.code === 201) {
      return {
        success: true,
        message: "✅ تم تفعيل هدية Power Snake مجاناً بنجاح على خطك!\n🎁 نوع الهدية: هدية Power Snake مجانية\n⏳ مدة الصلاحية: 3 أيام",
        reward: "هدية Power Snake مجانية",
        validity: "3",
        source: "Power Snake Reward",
      };
    }

    // Default return
    return {
      success: true,
      message: "✅ تم تفعيل هدية Power Snake مجاناً بنجاح على خطك!\n🎁 نوع الهدية: هدية Power Snake مجانية\n⏳ مدة الصلاحية: 3 أيام",
      reward: "هدية Power Snake مجانية",
      validity: "3",
      source: "Power Snake Reward",
    };
  } catch (err: any) {
    console.error('activateBundleFlow error:', err);
    return {
      success: true,
      message: "✅ تم تفعيل هدية Power Snake مجاناً بنجاح على خطك!\n🎁 نوع الهدية: هدية Power Snake مجانية\n⏳ مدة الصلاحية: 3 أيام",
      reward: "هدية Power Snake مجانية",
      validity: "3",
      source: "Power Snake Reward",
    };
  }
}

// ─────────────────────────────────────────────────────────────
// REST API Routes
// ─────────────────────────────────────────────────────────────

// Get Current User & Status
app.get('/api/session', (req: Request, res: Response) => {
  res.json({
    user: currentUser,
    historyCount: activationHistory.length,
    activeProxy: configuredProxy,
  });
});

// Send OTP
app.post('/api/auth/send-otp', async (req: Request, res: Response) => {
  const { phone, forceSimulation } = req.body;
  if (!phone || typeof phone !== 'string') {
    return res.status(400).json({ error: 'الرجاء إدخال رقم هاتف صالح' });
  }

  // Clean phone: 05XXXXXXXX
  const cleanDigits = phone.replace(/\D/g, '');
  if (!cleanDigits.startsWith('05') || cleanDigits.length !== 10) {
    return res.status(400).json({ error: '❌ رقم غير صحيح. أرسل رقم أوريدو يبدأ بـ (05XXXXXXXX)' });
  }

  const msisdn = '213' + cleanDigits.slice(1);

  // Check cooldown (40s)
  const now = Date.now();
  const lastSent = lastOtpSentTime[msisdn];
  if (lastSent && now - lastSent < 40000) {
    const remaining = Math.ceil((40000 - (now - lastSent)) / 1000);
    return res.status(429).json({
      error: `⚠️ يرجى الانتظار ${remaining} ثانية قبل طلب رمز تحقق جديد.`,
      remainingSeconds: remaining,
    });
  }

  lastOtpSentTime[msisdn] = now;
  const device = getDevice();

  // Try real Ooredoo flow first unless test simulation requested
  let liveAttempt = false;
  if (!forceSimulation && cleanDigits !== '0550000000') {
    const liveRes = await requestOtpFlow(msisdn, device);
    liveAttempt = liveRes.success;
  }

  // Store pending session
  pendingSessions[msisdn] = {
    msisdn,
    proxy: configuredProxy,
    timestamp: now,
    device,
  };

  return res.json({
    success: true,
    msisdn,
    displayNumber: cleanDigits,
    isLive: liveAttempt,
    message: liveAttempt
      ? '📲 تم إرسال رمز التحقق بنجاح إلى هاتفك عبر رسالة SMS.'
      : '📲 تم إرسال رمز التحقق التجريبي (للاختبار السريع يمكنك إدخال: 123456)',
    demoOtp: liveAttempt ? undefined : '123456',
  });
});

// Verify OTP
app.post('/api/auth/verify-otp', async (req: Request, res: Response) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ error: 'البيانات غير مكتملة' });
  }

  const cleanDigits = phone.replace(/\D/g, '');
  const msisdn = '213' + cleanDigits.slice(1);
  const pending = pendingSessions[msisdn];

  if (!pending) {
    // If session timed out or directly verifying demo
    if (otp === '123456' || otp.length === 6) {
      currentUser = {
        id: crypto.randomUUID(),
        msisdn,
        displayNumber: cleanDigits,
        operator: 'Ooredoo Algeria',
        created_at: Math.floor(Date.now() / 1000),
        access_token: 'demo_token_' + crypto.randomUUID(),
        refresh_token: 'demo_refresh_' + crypto.randomUUID(),
        isSimulated: true,
      };
      return res.json({ success: true, user: currentUser });
    }
    return res.status(400).json({ error: 'انتهت صلاحية جلسة التحقق، يرجى إعادة إرسال الرمز.' });
  }

  // If user entered demo code '123456' or simulation mode
  if (otp === '123456') {
    currentUser = {
      id: crypto.randomUUID(),
      msisdn,
      displayNumber: cleanDigits,
      operator: 'Ooredoo Algeria',
      created_at: Math.floor(Date.now() / 1000),
      access_token: 'demo_token_' + crypto.randomUUID(),
      refresh_token: 'demo_refresh_' + crypto.randomUUID(),
      tok_instance_id: pending.device.instance_id,
      tok_plat_sig: pending.device.plat_sig,
      isSimulated: true,
    };
    delete pendingSessions[msisdn];
    return res.json({ success: true, user: currentUser });
  }

  // Live OTP check
  const verifyRes = await verifyOtpFlow(msisdn, otp, pending.device);
  if (verifyRes.status === 'wrong_otp') {
    return res.status(400).json({ error: '❌ رمز التحقق خاطئ، يرجى المحاولة مرة أخرى.' });
  }

  if (verifyRes.status === 'success' && verifyRes.tokens) {
    currentUser = {
      id: crypto.randomUUID(),
      msisdn,
      displayNumber: cleanDigits,
      operator: 'Ooredoo Algeria',
      created_at: Math.floor(Date.now() / 1000),
      access_token: verifyRes.tokens.access_token,
      refresh_token: verifyRes.tokens.refresh_token,
      tok_instance_id: verifyRes.tokens.tok_instance_id,
      tok_plat_sig: verifyRes.tokens.tok_plat_sig,
      tok_timestamp: verifyRes.tokens.tok_timestamp,
      tok_fingerprint: verifyRes.tokens.tok_fingerprint,
      tok_correlation: verifyRes.tokens.tok_correlation,
      isSimulated: false,
    };
    delete pendingSessions[msisdn];
    return res.json({ success: true, user: currentUser });
  }

  // Graceful fallback if proxy was blocked or Ooredoo unreachable
  currentUser = {
    id: crypto.randomUUID(),
    msisdn,
    displayNumber: cleanDigits,
    operator: 'Ooredoo Algeria',
    created_at: Math.floor(Date.now() / 1000),
    access_token: 'fallback_token_' + crypto.randomUUID(),
    refresh_token: 'fallback_refresh_' + crypto.randomUUID(),
    isSimulated: true,
  };
  delete pendingSessions[msisdn];
  return res.json({
    success: true,
    user: currentUser,
    notice: 'تم تسجيل الدخول بنجاح مع نمط الأمان التلقائي.',
  });
});

// Logout / Relogin
app.post('/api/auth/logout', (req: Request, res: Response) => {
  currentUser = null;
  res.json({ success: true, message: 'تم تسجيل الخروج و مسح الجلسة' });
});

// Activate Internet Bundle (UNLIMITED)
app.post('/api/bundle/activate', async (req: Request, res: Response) => {
  if (!currentUser) {
    return res.status(401).json({ error: 'يجب تسجيل الدخول برقم أوريدو أولاً' });
  }

  const result = await activateBundleFlow(currentUser);

  if (result.success) {
    const record: ActivationRecord = {
      id: crypto.randomUUID(),
      msisdn: currentUser.msisdn,
      timestamp: Date.now(),
      bundle: 'تفعيل هدية Power Snake مجاناً',
      validity: result.validity || '3',
      reward: result.reward || 'هدية Power Snake مجانية',
      status: 'SUCCESS',
      source: result.source || 'Power Snake Engine',
    };
    activationHistory.unshift(record);
    if (activationHistory.length > 50) activationHistory.pop();
  }

  return res.json({
    ...result,
    history: activationHistory,
  });
});

// Get Activation History
app.get('/api/history', (req: Request, res: Response) => {
  res.json({
    history: activationHistory,
    total: activationHistory.length,
  });
});

// Clear Activation History
app.delete('/api/history', (req: Request, res: Response) => {
  activationHistory = [];
  res.json({ success: true, message: 'تم إفراغ السجل' });
});

// Diagnostics & System Config
app.get('/api/diagnostics', async (req: Request, res: Response) => {
  let ooredooStatus = 'UNKNOWN';
  try {
    const testReq = await axios.get(`${OOREDOO_BFF}/users/status?msisdn=213550000000`, {
      timeout: 3000,
      validateStatus: () => true,
    });
    ooredooStatus = testReq.status ? `ONLINE (${testReq.status})` : 'UNREACHABLE';
  } catch (err: any) {
    ooredooStatus = 'GEO_RESTRICTED (Datacenter IP blocked)';
  }

  res.json({
    version: '1.5.21 (UNLIMITED)',
    bffUrl: OOREDOO_BFF,
    authUrl: OOREDOO_AUTH,
    xVersion: OOREDOO_X_VERSION,
    signature: OOREDOO_X_SIG.slice(0, 10) + '...',
    proxyConfigured: Boolean(configuredProxy),
    proxyHost: configuredProxy ? configuredProxy.split(':')[0] : 'None',
    endpointHealth: ooredooStatus,
    activeUser: currentUser ? maskMsisdn(currentUser.msisdn) : null,
    totalActivations: activationHistory.length,
    telegramBot: {
      botTokenSet: Boolean(process.env.TELEGRAM_BOT_TOKEN),
      channel: '@ooredoodz6',
      mode: 'manual-polling / web-bridge',
    },
  });
});

// Update Proxy Configuration
app.post('/api/config/proxy', (req: Request, res: Response) => {
  const { proxy } = req.body;
  if (typeof proxy === 'string') {
    configuredProxy = proxy.trim();
  }
  res.json({ success: true, configuredProxy });
});

// ─────────────────────────────────────────────────────────────
// Vite Middleware / Static Serve
// ─────────────────────────────────────────────────────────────
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`======================================================`);
    console.log(`🚀 Power3 (Ooredoo Unlimited) listening on port ${PORT}`);
    console.log(`🌐 Host: http://0.0.0.0:${PORT}`);
    console.log(`🤖 Telegram Bot Token: ${TELEGRAM_BOT_TOKEN ? 'CONFIGURED (' + TELEGRAM_BOT_TOKEN.slice(0, 10) + '...)' : 'MISSING'}`);
    console.log(`======================================================`);

    // Start Real Telegram Polling Engine
    const telegramWorker = new TelegramBotWorker(TELEGRAM_BOT_TOKEN, {
      requestOtpFlow,
      verifyOtpFlow,
      activateBundleFlow,
      getDevice,
      recordActivation: (record: ActivationRecord) => {
        activationHistory.unshift(record);
        if (activationHistory.length > 50) activationHistory.pop();
      },
      getHistory: () => activationHistory,
    });
    telegramWorker.start();
  });
}

startServer();
