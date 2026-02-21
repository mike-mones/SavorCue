# SavorCue

SavorCue is now an iOS-first mindful meal pacing app with Firebase backend support and TestFlight distribution.

## Current Status

- iOS app uploaded to App Store Connect/TestFlight
- Google Sign-In working on device
- Firestore sync integrated for sessions, events, and settings
- Adaptive meal flow implemented (prompt → rating → unlock/done flow → pause/end)
- Escalating notifications + haptic nudges implemented during unresponsive states
- Apple Watch companion target added (real-device validation still in progress)

## iOS Features

- One-tap start meal + contextual pre-meal setup
- Adaptive fullness prompts (0–10) with configurable timing schedule
- Unlock friction options (tap, hold, type code)
- Done-flow escalation requiring pause/continue choice
- End-of-meal summary with final fullness and notes
- History view backed by Firestore
- Full in-app settings editor synced to Firestore
- APNs + Firebase Messaging plumbing for push delivery

## Repository Structure

```
ios/        iOS app + watch target
functions/  Firebase Cloud Functions
firebase.json
firestore.indexes.json
```

## Local Development

### iOS App

1. Open `ios/SavorCue/SavorCue.xcodeproj` in Xcode
2. Select the `SavorCue` scheme
3. Build/run on device or simulator

### Firebase Functions

```bash
cd functions
npm install
npm run serve
```

Deploy:

```bash
npx firebase-tools deploy --only functions
```

## Notes

- Web frontend code has been removed from this repository.
- If watch deployment is not available in Xcode, continue shipping iPhone builds through TestFlight while watch device pairing is resolved.

## License

MIT
