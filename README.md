# League of Puddles
scarlett only - Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass


A React Native + Expo mobile app built with JavaScript/TypeScript.

## Why React Native + Expo?

- ✅ **One codebase** for both iPhone and Android
- ✅ **Easy access to device features:**
  - GPS/Location tracking
  - Interactive maps
  - Camera functionality
  - Push notifications
- ✅ **Fast development** with hot reload
- ✅ **Team-friendly** - anyone who knows JavaScript/TypeScript can contribute

## Getting Started

### Prerequisites

- Node.js (v24.16.0 or higher) ✅ Installed
- npm or yarn
- Expo Go app on your phone (download from App Store/Play Store)

### Running the App

1. **Start the development server:**
   ```bash
   npm start
   ```

2. **Run on different platforms:**
   ```bash
   npm run android    # Run on Android device/emulator
   npm run web        # Run in web browser
   npm run ios        # Run on iOS (requires macOS)
   ```

3. **Test on your phone:**
   - Install Expo Go from App Store (iOS) or Play Store (Android)
   - Scan the QR code shown in terminal with your phone camera
   - The app will open in Expo Go

## Adding Features

### Location / GPS

Install the package:
```bash
npx expo install expo-location
```

Example usage:
```javascript
import * as Location from 'expo-location';

const location = await Location.getCurrentPositionAsync({});
```

### Maps

Install the package:
```bash
npx expo install react-native-maps
```

### Camera

Install the package:
```bash
npx expo install expo-camera
```

### Push Notifications

Install the package:
```bash
npx expo install expo-notifications
```

## Project Structure

```
LeagueOfPuddles/
├── App.js              # Main app component
├── assets/             # Images, fonts, and other static files
├── package.json        # Dependencies and scripts
└── app.json           # Expo configuration
```

## Next Steps

1. **Customize the UI** - Edit `App.js` to build your app
2. **Add navigation** - Install `@react-navigation/native` for multi-screen apps
3. **Add features** - Install Expo packages for location, maps, camera, etc.
4. **Test on devices** - Use Expo Go for quick testing
5. **Build for production** - Use `eas build` when ready to publish

## Development Tips

- **Fast refresh** - Changes appear instantly while developing
- **Console logs** - View logs in terminal or Expo Go app
- **Debug menu** - Shake device or press Cmd+D (iOS) / Cmd+M (Android)
- **Documentation** - https://docs.expo.dev/

## Common Commands

```bash
npm start              # Start development server
npm start --clear      # Start with cache cleared
npm run android        # Run on Android
npm run web            # Run in browser
npx expo install <pkg> # Install Expo-compatible package
```

## Troubleshooting

### Node not recognized
If you get "node is not recognized" error after closing VS Code:
```powershell
$env:PATH += ";C:\Program Files\nodejs"
```

Or permanently add Node.js to your system PATH:
1. Search for "Environment Variables" in Windows
2. Edit System PATH
3. Add: `C:\Program Files\nodejs`

### PowerShell execution policy
If scripts fail to run:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Examples](https://github.com/expo/examples)
- [React Navigation](https://reactnavigation.org/)
