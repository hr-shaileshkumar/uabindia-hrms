# UABIndia Hrms - Mobile App

React Native Android mobile application for field users.

## Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android development)
- Android device or emulator

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure API URL**
   - Update API_BASE_URL in `src/config/api.js`
   - Use your backend API URL (e.g., `http://your-ip:5000/api`)

3. **Start Development Server**
   ```bash
   npx expo start
   ```

4. **Run on Android**
   - Press `a` in the terminal, or
   - Scan QR code with Expo Go app on Android device

## Project Structure

```
Mobile/
├── src/
│   ├── screens/         # Screen Components
│   ├── context/         # React Context (Auth)
│   └── config/          # Configuration Files
├── assets/              # Images and Assets
├── App.js               # Main App Component
└── app.json             # Expo Configuration
```

## Features

- **Authentication**: Mobile number + OTP login
- **Attendance / Leave / Profile**: HRMS features (kept)
- **Farmer Management & Treatments**: Previously present — moved to archive/non-hrms-20260128 (removed from main app)
- **Camera/Gallery**: Capture or select images
- **Offline Support**: (Future enhancement)

## Configuration

### API Configuration

Update `src/config/api.js`:

```javascript
const API_BASE_URL = 'http://your-api-url:5000/api';
```

**Important**: For Android emulator, use `http://10.0.2.2:5000/api`
For physical device, use your computer's IP address.

### Permissions

The app requires:
- Camera permission
- Photo library permission

These are configured in `app.json` and will be requested at runtime.

## Building for Production

### Android APK

```bash
expo build:android
```

Or use EAS Build:

```bash
eas build --platform android
```

## Store Release Checklist (Play Store + App Store)

### 1) Production API & Network Security
- Use **HTTPS** for the production API base URL.
- Do **not** ship local IPs (like `http://192.168.x.x:5000/api`).
- Confirm backend TLS certificate is valid and not self‑signed.

### 2) App Identity & Versioning (Required)
- `app.json`
   - Android: `android.package` and **increment** `android.versionCode` for each release.
   - iOS: `ios.bundleIdentifier` and **increment** `ios.buildNumber` for each release.
   - Update `version` when submitting.

### 3) Permissions (Minimum Required)
- **Camera** permission is required for capturing treatment images.
- **Photo Library** permission is required for selecting images.
- No microphone, location, contacts, SMS, or background access is used.
- Keep permissions minimal to avoid store rejections.

### 4) Privacy Policy & Data Safety
- Provide a **Privacy Policy URL** in the store listing.
- Declare **data collection** (phone number for OTP, images uploaded, user account data) in Play Console Data Safety and App Store Privacy.
- If login is required, provide a **Clear Account Deletion** option or a documented deletion request flow.

### 5) Security Best Practices
- Use **HTTPS** for all API calls.
- Avoid hard‑coding secrets in the mobile app.
- Use `expo-secure-store` for sensitive tokens if required by policy.
- Remove debug logs and test endpoints before release.

### 6) Store Assets
- App icon (1024x1024), feature graphic (Play Store), screenshots for all screens.
- Accurate app description and contact email.

## Release Notes (Template)

```
Version: 1.0.0
Changes:
- Initial release
- Farmer registration and treatment capture
```

## Development Notes

- Uses Expo for easier development
- React Native Paper for UI components
- Expo Image Picker for camera/gallery access
- AsyncStorage for local token storage

## Troubleshooting

### API Connection Issues
- Ensure backend is running
- Check API URL configuration
- For physical device, ensure same network
- Check firewall settings

### Camera/Gallery Issues
- Grant permissions when prompted
- Check app.json permissions configuration
