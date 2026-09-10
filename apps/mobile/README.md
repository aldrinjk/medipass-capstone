# MediPass Mobile App

React Native + Expo + TypeScript patient app. This module implements Team Member 2's slice: the emergency pass / QR workflow (`features/passes`, `components/qr`). See `docs/team-handoffs/` for the full brief.

## Quick start

```bash
cd apps/mobile
npm install
cp .env.example .env      # EXPO_PUBLIC_API_BASE_URL, defaults to http://localhost:8080
npm start                 # then press w for web, or scan the QR with Expo Go
```

Requires the Spring Boot API (`apps/api`) running locally (`CORS_ALLOWED_ORIGINS` already includes `http://localhost:8081` for Expo web — see `apps/api/src/main/resources/application.yml`).

There's no seeded account yet, so on first run tap **"Need an account? Create one"** on the sign-in screen to register a synthetic test user (`POST /api/v1/auth/register`, then this app signs you in automatically).

## What's here vs. what isn't

`app/(auth)` (sign-in/register) and the root auth wiring in `services/AuthContext.tsx` / `services/authService.ts` are a **minimal placeholder** so this module can call authenticated endpoints locally — real authentication screens are Team Member 1's ownership per the repo README's "Team ownership" list. Everything under `features/passes` and `components/qr` is this module's actual, owned deliverable:

- **Pass creation** (`features/passes/screens/PassCreateScreen.tsx`) — pick categories + expiry, `POST /api/v1/passes`.
- **QR display** (`components/qr/PassQrCode.tsx`) — encodes `publicUrl` only, nothing else.
- **Pass management** (`PassListScreen.tsx`, `PassDetailScreen.tsx`) — list/detail/revoke/rotate against `GET/POST /api/v1/passes/...`.

### Why a pass detail screen sometimes says "no shareable link on this device"

The backend only returns a pass's raw `publicUrl` at creation and rotation time — it stores a SHA-256 hash, not the token itself (see `apps/api/.../pass/EmergencyPassService.java` and `PassTokenService.java`), so it *can't* re-issue the old link later. This app caches the last known `publicUrl` per pass locally (`features/passes/api/passUrlCache.ts`, via `expo-secure-store`) so reopening a pass still shows its QR. If that cache is empty (fresh install, cleared data), the detail screen explains this and offers **Rotate** to generate a new one — which is the same tradeoff the backend's design makes.

## Project layout

```text
app/                  # Expo Router routes (thin — screens live in features/)
├── (auth)/           # placeholder sign-in/register (see above)
└── (app)/passes/     # index, new, [passId]
components/qr/        # PassQrCode — encodes publicUrl only
features/passes/
├── api/              # passApi.ts (typed HTTP calls), passUrlCache.ts
├── hooks/            # usePasses, usePassDetail, useCreatePass
├── screens/          # PassListScreen, PassCreateScreen, PassDetailScreen
├── components/       # CategoryToggleList, ExpiryPicker, PassStatusBadge, ConfirmButton
└── utils/            # category labels, expiry presets/formatting
services/              # apiClient (auth header + 401 refresh), secureStore, auth placeholder
types/                 # pass.ts / auth.ts mirroring the backend DTOs exactly
```

## Security notes (see docs/team-handoffs section 6.8 / 7)

- Auth tokens live only in `expo-secure-store` (OS keychain/keystore) — never `AsyncStorage`, never logged.
- The QR component's only input is `publicUrl`; no demographics/medical fields ever reach it.
- No `EXPO_PUBLIC_*` variable carries a secret — only the API's public base URL.
- No direct Supabase access anywhere in this app; every call goes through `services/apiClient.ts` to Spring Boot.

## Testing

```bash
npm test          # Jest + jest-expo + @testing-library/react-native (37 tests)
npm run typecheck # tsc --noEmit
```

Covers: the auth-header/401-refresh logic in `apiClient`, the publicUrl cache, the create/list/detail hooks (mocking `passApi`), `PassQrCode` (asserts it only ever receives/encodes the `publicUrl` string), `CategoryToggleList`, and `ConfirmButton`'s two-tap confirmation for revoke/rotate.

Manual checklist before opening a PR (per section 6.9 / 6.7):

- [ ] Active, revoked, expired, invalid, and rotated passes all behave correctly end-to-end.
- [ ] A QR code rendered on a real device (or Expo Go) scans with a normal phone camera and opens `apps/responder-web` directly in the browser — no MediPass install/sign-in required on the scanning device.
- [ ] Rotating a pass immediately swaps the displayed QR to the new URL.
