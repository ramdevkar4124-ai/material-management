# Material Management (React Native / Expo)

Local-first construction material app for Android and iOS.

## Features
- Sites with budget and location; budget bar turns amber at 80% and red when over.
- Materials per site: quantity, unit, cost per unit, category filter, low-stock flag.
- Stock in / stock out log per material.
- Suppliers khata ledger: Udhar (credit) and Jama (paid), balance as Baki, advance or settled.
- Labour: workers, daily attendance (Present / Half / Absent), monthly muster roll grid.
- Print / Save PDF report of all sites.
- Light, dark and system theme.
- Backup file save and restore (JSON).

Data is stored on the phone only (AsyncStorage). Cloud sync, photo attachments and login from the web version are not included.

## Setup
```bash
npm install
npx expo install --fix      # aligns package versions with Expo SDK 51
npx expo start
```
Open the project in Expo Go on your phone, or in an Android emulator or iOS simulator.

## Build for deployment
```bash
npm install -g eas-cli
eas login
eas build -p android --profile production   # produces an .aab for Google Play
eas build -p ios --profile production       # needs an Apple Developer account
```
Run `eas build:configure` once first to create `eas.json`. Before publishing, replace
`com.example.materialmanagement` in `app.json` with your own bundle id, and add an `assets/icon.png`
(1024×1024) and splash image.

## Structure
- `App.js`: navigation (bottom tabs plus the Site screen).
- `src/store.js`: data storage, preferences and backup normalisation.
- `src/util.js`: money, date, stock and budget rules.
- `src/theme.js`: light and dark colour palettes.
- `src/ui.js`: shared components.
- `src/screens/`: Sites, Site, Suppliers, Labour, Settings.

## Notes
- This is an untested first build. Run it on a device and check each screen before release.
- The web version's rules are kept: spent = quantity × cost per unit, Baki = Udhar − Jama, P = 1 day, H = ½ day.
