# Tonight — Native iOS & Android Build

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18+ | https://nodejs.org |
| Xcode | 15+ | Mac App Store (iOS only) |
| Android Studio | Hedgehog+ | https://developer.android.com/studio |
| Java JDK | 17+ | Bundled with Android Studio |

## One-time setup

```bash
# 1. Install dependencies
cd bugece-clone
npm install

# 2. Add native platforms
npm run cap:add:ios       # Creates ios/ folder (Mac only)
npm run cap:add:android   # Creates android/ folder
```

## Build & Run

```bash
# Sync web assets to native projects
npm run cap:sync

# Open in native IDE
npm run cap:open:ios      # Opens Xcode
npm run cap:open:android  # Opens Android Studio
```

## iOS (Xcode)
1. `npm run cap:sync`
2. `npm run cap:open:ios`
3. In Xcode: select your Team under Signing & Capabilities
4. Choose your target device/simulator
5. Press ▶ to build and run
6. For App Store: Product → Archive → Distribute App

## Android (Android Studio)
1. `npm run cap:sync`
2. `npm run cap:open:android`
3. Wait for Gradle sync to finish
4. Click ▶ Run button
5. For Play Store: Build → Generate Signed Bundle/APK

## App IDs
- Bundle ID (iOS): `app.tonight.events`
- Application ID (Android): `app.tonight.events`

## Icons
All icons are in `icons/` folder:
- icon-72.png through icon-512.png (Android)
- icon-152.png, icon-192.png (iOS)
- Splash screens: splash-390.png, splash-430.png

## First-time accounts required
- Apple Developer Program: $99/year — https://developer.apple.com/programs/
- Google Play Console: $25 one-time — https://play.google.com/console

## Notes
- The app is a PWA wrapped in Capacitor — no React/Vue/Angular needed
- All app logic is in `index.html` (single-file architecture)
- The service worker (`sw.js`) handles offline caching
- `webDir: "."` in capacitor.config.json points to the project root
