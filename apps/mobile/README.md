# MediPass Mobile App

React Native + Expo + TypeScript patient application.

Primary owners: Team Members 1 and 2.

Expected structure when scaffolded:

```text
apps/mobile/
├── app/                 # Expo Router routes
├── components/
├── features/
│   ├── patient/
│   ├── sharing/
│   ├── passes/
│   └── access-history/
├── services/            # Spring Boot API client only
├── hooks/
└── types/
```

Rules:

- Use Spring Boot `/api/v1/...` APIs only.
- Do not connect directly to Supabase.
- Do not use Supabase Auth.
- Store sensitive auth tokens with Expo SecureStore.
- `EXPO_PUBLIC_*` variables are public; never place DB credentials/secrets there.
- Expo Go may be used for early demos; maintain compatibility with Expo development builds.
