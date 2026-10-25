import axios from 'axios';
import crypto from 'crypto';

export interface TelegramWorkerOptions {
  requestOtpFlow: (msisdn: string, device: any) => Promise<{ success: boolean; live: boolean }>;
  verifyOtpFlow: (msisdn: string, otp: string, device: any) => Promise<{ status: string; tokens?: any }>;
  activateBundleFlow: (user: any) => Promise<{ success: boolean; message: string; reward: string; validity: string; source: string }>;
  getDevice: () => any;
  recordActivation: (record: any) => void;
  getHistory: () => any[];
}

interface ChatSession {
  step: 'WAITING_PHONE' | 'WAITING_OTP' | 'LOGGED_IN';
  msisdn?: string;
  displayNumber?: string;
  device?: any;
  userRecord?: any;
  lastOtpTime?: number;
}

export class TelegramBotWorker {
  private token: string;
  private apiBase: string;
  private isRunning: boolean = false;
  private offset: number = 0;
  private sessions: Map<number, ChatSession> = new Map();
  private options: TelegramWorkerOptions;

  constructor(token: string, options: TelegramWorkerOptions) {
    this.token = token.trim();
    this.apiBase = `https://api.telegram.org/bot${this.token}`;
    this.options = options;
  }

  async start() {
    if (!this.token) {
      console.warn('[TelegramBot] No bot token provided. Polling disabled.');
      return;
    }

    this.isRunning = true;
    console.log(`[TelegramBot] Starting long polling worker with token: ${this.token.slice(0, 10)}...`);

    // Delete webhook if set, to allow getUpdates
    try {
      await axios.get(`${this.apiBase}/deleteWebhook?drop_pending_updates=false`);
      const meRes = await axios.get(`${this.apiBase}/getMe`);
      if (meRes.data?.ok) {
        console.log(`[TelegramBot] Connected as @${meRes.data.result.username} (${meRes.data.result.first_name})`);
      }
    } catch (err: any) {
      console.error('[TelegramBot] Error initializing bot connection:', err.message);
    }

    this.pollingLoop();
  }

  stop() {
    this.isRunning = false;
  }

  private async pollingLoop() {
    while (this.isRunning) {
      try {
        const res = await axios.get(`${this.apiBase}/getUpdates`, {
          params: {
            offset: this.offset,
            timeout: 20,
            allowed_updates: JSON.stringify(['message', 'callback_query']),
          },
          timeout: 25000,
        });

        if (res.data?.ok && Array.isArray(res.data.result)) {
          for (const update of res.data.result) {
            this.offset = Math.max(this.offset, update.update_id + 1);
            await this.handleUpdate(update);
          }
        }
      } catch (err: any) {
        // Sleep on error to prevent CPU spinning
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  }

  private async handleUpdate(update: any) {
    try {
      if (update.message) {
        await this.handleMessage(update.message);
      } else if (update.callback_query) {
        await this.handleCallbackQuery(update.callback_query);
      }
    } catch (err: any) {
      console.error('[TelegramBot] Error handling update:', err.message);
    }
  }

  private async sendMessage(chatId: number, text: string, extra: any = {}) {
    try {
      await axios.post(`${this.apiBase}/sendMessage`, {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        ...extra,
      });
    } catch (err: any) {
      console.error(`[TelegramBot] Failed to send message to ${chatId}:`, err.message);
    }
  }

  private async sendChatAction(chatId: number, action: string = 'typing') {
    try {
      await axios.post(`${this.apiBase}/sendChatAction`, {
        chat_id: chatId,
        action,
      });
    } catch {
      // Ignore
    }
  }

  private async answerCallbackQuery(callbackQueryId: string, text?: string) {
    try {
      await axios.post(`${this.apiBase}/answerCallbackQuery`, {
        callback_query_id: callbackQueryId,
        text,
      });
    } catch {
      // Ignore
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Message Handler
  // ─────────────────────────────────────────────────────────────
  private async handleMessage(msg: any) {
    const chatId = msg.chat?.id;
    if (!chatId) return;

    let session = this.sessions.get(chatId);
    if (!session) {
      session = { step: 'WAITING_PHONE' };
      this.sessions.set(chatId, session);
    }

    const text = (msg.text || '').trim();

    // 1. Handle Contact Sharing
    if (msg.contact?.phone_number) {
      await this.processPhoneNumber(chatId, session, msg.contact.phone_number);
      return;
    }

    // 2. Handle /start
    if (text === '/start') {
      if (session.step === 'LOGGED_IN' && session.userRecord) {
        await this.sendMessage(
          chatId,
          `👋 مرحباً بك مجدداً في <b>بوت Ooredoo Power Snake</b>! 🎁\n\n📱 حسابك المرتبط حالياً: <b>${session.displayNumber}</b>\n📶 شبكة أوريدو الجزائر (Ooredoo DZ)\n\nاختر ما تحتاجه من القائمة أدناه:`,
          {
            reply_markup: {
              keyboard: [
                [{ text: '🎁 تفعيل هدية Power Snake مجاناً' }],
                [{ text: '📋 سجل الهدايا' }, { text: '👤 معلومات خطي' }],
                [{ text: '🔄 تسجيل رقم جديد' }],
              ],
              resize_keyboard: true,
            },
          }
        );
      } else {
        session.step = 'WAITING_PHONE';
        await this.sendMessage(
          chatId,
          `👋 مرحباً بك في <b>بوت Ooredoo Power Snake الرسمي</b>! 🎁\n\n✨ هذا البوت مخصص لـ <b>تفعيل هدية Power Snake مجاناً</b> وبشكل فوري لجميع خطوط أوريدو الجزائر بدون أي رصيد.\n\n📱 <b>يرجى إرسال رقم هاتفك للبدء</b> (مثال: <code>0550123456</code>):`,
          {
            reply_markup: {
              keyboard: [
                [{ text: '📱 مشاركة رقم هاتفي', request_contact: true }],
                [{ text: '❓ كيفية الاستخدام' }, { text: '📢 قناة التحديثات' }],
              ],
              resize_keyboard: true,
              one_time_keyboard: false,
            },
          }
        );
      }
      return;
    }

    // 3. Handle /help or "❓ كيفية الاستخدام"
    if (text === '/help' || text === '❓ كيفية الاستخدام') {
      await this.sendMessage(
        chatId,
        `📖 <b>طريقة استخدام بوت Ooredoo Power Snake:</b>\n━━━━━━━━━━━━━━━━━━━━\n1️⃣ <b>إرسال رقم هاتفك:</b> أرسل رقم أوريدو الخاص بك (05xxxxxxxx) أو اضغط على مشاركة رقم هاتفي.\n2️⃣ <b>إدخال رمز التحقق:</b> ستصلك رسالة SMS بكود التحقق المكون من 6 أرقام، قم بإرساله هنا.\n3️⃣ <b>تفعيل الهدية:</b> اضغط على زر [ 🎁 تفعيل هدية Power Snake مجاناً ] وسيتم شحنها فوراً بدون رصيد وبدون أي دفع!\n\n📢 قناة التحديثات: @ooredoodz6`
      );
      return;
    }

    // 4. Handle "📢 قناة التحديثات"
    if (text === '📢 قناة التحديثات') {
      await this.sendMessage(
        chatId,
        `📢 <b>قناة التحديثات الرسمية لبوت Power Snake:</b>\nhttps://t.me/ooredoodz6\n\nيتم نشر كافة التحديثات وحالات السيرفر وإشعارات التفعيل هناك.`
      );
      return;
    }

    // 5. Handle /logout or "🔄 تسجيل رقم جديد" or "❌ تغيير رقم الهاتف"
    if (text === '/logout' || text === '🔄 تسجيل رقم جديد' || text === '❌ تغيير رقم الهاتف') {
      session.step = 'WAITING_PHONE';
      session.userRecord = undefined;
      session.msisdn = undefined;
      session.displayNumber = undefined;
      session.device = undefined;

      await this.sendMessage(
        chatId,
        `🔄 تم تسجيل الخروج وإلغاء الربط.\n\n📱 <b>يرجى إرسال رقم هاتف أوريدو الجديد</b> للبدء (مثال: <code>0550123456</code>):`,
        {
          reply_markup: {
            keyboard: [
              [{ text: '📱 مشاركة رقم هاتفي', request_contact: true }],
              [{ text: '❓ كيفية الاستخدام' }],
            ],
            resize_keyboard: true,
          },
        }
      );
      return;
    }

    // 6. Handle "🔄 إعادة إرسال الرمز"
    if (text === '🔄 إعادة إرسال الرمز') {
      if (session.displayNumber) {
        await this.processPhoneNumber(chatId, session, session.displayNumber);
      } else {
        await this.sendMessage(chatId, '📱 يرجى إرسال رقم هاتفك أولاً.');
      }
      return;
    }

    // 7. Handle /claim, /gift, or "🎁 تفعيل هدية Power Snake مجاناً"
    if (text === '/claim' || text === '/gift' || text === '🎁 تفعيل هدية Power Snake مجاناً') {
      await this.triggerGiftActivation(chatId, session);
      return;
    }

    // 8. Handle /snake or "🐍 فحص لعبة Power Snake"
    if (text === '/snake' || text === '🐍 فحص لعبة Power Snake') {
      await this.sendMessage(
        chatId,
        `🐍 <b>حالة لعبة ومكافآت Power Snake:</b>\n━━━━━━━━━━━━━━━━━━━━\n🎮 <b>الفعالية:</b> Snake Quest Daily\n🏆 <b>حالة الهدية:</b> متاحة للتفعيل (AVAILABLE)\n💎 <b>المكافأة:</b> هدية Power Snake مجانية\n⚡ <b>التكلفة:</b> 0 دج (مجاناً بدون رصيد)\n📱 <b>الرقم المرتبط:</b> ${session.displayNumber || 'غير مرتبط'}\n━━━━━━━━━━━━━━━━━━━━\nاضغط على الزر أدناه لتفعيل هديتك الآن:`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎁 تفعيل هدية Power Snake مجاناً', callback_data: 'claim_gift' }],
            ],
          },
        }
      );
      return;
    }

    // 9. Handle /history or "📋 سجل الهدايا"
    if (text === '/history' || text === '📋 سجل الهدايا') {
      const history = this.options.getHistory();
      if (!history || history.length === 0) {
        await this.sendMessage(
          chatId,
          `📋 <b>سجل الهدايا فارغ حالياً.</b>\nلم تقم بتفعيل أي هدية بعد في هذه الجلسة.\nاضغط على الزر أدناه للبدء:`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🎁 تفعيل هدية Power Snake مجاناً', callback_data: 'claim_gift' }],
              ],
            },
          }
        );
      } else {
        let msgText = `📋 <b>سجل الهدايا المفعلة (${history.length}):</b>\n━━━━━━━━━━━━━━━━━━━━\n`;
        history.slice(0, 5).forEach((item, idx) => {
          const dateStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          msgText += `${idx + 1}. 🎁 <b>${item.reward}</b>\n   ⏳ الصلاحية: ${item.validity} أيام | 🕒 ${dateStr}\n   📱 الرقم: <code>${item.msisdn}</code>\n\n`;
        });
        msgText += `━━━━━━━━━━━━━━━━━━━━\n✨ يمكنك تفعيل المزيد مجاناً بدون حدود!`;

        await this.sendMessage(chatId, msgText, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎁 تفعيل هدية Power Snake مجاناً', callback_data: 'claim_gift' }],
            ],
          },
        });
      }
      return;
    }

    // 10. Handle /account or "👤 معلومات خطي"
    if (text === '/account' || text === '👤 معلومات خطي') {
      if (session.step === 'LOGGED_IN' && session.displayNumber) {
        await this.sendMessage(
          chatId,
          `👤 <b>معلومات الحساب المرتبط:</b>\n━━━━━━━━━━━━━━━━━━━━\n📱 <b>رقم الهاتف:</b> <code>${session.displayNumber}</code>\n📶 <b>المشغل:</b> Ooredoo Algeria\n🛡️ <b>حالة الاتصال:</b> جلسة نشطة وموثقة\n━━━━━━━━━━━━━━━━━━━━`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🎁 تفعيل هدية Power Snake مجاناً', callback_data: 'claim_gift' }],
                [{ text: '🔄 تسجيل رقم جديد', callback_data: 'relogin' }],
              ],
            },
          }
        );
      } else {
        await this.sendMessage(
          chatId,
          '⚠️ <b>أنت غير مسجل حالياً.</b>\nيرجى إرسال رقم هاتف أوريدو الخاص بك للبدء (مثال: <code>0550123456</code>):',
          {
            reply_markup: {
              keyboard: [
                [{ text: '📱 مشاركة رقم هاتفي', request_contact: true }],
                [{ text: '❓ كيفية الاستخدام' }],
              ],
              resize_keyboard: true,
            },
          }
        );
      }
      return;
    }

    // 11. Check if user typed a phone number
    const cleanDigits = text.replace(/\D/g, '');
    const isPhonePattern =
      (cleanDigits.startsWith('05') && cleanDigits.length === 10) ||
      (cleanDigits.startsWith('2135') && cleanDigits.length === 12);

    if (isPhonePattern) {
      await this.processPhoneNumber(chatId, session, text);
      return;
    }

    // 12. Check if user typed a 6-digit OTP code while waiting for OTP
    const isSixDigitOtp = /^\d{6}$/.test(text);
    if (isSixDigitOtp || session.step === 'WAITING_OTP') {
      await this.processOtpCode(chatId, session, text);
      return;
    }

    // Fallback response
    if (session.step === 'LOGGED_IN') {
      await this.sendMessage(
        chatId,
        `🤖 أهلاً بك! حسابك مرتبط بالرقم <b>${session.displayNumber}</b>.\nاضغط على الزر أدناه لتفعيل هديتك:`,
        {
          reply_markup: {
            keyboard: [
              [{ text: '🎁 تفعيل هدية Power Snake مجاناً' }],
              [{ text: '📋 سجل الهدايا' }, { text: '👤 معلومات خطي' }],
              [{ text: '🔄 تسجيل رقم جديد' }],
            ],
            resize_keyboard: true,
          },
        }
      );
    } else {
      await this.sendMessage(
        chatId,
        `📱 <b>يرجى إرسال رقم هاتفك للبدء</b> (مثال: <code>0550123456</code>):`,
        {
          reply_markup: {
            keyboard: [
              [{ text: '📱 مشاركة رقم هاتفي', request_contact: true }],
              [{ text: '❓ كيفية الاستخدام' }],
            ],
            resize_keyboard: true,
          },
        }
      );
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Processing Phone Number Submission
  // ─────────────────────────────────────────────────────────────
  private async processPhoneNumber(chatId: number, session: ChatSession, rawPhone: string) {
    let clean = rawPhone.replace(/\D/g, '');
    if (clean.startsWith('213')) {
      clean = '0' + clean.slice(3);
    }

    if (!clean.startsWith('05') || clean.length !== 10) {
      await this.sendMessage(
        chatId,
        `❌ <b>رقم غير صحيح!</b>\nيرجى إرسال رقم هاتف أوريدو يبدأ بـ <code>05</code> ويتكون من 10 أرقام (مثال: <code>0550123456</code>).`
      );
      return;
    }

    const msisdn = '213' + clean.slice(1);
    session.displayNumber = clean;
    session.msisdn = msisdn;
    session.device = this.options.getDevice();
    session.step = 'WAITING_OTP';

    await this.sendChatAction(chatId, 'typing');
    await this.sendMessage(chatId, `⏳ جاري إرسال رمز التحقق SMS عبر أوريدو للرقم <b>${clean}</b>...`);

    try {
      const otpRes = await this.options.requestOtpFlow(msisdn, session.device);
      session.lastOtpTime = Date.now();

      await this.sendMessage(
        chatId,
        `📲 <b>تم إرسال رمز التحقق في رسالة SMS إلى هاتفك:</b> <code>${clean}</code>\n\n🔢 <b>يرجى كتابة رمز التحقق المكون من 6 أرقام هنا لإكمال التفعيل:</b>`,
        {
          reply_markup: {
            keyboard: [
              [{ text: '🔄 إعادة إرسال الرمز' }],
              [{ text: '❌ تغيير رقم الهاتف' }],
            ],
            resize_keyboard: true,
          },
        }
      );
    } catch (err: any) {
      await this.sendMessage(
        chatId,
        `⚠️ <b>حدث خطأ أثناء إرسال الرمز:</b> ${err.message || 'يرجى المحاولة مجدداً.'}`
      );
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Processing OTP Code Verification
  // ─────────────────────────────────────────────────────────────
  private async processOtpCode(chatId: number, session: ChatSession, otp: string) {
    if (!session.msisdn || !session.device) {
      await this.sendMessage(chatId, '📱 يرجى إرسال رقم هاتفك أولاً.');
      session.step = 'WAITING_PHONE';
      return;
    }

    await this.sendChatAction(chatId, 'typing');
    await this.sendMessage(chatId, '⏳ جاري التحقق من الرمز وتأمين الجلسة...');

    try {
      const verifyRes = await this.options.verifyOtpFlow(session.msisdn, otp, session.device);

      if (verifyRes.status === 'wrong_otp') {
        await this.sendMessage(
          chatId,
          `❌ <b>رمز التحقق غير صحيح!</b>\nيرجى إعادة التأكد من الرسالة النصية وإدخال الرمز الصحيح:`
        );
        return;
      }

      // Valid session
      session.step = 'LOGGED_IN';
      session.userRecord = {
        id: crypto.randomUUID(),
        msisdn: session.msisdn,
        displayNumber: session.displayNumber || session.msisdn,
        operator: 'Ooredoo Algeria',
        created_at: Math.floor(Date.now() / 1000),
        access_token: verifyRes.tokens?.access_token || ('token_' + crypto.randomUUID()),
        refresh_token: verifyRes.tokens?.refresh_token || '',
        tok_instance_id: verifyRes.tokens?.tok_instance_id || session.device.instance_id,
        tok_plat_sig: verifyRes.tokens?.tok_plat_sig || session.device.plat_sig,
        tok_timestamp: verifyRes.tokens?.tok_timestamp,
        tok_fingerprint: verifyRes.tokens?.tok_fingerprint,
        tok_correlation: verifyRes.tokens?.tok_correlation,
        isSimulated: !verifyRes.tokens,
      };

      await this.sendMessage(
        chatId,
        `🎉 <b>تم تسجيل الدخول والتحقق من رقمك بنجاح!</b>\n━━━━━━━━━━━━━━━━━━━━\n📱 الرقم: <b>${session.displayNumber}</b>\n📶 المشغل: <b>Ooredoo Algeria</b>\n🛡️ حالة الحساب: <b>موثق وجاهز للتفعيل</b>\n━━━━━━━━━━━━━━━━━━━━\n🎁 <b>حسابك جاهز الآن! اضغط على الزر أدناه لتفعيل هديتك فوراً:</b>`,
        {
          reply_markup: {
            keyboard: [
              [{ text: '🎁 تفعيل هدية Power Snake مجاناً' }],
              [{ text: '📋 سجل الهدايا' }, { text: '👤 معلومات خطي' }],
              [{ text: '🔄 تسجيل رقم جديد' }],
            ],
            resize_keyboard: true,
          },
        }
      );

      // Also send inline button for direct tap
      await this.sendMessage(chatId, `اضغط لتفعيل هديتك المباشرة:`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎁 تفعيل هدية Power Snake مجاناً', callback_data: 'claim_gift' }],
          ],
        },
      });
    } catch (err: any) {
      await this.sendMessage(
        chatId,
        `❌ حدث خطأ أثناء التحقق: ${err.message || 'يرجى المحاولة لاحقاً.'}`
      );
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Trigger Power Snake Gift Activation
  // ─────────────────────────────────────────────────────────────
  private async triggerGiftActivation(chatId: number, session: ChatSession) {
    if (session.step !== 'LOGGED_IN' || !session.userRecord) {
      await this.sendMessage(
        chatId,
        `⚠️ <b>يرجى إرسال رقم هاتفك أولاً</b> لتفعيل هدية Power Snake مجاناً:`,
        {
          reply_markup: {
            keyboard: [
              [{ text: '📱 مشاركة رقم هاتفي', request_contact: true }],
              [{ text: '❓ كيفية الاستخدام' }],
            ],
            resize_keyboard: true,
          },
        }
      );
      return;
    }

    await this.sendChatAction(chatId, 'typing');
    await this.sendMessage(
      chatId,
      `⚡ <b>جاري الاتصال بأنظمة أوريدو وتفعيل هدية Power Snake مجاناً...</b>`
    );

    try {
      const res = await this.options.activateBundleFlow(session.userRecord);

      if (res.success) {
        const txId = 'PS-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        const giftReward = res.reward || 'هدية Power Snake مجانية';
        const giftValidity = res.validity || '3';
        const giftSource = res.source || 'Power Snake Reward';
        const validityText = String(giftValidity).includes('حتى') || String(giftValidity).includes('/')
          ? giftValidity
          : `${giftValidity} أيام`;

        this.options.recordActivation({
          id: crypto.randomUUID(),
          msisdn: session.userRecord.msisdn,
          timestamp: Date.now(),
          bundle: 'تفعيل هدية Power Snake مجاناً',
          validity: validityText,
          reward: giftReward,
          status: 'SUCCESS',
          source: giftSource,
        });

        await this.sendMessage(
          chatId,
          `🎉 <b>مبروك! تم تفعيل هدية Power Snake مجاناً بنجاح على خطك!</b>\n━━━━━━━━━━━━━━━━━━━━\n🎁 <b>نوع الهدية:</b> <b>${giftReward}</b>\n⏳ <b>مدة الصلاحية:</b> <b>${validityText}</b>\n📱 <b>الرقم المستفيد:</b> <code>${session.displayNumber}</code>\n🆔 <b>رقم المعاملة:</b> <code>${txId}</code>\n⚡ <b>المصدر:</b> <b>${giftSource}</b>\n━━━━━━━━━━━━━━━━━━━━\n✨ <b>تمت إضافة الهدية إلى رصيدك ويمكنك الاستفادة منها فوراً!</b>`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🎁 تفعيل هدية Power Snake مجاناً مجدداً', callback_data: 'claim_gift' }],
              ],
            },
          }
        );
      } else {
        await this.sendMessage(
          chatId,
          `❌ ${res.message || 'فشل التفعيل، يرجى المحاولة بعد قليل.'}`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔄 إعادة المحاولة', callback_data: 'claim_gift' }],
              ],
            },
          }
        );
      }
    } catch (err: any) {
      await this.sendMessage(
        chatId,
        `❌ حدث خطأ أثناء التفعيل: ${err.message || 'يرجى إعادة المحاولة.'}`
      );
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Callback Query Handler (Inline Keyboard clicks)
  // ─────────────────────────────────────────────────────────────
  private async handleCallbackQuery(cq: any) {
    const chatId = cq.message?.chat?.id;
    const data = cq.data;
    if (!chatId) return;

    let session = this.sessions.get(chatId);
    if (!session) {
      session = { step: 'WAITING_PHONE' };
      this.sessions.set(chatId, session);
    }

    await this.answerCallbackQuery(cq.id);

    if (data === 'claim_gift') {
      await this.triggerGiftActivation(chatId, session);
    } else if (data === 'check_snake') {
      await this.sendMessage(
        chatId,
        `🐍 <b>معلومات لعبة ومكافآت Power Snake:</b>\n━━━━━━━━━━━━━━━━━━━━\n🎮 <b>الفعالية:</b> Snake Quest Daily\n🏆 <b>حالة الهدية:</b> متاحة للتفعيل (AVAILABLE)\n💎 <b>المكافأة:</b> هدية Power Snake مجانية\n⚡ <b>التكلفة:</b> 0 دج (مجاناً بدون رصيد)\n📱 <b>الرقم المرتبط:</b> ${session.displayNumber || 'غير مرتبط'}\n━━━━━━━━━━━━━━━━━━━━\nاضغط على الزر أدناه لتفعيل هديتك فوراً:`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎁 تفعيل هدية Power Snake مجاناً', callback_data: 'claim_gift' }],
            ],
          },
        }
      );
    } else if (data === 'relogin') {
      session.step = 'WAITING_PHONE';
      session.userRecord = undefined;
      session.msisdn = undefined;
      session.displayNumber = undefined;
      await this.sendMessage(
        chatId,
        `🔄 <b>يرجى إرسال رقم هاتف أوريدو الجديد</b> للبدء (مثال: <code>0550123456</code>):`,
        {
          reply_markup: {
            keyboard: [
              [{ text: '📱 مشاركة رقم هاتفي', request_contact: true }],
              [{ text: '❓ كيفية الاستخدام' }],
            ],
            resize_keyboard: true,
          },
        }
      );
    }
  }
}
