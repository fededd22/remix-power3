import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Bot,
  Check,
  CheckCheck,
  Phone,
  KeyRound,
  Gift,
  Flame,
  ShieldCheck,
  RefreshCw,
  LogOut,
  Info,
  Server,
  Volume2,
  VolumeX,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Search,
  MessageSquare,
  Radio,
  Sliders,
  X,
  AlertCircle,
  HelpCircle,
  Copy,
  Terminal,
  Clock,
  Layers
} from 'lucide-react';
import { UserRecord, ActivationRecord, TelegramMessage, TelegramInlineButton, DiagnosticsData } from '../types';
import { api } from '../services/api';
import { telegramAudio } from '../utils/telegramAudio';
import { launchConfetti } from '../utils/confetti';

export function TelegramBotApp() {
  const [user, setUser] = useState<UserRecord | null>(null);
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);
  const [messages, setMessages] = useState<TelegramMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [typingStatus, setTypingStatus] = useState<string>('يكتب الآن...');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showReplyKeyboard, setShowReplyKeyboard] = useState(true);
  const [showCommandsMenu, setShowCommandsMenu] = useState(false);
  const [showBotInfo, setShowBotInfo] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnosticsData, setDiagnosticsData] = useState<DiagnosticsData | null>(null);
  const [activeChatTab, setActiveChatTab] = useState<'bot' | 'channel'>('bot');
  const [channelPosts, setChannelPosts] = useState<Array<{ id: string; time: string; text: string; msisdn: string; reward: string }>>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isActivatingGift, setIsActivatingGift] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync sound controller
  useEffect(() => {
    telegramAudio.enabled = soundEnabled;
  }, [soundEnabled]);

  // Initial load
  useEffect(() => {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';

    async function initSession() {
      try {
        const sessionRes = await api.getSession();
        if (sessionRes.user) {
          setUser(sessionRes.user);
          addBotMessage(
            `👋 مرحباً بك مجدداً!\n\n📱 تم استعادة جلستك على الرقم: **${sessionRes.user.displayNumber || sessionRes.user.msisdn}**\n📶 شبكة أوريدو الجزائر (Ooredoo DZ)\n\nيمكنك الآن تفعيل هدية Power Snake مجاناً في أي وقت:`,
            [
              { id: 'act-1', label: '🎁 تفعيل هدية Power Snake مجاناً', action: 'activate_power_snake', variant: 'accent' },
              { id: 'act-3', label: '📋 سجل الهدايا المفعلة', action: 'show_history', variant: 'secondary' },
              { id: 'act-4', label: '🔄 تغيير الرقم / خروج', action: 'relogin', variant: 'danger' },
            ]
          );
        } else {
          // Welcome message for new / unauthenticated user
          addBotMessage(
            `👋 أهلاً بك في **بوت Ooredoo Power Snake الرسمي**! 🎁\n\n✨ هذا البوت مخصص لـ **تفعيل هدية Power Snake مجاناً** وبشكل فوري بدون أي رصيد لجميع خطوط أوريدو الجزائر.\n\n📱 **يرجى إرسال رقم هاتفك للبدء** (مثال: \`0550123456\`):`,
            [
              { id: 'help-btn', label: '❓ كيفية عمل البوت', action: 'show_help', variant: 'secondary' },
              { id: 'chan-btn', label: '📢 قناة التحديثات @ooredoodz6', action: 'open_channel', variant: 'secondary' },
            ]
          );
        }

        // Preload diagnostics
        api.getDiagnostics().then(setDiagnosticsData).catch(() => {});
      } catch (err) {
        console.error('Init error:', err);
      }
    }

    initSession();

    // Populate realistic channel broadcasts
    setChannelPosts([
      {
        id: '1',
        time: 'منذ دقيقتين',
        msisdn: '0554****89',
        reward: 'هدية Power Snake مجانية',
        text: '🎉 عملية تفعيل ناجحة جديدة لزبون أوريدو عبر بوت Power Snake!',
      },
      {
        id: '2',
        time: 'منذ 12 دقيقة',
        msisdn: '0550****12',
        reward: 'هدية Power Snake مجانية VIP',
        text: '🔥 تم تفعيل هدية Power Snake مجاناً بنجاح وصلاحية 7 أيام!',
      },
      {
        id: '3',
        time: 'منذ نصف ساعة',
        msisdn: '0558****64',
        reward: 'هدية Power Snake مجانية',
        text: '⚡ سرعة استجابة السيرفر 120ms - التفعيل متاح لجميع المشتركين بدون رصيد.',
      },
    ]);
  }, []);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isBotTyping]);

  const getTimeString = () => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const addUserMessage = (text: string) => {
    const newMsg: TelegramMessage = {
      id: 'msg-' + Date.now() + '-' + Math.random(),
      sender: 'user',
      text,
      time: getTimeString(),
    };
    setMessages((prev) => [...prev, newMsg]);
    telegramAudio.playSent();
  };

  const addBotMessage = (
    text: string,
    buttons?: TelegramInlineButton[],
    receiptData?: TelegramMessage['receiptData']
  ) => {
    const newMsg: TelegramMessage = {
      id: 'msg-' + Date.now() + '-' + Math.random(),
      sender: 'bot',
      text,
      time: getTimeString(),
      buttons,
      isReceipt: Boolean(receiptData),
      receiptData,
    };
    setMessages((prev) => [...prev, newMsg]);
    telegramAudio.playReceived();
  };

  // Handle User Sending Phone
  const handleSendPhone = async (phoneStr: string) => {
    const cleanDigits = phoneStr.replace(/\D/g, '');
    if (!cleanDigits.startsWith('05') || cleanDigits.length !== 10) {
      addBotMessage(
        '⚠️ رقم غير صحيح!\nيرجى إرسال رقم هاتف أوريدو مكوّن من 10 أرقام يبدأ بـ 05 (مثال: `0550123456`).',
        [{ id: 'help-retry', label: '❓ كيفية إدخال الرقم', action: 'show_help', variant: 'secondary' }]
      );
      return;
    }

    setPendingPhone(cleanDigits);
    setIsBotTyping(true);
    setTypingStatus('جاري إرسال رمز التحقق SMS عبر أوريدو...');

    try {
      const res = await api.sendOtp(cleanDigits);
      setIsBotTyping(false);

      if (res.success) {
        addBotMessage(
          `📩 تم طلب رمز التحقق لرقمك: **${cleanDigits}**\n\n🔢 الرجاء كتابة **رمز التحقق** المكون من 6 أرقام هنا لإكمال تسجيل الدخول وتفعيل هديتك:`,
          [
            { id: 'resend-btn', label: '🔄 إعادة إرسال الرمز', action: 'resend_otp', variant: 'secondary' },
            { id: 'change-num-btn', label: '❌ تغيير الرقم', action: 'relogin', variant: 'danger' },
          ]
        );
      }
    } catch (err: any) {
      setIsBotTyping(false);
      addBotMessage(
        `⚠️ ${err.message || 'حدث خطأ في طلب الرمز، يرجى المحاولة مرة أخرى.'}`,
        [{ id: 'help-err', label: '❓ مساعدة', action: 'show_help', variant: 'secondary' }]
      );
    }
  };

  // Handle User Sending OTP
  const handleVerifyOtp = async (otpStr: string) => {
    const phoneToVerify = pendingPhone || user?.displayNumber;
    if (!phoneToVerify) {
      addBotMessage('📱 يرجى إرسال رقم هاتفك أولاً.');
      return;
    }

    setIsBotTyping(true);
    setTypingStatus('جاري التحقق من الرمز وتأمين الجلسة...');

    try {
      const res = await api.verifyOtp(phoneToVerify, otpStr);
      setIsBotTyping(false);

      if (res.success && res.user) {
        setUser(res.user);
        setPendingPhone(null);
        telegramAudio.playSuccess();

        addBotMessage(
          `🎉 **تم التحقق بنجاح وتوثيق رقمك!**\n━━━━━━━━━━━━━━━━━━━━\n📱 الرقم: **${res.user.displayNumber || res.user.msisdn}**\n📶 المشغل: **Ooredoo Algeria**\n🛡️ نوع الجلسة: **توكن مؤكد وآمن**\n━━━━━━━━━━━━━━━━━━━━\n🎁 **حسابك جاهز الآن! اضغط على الزر أدناه لتفعيل هديتك فوراً:**`,
          [
            { id: 'claim-now-btn', label: '🎁 تفعيل هدية Power Snake مجاناً', action: 'activate_power_snake', variant: 'accent' },
            { id: 'history-btn', label: '📋 سجل الهدايا', action: 'show_history', variant: 'secondary' },
          ]
        );
      }
    } catch (err: any) {
      setIsBotTyping(false);
      addBotMessage(
        `❌ رمز التحقق غير صحيح أو منتهي الصلاحية!\nيرجى إعادة كتابة الرمز الصحيح المستلم عبر رسائل SMS.`,
        [
          { id: 'resend-btn2', label: '🔄 إعادة إرسال رمز جديد', action: 'resend_otp', variant: 'secondary' },
          { id: 'change-num-btn2', label: '❌ تغيير الرقم', action: 'relogin', variant: 'danger' },
        ]
      );
    }
  };

  // Handle Activating Power Snake Free Gift
  const handleActivatePowerSnakeGift = async () => {
    if (!user) {
      addBotMessage('⚠️ يرجى إرسال رقم هاتفك أولاً للبدء في تفعيل هدية Power Snake مجاناً.');
      return;
    }

    setIsActivatingGift(true);
    setIsBotTyping(true);
    setTypingStatus('جاري الاتصال بخوادم Ooredoo وتفعيل هدية Power Snake مجاناً...');

    try {
      const res = await api.activateBundle();
      setIsBotTyping(false);
      setIsActivatingGift(false);

      if (res.success) {
        launchConfetti();
        telegramAudio.playSuccess();

        const txId = 'PS-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        const giftReward = res.reward || 'هدية Power Snake مجانية';
        const giftValidity = res.validity || '3';
        const giftSource = res.source || 'Power Snake Reward';
        const validityText = String(giftValidity).includes('حتى') || String(giftValidity).includes('/')
          ? giftValidity
          : `${giftValidity} أيام`;

        // Add to channel broadcast stream as well
        setChannelPosts((prev) => [
          {
            id: String(Date.now()),
            time: 'الآن',
            msisdn: user.displayNumber.slice(0, 4) + '****' + user.displayNumber.slice(-2),
            reward: giftReward,
            text: '🎉 عملية تفعيل ناجحة جديدة لـ هدية Power Snake مجاناً!',
          },
          ...prev,
        ]);

        addBotMessage(
          `🎉 **مبروك! تم تفعيل هدية Power Snake مجاناً بنجاح على خطك!**\n━━━━━━━━━━━━━━━━━━━━\n🎁 **نوع الهدية:** ${giftReward}\n⏳ **مدة الصلاحية:** ${validityText}\n📱 **الرقم المستفيد:** ${user.displayNumber || user.msisdn}\n🆔 **رقم المعاملة:** \`${txId}\`\n⚡ **المصدر:** ${giftSource}\n━━━━━━━━━━━━━━━━━━━━\n✨ تمت إضافة الهدية إلى رصيدك ويمكنك الاستفادة منها فوراً!`,
          [
            { id: 'claim-again-btn', label: '🎁 تفعيل هدية Power Snake مجاناً مجدداً', action: 'activate_power_snake', variant: 'accent' },
            { id: 'hist-btn', label: '📋 مراجعة سجل الهدايا', action: 'show_history', variant: 'secondary' },
          ],
          {
            reward: giftReward,
            validity: validityText,
            phone: user.displayNumber || user.msisdn,
            txId,
            source: giftSource,
          }
        );
      } else {
        addBotMessage(
          `❌ ${res.message || 'فشل التفعيل، يرجى المحاولة بعد قليل.'}`,
          [{ id: 'retry-claim', label: '🔄 إعادة المحاولة', action: 'activate_power_snake', variant: 'primary' }]
        );
      }
    } catch (err: any) {
      setIsBotTyping(false);
      setIsActivatingGift(false);
      addBotMessage(
        `❌ خطأ أثناء الاتصال: ${err.message || 'تعذر استلام الهدية حالياً'}.`,
        [{ id: 'retry-claim-2', label: '🔄 إعادة المحاولة', action: 'activate_power_snake', variant: 'primary' }]
      );
    }
  };

  // Handle Inspecting Power Snake Gamification
  const handleCheckPowerSnake = () => {
    setIsBotTyping(true);
    setTypingStatus('جاري استعلام بيانات لعبة Power Snake من BFF...');

    setTimeout(() => {
      setIsBotTyping(false);
      addBotMessage(
        `🐍 **معلومات لعبة ومكافآت Power Snake:**\n━━━━━━━━━━━━━━━━━━━━\n🎮 اسم الفعالية: **Power Snake Quest DZ**\n🏆 المكافأة المتاحة: **هدية Power Snake مجانية**\n⚡ التكلفة: **0 دج (مجاناً بدون رصيد)**\n⏳ الصلاحية الممنوحة: **3 إلى 7 أيام**\n📶 الشريحة: **${user?.displayNumber || 'غير مرتبط'}**\n━━━━━━━━━━━━━━━━━━━━\nاضغط على الزر أدناه لتفعيل الهدية مجاناً على خطك:`,
        [
          { id: 'snake-claim-btn', label: '🎁 تفعيل هدية Power Snake مجاناً', action: 'activate_power_snake', variant: 'accent' },
          { id: 'history-btn-2', label: '📋 سجل الهدايا السابقة', action: 'show_history', variant: 'secondary' },
        ]
      );
    }, 600);
  };

  // Handle Activation History
  const handleShowHistory = async () => {
    setIsBotTyping(true);
    setTypingStatus('جاري جلب سجل الهدايا المفعلة...');

    try {
      const res = await api.getHistory();
      setIsBotTyping(false);

      if (!res.history || res.history.length === 0) {
        addBotMessage(
          '📋 **سجل الهدايا فارغ حالياً.**\nلم تقم بتفعيل أي هدية بعد في هذه الجلسة.\nاضغط على الزر أدناه للبدء:',
          [{ id: 'claim-first', label: '🎁 تفعيل هدية Power Snake مجاناً', action: 'activate_power_snake', variant: 'accent' }]
        );
      } else {
        let historyText = `📋 **سجل الهدايا المفعلة (${res.history.length}):**\n━━━━━━━━━━━━━━━━━━━━\n`;
        res.history.slice(0, 5).forEach((item, index) => {
          const dateStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          historyText += `${index + 1}. 🎁 **${item.reward}**\n   ⏳ الصلاحية: ${item.validity} أيام | 🕒 ${dateStr}\n   📱 الرقم: \`${item.msisdn}\`\n\n`;
        });
        historyText += '━━━━━━━━━━━━━━━━━━━━\n✨ يمكنك تفعيل هدايا إضافية مجاناً بدون حدود!';

        addBotMessage(historyText, [
          { id: 'claim-more', label: '🎁 تفعيل هدية Power Snake مجاناً', action: 'activate_power_snake', variant: 'accent' },
        ]);
      }
    } catch {
      setIsBotTyping(false);
      addBotMessage('⚠️ تعذر جلب السجل حالياً.');
    }
  };

  // Handle Logout / Reset Number
  const handleRelogin = async () => {
    try {
      await api.logout();
    } catch {}
    setUser(null);
    setPendingPhone(null);
    addBotMessage(
      '🔄 **تم تسجيل الخروج بنجاح.**\n📱 الرجاء إرسال رقم هاتف أوريدو الجديد للبدء (05xxxxxxxx):',
      [{ id: 'h-help-relogin', label: '❓ مساعدة', action: 'show_help', variant: 'secondary' }]
    );
  };

  // Show Help Message
  const handleShowHelp = () => {
    addBotMessage(
      `📖 **طريقة استخدام بوت Ooredoo Power Snake:**\n━━━━━━━━━━━━━━━━━━━━\n1️⃣ **إرسال رقم هاتفك:** أرسل رقم أوريدو يبدأ بـ 05 (مثال: \`0550123456\`).\n2️⃣ **تأكيد رمز التحقق:** ستصلك رسالة SMS بكود مكون من 6 أرقام، قم بإدخاله هنا.\n3️⃣ **تفعيل الهدية:** اضغط على زر [ 🎁 تفعيل هدية Power Snake مجاناً ] وسيتم شحنها فوراً على خطك بدون أي رصيد!\n\n📢 قناة التحديثات: @ooredoodz6\n⚡ الإصدار: Power Snake v1.5.21`,
      [
        { id: 'h-channel', label: '📢 قناة التليجرام @ooredoodz6', action: 'open_channel', variant: 'secondary' },
      ]
    );
  };

  // Handle Button Clicks
  const handleButtonClick = (action: TelegramInlineButton['action']) => {
    switch (action) {
      case 'send_phone_demo':
        addUserMessage('0550000000');
        handleSendPhone('0550000000');
        break;
      case 'send_otp_demo':
        addUserMessage('123456');
        handleVerifyOtp('123456');
        break;
      case 'activate_power_snake':
        addUserMessage('🎁 تفعيل هدية Power Snake مجاناً');
        handleActivatePowerSnakeGift();
        break;
      case 'check_snake':
        addUserMessage('🐍 فحص مكافآت Power Snake');
        handleCheckPowerSnake();
        break;
      case 'show_history':
        addUserMessage('📋 سجل الهدايا المفعلة');
        handleShowHistory();
        break;
      case 'relogin':
        addUserMessage('🔄 تغيير الرقم / خروج');
        handleRelogin();
        break;
      case 'show_help':
        addUserMessage('❓ مساعدة');
        handleShowHelp();
        break;
      case 'resend_otp':
        if (pendingPhone) {
          addUserMessage('🔄 إعادة إرسال رمز التحقق');
          handleSendPhone(pendingPhone);
        }
        break;
      case 'open_channel':
        setActiveChatTab('channel');
        break;
    }
  };

  // Handle Command Submission
  const handleCommand = (cmd: string) => {
    setShowCommandsMenu(false);
    const cleanCmd = cmd.trim().toLowerCase();

    if (cleanCmd === '/start') {
      addUserMessage('/start');
      if (user) {
        addBotMessage(
          `👋 مرحباً بك في بوت Ooredoo Power Snake!\nحسابك الحالي: **${user.displayNumber}**\nاختر من الأزرار أدناه:`,
          [
            { id: 's-act', label: '🎁 تفعيل هدية Power Snake مجاناً', action: 'activate_power_snake', variant: 'accent' },
            { id: 's-hist', label: '📋 سجل الهدايا', action: 'show_history', variant: 'secondary' },
            { id: 's-out', label: '🔄 تغيير الرقم / تسجيل الخروج', action: 'relogin', variant: 'danger' },
          ]
        );
      } else {
        addBotMessage(
          `👋 أهلاً بك في بوت Ooredoo Power Snake الرسمي! 🎁\n\nيرجى كتابة رقم هاتفك للبدء (مثال: 0550123456):`,
          [{ id: 's-help', label: '❓ كيفية الاستخدام', action: 'show_help', variant: 'secondary' }]
        );
      }
    } else if (cleanCmd === '/claim' || cleanCmd === '/gift' || cleanCmd === '/activate') {
      addUserMessage('/claim');
      handleActivatePowerSnakeGift();
    } else if (cleanCmd === '/snake') {
      addUserMessage('/snake');
      handleCheckPowerSnake();
    } else if (cleanCmd === '/history') {
      addUserMessage('/history');
      handleShowHistory();
    } else if (cleanCmd === '/account') {
      addUserMessage('/account');
      if (user) {
        addBotMessage(
          `👤 **معلومات الحساب المرتبط:**\n━━━━━━━━━━━━━━━━━━━━\n📱 رقم الهاتف: **${user.displayNumber}**\n📶 المشغل: **${user.operator}**\n🆔 رقم الهوية: \`${user.id.slice(0, 8)}...\`\n🛡️ نمط الاتصال: **جلسة موثقة (Ooredoo DZ)**\n━━━━━━━━━━━━━━━━━━━━`,
          [
            { id: 'acc-act', label: '🎁 تفعيل هدية Power Snake مجاناً', action: 'activate_power_snake', variant: 'accent' },
            { id: 'acc-out', label: '🔄 تسجيل الخروج', action: 'relogin', variant: 'danger' },
          ]
        );
      } else {
        addBotMessage('⚠️ أنت غير مسجل حالياً. يرجى إرسال رقم هاتفك للبدء.');
      }
    } else if (cleanCmd === '/status' || cleanCmd === '/ping') {
      addUserMessage('/status');
      setShowDiagnostics(true);
    } else if (cleanCmd === '/logout') {
      addUserMessage('/logout');
      handleRelogin();
    } else if (cleanCmd === '/help') {
      addUserMessage('/help');
      handleShowHelp();
    }
  };

  // Submit Text Message
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    setInputText('');

    if (text.startsWith('/')) {
      handleCommand(text);
      return;
    }

    addUserMessage(text);

    // If expecting phone number or user sent a phone number
    const isPhoneNumber = text.replace(/\D/g, '').length === 10 && text.replace(/\D/g, '').startsWith('05');
    const isSixDigitOtp = /^\d{6}$/.test(text.trim());

    if (!user && isPhoneNumber) {
      handleSendPhone(text);
      return;
    }

    if (isSixDigitOtp) {
      handleVerifyOtp(text.trim());
      return;
    }

    // Default conversational reply
    if (text.includes('هدية') || text.includes('تفعيل') || text.includes('power snake') || text.includes('سنيك')) {
      handleActivatePowerSnakeGift();
      return;
    }

    if (text.includes('رقم') || text.includes('هاتف') || text.includes('حساب')) {
      if (user) {
        addBotMessage(`📱 رقمك المرتبط حالياً هو: **${user.displayNumber}**\nيمكنك الضغط على الزر أدناه لتفعيل الهدية:`, [
          { id: 'c-act', label: '🎁 تفعيل هدية Power Snake مجاناً', action: 'activate_power_snake', variant: 'accent' },
        ]);
      } else {
        addBotMessage('📱 يرجى كتابة رقم هاتفك المكون من 10 أرقام (مثال: 0550123456):', [
          { id: 'snd-help', label: '❓ كيفية الاستخدام', action: 'show_help', variant: 'secondary' },
        ]);
      }
      return;
    }

    // Fallback response
    addBotMessage(
      `🤖 مرحباً بك! يمكنك كتابة رقم هاتفك للبدء، أو اختيار أحد الأوامر أدناه:`,
      user
        ? [
            { id: 'fb-act', label: '🎁 تفعيل هدية Power Snake مجاناً', action: 'activate_power_snake', variant: 'accent' },
            { id: 'fb-hist', label: '📋 سجل الهدايا', action: 'show_history', variant: 'secondary' },
          ]
        : [{ id: 'fb-help', label: '❓ كيفية الاستخدام', action: 'show_help', variant: 'secondary' }]
    );
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex h-screen w-full bg-[#0e1621] text-[#e4ecf2] overflow-hidden select-none font-sans">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* LEFT SIDEBAR: Telegram Chat List */}
      {/* ───────────────────────────────────────────────────────────── */}
      <aside className="w-80 md:w-96 flex-shrink-0 bg-[#17212b] border-l border-[#0e1621] flex flex-col hidden sm:flex">
        {/* Top Header of Sidebar */}
        <div className="p-3 bg-[#17212b] border-b border-[#0e1621]/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-600 to-red-600 flex items-center justify-center text-white shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-wide">تليجرام ويب</div>
              <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>متصل بخوادم أوريدو</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowDiagnostics(true)}
              title="فحص السيرفر والبروكسي"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#242f3d] transition cursor-pointer"
            >
              <Server className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowBotInfo(true)}
              title="معلومات البوت"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#242f3d] transition cursor-pointer"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search input in Telegram sidebar */}
        <div className="p-2.5 bg-[#17212b]">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-500" />
            <input
              type="text"
              readOnly
              placeholder="بحث في المحادثات والقنوات..."
              className="w-full bg-[#242f3d] text-xs text-white rounded-xl pr-9 pl-3 py-2 border-none outline-none placeholder:text-slate-500 cursor-default"
            />
          </div>
        </div>

        {/* Chat List Items */}
        <div className="flex-1 overflow-y-auto space-y-1 p-1.5">
          {/* Main Bot Chat */}
          <div
            onClick={() => setActiveChatTab('bot')}
            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${
              activeChatTab === 'bot'
                ? 'bg-[#2b5278] text-white shadow-sm'
                : 'hover:bg-[#202b36] text-slate-300'
            }`}
          >
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-red-600 via-rose-600 to-amber-500 flex items-center justify-center text-white shadow-md">
                <Gift className="w-6 h-6 animate-pulse" />
              </div>
              <span className="absolute bottom-0 left-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-[#17212b]" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-white truncate">بوت Ooredoo Power Snake</span>
                  <span className="bg-rose-500 text-[10px] text-white font-extrabold px-1.5 py-0.2 rounded font-mono">
                    BOT
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">الآن</span>
              </div>
              <div className="text-xs text-slate-300 truncate mt-1 flex items-center gap-1">
                <span className="text-rose-400 font-medium">🎁 هدية Power Snake:</span>
                <span>تفعيل فوري مجاناً</span>
              </div>
            </div>

            {user && (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" title="مسجل دخول" />
            )}
          </div>

          {/* Channel Chat Item */}
          <div
            onClick={() => setActiveChatTab('channel')}
            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${
              activeChatTab === 'channel'
                ? 'bg-[#2b5278] text-white shadow-sm'
                : 'hover:bg-[#202b36] text-slate-300'
            }`}
          >
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-sky-600 to-blue-700 flex items-center justify-center text-white shadow-md">
                <Radio className="w-6 h-6" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-white truncate">قناة @ooredoodz6</span>
                  <span className="bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[9px] font-bold px-1 rounded">
                    قناة
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">12:00</span>
              </div>
              <div className="text-xs text-slate-400 truncate mt-1">
                إشعارات وتأكيدات تفعيل هدايا Power Snake الناجحة
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Footer User Info */}
        <div className="p-3 bg-[#17212b] border-t border-[#0e1621] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold shrink-0">
              {user ? '📱' : '👤'}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-white truncate text-xs">
                {user ? user.displayNumber : 'غير متصل'}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {user ? 'Ooredoo Algeria' : 'أرسل رقمك في البوت'}
              </div>
            </div>
          </div>

          {user && (
            <button
              onClick={handleRelogin}
              title="تسجيل الخروج وتغيير الرقم"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-[#242f3d] transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MAIN VIEW: Telegram Bot Chat Window */}
      {/* ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-full bg-[#0e1621] relative overflow-hidden">
        {/* Telegram Chat Header */}
        <header className="h-14 sm:h-16 px-4 bg-[#17212b] border-b border-[#0e1621] flex items-center justify-between shadow-sm z-20">
          <div className="flex items-center gap-3">
            {/* Bot Avatar */}
            <div
              onClick={() => setShowBotInfo(true)}
              className="relative cursor-pointer group shrink-0"
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-rose-600 via-red-600 to-amber-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition">
                <Gift className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="absolute bottom-0 left-0 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-[#17212b]" />
            </div>

            {/* Bot Title & Status */}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-sm sm:text-base text-white tracking-tight flex items-center gap-1.5">
                  <span>بوت Ooredoo Power Snake</span>
                  <span className="w-4 h-4 rounded-full bg-sky-500 text-white flex items-center justify-center text-[10px] font-bold" title="بوت رسمي موثق">
                    ✓
                  </span>
                </h1>
                <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md">
                  هدية مجانية
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                {isBotTyping ? (
                  <span className="text-rose-400 font-semibold flex items-center gap-1 animate-pulse">
                    <span>{typingStatus}</span>
                  </span>
                ) : (
                  <>
                    <span className="text-slate-400">bot</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-medium">متصل دائماً</span>
                    {user && (
                      <>
                        <span>•</span>
                        <span className="text-rose-300 font-mono">{user.displayNumber}</span>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Header Action Tools */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'كتم أصوات البوت' : 'تفعيل الأصوات'}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#242f3d] transition cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
            </button>

            <button
              onClick={() => setShowDiagnostics(true)}
              title="فحص الاتصال والسيرفر"
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#242f3d] transition cursor-pointer"
            >
              <Server className="w-5 h-5 text-sky-400" />
            </button>

            <button
              onClick={() => handleCommand('/start')}
              title="إعادة تشغيل المحادثة (/start)"
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#242f3d] transition cursor-pointer"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowBotInfo(true)}
              title="معلومات عن البوت"
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#242f3d] transition cursor-pointer"
            >
              <Info className="w-5 h-5 text-slate-300" />
            </button>
          </div>
        </header>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* CHAT MESSAGES BODY / CHANNEL POSTS */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeChatTab === 'bot' ? (
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 telegram-chat-bg">
            {/* Telegram Bot Description Greeting Card */}
            <div className="max-w-md mx-auto my-3 p-4 sm:p-5 rounded-2xl bg-[#17212b]/95 border border-slate-800 shadow-xl backdrop-blur-md text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 mx-auto flex items-center justify-center text-white shadow-lg shadow-rose-600/30">
                <Gift className="w-8 h-8 animate-bounce" />
              </div>
              <h2 className="text-base sm:text-lg font-black text-white">
                ماذا يمكن لهذا البوت أن يفعل؟
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                🎁 هذا البوت مخصص لـ <span className="text-rose-400 font-bold">تفعيل هدية Power Snake مجاناً</span> لجميع زبائن شبكة أوريدو الجزائر (Ooredoo DZ).
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-slate-300 font-semibold">
                <div className="p-2 rounded-xl bg-[#242f3d]/60 border border-slate-700/60">
                  <span className="block text-emerald-400 font-bold">0 دج</span>
                  <span>بدون رصيد</span>
                </div>
                <div className="p-2 rounded-xl bg-[#242f3d]/60 border border-slate-700/60">
                  <span className="block text-rose-400 font-bold">فوري</span>
                  <span>تفعيل مباشر</span>
                </div>
                <div className="p-2 rounded-xl bg-[#242f3d]/60 border border-slate-700/60">
                  <span className="block text-amber-400 font-bold">4G / 3G</span>
                  <span>لكل أوريدو</span>
                </div>
              </div>
            </div>

            {/* Date Separator */}
            <div className="flex items-center justify-center my-3">
              <span className="px-3 py-1 rounded-full bg-[#17212b]/80 border border-slate-800 text-[11px] text-slate-400 font-semibold shadow-sm backdrop-blur-sm">
                اليوم
              </span>
            </div>

            {/* Message Stream */}
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full animate-fadeIn`}
                >
                  <div className={`flex gap-2.5 max-w-[92%] sm:max-w-[78%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Bot Avatar in bubble stream */}
                    {!isUser && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-600 to-red-600 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-1 shadow-sm">
                        <Gift className="w-4 h-4" />
                      </div>
                    )}

                    {/* Bubble Content */}
                    <div
                      className={`relative px-4 py-3 rounded-2xl text-xs sm:text-sm shadow-md leading-relaxed whitespace-pre-wrap break-words ${
                        isUser
                          ? 'bg-[#2b5278] text-white rounded-br-sm'
                          : 'bg-[#182533] text-[#e4ecf2] border border-slate-800/80 rounded-bl-sm'
                      }`}
                    >
                      {/* Formatted Text */}
                      <div className="space-y-1.5">
                        {msg.text.split('\n').map((line, lineIdx) => {
                          // Simple markdown style parsing
                          let content: React.ReactNode = line;

                          if (line.includes('**')) {
                            const parts = line.split('**');
                            content = parts.map((part, pIdx) =>
                              pIdx % 2 === 1 ? <strong key={pIdx} className="font-extrabold text-white">{part}</strong> : part
                            );
                          }

                          return <div key={lineIdx}>{content}</div>;
                        })}
                      </div>

                      {/* Power Snake Gift Receipt Box (If this message is a successful activation receipt) */}
                      {msg.isReceipt && msg.receiptData && (
                        <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-br from-emerald-950/80 to-[#12202c] border border-emerald-500/40 text-white space-y-2.5 shadow-inner">
                          <div className="flex items-center justify-between border-b border-emerald-800/40 pb-2">
                            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                              <Sparkles className="w-4 h-4" />
                              <span>بطاقة استلام هدية Power Snake</span>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                              مفعّلة الآن
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div className="p-2 rounded bg-black/30 border border-emerald-900/40">
                              <span className="text-slate-400 block text-[10px]">نوع المكافأة</span>
                              <span className="font-bold text-rose-300 truncate block">{msg.receiptData.reward}</span>
                            </div>
                            <div className="p-2 rounded bg-black/30 border border-emerald-900/40">
                              <span className="text-slate-400 block text-[10px]">فترة الصلاحية</span>
                              <span className="font-bold text-emerald-300">{msg.receiptData.validity}</span>
                            </div>
                            <div className="p-2 rounded bg-black/30 border border-emerald-900/40">
                              <span className="text-slate-400 block text-[10px]">الرقم المستفيد</span>
                              <span className="font-mono text-slate-200">{msg.receiptData.phone}</span>
                            </div>
                            <div className="p-2 rounded bg-black/30 border border-emerald-900/40">
                              <span className="text-slate-400 block text-[10px]">المصدر</span>
                              <span className="font-mono text-amber-300 truncate block">{msg.receiptData.source}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Time and checkmarks */}
                      <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 mt-1.5 select-none">
                        <span>{msg.time}</span>
                        {isUser && <CheckCheck className="w-3.5 h-3.5 text-sky-400" />}
                      </div>
                    </div>
                  </div>

                  {/* Inline Keyboard (Buttons Attached Under Bot Message) */}
                  {msg.buttons && msg.buttons.length > 0 && (
                    <div className="mt-2 mr-10 max-w-[85%] sm:max-w-[70%] space-y-1.5 animate-fadeIn">
                      {msg.buttons.map((btn) => {
                        const isPrimary = btn.variant === 'primary';
                        const isAccent = btn.variant === 'accent';
                        const isDanger = btn.variant === 'danger';

                        let btnClasses = 'bg-[#242f3d] hover:bg-[#2c394a] text-[#e4ecf2] border-slate-700/80';
                        if (isAccent) {
                          btnClasses =
                            'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-extrabold shadow-lg shadow-rose-600/30 ring-1 ring-red-400/50 animate-pulse-glow';
                        } else if (isPrimary) {
                          btnClasses = 'bg-[#2b5278] hover:bg-[#346290] text-white font-bold border-sky-600/40';
                        } else if (isDanger) {
                          btnClasses = 'bg-red-950/40 hover:bg-red-900/60 text-red-300 border-red-800/40';
                        }

                        return (
                          <button
                            key={btn.id}
                            onClick={() => handleButtonClick(btn.action)}
                            disabled={isActivatingGift}
                            className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-2 cursor-pointer border ${btnClasses}`}
                          >
                            <span>{btn.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing Indicator Bubble */}
            {isBotTyping && (
              <div className="flex items-center gap-2.5 max-w-[75%] animate-fadeIn">
                <div className="w-8 h-8 rounded-full bg-rose-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  <Gift className="w-4 h-4 animate-spin" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-[#182533] border border-slate-800 text-xs text-rose-300 flex items-center gap-2 shadow-md">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="font-medium">{typingStatus}</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        ) : (
          /* Channel Broadcast Feed View */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 telegram-chat-bg">
            <div className="max-w-xl mx-auto space-y-4">
              <div className="p-4 rounded-2xl bg-[#17212b] border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-sky-600 flex items-center justify-center text-white">
                    <Radio className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">قناة التحديثات الرسمية</h3>
                    <p className="text-xs text-sky-400 font-mono">@ooredoodz6</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveChatTab('bot')}
                  className="px-3 py-1.5 rounded-xl bg-[#2b5278] hover:bg-[#346290] text-xs font-bold text-white cursor-pointer"
                >
                  الرجوع للبوت
                </button>
              </div>

              {channelPosts.map((post) => (
                <div key={post.id} className="p-4 rounded-2xl bg-[#182533] border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{post.text}</span>
                    </span>
                    <span className="font-mono text-[11px]">{post.time}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-slate-800 font-mono space-y-1">
                    <div className="text-slate-300">📱 الرقم المستفيد: <span className="text-amber-400 font-bold">{post.msisdn}</span></div>
                    <div className="text-slate-300">🎁 نوع الهدية: <span className="text-rose-400 font-bold">{post.reward}</span></div>
                    <div className="text-slate-400 text-[10px]">⚡ عبر محرك Ooredoo Power Snake v1.5.21</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* TELEGRAM REPLY KEYBOARD (Bot Quick Action Buttons at Bottom) */}
        {/* ───────────────────────────────────────────────────────────── */}
        {showReplyKeyboard && activeChatTab === 'bot' && (
          <div className="px-3 pt-2 pb-1 bg-[#17212b] border-t border-[#0e1621] space-y-1.5 shadow-lg">
            {!user ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleShowHelp}
                  className="py-2.5 px-3 rounded-xl bg-[#242f3d] hover:bg-[#2c394a] text-xs font-semibold text-slate-200 border border-slate-700/60 flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
                  <span>❓ كيفية الاستخدام</span>
                </button>
                <button
                  onClick={() => setActiveChatTab('channel')}
                  className="py-2.5 px-3 rounded-xl bg-[#242f3d] hover:bg-[#2c394a] text-xs font-semibold text-slate-200 border border-slate-700/60 flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
                >
                  <Radio className="w-3.5 h-3.5 text-rose-400" />
                  <span>📢 قناة التحديثات @ooredoodz6</span>
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {/* Big Main Action Button */}
                <button
                  onClick={handleActivatePowerSnakeGift}
                  disabled={isActivatingGift}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm shadow-md shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer transition active:scale-98 animate-pulse-glow"
                >
                  <Gift className="w-4 h-4 fill-white" />
                  <span>🎁 تفعيل هدية Power Snake مجاناً</span>
                </button>

                {/* Secondary Row */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={handleShowHistory}
                    className="py-2.5 px-3 rounded-xl bg-[#242f3d] hover:bg-[#2c394a] font-semibold text-slate-200 border border-slate-700/60 flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95"
                  >
                    <span>📋 سجل الهدايا</span>
                  </button>
                  <button
                    onClick={handleRelogin}
                    className="py-2.5 px-3 rounded-xl bg-[#242f3d] hover:bg-red-950/50 font-semibold text-slate-300 hover:text-red-300 border border-slate-700/60 flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    <span>🔄 تغيير الرقم</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* TELEGRAM INPUT BAR */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="p-2 sm:p-3 bg-[#17212b] border-t border-[#0e1621] relative z-10">
          {/* Quick Commands Popup Menu */}
          {showCommandsMenu && (
            <div className="absolute bottom-full mb-2 right-4 w-72 rounded-2xl bg-[#17212b] border border-slate-700 shadow-2xl p-2 space-y-1 text-xs animate-fadeIn z-30">
              <div className="text-[11px] font-bold text-slate-400 px-3 py-1.5 border-b border-slate-800">
                أوامر بوت Power Snake
              </div>
              <button
                onClick={() => handleCommand('/start')}
                className="w-full text-right px-3 py-2 rounded-lg hover:bg-[#242f3d] flex items-center justify-between text-slate-200 cursor-pointer"
              >
                <span className="font-bold font-mono text-sky-400">/start</span>
                <span className="text-slate-400 text-[11px]">بدء المحادثة</span>
              </button>
              <button
                onClick={() => handleCommand('/claim')}
                className="w-full text-right px-3 py-2 rounded-lg hover:bg-[#242f3d] flex items-center justify-between text-slate-200 cursor-pointer"
              >
                <span className="font-bold font-mono text-rose-400">/claim</span>
                <span className="text-rose-300 font-semibold text-[11px]">تفعيل هدية Power Snake مجاناً</span>
              </button>
              <button
                onClick={() => handleCommand('/account')}
                className="w-full text-right px-3 py-2 rounded-lg hover:bg-[#242f3d] flex items-center justify-between text-slate-200 cursor-pointer"
              >
                <span className="font-bold font-mono text-amber-400">/account</span>
                <span className="text-slate-400 text-[11px]">معلومات الحساب</span>
              </button>
              <button
                onClick={() => handleCommand('/history')}
                className="w-full text-right px-3 py-2 rounded-lg hover:bg-[#242f3d] flex items-center justify-between text-slate-200 cursor-pointer"
              >
                <span className="font-bold font-mono text-sky-400">/history</span>
                <span className="text-slate-400 text-[11px]">سجل الهدايا</span>
              </button>
              <button
                onClick={() => handleCommand('/status')}
                className="w-full text-right px-3 py-2 rounded-lg hover:bg-[#242f3d] flex items-center justify-between text-slate-200 cursor-pointer"
              >
                <span className="font-bold font-mono text-slate-400">/status</span>
                <span className="text-slate-400 text-[11px]">فحص السيرفر والبروكسي</span>
              </button>
              <button
                onClick={() => handleCommand('/help')}
                className="w-full text-right px-3 py-2 rounded-lg hover:bg-[#242f3d] flex items-center justify-between text-slate-200 cursor-pointer"
              >
                <span className="font-bold font-mono text-slate-400">/help</span>
                <span className="text-slate-400 text-[11px]">المساعدة</span>
              </button>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            {/* Toggle Keyboard Button */}
            <button
              type="button"
              onClick={() => setShowReplyKeyboard(!showReplyKeyboard)}
              title="إظهار/إخفاء أزرار البوت"
              className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#242f3d] transition cursor-pointer shrink-0"
            >
              {showReplyKeyboard ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </button>

            {/* Commands '/' trigger button */}
            <button
              type="button"
              onClick={() => setShowCommandsMenu(!showCommandsMenu)}
              title="قائمة الأوامر"
              className="w-9 h-9 rounded-xl bg-[#242f3d] hover:bg-[#2c394a] text-slate-300 font-mono font-bold text-sm flex items-center justify-center transition cursor-pointer shrink-0"
            >
              /
            </button>

            {/* Input field */}
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                !user
                  ? 'أرسل رقم هاتفك هنا (05xxxxxxxx)...'
                  : 'اكتب رسالة، أمر /claim، أو اضغط تفعيل هدية...'
              }
              className="flex-1 bg-[#242f3d] text-white text-xs sm:text-sm rounded-xl px-4 py-3 outline-none border border-transparent focus:border-[#2b5278] placeholder:text-slate-500 transition"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-3 rounded-xl bg-gradient-to-tr from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4 rtl:rotate-180" />
            </button>
          </form>
        </div>
      </main>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* BOT INFO MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showBotInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-[#17212b] border border-slate-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-lg">
                  <Gift className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">بوت Ooredoo Power Snake</h3>
                  <p className="text-xs text-rose-400 font-mono">@OoredooPowerSnakeBot</p>
                </div>
              </div>
              <button
                onClick={() => setShowBotInfo(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#242f3d] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3.5 rounded-2xl bg-[#0e1621] border border-slate-800 space-y-2">
                <div className="font-bold text-white text-sm">الوصف:</div>
                <p className="leading-relaxed">
                  بوت تلقرام مخصص لمستخدمي شريحة أوريدو الجزائر للاستفادة من <strong className="text-rose-300">هدية Power Snake مجاناً</strong> بدون دفع أي سنتيم وبدون الحاجة إلى رصيد.
                </p>
              </div>

              <div className="space-y-2 font-mono text-[11px]">
                <div className="flex justify-between p-2 rounded-xl bg-[#242f3d]/50">
                  <span className="text-slate-400">الإصدار:</span>
                  <span className="text-emerald-400">v1.5.21 (Power Snake Edition)</span>
                </div>
                <div className="flex justify-between p-2 rounded-xl bg-[#242f3d]/50">
                  <span className="text-slate-400">قناة التحديثات:</span>
                  <span className="text-sky-400">@ooredoodz6</span>
                </div>
                <div className="flex justify-between p-2 rounded-xl bg-[#242f3d]/50">
                  <span className="text-slate-400">نوع الهدية:</span>
                  <span className="text-rose-300">مكافأة Power Snake المجانية</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowBotInfo(false)}
              className="w-full py-2.5 rounded-xl bg-[#2b5278] hover:bg-[#346290] text-white font-bold text-xs cursor-pointer transition"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* DIAGNOSTICS & SYSTEM STATUS MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showDiagnostics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-[#17212b] border border-slate-700 shadow-2xl p-6 space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">فحص الخوادم والاتصال (Diagnostics)</h3>
                  <p className="text-xs text-slate-400">حالة نقاط ربط Ooredoo الجزائر والبروكسي</p>
                </div>
              </div>
              <button
                onClick={() => setShowDiagnostics(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#242f3d] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3.5 rounded-2xl bg-[#0e1621] border border-slate-800 space-y-2">
                <div className="flex justify-between text-slate-300">
                  <span>خادم Ooredoo BFF:</span>
                  <span className="text-emerald-400 font-bold">apis.ooredoo.dz (ONLINE)</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>بوابة المصادقة Auth:</span>
                  <span className="text-emerald-400 font-bold">Keycloak OpenID (ACTIVE)</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>مكافآت Power Snake:</span>
                  <span className="text-rose-400 font-bold">AVAILABLE (جاهز)</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>البروكسي السكني:</span>
                  <span className="text-amber-400 truncate max-w-[200px]">gate.busyip.com</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/50 border border-slate-800 text-[11px] text-emerald-400 space-y-1">
                <div>[SYSTEM] Power3 Telegram Bridge initialized.</div>
                <div>[SYSTEM] Listening for user phone submissions & OTP codes.</div>
                <div>[SYSTEM] Reward target set to: تفعيل هدية Power Snake مجاناً.</div>
                <div>[SYSTEM] Ready to process unlimited requests.</div>
              </div>
            </div>

            <button
              onClick={() => setShowDiagnostics(false)}
              className="w-full py-2.5 rounded-xl bg-[#2b5278] hover:bg-[#346290] text-white font-bold text-xs cursor-pointer transition"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default TelegramBotApp;
