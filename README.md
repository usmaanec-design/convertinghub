<div align="center">
  <img src="src/assets/logo.png" width="220" alt="ConvertingHub Logo" />
  <br /><br />
  <h1>ConvertingHub</h1>
  <p><strong>The Ultimate Privacy-First All-In-One Document & Media Utility Platform</strong></p>
  <p>
    <a href="https://convertinghub-official.web.app" target="_blank">🌐 Live Production Web App</a>
  </p>
</div>

---

## 📌 About ConvertingHub

**ConvertingHub** is a modern, high-performance, and privacy-focused digital toolbox designed for professionals, developers, students, and everyday users. It brings together dozens of essential utilities—from advanced PDF manipulations and multi-format media conversions to data calculators and text processors—into one unified, elegant, and lightning-fast web and mobile experience.

Unlike traditional cloud converters that upload your confidential files to remote third-party servers, ConvertingHub performs processing directly inside the client browser whenever possible, guaranteeing speed, zero wait queues, and total data privacy.

---

## 🚀 Key Features & Capabilities

### 📄 1. Advanced PDF Suite
* **PDF Merge & Split:** Combine multiple documents into one or extract specific page ranges with visual previews.
* **Continuous Scroll Viewer:** High-performance PDF reader with smooth vertical scrolling, automatic fit-to-width scaling, and responsive canvas rendering.
* **PDF Compression & Optimization:** Minimize file sizes for email sharing while preserving visual clarity.
* **Page Management:** Rotate, reorder, delete, and organize PDF pages on the fly.
* **Format Conversion:** Convert PDFs to images (PNG, JPG) and export office formats seamlessly.

### 🖼️ 2. Image & Media Studio
* **Multi-Format Image Converter:** Convert between WebP, PNG, JPG, SVG, GIF, BMP, and ICO.
* **Batch Image Resizer & Cropper:** Scale and crop dimensions with aspect-ratio locking.
* **Smart Compression:** Reduce image payloads with lossy or lossless compression algorithms.
* **Video & Audio Utilities:** In-browser trimming, audio extraction, format conversion, and GIF creation using WebAssembly FFmpeg.

### 📱 3. Native Android Mobile App (TWA)
* **Storage Access Framework (SAF) Integration:** Directly scan and manage local folder documents on Android devices.
* **Persistent Document Library:** Fast recursive scanning, background reconciliation, and offline caching.
* **Mobile-Optimized Interface:** Native bottom-bar navigation, smooth touch gestures, and responsive mobile views.
* **Progressive Web App (PWA):** Offline capability, service worker caching, and installable app shell.

### 🔐 4. Dual Firebase Authentication
* **Continue with Google:** Seamless 1-click Google OAuth authentication.
* **Continue with Phone (SMS OTP):**
  * Global country dial code selector with live search.
  * Native Firebase SMS OTP delivery.
  * Invisible & dynamic reCAPTCHA verification preventing abuse.
  * Secure session management integrated with user profile storage.
* **Account Privacy & Self-Service:** Complete in-app account deletion workflow adhering to global privacy standards (GDPR / CCPA).

### 💳 5. Paddle Pro Billing & Subscription Engine
* **Flexible Plans:** Free tier and Pro tier with instant feature unlock.
* **Inline & Overlay Checkout:** Built-in Paddle billing integration with verified domain whitelisting.
* **Dynamic Entitlement Access:** Real-time entitlement validation for Pro features.

### 🛠️ 6. Text, Data & Developer Tools
* **Data Converters:** JSON to CSV, CSV to JSON, XML formatter, YAML tools.
* **Code & Web Utilities:** HTML/CSS/JS minifiers, regex testers, hash generators (MD5, SHA-256), Base64 encoders/decoders.
* **Calculators & Units:** Financial calculators, timestamp converters, unit transformations.

---

## 🛡️ Security & Client-Side Privacy

* **Local-First Processing:** Files are processed directly in the client browser using WebAssembly and Web Workers wherever possible.
* **Zero Unnecessary Cloud Storage:** Files are never retained or logged on external servers without explicit user intent.
* **Encrypted Sessions:** Industry-standard Firebase token validation with TLS encryption.

---

## 💻 Technology Stack

* **Frontend Framework:** React 18 with TypeScript
* **Build Tool:** Vite
* **Styling:** Vanilla CSS, Tailwind CSS, Material UI Components, Lucide Icons
* **Authentication:** Firebase Auth (Google OAuth + Phone SMS OTP)
* **Cloud & Hosting:** Firebase Hosting, Render LibreOffice Bridge API
* **Mobile Packaging:** Android Trusted Web Activity (TWA) with Java SAF Document Scanner
* **Billing:** Paddle v2 SDK Integration
* **Testing:** Playwright, Vitest

---

## 🛠️ Getting Started (Authorized Development)

### Prerequisites
* Node.js 20+
* npm or pnpm

### Installation & Local Run
```bash
# Install dependencies
npm install

# Run Vite development server
npm run dev

# Optional: Run local LibreOffice conversion bridge
npm run bridge
```

### Production Build
```bash
npm run build
```

---

## 🔒 License & Intellectual Property

**PROPRIETARY & CONFIDENTIAL**

Copyright © 2026 **ConvertingHub** (Muhammad Usman). All Rights Reserved.

This software, source code, designs, algorithms, and documentation are the exclusive property of ConvertingHub. Unauthorized copying, modification, distribution, public display, reverse engineering, or reproduction in whole or in part, via any medium, is strictly prohibited.