# Power3 - Ooredoo Algeria Internet Activator (React & Node.js)

**Power3 v1.5.21 (UNLIMITED - NO LIMITS)** has been completely rewritten from Python into a modern, full-stack React and TypeScript application with an Express API backend.

## ✨ Core Ported Features

- **Ooredoo Algeria Authentication Engine:**
  - Phone number validation and formatting (`05XXXXXXXX` -> `213XXXXXXXXX`).
  - 40-second OTP cooldown protection.
  - Checkpoint token generation with device fingerprinting and platform signatures (`x-instance-id`, `x-platform-data-signature`, `x-native-integrity-token`).
  - SMS OTP verification (`Keycloak openid-connect password grant`) & access/refresh token management.
  - Quick test demo account (`0550000000` with test code `123456`).

- **Internet Bundle & Power Snake Gamification:**
  - One-click unlimited 1 GB Internet activation (`DATA_1000_KTM`, valid for 3 days or more).
  - Power Snake gamification scanner & instant voucher redemption (`/gamification/power-snake?status=AVAILABLE` -> `/redeem`).
  - Step-by-step visualizer for device signature generation, checkpoint token acquisition, and bundle activation.

- **Account & Session Management:**
  - Active SIM card status card with masked MSISDN, operator identification, and security status.
  - Re-login / change number support.
  - Comprehensive activation history with timestamps, bundle sizes, validity periods, and clearing options.

- **Diagnostics & Telegram Bot Simulator:**
  - Network and Ooredoo BFF gateway diagnostics with custom proxy management.
  - Telegram bot console with `/start`, `menu_activate_1gb`, and `menu_relogin` command flows and `@ooredoodz6` channel notification previews.

- **Bilingual Interface:**
  - Full Arabic (RTL) and English support tailored for Algerian Ooredoo users.

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Vite
- **Backend:** Express, Node.js, Axios
- **Telecom BFF:** Ooredoo Algeria (`apis.ooredoo.dz/api/ooredoo-bff`)

## 🚀 Running the App

```bash
# Install dependencies
npm install

# Start the full-stack development server on port 3000
npm run dev

# Build for production
npm run build
```