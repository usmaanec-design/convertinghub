# ConvertingHub Multi-App Workspace

This repository contains two completely separate and independent application codebases:

## 1. Web Application (`web-app/`)
Dedicated codebase for the Web Application.
- `web-app/src/`: Contains Web UI (`Navbar`, `TabBar`, `Footer`, Web Dialogs).
- `web-app/package.json`: Independent Web dependencies & build configuration.

## 2. Mobile Application (`mobile-app/`)
Dedicated codebase for the Android Mobile Application.
- `mobile-app/src/`: Contains Mobile UI (`MobileLayout`, Bottom Navigation, Mobile Tabs, Android Intent handling).
- `mobile-app/android-twa/`: Android Studio Gradle project for TWA builds.
- `mobile-app/package.json`: Independent Mobile dependencies & build configuration.

## 3. Shared Library (`shared/`)
Contains platform-independent types, constants, and utilities shared between both applications.

---

### Working with the Codebases

To update or build the **Web App**:
```bash
cd web-app
npm install
npm run dev
npm run build
```

To update or build the **Mobile App**:
```bash
cd mobile-app
npm install
npm run dev
npm run build
npm run build:aab
```

No changes in `web-app/` affect `mobile-app/`, and no changes in `mobile-app/` affect `web-app/`.