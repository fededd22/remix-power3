export interface UserRecord {
  id: string;
  msisdn: string;
  displayNumber: string;
  operator: string;
  created_at: number;
  access_token: string;
  refresh_token?: string;
  isSimulated?: boolean;
}

export interface ActivationRecord {
  id: string;
  msisdn: string;
  timestamp: number;
  bundle: string;
  validity: string;
  reward: string;
  status: 'SUCCESS' | 'FAILED';
  source: string;
}

export interface DiagnosticsData {
  version: string;
  bffUrl: string;
  authUrl: string;
  xVersion: string;
  signature: string;
  proxyConfigured: boolean;
  proxyHost: string;
  endpointHealth: string;
  activeUser: string | null;
  totalActivations: number;
  telegramBot: {
    botTokenSet: boolean;
    channel: string;
    mode: string;
  };
}

export interface TelegramInlineButton {
  id: string;
  label: string;
  action:
    | 'send_phone_demo'
    | 'send_otp_demo'
    | 'activate_power_snake'
    | 'check_snake'
    | 'show_history'
    | 'relogin'
    | 'show_help'
    | 'resend_otp'
    | 'open_channel';
  payload?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'accent';
}

export interface TelegramMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
  buttons?: TelegramInlineButton[];
  isReceipt?: boolean;
  receiptData?: {
    reward: string;
    validity: string;
    phone: string;
    txId: string;
    source: string;
  };
}
