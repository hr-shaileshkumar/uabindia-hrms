# Mobile App Setup Guide - React Native

Complete setup guide for the React Native Android mobile application.

## Prerequisites

- Node.js 18+ installed
- Expo CLI installed: `npm install -g expo-cli`
- Android Studio installed (for Android development)
- Android device or emulator

---

## Step 1: Install Dependencies

```bash
cd Mobile
npm install
```

---

## Step 2: Configure API URL

### Update API Configuration

Open `src/config/api.js` and update the API base URL:

**For Android Emulator:**
```javascript
const API_BASE_URL = 'http://10.0.2.2:5000/api';
```

**For Physical Device (Same Network):**
```javascript
// Replace YOUR_COMPUTER_IP with your computer's local IP address
const API_BASE_URL = 'http://192.168.1.100:5000/api';
```

**For Production:**
```javascript
const API_BASE_URL = 'https://your-api-domain.com/api';
```

### How to Find Your Computer's IP Address

**Windows:**
```powershell
ipconfig
# Look for IPv4 Address under your active network adapter
```

**Mac/Linux:**
```bash
ifconfig
# Look for inet address under your active network interface
```

---

## Step 3: Start Development Server

```bash
npx expo start
```

This will:
- Start the Expo development server
- Show a QR code in terminal
- Open Expo DevTools in browser

---

## Step 4: Run on Android

### Option 1: Android Emulator

1. Start Android emulator from Android Studio
2. In Expo terminal, press `a` to open on Android emulator
3. Or click "Run on Android device/emulator" in Expo DevTools

### Option 2: Physical Android Device

1. Install **Expo Go** app from Google Play Store
2. Ensure device and computer are on same Wi-Fi network
3. Scan QR code with Expo Go app
4. App will load on your device

---

## Step 5: Test the App

### 5.1 Test Login

1. Open the app
2. Enter mobile number: `9999999999` (default admin)
3. Click "Generate OTP"
4. Check backend logs/console for OTP
5. Enter OTP and login

### 5.2 Test Features

- Add new farmer
- Add treatment record
- Capture image with camera
- Select image from gallery
- Submit treatment with images

---

## Step 6: Build for Production

### 6.1 Install EAS CLI

```bash
npm install -g eas-cli
```

### 6.2 Login to Expo

```bash
eas login
```

### 6.3 Configure Build

```bash
eas build:configure
```

### 6.4 Build Android APK

```bash
eas build --platform android
```

This will:
- Create a build on Expo servers
- Provide download link when complete
- APK can be installed directly on Android devices

### 6.5 Build Android App Bundle (for Play Store)

```bash
eas build --platform android --profile production
```

---

## Configuration

### Update App Information

Edit `app.json`:

```json
{
  "expo": {
    "name": "UABIndia Hrms",
    "slug": "uabindiahrms",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#16a34a"
    },
    "android": {
      "package": "com.uabindiahrms.app",
      "versionCode": 1,
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    }
  }
}
```

---

## Troubleshooting

### Issue: Cannot connect to API

**For Emulator:**
- Use `http://10.0.2.2:5000/api` (special IP for Android emulator)

**For Physical Device:**
- Ensure device and computer are on same Wi-Fi
- Use computer's local IP address (not localhost)
- Check firewall allows connections on port 5000
- Verify backend CORS allows your device's IP

**Solution:**
```bash
# Check if backend is accessible from device
# On device browser, try: http://YOUR_COMPUTER_IP:5000/health
```

### Issue: Camera/Gallery not working

**Solution:**
- Grant permissions when prompted
- Check `app.json` has camera permissions
- For Android 13+, check if permissions are properly requested

### Issue: Image upload fails

**Solution:**
- Check image size (max 5MB)
- Verify API URL is correct
- Check network connection
- Verify backend is running and accessible

### Issue: Expo Go app crashes

**Solution:**
- Clear Expo Go app cache
- Restart Expo development server
- Check for error messages in terminal
- Try rebuilding: `npx expo start --clear`

---

## API URL Configuration Examples

### Development (Local Network)

```javascript
// Android Emulator
const API_BASE_URL = 'http://10.0.2.2:5000/api';

// Physical Device (replace with your IP)
const API_BASE_URL = 'http://192.168.1.100:5000/api';
```

### Production

```javascript
const API_BASE_URL = 'https://api.yourdomain.com/api';
```

---

## Security Notes

- API calls include JWT token in Authorization header
- Token stored in AsyncStorage (device storage)
- Use HTTPS in production
- Consider certificate pinning for production

---

## Next Steps

1. Test all features on physical device
2. Configure production API URL
3. Build production APK
4. Test production build
5. Distribute to field users

---

## Building Standalone APK (Alternative)

If you prefer not to use EAS Build:

1. Install Android Studio
2. Run: `npx expo build:android`
3. Follow prompts to generate APK

**Note:** This method is deprecated. Use EAS Build instead.

---

## Support

For issues:
- Check Expo documentation: https://docs.expo.dev/
- Check React Native documentation: https://reactnative.dev/
- Review error messages in terminal and device logs
