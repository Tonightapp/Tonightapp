# Tonight App — Store Submission Guide

## What Was Built
The app is a **PWA (Progressive Web App)**. To publish to Apple App Store and Google Play Store, you wrap it using one of two approaches:

---

## Option A — Capacitor (Recommended, Free)
Converts the HTML app into a native iOS/Android app.

### Setup (one time)
```bash
npm install -g @capacitor/cli
npm init -y
npm install @capacitor/core @capacitor/ios @capacitor/android
npx cap init "Tonight" "com.tonight.app" --web-dir .
npx cap add ios
npx cap add android
```

### Build & sync
```bash
npx cap sync
npx cap open ios      # opens Xcode
npx cap open android  # opens Android Studio
```

### Then in Xcode:
- Set Bundle ID: `com.tonight.app`
- Set version: `1.0.0`
- Set minimum iOS: `15.0`
- Add icons to `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- Archive → Distribute App → App Store Connect

### Then in Android Studio:
- Set applicationId: `com.tonight.app`
- Set versionCode: `1`, versionName: `"1.0"`
- Build → Generate Signed Bundle → Google Play

---

## Option B — PWABuilder (Easiest, No Code)
1. Host the app (Netlify, Vercel, GitHub Pages)
2. Go to **pwabuilder.com** → enter your URL
3. Click "Package for Stores"
4. Download the iOS package (.ipa) and Android package (.aab)
5. Submit directly to stores

---

## Icons Needed

Create these icon files in `/icons/` folder:

| File | Size | Used For |
|------|------|----------|
| icon-72.png | 72×72 | Android legacy |
| icon-96.png | 96×96 | Android |
| icon-128.png | 128×128 | Android |
| icon-144.png | 144×144 | Android |
| icon-152.png | 152×152 | iPad |
| icon-192.png | 192×192 | Android + PWA |
| icon-384.png | 384×384 | Android |
| icon-512.png | 512×512 | Android + PWA |
| splash-390.png | 1170×2532 | iPhone 14 splash |
| splash-430.png | 1290×2796 | iPhone 14 Pro Max splash |

**Design:** Dark navy (#0a0b14) background, "TONIGHT" in Bebas Neue gold (#f5c842), centered.

**Quick generate with ImageMagick:**
```bash
mkdir icons
magick -size 512x512 xc:#0a0b14 -font "Bebas-Neue" -pointsize 120 -fill "#f5c842" -gravity center -annotate 0 "TONIGHT" icons/icon-512.png
```

---

## App Store Listing Copy

### App Name
`Tonight — Events & Nightlife`

### Subtitle (30 chars)
`Clubs, Concerts & Parties`

### Description
Discover the best events, clubs and nightlife across Southeast Asia.

**Tonight** is your complete guide to what's happening in Ho Chi Minh City, Hanoi, Bangkok, Bali, Singapore, Kuala Lumpur, Manila and beyond.

**Features:**
• Browse 500+ events across 12 cities
• Calendar view — see what's on any night
• Venue directory with hours, genres & capacity
• Artist profiles with upcoming show listings
• Magazine — nightlife guides, interviews & city tips
• Save events and get notified
• Promoter dashboard — list your own events
• QR ticket scanner for door staff
• Geofencing — automatic venue check-in

### Keywords (Apple)
nightlife, events, clubs, concerts, parties, Bangkok, Bali, Vietnam, Singapore, DJ, techno, house music, festival, venue

### Category
**Primary:** Entertainment
**Secondary:** Travel

### Age Rating
17+ (Frequent/Intense Alcohol, Tobacco, or Drug Use or References)

### Privacy Policy URL
Required — host a simple page at your domain: `/privacy`

---

## Google Play Listing

### Short Description (80 chars)
`Events, clubs & nightlife across Southeast Asia`

### Full Description
Same as App Store description above.

### Category
Entertainment

### Content Rating
Complete the IARC questionnaire → likely "Teen" or "Mature 17+"

### Screenshots Required
- Phone: minimum 2, up to 8 (16:9 or 9:16)
- Tablet: optional but recommended
- Feature graphic: 1024×500px

---

## Checklist Before Submission

- [ ] Icons created in all required sizes
- [ ] App hosted on HTTPS domain (required for PWA)
- [ ] Privacy Policy page live at your domain
- [ ] Service worker tested (open DevTools → Application → Service Workers)
- [ ] Offline fallback works
- [ ] App screenshots taken on real device or simulator
- [ ] Apple Developer account ($99/year) enrolled
- [ ] Google Play Developer account ($25 one-time) enrolled
- [ ] App tested on iOS 15+ and Android 9+
