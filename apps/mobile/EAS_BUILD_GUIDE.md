# VisionDesk Mobile - EAS Build Guide

## Prerequisites

- Node.js 18+ installed
- Expo account (free at expo.dev)
- For local builds: Android SDK + Java 17

---

## Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

## Step 2: Login to Expo

```bash
eas login
```

## Step 3: Configure EAS Project

```bash
cd c:\xampp\htdocs\VisionDesk\apps\mobile
eas init
```

After running `eas init`, update the `projectId` in `app.config.js` with the generated ID.

## Step 4: Install Dependencies

```bash
npm install
```

## Step 5: Build APK (Preview)

**Cloud build (recommended):**
```bash
npm run build:preview
```

**Local build:**
```bash
npm run build:apk
```

## Step 6: Build AAB (Production - Play Store)

**Cloud build:**
```bash
npm run build:production
```

**Local build:**
```bash
npm run build:aab
```

---

## Build Profiles

| Profile | Output | Use Case |
|---------|--------|----------|
| `preview` | APK | Testing, internal distribution |
| `production` | AAB | Google Play Store |
| `development` | APK | Dev client with debugging |

---

## Installing APK on Device

### Via ADB:
```bash
adb install path/to/app.apk
```

### Via USB:
1. Enable USB debugging on device
2. Connect device via USB
3. Copy APK to device storage
4. Open file manager and tap APK to install

### Via QR Code (EAS):
After cloud build completes, scan the QR code shown in terminal.

---

## Sharing APK with Clients

### Option 1: EAS Internal Distribution
```bash
eas build --platform android --profile preview
```
Share the download link provided after build.

### Option 2: Firebase App Distribution
1. Upload APK to Firebase Console
2. Add testers by email
3. Testers receive install link

### Option 3: Direct Share
- Upload to Google Drive/Dropbox
- Share download link
- Ensure "Install from unknown sources" is enabled

---

## Troubleshooting

### Error: "eas: command not found"
```bash
npm install -g eas-cli
```

### Error: "Not logged in"
```bash
eas login
eas whoami
```

### Error: "Missing projectId"
```bash
eas init
```

### Error: "Gradle build failed"
```bash
cd android
./gradlew clean
cd ..
npm run build:preview
```

### Error: "SDK version mismatch"
```bash
npx expo install --fix
```

### Error: "Out of memory during build"
Add to `android/gradle.properties`:
```
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
```

### Build too large?
1. Check only required architectures in `gradle.properties`
2. Ensure ProGuard/R8 is enabled
3. Remove unused assets from `assets/` folder
4. Use `expo-image` instead of large image files

---

## Version Bumping

Before each release, update in `app.config.js`:
- `version`: Semantic version (1.0.1)
- `android.versionCode`: Integer, must increment (2, 3, 4...)

Or use auto-increment:
```bash
eas build --platform android --profile production --auto-submit
```

---

## Commands Reference

```bash
# Check EAS CLI version
eas --version

# View build status
eas build:list

# Cancel running build
eas build:cancel

# View build logs
eas build:view

# Submit to Play Store
eas submit --platform android

# Update OTA (no new build)
eas update --branch production
```
